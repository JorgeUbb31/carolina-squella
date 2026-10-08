<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkout_saves_order_items_and_decrements_stock(): void
    {
        $category = Category::query()->create([
            'name' => 'Cortinas',
            'slug' => 'cortinas',
            'description' => 'Cortinas',
            'is_active' => true,
        ]);
        $product = Product::query()->create([
            'category_id' => $category->id,
            'name' => 'Cortina de prueba',
            'slug' => 'cortina-prueba',
            'price' => 12000,
            'stock' => 5,
            'unit_type' => 'pieza',
            'is_active' => true,
        ]);
        $cartToken = '9e2e3c3f-5f9a-4a08-99e2-4b8bbf21d683';

        $this->putJson('/api/v1/cart', [
            'cart_token' => $cartToken,
            'items' => [['slug' => $product->slug, 'quantity' => 2]],
        ])->assertOk();

        $response = $this->postJson('/api/v1/orders', [
            'cart_token' => $cartToken,
            'customer_name' => 'Carolina Cliente',
            'customer_email' => 'cliente@example.com',
            'customer_phone' => '+56912345678',
            'delivery_address' => 'Av. Principal 123',
            'delivery_city' => 'Santiago',
            'delivery_region' => 'Metropolitana',
            'payment_method' => 'bank_transfer',
        ]);

        $response->assertCreated()
            ->assertJsonPath('order.subtotal', '24000.00')
            ->assertJsonCount(1, 'order.items');
        $this->assertDatabaseHas('orders', ['customer_email' => 'cliente@example.com', 'total' => 24000]);
        $this->assertDatabaseHas('order_items', ['product_id' => $product->id, 'quantity' => 2]);
        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 3]);
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'quantity_change' => -2,
            'stock_before' => 5,
            'stock_after' => 3,
        ]);
        $this->assertDatabaseCount('cart_items', 0);
    }

    public function test_checkout_rejects_stock_that_changed_after_cart_was_saved(): void
    {
        $category = Category::query()->create([
            'name' => 'Cortinas',
            'slug' => 'cortinas',
            'description' => 'Cortinas',
            'is_active' => true,
        ]);
        $product = Product::query()->create([
            'category_id' => $category->id,
            'name' => 'Cortina de prueba',
            'slug' => 'cortina-prueba',
            'price' => 12000,
            'stock' => 1,
            'unit_type' => 'pieza',
            'is_active' => true,
        ]);
        $cartToken = '9e2e3c3f-5f9a-4a08-99e2-4b8bbf21d683';

        $this->putJson('/api/v1/cart', [
            'cart_token' => $cartToken,
            'items' => [['slug' => $product->slug, 'quantity' => 1]],
        ])->assertOk();

        $product->decrement('stock');

        $this->postJson('/api/v1/orders', [
            'cart_token' => $cartToken,
            'customer_name' => 'Carolina Cliente',
            'customer_email' => 'cliente@example.com',
            'customer_phone' => '+56912345678',
            'delivery_address' => 'Av. Principal 123',
            'delivery_city' => 'Santiago',
            'delivery_region' => 'Metropolitana',
            'payment_method' => 'bank_transfer',
        ])->assertUnprocessable();

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 0]);
    }
}