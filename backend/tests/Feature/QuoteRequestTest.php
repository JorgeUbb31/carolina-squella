<?php

use App\Models\QuoteRequest;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

it('stores a quote request and emails a confirmation to the submitted address', function () {
    /** @var TestCase $this */
    config(['mail.default' => 'smtp']);
    Mail::shouldReceive('raw')
        ->once()
        ->withArgs(function (string $body, callable $configureMessage): bool {
            expect($body)
                ->toContain('Hola Jorge Díaz')
                ->toContain('Necesito cotizar cortinas para dos ventanas.');

            $message = Mockery::mock();
            $message->shouldReceive('to')->once()->with('jorge@example.com')->andReturnSelf();
            $message->shouldReceive('subject')->once()->with('Recibimos tu solicitud de cotización');
            $configureMessage($message);

            return true;
        });

    $this->postJson('/api/v1/quote-requests', [
        'name' => 'Jorge Díaz',
        'email' => 'jorge@example.com',
        'phone' => '+56912345678',
        'details' => 'Necesito cotizar cortinas para dos ventanas.',
    ])
        ->assertCreated()
        ->assertJsonPath('email_sent', true);

    $quoteRequest = QuoteRequest::query()->firstOrFail();
    $this->assertDatabaseHas('quote_requests', [
        'id' => $quoteRequest->id,
        'name' => 'Jorge Díaz',
        'email' => 'jorge@example.com',
        'phone' => '+56912345678',
        'details' => 'Necesito cotizar cortinas para dos ventanas.',
        'status' => 'pending',
    ]);

});

it('requires valid contact details and request information for a quote', function () {
    /** @var TestCase $this */
    $this->postJson('/api/v1/quote-requests', [
        'name' => '',
        'email' => 'not-an-email',
        'details' => '',
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'email', 'details']);

    $this->assertDatabaseCount('quote_requests', 0);
});

it('stores a quote request when outbound email is not configured', function () {
    /** @var TestCase $this */
    config(['mail.default' => 'log']);

    $this->postJson('/api/v1/quote-requests', [
        'name' => 'Jorge Díaz',
        'email' => 'jorge@example.com',
        'details' => 'Necesito cotizar cortinas.',
    ])
        ->assertCreated()
        ->assertJsonPath('email_sent', false)
        ->assertJsonPath('message', 'Guardamos tu solicitud. El correo de confirmación no está habilitado en este entorno.');

    $this->assertDatabaseCount('quote_requests', 1);
});
