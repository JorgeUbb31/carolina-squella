<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_view_update_and_delete_empty_categories(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $token = $admin->createToken('category-test')->plainTextToken;

        $created = $this->withToken($token)->postJson('/api/v1/admin/categories', [
            'name' => 'Telas naturales',
            'slug' => 'telas-naturales',
            'description' => 'Telas elaboradas con fibras naturales.',
            'is_active' => true,
        ])->assertCreated()
            ->assertJsonPath('name', 'Telas naturales');

        $categoryId = $created->json('id');

        $this->withToken($token)->getJson('/api/v1/admin/categories')
            ->assertOk()
            ->assertJsonFragment(['id' => $categoryId, 'name' => 'Telas naturales']);

        $this->withToken($token)->putJson('/api/v1/admin/categories/'.$categoryId, [
            'name' => 'Telas naturales premium',
            'is_active' => false,
        ])->assertOk()
            ->assertJsonPath('name', 'Telas naturales premium');

        $this->withToken($token)->deleteJson('/api/v1/admin/categories/'.$categoryId)
            ->assertNoContent();

        $this->assertDatabaseMissing('categories', ['id' => $categoryId]);
    }

    public function test_category_cannot_be_deleted_when_it_has_products(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $token = $admin->createToken('category-test')->plainTextToken;
        $category = Category::query()->create([
            'name' => 'Cortinas',
            'slug' => 'cortinas',
            'is_active' => true,
        ]);
        Product::query()->create([
            'category_id' => $category->id,
            'name' => 'Cortina asociada',
            'slug' => 'cortina-asociada',
            'price' => 50000,
            'stock' => 4,
            'is_active' => true,
        ]);

        $this->withToken($token)->deleteJson('/api/v1/admin/categories/'.$category->id)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('category');

        $this->assertDatabaseHas('categories', ['id' => $category->id]);
    }
}
