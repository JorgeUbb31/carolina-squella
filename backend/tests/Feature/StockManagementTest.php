<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Tests\TestCase;

it('requires an admin token for admin product routes', function () {
    /** @var TestCase $this */
    $this->getJson('/api/v1/admin/products')->assertUnauthorized();

    $user = User::factory()->create();
    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/admin/products')
        ->assertForbidden();
});

it('allows an admin to create, view, update, and delete products', function () {
    /** @var TestCase $this */
    $admin = createStockAdmin();
    $category = Category::query()->create([
        'name' => 'Telas',
        'slug' => 'telas',
        'is_active' => true,
    ]);
    $token = $admin->createToken('test')->plainTextToken;

    $created = $this->withToken($token)->postJson('/api/v1/admin/products', [
        'category_id' => $category->id,
        'name' => 'Lino premium',
        'slug' => 'lino-premium',
        'price' => 18900,
        'stock' => 8,
        'unit_type' => 'metro',
    ])->assertCreated()
        ->assertJsonPath('name', 'Lino premium')
        ->assertJsonPath('stock', 8);

    $productId = $created->json('id');

    $this->withToken($token)->getJson('/api/v1/admin/products/'.$productId)
        ->assertOk()
        ->assertJsonPath('category.name', 'Telas');

    $this->withToken($token)->getJson('/api/v1/admin/products?low_stock_below=8')
        ->assertOk()
        ->assertJsonPath('data.0.id', $productId);

    $this->withToken($token)->putJson('/api/v1/admin/products/'.$productId, [
        'name' => 'Lino premium natural',
        'stock' => 12,
    ])->assertOk()
        ->assertJsonPath('name', 'Lino premium natural')
        ->assertJsonPath('stock', 12);

    $this->withToken($token)->deleteJson('/api/v1/admin/products/'.$productId)
        ->assertNoContent();

    $this->assertDatabaseMissing('products', ['id' => $productId]);
});

it('rejects negative stock when updating a product', function () {
    /** @var TestCase $this */
    $admin = createStockAdmin();
    $product = createStockManagedProduct(2);

    $this->actingAs($admin, 'sanctum')
        ->putJson('/api/v1/admin/products/'.$product->id, ['stock' => -1])
        ->assertUnprocessable();

    $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 2]);
});

function createStockAdmin(): User
{
    $admin = User::factory()->create();
    $admin->forceFill(['is_admin' => true])->save();

    return $admin;
}

function createStockManagedProduct(int $stock): Product
{
    $category = Category::query()->create([
        'name' => 'Cortinas',
        'slug' => 'cortinas',
        'is_active' => true,
    ]);

    return Product::query()->create([
        'category_id' => $category->id,
        'name' => 'Cortina de prueba',
        'slug' => 'cortina-prueba',
        'price' => 12000,
        'stock' => $stock,
        'is_active' => true,
    ]);
}
