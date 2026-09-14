<?php

namespace Tests\Feature;


use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_the_products_api_returns_a_successful_response(): void
    {
        $response = $this->getJson('/api/v1/products');

        $response->assertOk();
        $response->assertJsonStructure(['data']);
    }
}
