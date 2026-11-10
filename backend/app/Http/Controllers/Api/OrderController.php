<?php

namespace App\Http\Controllers\Api;

use App\Contracts\TransbankGateway;
use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Order;
use App\Services\Transbank\OrderStockReservation;
use App\Services\Transbank\TransbankPaymentReviewNotifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;
use Transbank\Webpay\WebpayPlus\Exceptions\TransactionCommitException;

class OrderController extends Controller
{
    public function __construct(
        private readonly TransbankGateway $transbank,
        private readonly OrderStockReservation $stockReservation,
        private readonly TransbankPaymentReviewNotifier $paymentReviewNotifier,
    ) {}

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'cart_token' => ['required', 'uuid'],
            'customer_name' => ['required', 'string', 'max:160'],
            'customer_email' => ['required', 'email', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:40'],
            'delivery_address' => ['required', 'string', 'max:255'],
            'delivery_city' => ['required', 'string', 'max:120'],
            'delivery_region' => ['required', 'string', 'max:120'],
            'payment_method' => ['required', 'in:bank_transfer,webpay_plus'],
        ]);

        $paymentMethod = $data['payment_method'];
        $order = DB::transaction(function () use ($data, $paymentMethod) {
            $cart = Cart::query()
                ->where('token', $data['cart_token'])
                ->lockForUpdate()
                ->first();

            if (! $cart) {
                throw ValidationException::withMessages(['cart' => ['El carrito está vacío.']]);
            }

            if (Order::query()
                ->where('cart_token', $cart->token)
                ->where('status', 'pending_payment')
                ->exists()) {
                throw ValidationException::withMessages([
                    'cart' => ['Ya hay un pago en curso para este carrito.'],
                ]);
            }

            $cartItems = $cart->items()->with('product')->get();
            if ($cartItems->isEmpty()) {
                throw ValidationException::withMessages(['cart' => ['El carrito está vacío.']]);
            }

            $products = $cartItems->map(function ($item) {
                $product = $item->product()->lockForUpdate()->first();
                if (! $product || ! $product->is_active || $product->stock < $item->quantity) {
                    throw ValidationException::withMessages([
                        'stock' => ["{$item->product?->name} ya no tiene stock suficiente."],
                    ]);
                }

                return [$item, $product];
            });

            $subtotal = $products->sum(fn ($pair) => (float) $pair[1]->price * $pair[0]->quantity);
            $expirationMinutes = $paymentMethod === 'webpay_plus'
                ? config('services.transbank.payment_expiration_minutes')
                : (config('services.transbank.bank_transfer_payment_expiration_hours') * 60);

            $order = Order::query()->create([
                ...collect($data)->except('cart_token')->all(),
                'order_number' => 'CS-'.Str::upper(Str::random(10)),
                'status' => 'pending_payment',
                'cart_token' => $data['cart_token'],
                'subtotal' => $subtotal,
                'shipping_total' => 0,
                'total' => $subtotal,
                'payment_method' => $paymentMethod,
                'payment_expires_at' => now()->addMinutes((int) $expirationMinutes),
            ]);

            foreach ($products as [$item, $product]) {
                $lineTotal = (float) $product->price * $item->quantity;
                $order->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_slug' => $product->slug,
                    'unit_price' => $product->price,
                    'quantity' => $item->quantity,
                    'line_total' => $lineTotal,
                ]);

                $stockBefore = (int) $product->stock;
                $product->decrement('stock', $item->quantity);
                $stockAfter = $stockBefore - (int) $item->quantity;
                $product->stockMovements()->create([
                    'product_id' => $product->id,
                    'quantity_change' => -((int) $item->quantity),
                    'stock_before' => $stockBefore,
                    'stock_after' => $stockAfter,
                    'reason' => 'order_reservation',
                ]);
            }

            if ($paymentMethod === 'bank_transfer') {
                $cart->items()->delete();
            }

            return $order->load('items');
        });

        if ($paymentMethod === 'webpay_plus') {
            return $this->startTransbankPayment($order);
        }

        return response()->json(['order' => $order], 201);
    }

    public function transbankReturn(Request $request): RedirectResponse
    {
        if ($request->filled('TBK_TOKEN') && ! $request->filled('token_ws')) {
            $orderNumber = $this->cancelTransbankOrder($request);

            return $this->paymentResultRedirect($orderNumber ? 'cancelled' : 'failed', $orderNumber);
        }

        $token = $request->input('token_ws');
        if (! is_string($token) || $token === '') {
            return $this->paymentResultRedirect('failed');
        }

        $order = Order::query()->where('transbank_token', $token)->first();

        if (! $order) {
            return $this->paymentResultRedirect('failed');
        }

        if ($order->status === 'paid') {
            return $this->paymentResultRedirect('approved', $order->order_number);
        }

        if ($order->status !== 'pending_payment') {
            $resultStatus = match ($order->status) {
                'payment_cancelled' => 'cancelled',
                'payment_expired' => 'expired',
                'payment_failed' => 'failed',
                'payment_review' => 'review',
                default => 'failed',
            };

            return $this->paymentResultRedirect($resultStatus, $order->order_number);
        }

        try {
            $payment = $this->transbank->commit($token);
        } catch (TransactionCommitException $exception) {
            if ($exception->getHttpCode() !== 422
                || ! str_contains(
                    strtolower($exception->getTransbankErrorMessage() ?? ''),
                    'finished state: aborted',
                )) {
                throw $exception;
            }

            return DB::transaction(function () use ($order) {
                $lockedOrder = Order::query()->whereKey($order->id)->lockForUpdate()->first();
                if (! $lockedOrder || $lockedOrder->status !== 'pending_payment') {
                    return $this->paymentResultRedirect('cancelled', $order->order_number);
                }

                $this->stockReservation->release($lockedOrder);
                $lockedOrder->update(['status' => 'payment_cancelled']);

                return $this->paymentResultRedirect('cancelled', $lockedOrder->order_number);
            });
        } catch (Throwable $exception) {
            Log::error('No se pudo confirmar una transacción Webpay Plus.', [
                'exception' => $exception,
            ]);

            $orderNumber = Order::query()->where('transbank_token', $token)->value('order_number');

            return $this->paymentResultRedirect('pending', $orderNumber);
        }

        $result = DB::transaction(function () use ($payment, $token) {
            $lockedOrder = Order::query()
                ->where('transbank_token', $token)
                ->lockForUpdate()
                ->first();

            if (! $lockedOrder) {
                return ['status' => 'failed'];
            }

            if ($lockedOrder->status === 'paid') {
                return ['status' => 'approved', 'order_number' => $lockedOrder->order_number];
            }

            if ($lockedOrder->status !== 'pending_payment') {
                $resultStatus = match ($lockedOrder->status) {
                    'payment_cancelled' => 'cancelled',
                    'payment_expired' => 'expired',
                    'payment_failed' => 'failed',
                    'payment_review' => 'review',
                    default => 'failed',
                };

                return ['status' => $resultStatus, 'order_number' => $lockedOrder->order_number];
            }

            $authorized = in_array($payment['status'] ?? null, ['AUTHORIZED', 'CAPTURED'], true)
                && ($payment['response_code'] ?? null) === 0;

            if ($authorized) {
                if (! $this->stockReservation->confirm($lockedOrder, $payment)) {
                    Log::critical('Una transacción Webpay aprobada no coincide con los datos del pedido.', [
                        'order_id' => $lockedOrder->id,
                        'transbank_buy_order' => $payment['buy_order'] ?? null,
                        'transbank_session_id' => $payment['session_id'] ?? null,
                        'transbank_amount' => $payment['amount'] ?? null,
                    ]);
                    $lockedOrder->update(['status' => 'payment_review']);
                    $this->paymentReviewNotifier->notify($lockedOrder, $payment);

                    return ['status' => 'review', 'order_number' => $lockedOrder->order_number];
                }

                return ['status' => 'approved', 'order_number' => $lockedOrder->order_number];
            }

            if ($lockedOrder->payment_expires_at?->isPast()) {
                $this->stockReservation->expire($lockedOrder);

                return ['status' => 'expired', 'order_number' => $lockedOrder->order_number];
            }

            $hasDefinitiveStatus = is_string($payment['status'] ?? null)
                && ($payment['response_code'] ?? null) !== null;
            if ($hasDefinitiveStatus) {
                $this->stockReservation->release($lockedOrder);
                $lockedOrder->update(['status' => 'payment_failed']);

                return ['status' => 'failed', 'order_number' => $lockedOrder->order_number];
            }

            return ['status' => 'pending', 'order_number' => $lockedOrder->order_number];
        });

        return $this->paymentResultRedirect($result['status'], $result['order_number'] ?? null);
    }

    public function paymentStatus(Order $order): JsonResponse
    {
        abort_unless($order->payment_method === 'webpay_plus', 404);

        return response()->json([
            'status' => $order->status,
        ]);
    }

    private function startTransbankPayment(Order $order): JsonResponse
    {
        $sessionId = (string) Str::uuid();
        $expiresAt = now()->addMinutes(config('services.transbank.payment_expiration_minutes'));

        try {
            $payment = $this->transbank->create(
                $order->order_number,
                $sessionId,
                (int) round((float) $order->total),
                route('payments.transbank.return'),
            );

            if (! is_string($payment['token'] ?? null) || ! is_string($payment['url'] ?? null)) {
                throw new RuntimeException('Transbank no devolvió los datos de inicio de pago esperados.');
            }

            DB::transaction(function () use ($order, $sessionId, $expiresAt, $payment) {
                $lockedOrder = Order::query()->lockForUpdate()->findOrFail($order->id);
                if ($lockedOrder->status !== 'pending_payment') {
                    return;
                }

                $lockedOrder->update([
                    'transbank_token' => $payment['token'],
                    'transbank_buy_order' => $order->order_number,
                    'transbank_session_id' => $sessionId,
                    'payment_expires_at' => $expiresAt,
                ]);
            });
        } catch (Throwable $exception) {
            DB::transaction(function () use ($order) {
                $lockedOrder = Order::query()->lockForUpdate()->findOrFail($order->id);
                if ($lockedOrder->status !== 'pending_payment') {
                    return;
                }

                $this->stockReservation->release($lockedOrder);
                $lockedOrder->update(['status' => 'payment_failed']);
            });

            Log::error('No se pudo iniciar un pago Webpay Plus.', [
                'order_id' => $order->id,
                'exception' => $exception,
            ]);

            return response()->json([
                'message' => 'No fue posible iniciar el pago. Inténtalo nuevamente.',
            ], 502);
        }

        return response()->json([
            'order' => ['order_number' => $order->order_number, 'total' => $order->total],
            'payment' => ['url' => $payment['url'], 'token' => $payment['token']],
        ], 201);
    }

    private function cancelTransbankOrder(Request $request): ?string
    {
        $buyOrder = $request->input('TBK_ORDEN_COMPRA');
        $token = $request->input('TBK_TOKEN');
        $sessionId = $request->input('TBK_ID_SESION');

        if (! is_string($buyOrder) || ! is_string($token) || ! is_string($sessionId)) {
            return null;
        }

        return DB::transaction(function () use ($buyOrder, $token, $sessionId) {
            $order = Order::query()
                ->where('transbank_buy_order', $buyOrder)
                ->lockForUpdate()
                ->first();

            if (! $order
                || $order->transbank_token !== $token
                || $order->transbank_session_id !== $sessionId
                || $order->status !== 'pending_payment') {
                return null;
            }

            $this->stockReservation->release($order);
            $order->update(['status' => 'payment_cancelled']);

            return $order->order_number;
        });
    }

    private function paymentResultRedirect(string $status, ?string $orderNumber = null): RedirectResponse
    {
        $query = http_build_query(array_filter([
            'status' => $status,
            'order' => $orderNumber,
        ]));

        return redirect()->away(rtrim(config('services.transbank.storefront_url'), '/').'/payment/result?'.$query);
    }
}
