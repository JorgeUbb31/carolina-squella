<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StockManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_stock_routes_require_an_admin_token(): void
    {
        $this->getJson('/api/v1/admin/stock')->assertUnauthorized();

        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/admin/stock')
            ->assertForbidden();
    }

    public function test_admin_can_login_and_adjust_stock_with_audited_movement(): void
    {
        $admin = $this->createAdmin();
        $product = $this->createProduct(4);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $admin->email,
            'password' => 'password',
        ])->assertOk()->assertJsonStructure(['token', 'user' => ['id', 'name', 'email']]);

        $response = $this->withToken($login->json('token'))
            ->postJson('/api/v1/admin/stock/adjustments', [
                'product_id' => $product->id,
                'quantity_change' => 6,
                'reason' => 'Recepción de mercadería',
            ]);

        $response->assertCreated()
            ->assertJsonPath('product.stock', 10)
            ->assertJsonPath('movement.quantity_change', 6)
            ->assertJsonPath('movement.stock_before', 4)
            ->assertJsonPath('movement.stock_after', 10);
        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 10]);
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'user_id' => $admin->id,
            'quantity_change' => 6,
        ]);
    }

    public function test_stock_adjustment_cannot_make_stock_negative(): void
    {
        $admin = $this->createAdmin();
        $product = $this->createProduct(2);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/stock/adjustments', [
                'product_id' => $product->id,
                'quantity_change' => -3,
                'reason' => 'Corrección de inventario',
            ])
            ->assertUnprocessable();

        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 2]);
        $this->assertDatabaseCount('stock_movements', 0);
    }

    private function createAdmin(): User
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();

        return $admin;
    }

    private function createProduct(int $stock): Product
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
}