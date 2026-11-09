<?php

use App\Contracts\TransbankGateway;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Str;
use Tests\TestCase;
use Transbank\Webpay\WebpayPlus\Exceptions\TransactionCommitException;

it('creates an order, saves its items, and decrements stock', function () {
    /** @var TestCase $this */
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
    $this->assertDatabaseCount('cart_items', 0);
});

it('rejects checkout when stock changes after the cart was saved', function () {
    /** @var TestCase $this */
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
});

it('creates a Webpay payment and reserves inventory until its result', function () {
    /** @var TestCase $this */
    $gateway = Mockery::mock(TransbankGateway::class);
    $gateway->shouldReceive('create')
        ->once()
        ->withArgs(fn ($buyOrder, $sessionId, $amount, $returnUrl) => $amount === 24000
            && str_contains($returnUrl, '/api/v1/payments/transbank/return'))
        ->andReturn(['token' => 'webpay-token', 'url' => 'https://webpay.example/']);
    $this->app->instance(TransbankGateway::class, $gateway);

    [$product, $cartToken] = createWebpayCart($this);

    $response = $this->postJson('/api/v1/orders', [
        'cart_token' => $cartToken,
        'customer_name' => 'Carolina Cliente',
        'customer_email' => 'cliente@example.com',
        'customer_phone' => '+56912345678',
        'delivery_address' => 'Av. Principal 123',
        'delivery_city' => 'Santiago',
        'delivery_region' => 'Metropolitana',
        'payment_method' => 'webpay_plus',
    ]);

    $response->assertCreated()
        ->assertJsonPath('payment.token', 'webpay-token')
        ->assertJsonPath('payment.url', 'https://webpay.example/');
    $this->assertDatabaseHas('orders', [
        'order_number' => $response->json('order.order_number'),
        'payment_method' => 'webpay_plus',
        'cart_token' => $cartToken,
        'transbank_token' => 'webpay-token',
        'status' => 'pending_payment',
    ]);
    $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 3]);
    $this->assertDatabaseCount('cart_items', 1);
});

it('confirms an authorized or captured Webpay payment only when its order details match', function (string $status) {
    /** @var TestCase $this */
    $gateway = Mockery::mock(TransbankGateway::class);
    $gateway->shouldReceive('create')->once()
        ->andReturn(['token' => 'webpay-token', 'url' => 'https://webpay.example/']);
    $this->app->instance(TransbankGateway::class, $gateway);

    [$product, $cartToken] = createWebpayCart($this);
    $order = createWebpayOrder($this, $cartToken);
    $gateway->shouldReceive('commit')->once()->with('webpay-token')->andReturn([
        'status' => $status,
        'response_code' => 0,
        'amount' => 24000,
        'authorization_code' => 'auth-123',
        'buy_order' => $order->order_number,
        'session_id' => $order->transbank_session_id,
    ]);

    $this->get('/api/v1/payments/transbank/return?token_ws=webpay-token')
        ->assertRedirect(config('services.transbank.storefront_url').'/payment/result?status=approved&order='.$order->order_number);

    $this->post('/api/v1/payments/transbank/return', ['token_ws' => 'webpay-token'])
        ->assertRedirect(config('services.transbank.storefront_url').'/payment/result?status=approved&order='.$order->order_number);

    $this->assertDatabaseHas('orders', [
        'id' => $order->id,
        'status' => 'paid',
        'transbank_authorization_code' => 'auth-123',
    ]);
    $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 3]);
    $this->assertDatabaseCount('cart_items', 0);
    $this->getJson('/api/v1/orders/'.$order->order_number.'/payment-status')
        ->assertOk()
        ->assertJsonPath('status', 'paid')
        ->assertJsonPath('cart_token', $order->cart_token);
})->with(['AUTHORIZED', 'CAPTURED']);

it('releases reserved stock when Webpay declines a payment', function () {
    /** @var TestCase $this */
    $gateway = Mockery::mock(TransbankGateway::class);
    $gateway->shouldReceive('create')->once()
        ->andReturn(['token' => 'webpay-token', 'url' => 'https://webpay.example/']);
    $gateway->shouldReceive('commit')->once()->with('webpay-token')->andReturn([
        'status' => 'FAILED',
        'response_code' => -1,
        'amount' => 24000,
        'authorization_code' => null,
        'buy_order' => 'unused',
        'session_id' => 'unused',
    ]);
    $this->app->instance(TransbankGateway::class, $gateway);

    [$product, $cartToken] = createWebpayCart($this);
    $order = createWebpayOrder($this, $cartToken);
    $order->update(['transbank_token' => 'webpay-token']);

    $this->post('/api/v1/payments/transbank/return', ['token_ws' => 'webpay-token'])
        ->assertRedirect(config('services.transbank.storefront_url').'/payment/result?status=failed&order='.$order->order_number);

    $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'payment_failed']);
    $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 5]);
});

it('marks an aborted Transbank transaction as cancelled and releases its stock', function () {
    /** @var TestCase $this */
    $gateway = Mockery::mock(TransbankGateway::class);
    $gateway->shouldReceive('create')->once()
        ->andReturn(['token' => 'webpay-token', 'url' => 'https://webpay.example/']);
    $gateway->shouldReceive('commit')->once()->with('webpay-token')->andThrow(
        new TransactionCommitException(
            'The transaction could not be confirmed',
            'Transaction has an invalid finished state: aborted',
            422,
        ),
    );
    $this->app->instance(TransbankGateway::class, $gateway);

    [$product, $cartToken] = createWebpayCart($this);
    $order = createWebpayOrder($this, $cartToken);

    $this->get('/api/v1/payments/transbank/return?token_ws=webpay-token')
        ->assertRedirect(config('services.transbank.storefront_url').'/payment/result?status=cancelled&order='.$order->order_number);

    $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'payment_cancelled']);
    $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 5]);
});

it('releases reserved stock when the customer cancels Webpay', function () {
    /** @var TestCase $this */
    $gateway = Mockery::mock(TransbankGateway::class);
    $gateway->shouldReceive('create')->once()
        ->andReturn(['token' => 'webpay-token', 'url' => 'https://webpay.example/']);
    $this->app->instance(TransbankGateway::class, $gateway);

    [$product, $cartToken] = createWebpayCart($this);
    $order = createWebpayOrder($this, $cartToken);

    $this->post('/api/v1/payments/transbank/return', [
        'TBK_TOKEN' => 'webpay-token',
        'TBK_ORDEN_COMPRA' => $order->order_number,
        'TBK_ID_SESION' => $order->transbank_session_id,
    ])->assertRedirect(config('services.transbank.storefront_url').'/payment/result?status=cancelled&order='.$order->order_number);

    $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'payment_cancelled']);
    $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 5]);
    $this->assertDatabaseCount('cart_items', 1);
});

it('keeps stock reserved for manual review when an authorized response mismatches the order', function () {
    /** @var TestCase $this */
    $gateway = Mockery::mock(TransbankGateway::class);
    $gateway->shouldReceive('create')->once()
        ->andReturn(['token' => 'webpay-token', 'url' => 'https://webpay.example/']);
    $this->app->instance(TransbankGateway::class, $gateway);

    [$product, $cartToken] = createWebpayCart($this);
    $order = createWebpayOrder($this, $cartToken);
    $gateway->shouldReceive('commit')->once()->with('webpay-token')->andReturn([
        'status' => 'AUTHORIZED',
        'response_code' => 0,
        'amount' => 12000,
        'authorization_code' => 'auth-123',
        'buy_order' => $order->order_number,
        'session_id' => $order->transbank_session_id,
    ]);

    $this->post('/api/v1/payments/transbank/return', ['token_ws' => 'webpay-token'])
        ->assertRedirect(config('services.transbank.storefront_url').'/payment/result?status=review&order='.$order->order_number);

    $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'payment_review']);
    $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 3]);
});

it('expires pending Webpay orders and releases their reserved stock', function () {
    /** @var TestCase $this */
    $gateway = Mockery::mock(TransbankGateway::class);
    $gateway->shouldReceive('create')->once()
        ->andReturn(['token' => 'webpay-token', 'url' => 'https://webpay.example/']);
    $this->app->instance(TransbankGateway::class, $gateway);

    [$product, $cartToken] = createWebpayCart($this);
    $order = createWebpayOrder($this, $cartToken);
    $order->update(['payment_expires_at' => now()->subMinute()]);

    $this->artisan('orders:expire-transbank')->assertSuccessful();

    $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'payment_expired']);
    $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 5]);
});

it('releases reserved stock when creating a Webpay transaction fails', function () {
    /** @var TestCase $this */
    $gateway = Mockery::mock(TransbankGateway::class);
    $gateway->shouldReceive('create')->once()->andThrow(new RuntimeException('Transbank unavailable'));
    $this->app->instance(TransbankGateway::class, $gateway);

    [$product, $cartToken] = createWebpayCart($this);

    $this->postJson('/api/v1/orders', [
        'cart_token' => $cartToken,
        'customer_name' => 'Carolina Cliente',
        'customer_email' => 'cliente@example.com',
        'customer_phone' => '+56912345678',
        'delivery_address' => 'Av. Principal 123',
        'delivery_city' => 'Santiago',
        'delivery_region' => 'Metropolitana',
        'payment_method' => 'webpay_plus',
    ])->assertStatus(502);

    $this->assertDatabaseHas('orders', ['payment_method' => 'webpay_plus', 'status' => 'payment_failed']);
    $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 5]);
    $this->assertDatabaseCount('cart_items', 1);
});

function createWebpayCart(TestCase $test): array
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
    $cartToken = (string) Str::uuid();

    $test->putJson('/api/v1/cart', [
        'cart_token' => $cartToken,
        'items' => [['slug' => $product->slug, 'quantity' => 2]],
    ])->assertOk();

    return [$product, $cartToken];
}

function createWebpayOrder(TestCase $test, string $cartToken): Order
{
    $response = $test->postJson('/api/v1/orders', [
        'cart_token' => $cartToken,
        'customer_name' => 'Carolina Cliente',
        'customer_email' => 'cliente@example.com',
        'customer_phone' => '+56912345678',
        'delivery_address' => 'Av. Principal 123',
        'delivery_city' => 'Santiago',
        'delivery_region' => 'Metropolitana',
        'payment_method' => 'webpay_plus',
    ]);

    $response->assertCreated();

    return Order::query()->where('order_number', $response->json('order.order_number'))->firstOrFail();
}
