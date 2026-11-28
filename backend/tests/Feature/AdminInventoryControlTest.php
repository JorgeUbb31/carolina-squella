<?php

use App\Models\InventoryControl;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Tests\TestCase;

it('reconciles a physical count without overwriting later stock movements', function () {
    /** @var TestCase $this */
    $admin = User::factory()->create(['is_admin' => true]);
    $product = Product::query()->create([
        'name' => 'Cortina de control',
        'slug' => 'cortina-de-control',
        'price' => 12000,
        'stock' => 10,
        'unit_type' => 'pieza',
        'is_active' => true,
    ]);

    $control = $this->actingAs($admin, 'sanctum')
        ->postJson('/api/v1/admin/inventory-controls')
        ->assertCreated()
        ->assertJsonPath('status', 'in_progress')
        ->json();
    $item = collect($control['items'])->firstWhere('product_id', $product->id);

    $product->decrement('stock', 2);
    StockMovement::query()->create([
        'product_id' => $product->id,
        'user_id' => $admin->id,
        'quantity_change' => -2,
        'stock_before' => 10,
        'stock_after' => 8,
        'reason' => 'test_sale_before_count',
    ]);

    $this->actingAs($admin, 'sanctum')
        ->patchJson("/api/v1/admin/inventory-controls/{$control['id']}/items/{$item['id']}", [
            'counted_stock' => 9,
        ])
        ->assertOk()
        ->assertJsonPath('expected_stock', 8)
        ->assertJsonPath('difference', 1);

    $product->decrement('stock');
    StockMovement::query()->create([
        'product_id' => $product->id,
        'user_id' => $admin->id,
        'quantity_change' => -1,
        'stock_before' => 8,
        'stock_after' => 7,
        'reason' => 'test_sale_after_count',
    ]);

    $this->actingAs($admin, 'sanctum')
        ->postJson("/api/v1/admin/inventory-controls/{$control['id']}/complete")
        ->assertOk()
        ->assertJsonPath('status', 'completed')
        ->assertJsonPath('items.0.difference', 1);

    $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 8]);
    $this->assertDatabaseHas('stock_movements', [
        'product_id' => $product->id,
        'inventory_control_id' => $control['id'],
        'quantity_change' => 1,
        'reason' => 'inventory_control',
    ]);

    $this->actingAs($admin, 'sanctum')
        ->get('/api/v1/admin/inventory-controls/'.$control['id'].'/report')
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf');
});

it('does not complete an inventory control until every item has been counted', function () {
    /** @var TestCase $this */
    $admin = User::factory()->create(['is_admin' => true]);
    Product::query()->create([
        'name' => 'Producto pendiente',
        'slug' => 'producto-pendiente',
        'price' => 5000,
        'stock' => 3,
        'unit_type' => 'pieza',
        'is_active' => true,
    ]);

    $control = $this->actingAs($admin, 'sanctum')
        ->postJson('/api/v1/admin/inventory-controls')
        ->assertCreated()
        ->json();

    $this->actingAs($admin, 'sanctum')
        ->postJson("/api/v1/admin/inventory-controls/{$control['id']}/complete")
        ->assertUnprocessable()
        ->assertJsonValidationErrors('items');

    $this->assertDatabaseHas('inventory_controls', [
        'id' => $control['id'],
        'status' => 'in_progress',
    ]);
});

it('allows only one inventory control to be in progress', function () {
    /** @var TestCase $this */
    $admin = User::factory()->create(['is_admin' => true]);
    Product::query()->create([
        'name' => 'Producto único',
        'slug' => 'producto-unico',
        'price' => 5000,
        'stock' => 3,
        'unit_type' => 'pieza',
        'is_active' => true,
    ]);

    $this->actingAs($admin, 'sanctum')
        ->postJson('/api/v1/admin/inventory-controls')
        ->assertCreated();

    $this->actingAs($admin, 'sanctum')
        ->postJson('/api/v1/admin/inventory-controls')
        ->assertUnprocessable()
        ->assertJsonValidationErrors('control');

    $this->assertDatabaseCount('inventory_controls', 1);
});

it('does not start an inventory control without products', function () {
    /** @var TestCase $this */
    $admin = User::factory()->create(['is_admin' => true]);

    $this->actingAs($admin, 'sanctum')
        ->postJson('/api/v1/admin/inventory-controls')
        ->assertUnprocessable()
        ->assertJsonValidationErrors('products');

    $this->assertDatabaseCount('inventory_controls', 0);
});
