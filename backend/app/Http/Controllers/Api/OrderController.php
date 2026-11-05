<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
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
            'payment_method' => ['required', 'in:bank_transfer'],
        ]);

        $order = DB::transaction(function () use ($data) {
            $cart = Cart::query()
                ->where('token', $data['cart_token'])
                ->lockForUpdate()
                ->first();

            if (! $cart) {
                throw ValidationException::withMessages(['cart' => ['El carrito está vacío.']]);
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
            $order = Order::query()->create([
                ...collect($data)->except('cart_token')->all(),
                'order_number' => 'CS-'.Str::upper(Str::random(10)),
                'status' => 'pending_payment',
                'subtotal' => $subtotal,
                'shipping_total' => 0,
                'total' => $subtotal,
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
                $stockBefore = $product->stock;
                $product->decrement('stock', $item->quantity);
            }

            $cart->items()->delete();

            return $order->load('items');
        });

        return response()->json(['order' => $order], 201);
    }
}