<?php

namespace App\Services\Transbank;

use App\Contracts\TransbankGateway;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class TransbankOrderReconciler
{
    private const INITIALIZED_PAYMENT_HARD_CAP_HOURS = 2;

    public function __construct(
        private readonly TransbankGateway $transbank,
        private readonly OrderStockReservation $stockReservation,
        private readonly TransbankPaymentReviewNotifier $paymentReviewNotifier,
    ) {}

    public function expireBankTransfer(Order $order): void
    {
        DB::transaction(function () use ($order) {
            $lockedOrder = Order::query()->lockForUpdate()->find($order->id);

            if (! $lockedOrder
                || $lockedOrder->status !== 'pending_payment'
                || $lockedOrder->payment_method !== 'bank_transfer') {
                return;
            }

            $this->stockReservation->expire($lockedOrder);
        });
    }

    public function reconcile(Order $order, bool $expireIfUnapproved = false): void
    {
        if (! $order->transbank_token) {
            if ($expireIfUnapproved && $order->payment_expires_at?->isPast()) {
                DB::transaction(function () use ($order) {
                    $lockedOrder = Order::query()->lockForUpdate()->find($order->id);
                    if ($lockedOrder
                        && $lockedOrder->status === 'pending_payment'
                        && ! $lockedOrder->transbank_token
                        && ! $lockedOrder->payment_expires_at?->isFuture()) {
                        $this->stockReservation->expire($lockedOrder);
                    }
                });
            }

            return;
        }

        try {
            $payment = $this->transbank->status($order->transbank_token);
        } catch (Throwable $exception) {
            Log::warning('No se pudo consultar el estado de una transacción Webpay Plus.', [
                'order_id' => $order->id,
                'exception' => $exception,
            ]);

            return;
        }

        DB::transaction(function () use ($order, $payment, $expireIfUnapproved) {
            $lockedOrder = Order::query()->lockForUpdate()->find($order->id);
            if (! $lockedOrder
                || $lockedOrder->status !== 'pending_payment'
                || $lockedOrder->transbank_token !== $order->transbank_token) {
                return;
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
                }

                return;
            }

            $status = $payment['status'] ?? null;
            $hasDefinitiveStatus = is_string($status)
                && ($payment['response_code'] ?? null) !== null;

            if ($hasDefinitiveStatus) {
                $this->stockReservation->release($lockedOrder);
                $lockedOrder->update(['status' => 'payment_failed']);

                return;
            }

            if ($expireIfUnapproved && $status === 'INITIALIZED') {
                if ($lockedOrder->created_at?->lt(now()->subHours(self::INITIALIZED_PAYMENT_HARD_CAP_HOURS))) {
                    Log::warning('Una orden Webpay sigue INITIALIZED después del límite de expiración; se liberará su inventario.', [
                        'order_id' => $lockedOrder->id,
                        'created_at' => $lockedOrder->created_at,
                    ]);
                    $this->stockReservation->expire($lockedOrder);
                }

                return;
            }

            if ($expireIfUnapproved && $lockedOrder->payment_expires_at?->isPast()) {
                $this->stockReservation->expire($lockedOrder);
            }
        });
    }
}
