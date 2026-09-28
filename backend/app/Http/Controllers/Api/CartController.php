<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CartController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $cart = $this->cart($request);

        return response()->json($this->cartPayload($cart));
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'items' => ['present', 'array', 'max:100'],
            'items.*.slug' => ['required', 'string', 'exists:products,slug'],
            'items.*.quantity' => ['required', 'integer', 'between:1,100'],
        ]);
        $cart = $this->cart($request);

        DB::transaction(function () use ($cart, $data) {
            $cart->items()->delete();

            foreach ($data['items'] as $item) {
                $product = Product::query()->where('slug', $item['slug'])->firstOrFail();
                if (! $product->is_active || $item['quantity'] > $product->stock) {
                    throw ValidationException::withMessages([
                        'items' => ["{$product->name} no tiene stock suficiente."],
                    ]);
                }

                $cart->items()->create([
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                ]);
            }
        });

        return response()->json($this->cartPayload($cart->fresh()));
    }

    public function destroy(Request $request): JsonResponse
    {
        $cart = $this->cart($request);
        $cart->items()->delete();

        return response()->json(['items' => []]);
    }

    private function cart(Request $request): Cart
    {
        $data = $request->validate(['cart_token' => ['required', 'uuid']]);

        return Cart::query()->firstOrCreate(['token' => $data['cart_token']]);
    }

    private function cartPayload(Cart $cart): array
    {
        return [
            'items' => $cart->items()->with('product')->get()->map(fn ($item) => [
                'id' => $item->product->id,
                'slug' => $item->product->slug,
                'name' => $item->product->name,
                'price' => $item->product->price,
                'image_url' => $item->product->image_url,
                'unit_type' => $item->product->unit_type,
                'stock' => $item->product->stock,
                'quantity' => $item->quantity,
            ])->values(),
        ];
    }
}