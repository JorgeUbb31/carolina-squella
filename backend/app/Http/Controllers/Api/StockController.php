<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StockController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['sometimes', 'string', 'max:100'],
            'low_stock_below' => ['sometimes', 'integer', 'min:0'],
            'per_page' => ['sometimes', 'integer', 'between:1,100'],
        ]);

        $products = Product::query()
            ->with('category:id,name')
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->where('name', 'like', "%{$search}%"))
            ->when(array_key_exists('low_stock_below', $filters), fn ($query) => $query->where('stock', '<=', $filters['low_stock_below']))
            ->orderBy('name')
            ->paginate($filters['per_page'] ?? 20);

        return response()->json($products);
    }

    public function movements(): JsonResponse
    {
        return response()->json(
            StockMovement::query()
                ->with(['product:id,name,slug', 'user:id,name'])
                ->latest()
                ->paginate(20)
        );
    }

    public function adjust(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity_change' => ['required', 'integer', 'between:-100000,100000', 'not_in:0'],
            'reason' => ['required', 'string', 'max:255'],
        ]);

        $result = DB::transaction(function () use ($data, $request) {
            $product = Product::query()->lockForUpdate()->findOrFail($data['product_id']);
            $stockBefore = $product->stock;
            $stockAfter = $stockBefore + $data['quantity_change'];

            if ($stockAfter < 0) {
                throw ValidationException::withMessages([
                    'quantity_change' => ['El ajuste no puede dejar el stock en negativo.'],
                ]);
            }

            $product->update(['stock' => $stockAfter]);
            $movement = StockMovement::query()->create([
                'product_id' => $product->id,
                'user_id' => $request->user()->id,
                'quantity_change' => $data['quantity_change'],
                'stock_before' => $stockBefore,
                'stock_after' => $stockAfter,
                'reason' => $data['reason'],
            ]);

            return [
                'product' => $product->fresh()->load('category:id,name'),
                'movement' => $movement->load('user:id,name'),
            ];
        });

        return response()->json($result, 201);
    }
}