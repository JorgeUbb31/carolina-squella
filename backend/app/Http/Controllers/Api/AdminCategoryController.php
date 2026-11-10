<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Category::query()
                ->withCount('products')
                ->orderBy('name')
                ->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $category = Category::query()->create($this->validatedData($request));

        return response()->json($category->loadCount('products'), 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $category->update($this->validatedData($request, $category));

        return response()->json($category->fresh()->loadCount('products'));
    }

    public function destroy(Category $category): Response
    {
        if ($category->products()->exists()) {
            throw ValidationException::withMessages([
                'category' => ['No se puede eliminar una categoría que tiene productos asociados.'],
            ]);
        }

        $category->delete();

        return response()->noContent();
    }

    private function validatedData(Request $request, ?Category $category = null): array
    {
        $required = $category ? 'sometimes' : 'required';
        $slugRule = Rule::unique('categories', 'slug');

        if ($category) {
            $slugRule->ignore($category->id);
        }

        return $request->validate([
            'name' => [$required, 'string', 'max:255'],
            'slug' => [$required, 'string', 'max:255', $slugRule],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
    }
}
