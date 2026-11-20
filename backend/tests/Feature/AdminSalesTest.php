<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Tests\TestCase;

it('allows an admin to register an in-person sale and discount stock', function () {
    /** @var TestCase $this */
    $admin = User::factory()->create(['is_admin' => true]);
    $category = Category::query()->create([
        'name' => 'Cortinas',
        'slug' => 'cortinas',
        'description' => 'Cortinas',
        'is_active' => true,
    ]);
    $product = Product::query()->create([
        'category_id' => $category->id,
        'name' => 'Cortina presencial',
        'slug' => 'cortina-presencial',
        'price' => 15000,
        'stock' => 5,
        'unit_type' => 'pieza',
        'is_active' => true,
    ]);

    $this->actingAs($admin, 'sanctum')
        ->postJson('/api/v1/admin/orders', [
            'customer_name' => 'Cliente mostrador',
            'customer_email' => 'cliente@example.com',
            'payment_method' => 'cash',
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
        ])
        ->assertCreated()
        ->assertJsonPath('order.sale_source', 'in_person')
        ->assertJsonPath('order.status', 'paid')
        ->assertJsonPath('order.total', '30000.00');

    $this->assertDatabaseHas('orders', [
        'sale_source' => 'in_person',
        'customer_name' => 'Cliente mostrador',
        'status' => 'paid',
        'total' => 30000,
    ]);
    $this->assertDatabaseHas('order_items', [
        'product_id' => $product->id,
        'quantity' => 2,
        'line_total' => 30000,
    ]);
    $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 3]);

    $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/admin/orders?sale_source=in_person')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.sale_source', 'in_person');
});

it('rejects an in-person sale without enough stock', function () {
    /** @var TestCase $this */
    $admin = User::factory()->create(['is_admin' => true]);
    $product = Product::query()->create([
        'name' => 'Producto limitado',
        'slug' => 'producto-limitado',
        'price' => 10000,
        'stock' => 1,
        'unit_type' => 'pieza',
        'is_active' => true,
    ]);

    $this->actingAs($admin, 'sanctum')
        ->postJson('/api/v1/admin/orders', [
            'customer_name' => 'Cliente mostrador',
            'payment_method' => 'debit_card',
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('items');

    $this->assertDatabaseCount('orders', 0);
    $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 1]);
});
