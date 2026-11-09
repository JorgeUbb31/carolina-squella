<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['sometimes', 'string', 'max:100'],
            'category_id' => ['sometimes', 'integer', 'exists:categories,id'],
            'low_stock_below' => ['sometimes', 'integer', 'min:0'],
            'per_page' => ['sometimes', 'integer', 'between:1,100'],
        ]);

        $products = Product::query()
            ->with('category:id,name,slug')
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->where('name', 'like', "%{$search}%"))
            ->when($filters['category_id'] ?? null, fn ($query, $categoryId) => $query->where('category_id', $categoryId))
            ->when(array_key_exists('low_stock_below', $filters), fn ($query) => $query->where('stock', '<=', $filters['low_stock_below']))
            ->orderBy('name')
            ->paginate($filters['per_page'] ?? 20);

        return response()->json($products);
    }

    public function store(Request $request): JsonResponse
    {
        $product = Product::query()->create($this->validatedProductData($request));

        return response()->json($product->load('category:id,name,slug'), 201);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json($product->load('category:id,name,slug'));
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $data = $this->validatedProductData($request, $product);
        $product = DB::transaction(function () use ($product, $data) {
            $lockedProduct = Product::query()->lockForUpdate()->findOrFail($product->id);
            $lockedProduct->update($data);

            return $lockedProduct->fresh()->load('category:id,name,slug');
        });

        return response()->json($product);
    }

        public function destroy(Product $product): Response
    {
        DB::transaction(function () use ($product) {
            Product::query()->lockForUpdate()->findOrFail($product->id)->delete();
        });

        return response()->noContent();
    }

    private function validatedProductData(Request $request, ?Product $product = null): array
    {
        $required = $product ? 'sometimes' : 'required';
        $slugRule = Rule::unique('products', 'slug');

        if ($product) {
            $slugRule->ignore($product->id);
        }

        return $request->validate([
            'category_id' => ['sometimes', 'nullable', 'integer', 'exists:categories,id'],
            'name' => [$required, 'string', 'max:255'],
            'slug' => [$required, 'string', 'max:255', $slugRule],
            'description' => ['sometimes', 'nullable', 'string'],
            'price' => [$required, 'numeric', 'min:0'],
            'stock' => [$required, 'integer', 'min:0'],
            'material' => ['sometimes', 'nullable', 'string', 'max:255'],
            'color' => ['sometimes', 'nullable', 'string', 'max:255'],
            'pattern' => ['sometimes', 'nullable', 'string', 'max:255'],
            'width_cm' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'height_cm' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'is_blackout' => ['sometimes', 'boolean'],
            'is_thermal' => ['sometimes', 'boolean'],
            'is_waterproof' => ['sometimes', 'boolean'],
            'sample_available' => ['sometimes', 'boolean'],
            'unit_type' => ['sometimes', 'string', 'max:50'],
            'image_url' => ['sometimes', 'nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
    }
}