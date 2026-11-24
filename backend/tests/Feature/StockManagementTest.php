<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
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
    $this->assertDatabaseHas('stock_movements', [
        'product_id' => $productId,
        'user_id' => $admin->id,
        'quantity_change' => 8,
        'stock_before' => 0,
        'stock_after' => 8,
        'reason' => 'initial',
    ]);

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
    $this->assertDatabaseHas('stock_movements', [
        'product_id' => $productId,
        'user_id' => $admin->id,
        'quantity_change' => 4,
        'stock_before' => 8,
        'stock_after' => 12,
        'reason' => 'manual_adjustment',
    ]);

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

it('uses the category sale unit when creating a product', function () {
    /** @var TestCase $this */
    $admin = createStockAdmin();
    $category = Category::query()->create([
        'name' => 'Telas por metro',
        'slug' => 'telas-por-metro',
        'sale_unit' => 'meter',
        'is_active' => true,
    ]);
    $token = $admin->createToken('category-unit-product-test')->plainTextToken;

    $this->withToken($token)->postJson('/api/v1/admin/products', [
        'category_id' => $category->id,
        'name' => 'Lino por metro',
        'slug' => 'lino-por-metro',
        'price' => 18900,
        'stock' => 8,
        'unit_type' => 'pieza',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors('width_cm');

    $this->withToken($token)->postJson('/api/v1/admin/products', [
        'category_id' => $category->id,
        'name' => 'Lino por metro',
        'slug' => 'lino-por-metro',
        'price' => 18900,
        'stock' => 8,
        'unit_type' => 'pieza',
        'width_cm' => 250,
    ])->assertCreated()
        ->assertJsonPath('unit_type', 'metro')
        ->assertJsonPath('width_cm', 250);

    $this->assertDatabaseHas('products', [
        'slug' => 'lino-por-metro',
        'unit_type' => 'metro',
        'width_cm' => 250,
    ]);
});

it('stores and replaces product images on the public disk', function () {
    /** @var TestCase $this */
    Storage::fake('public');
    $admin = createStockAdmin();
    $category = Category::query()->create([
        'name' => 'Telas',
        'slug' => 'telas',
        'is_active' => true,
    ]);
    $token = $admin->createToken('image-test')->plainTextToken;

    $created = $this->withToken($token)->post('/api/v1/admin/products', [
        'category_id' => $category->id,
        'name' => 'Lino con imagen',
        'slug' => 'lino-con-imagen',
        'price' => 18900,
        'stock' => 8,
        'unit_type' => 'metro',
        'image' => UploadedFile::fake()->createWithContent('lino.png', testPngImage()),
    ], ['Accept' => 'application/json'])->assertCreated();

    $productId = $created->json('id');
    $firstImageUrl = $created->json('image_url');
    expect($firstImageUrl)->toContain('/storage/products/');
    $firstImagePath = basename(parse_url($firstImageUrl, PHP_URL_PATH));
    $this->assertTrue(Storage::disk('public')->exists('products/'.$firstImagePath));

    $updated = $this->withToken($token)->post('/api/v1/admin/products/'.$productId, [
        '_method' => 'PUT',
        'image' => UploadedFile::fake()->createWithContent('lino-natural.png', testPngImage()),
    ], ['Accept' => 'application/json'])->assertOk();

    $secondImageUrl = $updated->json('image_url');
    $secondImagePath = basename(parse_url($secondImageUrl, PHP_URL_PATH));
    expect($secondImageUrl)->not->toBe($firstImageUrl);
    $this->assertFalse(Storage::disk('public')->exists('products/'.$firstImagePath));
    $this->assertTrue(Storage::disk('public')->exists('products/'.$secondImagePath));
});

it('rejects non-image files when creating a product', function () {
    /** @var TestCase $this */
    $admin = createStockAdmin();
    $token = $admin->createToken('image-validation-test')->plainTextToken;

    $this->withToken($token)->post('/api/v1/admin/products', [
        'name' => 'Producto con archivo inválido',
        'slug' => 'producto-con-archivo-invalido',
        'price' => 10000,
        'stock' => 2,
        'image' => UploadedFile::fake()->createWithContent('manual.pdf', '%PDF-1.4 producto'),
    ], ['Accept' => 'application/json'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('image');

    $this->assertDatabaseCount('products', 0);
});

function testPngImage(): string
{
    return base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lE8AAAAASUVORK5CYII=');
}

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
