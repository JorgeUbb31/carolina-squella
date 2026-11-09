<?php

use App\Models\Cart;
use App\Models\Category;
use App\Models\Product;
use Tests\TestCase;

it('returns only active products in the catalog', function () {
    /** @var TestCase $this */
    $activeProduct = createCatalogCartProduct('cortina-activa');
    createCatalogCartProduct('cortina-inactiva', isActive: false);

    $this->getJson('/api/v1/products')
        ->assertOk()
        ->assertJsonPath('data.0.slug', $activeProduct->slug)
        ->assertJsonMissing(['slug' => 'cortina-inactiva']);
});

it('includes the category in product details', function () {
    /** @var TestCase $this */
    $category = Category::query()->create([
        'name' => 'Cortinas',
        'slug' => 'cortinas',
        'is_active' => true,
    ]);
    $product = createCatalogCartProduct('roller-blackout', category: $category);

    $this->getJson('/api/v1/products/'.$product->slug)
        ->assertOk()
        ->assertJsonPath('slug', 'roller-blackout')
        ->assertJsonPath('category.slug', 'cortinas');
});

it('updates and reads cart items with product details', function () {
    /** @var TestCase $this */
    $product = createCatalogCartProduct('lino-natural', stock: 5);
    $product->update([
        'unit_type' => 'metro',
        'width_cm' => 250,
    ]);
    $cartToken = '9e2e3c3f-5f9a-4a08-99e2-4b8bbf21d683';

    $this->putJson('/api/v1/cart', [
        'cart_token' => $cartToken,
        'items' => [['slug' => $product->slug, 'quantity' => 2]],
    ])
        ->assertOk()
        ->assertJsonPath('items.0.slug', 'lino-natural')
        ->assertJsonPath('items.0.quantity', 2)
        ->assertJsonPath('items.0.unit_type', 'metro')
        ->assertJsonPath('items.0.width_cm', 250);

    $this->getJson('/api/v1/cart?cart_token='.$cartToken)
        ->assertOk()
        ->assertJsonPath('items.0.name', $product->name)
        ->assertJsonPath('items.0.stock', 5)
        ->assertJsonPath('items.0.width_cm', 250);
});

it('rolls back existing cart items when an update is rejected', function () {
    /** @var TestCase $this */
    $existingProduct = createCatalogCartProduct('producto-actual', stock: 4);
    $unavailableProduct = createCatalogCartProduct('producto-sin-stock', stock: 1);
    $cartToken = '9e2e3c3f-5f9a-4a08-99e2-4b8bbf21d683';
    $cart = Cart::query()->create(['token' => $cartToken]);
    $cart->items()->create([
        'product_id' => $existingProduct->id,
        'quantity' => 1,
    ]);

    $this->putJson('/api/v1/cart', [
        'cart_token' => $cartToken,
        'items' => [
            ['slug' => $existingProduct->slug, 'quantity' => 2],
            ['slug' => $unavailableProduct->slug, 'quantity' => 2],
        ],
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('items');

    $this->assertDatabaseCount('cart_items', 1);
    $this->assertDatabaseHas('cart_items', [
        'cart_id' => $cart->id,
        'product_id' => $existingProduct->id,
        'quantity' => 1,
    ]);
});

function createCatalogCartProduct(
    string $slug,
    int $stock = 5,
    bool $isActive = true,
    ?Category $category = null,
): Product {
    return Product::query()->create([
        'category_id' => $category?->id,
        'name' => str($slug)->replace('-', ' ')->title()->toString(),
        'slug' => $slug,
        'price' => 12000,
        'stock' => $stock,
        'unit_type' => 'pieza',
        'is_active' => $isActive,
    ]);
}
