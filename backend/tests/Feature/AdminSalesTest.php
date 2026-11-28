<?php

use App\Models\Category;
use App\Models\Order;
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
            'customer_rut' => '12.345.678-5',
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
            'customer_rut' => '12.345.678-5',
            'payment_method' => 'debit_card',
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('items');

    $this->assertDatabaseCount('orders', 0);
    $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 1]);
});

it('looks up previous customer details by RUT and edits a sale while reconciling stock', function () {
    /** @var TestCase $this */
    $admin = User::factory()->create(['is_admin' => true]);
    $category = Category::query()->create([
        'name' => 'Cortinas',
        'slug' => 'cortinas',
        'is_active' => true,
    ]);
    $firstProduct = Product::query()->create([
        'category_id' => $category->id,
        'name' => 'Cortina antigua',
        'slug' => 'cortina-antigua',
        'price' => 10000,
        'stock' => 10,
        'unit_type' => 'pieza',
        'is_active' => true,
    ]);
    $secondProduct = Product::query()->create([
        'category_id' => $category->id,
        'name' => 'Cortina nueva',
        'slug' => 'cortina-nueva',
        'price' => 20000,
        'stock' => 5,
        'unit_type' => 'pieza',
        'is_active' => true,
    ]);
    $token = $admin->createToken('in-person-sale-edit-test')->plainTextToken;

    $created = $this->withToken($token)->postJson('/api/v1/admin/orders', [
        'customer_name' => 'María Cliente',
        'customer_rut' => '12.345.678-5',
        'customer_email' => 'maria@example.com',
        'customer_phone' => '+56 9 1234 5678',
        'payment_method' => 'cash',
        'items' => [['product_id' => $firstProduct->id, 'quantity' => 2]],
    ])->assertCreated()
        ->assertJsonPath('order.customer_rut', '123456785');
    $saleId = $created->json('order.id');

    $this->withToken($token)->getJson('/api/v1/admin/orders/customer?rut=12345678-5')
        ->assertOk()
        ->assertJsonPath('customer.customer_name', 'María Cliente')
        ->assertJsonPath('customer.customer_email', 'maria@example.com');

    $this->withToken($token)->putJson('/api/v1/admin/orders/'.$saleId, [
        'customer_name' => 'María Cliente actualizada',
        'customer_rut' => '12345678-5',
        'customer_email' => 'maria@example.com',
        'customer_phone' => '+56 9 8765 4321',
        'payment_method' => 'debit_card',
        'items' => [
            ['product_id' => $firstProduct->id, 'quantity' => 1],
            ['product_id' => $secondProduct->id, 'quantity' => 1],
        ],
    ])->assertOk()
        ->assertJsonPath('order.customer_name', 'María Cliente actualizada')
        ->assertJsonPath('order.total', '30000.00')
        ->assertJsonCount(2, 'order.items');

    $this->assertDatabaseHas('products', ['id' => $firstProduct->id, 'stock' => 9]);
    $this->assertDatabaseHas('products', ['id' => $secondProduct->id, 'stock' => 4]);
    $this->assertDatabaseHas('stock_movements', [
        'product_id' => $firstProduct->id,
        'quantity_change' => 1,
        'reason' => 'in_person_sale_edit',
    ]);
    $this->assertDatabaseHas('stock_movements', [
        'product_id' => $secondProduct->id,
        'quantity_change' => -1,
        'reason' => 'in_person_sale_edit',
    ]);
});

it('rejects invalid Chilean RUTs on in-person sales', function () {
    /** @var TestCase $this */
    $admin = User::factory()->create(['is_admin' => true]);
    $product = Product::query()->create([
        'name' => 'Producto RUT',
        'slug' => 'producto-rut',
        'price' => 10000,
        'stock' => 2,
        'unit_type' => 'pieza',
        'is_active' => true,
    ]);

    $this->actingAs($admin, 'sanctum')
        ->postJson('/api/v1/admin/orders', [
            'customer_name' => 'Cliente inválido',
            'customer_rut' => '12.345.678-0',
            'payment_method' => 'cash',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('customer_rut');

    $this->assertDatabaseCount('orders', 0);
});

it('generates a monthly sales PDF for all sales channels', function () {
    /** @var TestCase $this */
    $admin = User::factory()->create(['is_admin' => true]);

    $paidOnline = createMonthlyReportOrder('CS-ONLINE-OCT', 'online', 'paid', 25000, '2026-10-12 10:30:00');
    $paidOnline->items()->create([
        'product_name' => 'Cortina online',
        'product_slug' => 'cortina-online',
        'unit_price' => 25000,
        'quantity' => 1,
        'line_total' => 25000,
    ]);
    $pendingInPerson = createMonthlyReportOrder('CSV-PENDING-OCT', 'in_person', 'pending_payment', 12000, '2026-10-20 15:00:00');
    $outsideMonth = createMonthlyReportOrder('CS-ONLINE-SEP', 'online', 'paid', 9000, '2026-09-30 23:59:00');
    $outsideMonth->items()->create([
        'product_name' => 'Producto de septiembre',
        'product_slug' => 'producto-septiembre',
        'unit_price' => 9000,
        'quantity' => 1,
        'line_total' => 9000,
    ]);

    $this->actingAs($admin, 'sanctum')
        ->get('/api/v1/admin/orders/monthly-report?month=2026-10')
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf')
        ->assertHeader('content-disposition', 'inline; filename=ventas-2026-10.pdf')
        ->assertSee('%PDF', false);

    $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/admin/orders/monthly-report?month=2026-13')
        ->assertUnprocessable()
        ->assertJsonValidationErrors('month');

    $this->assertDatabaseHas('orders', ['id' => $paidOnline->id, 'sale_source' => 'online', 'status' => 'paid']);
    $this->assertDatabaseHas('orders', ['id' => $pendingInPerson->id, 'sale_source' => 'in_person', 'status' => 'pending_payment']);
});

function createMonthlyReportOrder(string $number, string $source, string $status, int $total, string $createdAt): Order
{
    $order = Order::query()->create([
        'order_number' => $number,
        'sale_source' => $source,
        'customer_name' => 'Cliente de prueba',
        'customer_email' => 'cliente@example.com',
        'customer_phone' => '+56912345678',
        'delivery_address' => '',
        'delivery_city' => '',
        'delivery_region' => '',
        'payment_method' => $source === 'in_person' ? 'cash' : 'webpay_plus',
        'status' => $status,
        'subtotal' => $total,
        'shipping_total' => 0,
        'total' => $total,
        'paid_at' => $status === 'paid' ? $createdAt : null,
    ]);

    $order->forceFill([
        'created_at' => $createdAt,
        'updated_at' => $createdAt,
    ])->saveQuietly();

    return $order;
}
