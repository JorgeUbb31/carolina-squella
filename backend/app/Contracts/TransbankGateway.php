<?php

namespace App\Contracts;

interface TransbankGateway
{
    public function create(string $buyOrder, string $sessionId, int $amount, string $returnUrl): array;

    public function commit(string $token): array;

    public function status(string $token): array;
}
