<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;

class AdminOrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'sale_source' => ['sometimes', Rule::in(['online', 'in_person'])],
            'search' => ['sometimes', 'string', 'max:100'],
            'per_page' => ['sometimes', 'integer', 'between:1,100'],
        ]);

        $orders = Order::query()
            ->with('items')
            ->when($filters['sale_source'] ?? null, fn ($query, $saleSource) => $query->where('sale_source', $saleSource))
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('order_number', 'like', "%{$search}%")
                        ->orWhere('customer_name', 'like', "%{$search}%")
                        ->orWhere('customer_email', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($filters['per_page'] ?? 20);

        return response()->json($orders);
    }

    public function monthlyReport(Request $request)
    {
        $filters = $request->validate([
            'month' => ['required', 'date_format:Y-m'],
        ]);

        $periodStart = CarbonImmutable::createFromFormat('!Y-m', $filters['month']);
        $orders = Order::query()
            ->with('items')
            ->whereBetween('created_at', [$periodStart, $periodStart->endOfMonth()])
            ->orderBy('created_at')
            ->orderBy('id')
            ->get();
        $paidOrders = $orders->where('status', 'paid');
        $monthNames = [
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
        ];
        $summary = [
            'month' => ucfirst($monthNames[$periodStart->month - 1]).' '.$periodStart->year,
            'operations' => $orders->count(),
            'paid' => $paidOrders->count(),
            'pending' => $orders->where('status', 'pending_payment')->count(),
            'other_status' => $orders->reject(fn ($order) => in_array($order->status, ['paid', 'pending_payment'], true))->count(),
            'paid_total' => $paidOrders->sum(fn ($order) => (float) $order->total),
            'online_total' => $paidOrders->where('sale_source', 'online')->sum(fn ($order) => (float) $order->total),
            'in_person_total' => $paidOrders->where('sale_source', 'in_person')->sum(fn ($order) => (float) $order->total),
        ];

        return Pdf::loadView('pdf.monthly-sales', [
            'orders' => $orders,
            'summary' => $summary,
            'month' => $filters['month'],
        ])
            ->setPaper('a4', 'landscape')
            ->stream("ventas-{$filters['month']}.pdf");
    }

    public function customerByRut(Request $request): JsonResponse
    {
        $data = $request->validate([
            'rut' => ['required', 'string', 'max:12', function ($attribute, $value, $fail) {
                if (! $this->isValidChileanRut($value)) {
                    $fail('Ingresa un RUT chileno válido.');
                }
            }],
        ]);

        $rut = $this->normalizeRut($data['rut']);
        $order = Order::query()
            ->where('sale_source', 'in_person')
            ->where('customer_rut', $rut)
            ->latest('created_at')
            ->first();

        return response()->json([
            'customer' => $order ? [
                'customer_name' => $order->customer_name,
                'customer_rut' => $order->customer_rut,
                'customer_email' => $order->customer_email,
                'customer_phone' => $order->customer_phone,
            ] : null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_rut' => ['required', 'string', 'max:12', function ($attribute, $value, $fail) {
                if (! $this->isValidChileanRut($value)) {
                    $fail('Ingresa un RUT chileno válido.');
                }
            }],
            'customer_email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'customer_phone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'payment_method' => ['required', Rule::in(['cash', 'bank_transfer', 'debit_card', 'credit_card'])],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);
        $data['customer_rut'] = $this->normalizeRut($data['customer_rut']);

        $order = DB::transaction(function () use ($data) {
            $items = collect($data['items']);
            $productIds = $items->pluck('product_id')->unique();
            $products = Product::query()
                ->whereIn('id', $productIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $subtotal = 0;

            foreach ($items as $item) {
                $product = $products->get($item['product_id']);

                if (! $product || ! $product->is_active) {
                    throw ValidationException::withMessages([
                        'items' => ['Hay un producto inexistente o inactivo.'],
                    ]);
                }

                if ($product->stock < $item['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => ["{$product->name} no tiene stock suficiente."],
                    ]);
                }

                $subtotal += (float) $product->price * $item['quantity'];
            }

            $order = Order::query()->create([
                'order_number' => 'CSV-'.Str::upper(Str::random(9)),
                'sale_source' => 'in_person',
                'customer_name' => $data['customer_name'],
                'customer_rut' => $data['customer_rut'],
                'customer_email' => $data['customer_email'] ?? '',
                'customer_phone' => $data['customer_phone'] ?? '',
                'delivery_address' => '',
                'delivery_city' => '',
                'delivery_region' => '',
                'payment_method' => $data['payment_method'],
                'status' => 'paid',
                'subtotal' => $subtotal,
                'shipping_total' => 0,
                'total' => $subtotal,
                'paid_at' => now(),
            ]);

            foreach ($items as $item) {
                $product = $products->get($item['product_id']);
                $lineTotal = (float) $product->price * $item['quantity'];

                $order->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_slug' => $product->slug,
                    'unit_price' => $product->price,
                    'quantity' => $item['quantity'],
                    'line_total' => $lineTotal,
                ]);

                $stockBefore = (int) $product->stock;
                $product->decrement('stock', $item['quantity']);
                $product->stockMovements()->create([
                    'product_id' => $product->id,
                    'quantity_change' => -((int) $item['quantity']),
                    'stock_before' => $stockBefore,
                    'stock_after' => $stockBefore - (int) $item['quantity'],
                    'reason' => 'in_person_sale',
                ]);
            }

            return $order;
        });

        return response()->json(['order' => $order->load('items')], 201);
    }

    public function updateInPerson(Request $request, Order $order): JsonResponse
    {
        abort_unless($order->sale_source === 'in_person', 404);

        $data = $request->validate([
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_rut' => ['required', 'string', 'max:12', function ($attribute, $value, $fail) {
                if (! $this->isValidChileanRut($value)) {
                    $fail('Ingresa un RUT chileno válido.');
                }
            }],
            'customer_email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'customer_phone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'payment_method' => ['required', Rule::in(['cash', 'bank_transfer', 'debit_card', 'credit_card'])],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'distinct', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);
        $data['customer_rut'] = $this->normalizeRut($data['customer_rut']);

        $updatedOrder = DB::transaction(function () use ($data, $order, $request) {
            $lockedOrder = Order::query()->lockForUpdate()->findOrFail($order->id);
            if ($lockedOrder->sale_source !== 'in_person' || $lockedOrder->status !== 'paid') {
                throw ValidationException::withMessages([
                    'order' => ['Solo se pueden editar ventas presenciales pagadas.'],
                ]);
            }

            $existingItems = $lockedOrder->items()->get();
            $requestedItems = collect($data['items'])->keyBy('product_id');
            $productIds = $existingItems->pluck('product_id')
                ->filter()
                ->merge($requestedItems->keys())
                ->unique()
                ->sort()
                ->values();
            $products = Product::query()
                ->whereIn('id', $productIds)
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            foreach ($requestedItems as $productId => $item) {
                $product = $products->get($productId);
                if (! $product || ! $product->is_active) {
                    throw ValidationException::withMessages([
                        'items' => ['Hay un producto inexistente o inactivo.'],
                    ]);
                }
            }

            foreach ($productIds as $productId) {
                $product = $products->get($productId);
                if (! $product) {
                    continue;
                }

                $oldQuantity = (int) $existingItems
                    ->where('product_id', $productId)
                    ->sum('quantity');
                $newQuantity = (int) ($requestedItems->get($productId)['quantity'] ?? 0);
                $stockChange = $oldQuantity - $newQuantity;
                $stockBefore = (int) $product->stock;
                $stockAfter = $stockBefore + $stockChange;

                if ($stockAfter < 0) {
                    throw ValidationException::withMessages([
                        'items' => ["{$product->name} no tiene stock suficiente para la corrección."],
                    ]);
                }

                if ($stockChange !== 0) {
                    $product->update(['stock' => $stockAfter]);
                    $product->stockMovements()->create([
                        'user_id' => $request->user()?->id,
                        'quantity_change' => $stockChange,
                        'stock_before' => $stockBefore,
                        'stock_after' => $stockAfter,
                        'reason' => 'in_person_sale_edit',
                    ]);
                }
            }

            $lines = $requestedItems->map(function ($item, $productId) use ($existingItems, $products) {
                $product = $products->get($productId);
                $existingItem = $existingItems->firstWhere('product_id', $productId);
                $unitPrice = (float) ($existingItem?->unit_price ?? $product->price);
                $quantity = (int) $item['quantity'];

                return [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_slug' => $product->slug,
                    'unit_price' => $unitPrice,
                    'quantity' => $quantity,
                    'line_total' => $unitPrice * $quantity,
                ];
            })->values();
            $subtotal = $lines->sum('line_total');

            $lockedOrder->items()->delete();
            foreach ($lines as $line) {
                $lockedOrder->items()->create($line);
            }

            $lockedOrder->update([
                'customer_name' => $data['customer_name'],
                'customer_rut' => $data['customer_rut'],
                'customer_email' => $data['customer_email'] ?? '',
                'customer_phone' => $data['customer_phone'] ?? '',
                'payment_method' => $data['payment_method'],
                'subtotal' => $subtotal,
                'total' => $subtotal,
            ]);

            return $lockedOrder->fresh()->load('items');
        });

        return response()->json(['order' => $updatedOrder]);
    }

    private function normalizeRut(string $rut): string
    {
        return strtoupper((string) preg_replace('/[^0-9k]/i', '', $rut));
    }

    private function isValidChileanRut(string $rut): bool
    {
        $normalized = $this->normalizeRut($rut);
        if (! preg_match('/^\d{7,8}[0-9K]$/', $normalized)) {
            return false;
        }

        $body = substr($normalized, 0, -1);
        $providedDigit = substr($normalized, -1);
        $sum = 0;
        $factor = 2;

        for ($index = strlen($body) - 1; $index >= 0; $index--) {
            $sum += (int) $body[$index] * $factor;
            $factor = $factor === 7 ? 2 : $factor + 1;
        }

        $remainder = 11 - ($sum % 11);
        $expectedDigit = match ($remainder) {
            11 => '0',
            10 => 'K',
            default => (string) $remainder,
        };

        return $providedDigit === $expectedDigit;
    }
}
