<?php

use App\Mail\QuoteMail;
use App\Models\Category;
use App\Models\Product;
use App\Models\QuoteRequest;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

function makeQuoteProduct(): Product
{
    $category = Category::query()->create([
        'name' => 'Cortinas',
        'slug' => 'cortinas',
        'description' => 'Cortinas',
        'is_active' => true,
    ]);

    return Product::query()->create([
        'category_id' => $category->id,
        'name' => 'Cortina de prueba',
        'slug' => 'cortina-prueba',
        'price' => 12000,
        'stock' => 5,
        'unit_type' => 'pieza',
        'is_active' => true,
    ]);
}

it('stores product lines priced from the database and emails a PDF quote', function () {
    /** @var TestCase $this */
    $product = makeQuoteProduct();
    config([
        'mail.default' => 'array',
        'services.quotes.copy_email' => 'carolina@example.com',
        'services.quotes.validity_days' => 3,
    ]);
    Mail::fake();

    $this->postJson('/api/v1/quote-requests', [
        'name' => 'Jorge Díaz',
        'email' => 'jorge@example.com',
        'phone' => '+56912345678',
        'details' => 'Necesito cotizar cortinas para dos ventanas.',
        'items' => [[
            'slug' => $product->slug,
            'quantity' => 2,
            'unit_price' => 1,
        ]],
    ])
        ->assertCreated()
        ->assertJsonPath('quote_number', 'COT-000001')
        ->assertJsonPath('total', '24000.00')
        ->assertJsonPath('email_sent', true);

    $quoteRequest = QuoteRequest::query()->with('items')->firstOrFail();
    $this->assertDatabaseHas('quote_requests', [
        'id' => $quoteRequest->id,
        'name' => 'Jorge Díaz',
        'email' => 'jorge@example.com',
        'total' => 24000,
        'status' => 'pending',
    ]);
    $this->assertDatabaseHas('quote_request_items', [
        'quote_request_id' => $quoteRequest->id,
        'product_id' => $product->id,
        'unit_price' => 12000,
        'quantity' => 2,
        'line_total' => 24000,
    ]);
    $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 5]);

    Mail::assertSent(QuoteMail::class, function (QuoteMail $mail) use ($quoteRequest): bool {
        return $mail->hasTo('jorge@example.com')
            && $mail->hasBcc('carolina@example.com')
            && $mail->quoteRequest->number === $quoteRequest->number
            && $mail->quoteRequest->items->count() === 1
            && str_starts_with($mail->pdf(), '%PDF-');
    });
});

it('requires valid contact details and at least one valid product for a quote', function () {
    /** @var TestCase $this */
    $this->postJson('/api/v1/quote-requests', [
        'name' => '',
        'email' => 'not-an-email',
        'items' => [],
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'email', 'items']);

    $this->assertDatabaseCount('quote_requests', 0);
});

it('rejects inactive and unknown products without creating a quote', function () {
    /** @var TestCase $this */
    $product = makeQuoteProduct();
    $product->update(['is_active' => false]);

    $this->postJson('/api/v1/quote-requests', [
        'name' => 'Jorge Díaz',
        'email' => 'jorge@example.com',
        'items' => [['slug' => $product->slug, 'quantity' => 1]],
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('items.0.slug');

    $this->assertDatabaseCount('quote_requests', 0);
});

it('stores quote requests when outbound email is not configured', function () {
    /** @var TestCase $this */
    $product = makeQuoteProduct();
    config(['mail.default' => 'log']);

    $this->postJson('/api/v1/quote-requests', [
        'name' => 'Jorge Díaz',
        'email' => 'jorge@example.com',
        'items' => [['slug' => $product->slug, 'quantity' => 1]],
    ])
        ->assertCreated()
        ->assertJsonPath('email_sent', false)
        ->assertJsonPath('quote_number', 'COT-000001');

    $this->assertDatabaseCount('quote_requests', 1);
    $this->assertDatabaseCount('quote_request_items', 1);
});
