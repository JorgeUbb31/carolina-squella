<?php

use App\Models\QuoteRequest;
use App\Models\User;
use Tests\TestCase;

it('allows an admin to list quote requests with their products and update status', function () {
    /** @var TestCase $this */
    $admin = User::factory()->create(['is_admin' => true]);
    $quote = QuoteRequest::query()->create([
        'name' => 'Jorge Díaz',
        'email' => 'jorge@example.com',
        'details' => 'Medidas por confirmar.',
        'total' => 24000,
    ]);
    $quote->items()->create([
        'product_name' => 'Cortina de prueba',
        'product_slug' => 'cortina-prueba',
        'unit_type' => 'pieza',
        'unit_price' => 12000,
        'quantity' => 2,
        'line_total' => 24000,
    ]);

    $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/admin/quote-requests')
        ->assertOk()
        ->assertJsonPath('data.0.name', 'Jorge Díaz')
        ->assertJsonPath('data.0.number', 'COT-000001')
        ->assertJsonPath('data.0.items.0.product_name', 'Cortina de prueba');

    $this->actingAs($admin, 'sanctum')
        ->patchJson("/api/v1/admin/quote-requests/{$quote->id}", ['status' => 'contacted'])
        ->assertOk()
        ->assertJsonPath('status', 'contacted');

    $this->assertDatabaseHas('quote_requests', ['id' => $quote->id, 'status' => 'contacted']);
});

it('does not allow changing a closed quote status', function () {
    /** @var TestCase $this */
    $admin = User::factory()->create(['is_admin' => true]);
    $quote = QuoteRequest::query()->create([
        'name' => 'Jorge Díaz',
        'email' => 'jorge@example.com',
        'details' => 'Cotización cerrada.',
        'status' => 'closed',
        'total' => 24000,
    ]);

    $this->actingAs($admin, 'sanctum')
        ->patchJson("/api/v1/admin/quote-requests/{$quote->id}", ['status' => 'contacted'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('status');

    $this->assertDatabaseHas('quote_requests', ['id' => $quote->id, 'status' => 'closed']);
});

it('restricts quote management to authenticated administrators', function () {
    /** @var TestCase $this */
    $this->getJson('/api/v1/admin/quote-requests')->assertUnauthorized();

    $customer = User::factory()->create(['is_admin' => false]);
    $this->actingAs($customer, 'sanctum')
        ->getJson('/api/v1/admin/quote-requests')
        ->assertForbidden();
});
