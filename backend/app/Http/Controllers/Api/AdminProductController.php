<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

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
        $data = $this->validatedProductData($request);
        $image = $data['image'] ?? null;
        unset($data['image']);
        $imagePath = $this->storeProductImage($image);
        if ($imagePath) {
            $data['image_url'] = $this->publicImageUrl($imagePath);
        }

        try {
            $product = DB::transaction(function () use ($data, $request) {
                $product = Product::query()->create($data);
                $this->recordStockMovement(
                    $product,
                    $request->user()?->id,
                    0,
                    (int) $product->stock,
                    'initial',
                );

                return $product;
            });
        } catch (Throwable $error) {
            if ($imagePath) {
                Storage::disk('public')->delete($imagePath);
            }

            throw $error;
        }

        return response()->json($product->load('category:id,name,slug'), 201);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json($product->load('category:id,name,slug'));
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $data = $this->validatedProductData($request, $product);
        $image = $data['image'] ?? null;
        unset($data['image']);
        $imagePath = $this->storeProductImage($image);
        $previousImageUrl = $product->image_url;
        if ($imagePath) {
            $data['image_url'] = $this->publicImageUrl($imagePath);
        }

        try {
            $updatedProduct = DB::transaction(function () use ($product, $data, $request) {
                $lockedProduct = Product::query()->lockForUpdate()->findOrFail($product->id);
                $stockBefore = (int) $lockedProduct->stock;
                $lockedProduct->update($data);
                $stockAfter = (int) $lockedProduct->stock;

                if ($stockAfter !== $stockBefore) {
                    $this->recordStockMovement(
                        $lockedProduct,
                        $request->user()?->id,
                        $stockBefore,
                        $stockAfter,
                        'manual_adjustment',
                    );
                }

                return $lockedProduct->fresh()->load('category:id,name,slug');
            });
        } catch (Throwable $error) {
            if ($imagePath) {
                Storage::disk('public')->delete($imagePath);
            }

            throw $error;
        }

        if ($imagePath) {
            $this->deleteStoredProductImage($previousImageUrl);
        }

        return response()->json($updatedProduct);
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

        $data = $request->validate([
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
            'image' => ['sometimes', 'nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $categoryId = array_key_exists('category_id', $data)
            ? $data['category_id']
            : $product?->category_id;
        $category = $categoryId ? Category::query()->find($categoryId) : null;

        if ($category?->sale_unit === 'meter') {
            if (empty($data['width_cm'] ?? $product?->width_cm)) {
                throw ValidationException::withMessages([
                    'width_cm' => ['El ancho del rollo es obligatorio para productos vendidos por metro.'],
                ]);
            }

            $data['unit_type'] = 'metro';
            $data['height_cm'] = null;
        } elseif (($data['unit_type'] ?? $product?->unit_type) === 'metro') {
            $data['unit_type'] = 'pieza';
            $data['width_cm'] = null;
        }

        return $data;
    }

    private function storeProductImage(mixed $image): ?string
    {
        if (! $image) {
            return null;
        }

        $path = $image->store('products', 'public');
        if (! $path) {
            throw new \RuntimeException('No se pudo guardar la imagen del producto.');
        }

        return $path;
    }

    private function deleteStoredProductImage(?string $imageUrl): void
    {
        if (! $imageUrl) {
            return;
        }

        $publicDiskUrl = config('filesystems.disks.public.url') ?: url('/storage');
        $diskUrlPath = parse_url($publicDiskUrl, PHP_URL_PATH);
        $imageUrlPath = parse_url($imageUrl, PHP_URL_PATH);
        if (! is_string($diskUrlPath) || ! is_string($imageUrlPath)) {
            return;
        }

        $diskUrlPath = rtrim($diskUrlPath, '/');
        if (! str_starts_with($imageUrlPath, $diskUrlPath.'/')) {
            return;
        }

        Storage::disk('public')->delete(substr($imageUrlPath, strlen($diskUrlPath) + 1));
    }

    private function publicImageUrl(string $path): string
    {
        $publicDiskUrl = rtrim((string) (config('filesystems.disks.public.url') ?: url('/storage')), '/');

        return $publicDiskUrl.'/'.$path;
    }

    private function recordStockMovement(
        Product $product,
        ?int $userId,
        int $stockBefore,
        int $stockAfter,
        string $reason,
    ): void {
        $product->stockMovements()->create([
            'user_id' => $userId,
            'quantity_change' => $stockAfter - $stockBefore,
            'stock_before' => $stockBefore,
            'stock_after' => $stockAfter,
            'reason' => $reason,
        ]);
    }
}
