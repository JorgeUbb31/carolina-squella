<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Category::query()
                ->where('is_active', true)
                ->withCount(['products' => fn ($query) => $query->where('is_active', true)])
                ->orderBy('name')
                ->get()
        );
    }

    public function products(Category $category): JsonResponse
    {
        abort_unless($category->is_active, 404);

        return response()->json([
            'category' => $category,
            'products' => $category->products()
                ->where('is_active', true)
                ->with('category:id,name,slug')
                ->orderBy('name')
                ->get(),
        ]);
    }
}
