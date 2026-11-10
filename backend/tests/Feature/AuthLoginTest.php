<?php

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Tests\TestCase;

it('allows an admin to log in and receive a Sanctum token', function () {
    /** @var TestCase $this */
    User::factory()->create([
        'email' => 'admin@example.com',
        'password' => 'correct-password',
        'is_admin' => true,
    ]);

    $this->postJson('/api/v1/auth/login', [
        'email' => 'admin@example.com',
        'password' => 'correct-password',
    ])
        ->assertOk()
        ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email']])
        ->assertJsonPath('user.email', 'admin@example.com');

    $this->assertDatabaseCount('personal_access_tokens', 1);
});

it('rejects invalid login credentials', function () {
    /** @var TestCase $this */
    User::factory()->create([
        'email' => 'admin@example.com',
        'password' => 'correct-password',
        'is_admin' => true,
    ]);

    $this->postJson('/api/v1/auth/login', [
        'email' => 'admin@example.com',
        'password' => 'wrong-password',
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('email');
});

it('returns a generic credentials error for non-admin users logging in to the admin api', function () {
    /** @var TestCase $this */
    User::factory()->create([
        'email' => 'customer@example.com',
        'password' => 'correct-password',
        'is_admin' => false,
    ]);

    $this->postJson('/api/v1/auth/login', [
        'email' => 'customer@example.com',
        'password' => 'correct-password',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors('email')
        ->assertJsonPath('errors.email.0', 'Credenciales inválidas.');

    $this->assertDatabaseCount('personal_access_tokens', 0);
});

it('rate limits login after five attempts', function () {
    /** @var TestCase $this */
    User::factory()->create([
        'email' => 'admin@example.com',
        'password' => 'correct-password',
        'is_admin' => true,
    ]);

    for ($attempt = 0; $attempt < 5; $attempt++) {
        $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@example.com',
            'password' => 'wrong-password',
        ])->assertUnprocessable();
    }

    $this->postJson('/api/v1/auth/login', [
        'email' => 'admin@example.com',
        'password' => 'correct-password',
    ])->assertTooManyRequests();
});

it('seeds an admin account that can log in', function () {
    /** @var TestCase $this */
    $this->seed();

    $this->postJson('/api/v1/auth/login', [
        'email' => 'test@example.com',
        'password' => 'password',
    ])
        ->assertOk()
        ->assertJsonPath('user.email', 'test@example.com')
        ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email']]);

    $this->assertDatabaseHas('users', [
        'email' => 'test@example.com',
        'is_admin' => true,
    ]);
});

it('does not seed the demo admin account in production', function () {
    /** @var TestCase $this */
    $this->app->detectEnvironment(fn () => 'production');

    $this->app->make(DatabaseSeeder::class)->run();

    $this->assertDatabaseMissing('users', ['email' => 'test@example.com']);
});
