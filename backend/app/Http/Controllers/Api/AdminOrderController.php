<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
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

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'customer_phone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'payment_method' => ['required', Rule::in(['cash', 'bank_transfer', 'debit_card', 'credit_card'])],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

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
}
