<?php

namespace App\Services\Transbank;

use App\Contracts\TransbankGateway;
use RuntimeException;
use Transbank\Webpay\WebpayPlus;
use Transbank\Webpay\WebpayPlus\Transaction;

class SdkTransbankGateway implements TransbankGateway
{
    public function create(string $buyOrder, string $sessionId, int $amount, string $returnUrl): array
    {
        $response = $this->transaction()->create($buyOrder, $sessionId, $amount, $returnUrl);

        return [
            'token' => $response->getToken(),
            'url' => $response->getUrl(),
        ];
    }

    public function commit(string $token): array
    {
        $response = $this->transaction()->commit($token);

        return [
            'status' => $response->status,
            'response_code' => $response->responseCode,
            'amount' => $response->amount,
            'authorization_code' => $response->authorizationCode,
            'buy_order' => $response->buyOrder,
            'session_id' => $response->sessionId,
        ];
    }

    private function transaction(): Transaction
    {
        $environment = config('services.transbank.environment');
        $commerceCode = config('services.transbank.commerce_code');
        $apiKey = config('services.transbank.api_key');

        if ($environment === 'integration') {
            return Transaction::buildForIntegration(
                $apiKey ?: WebpayPlus::INTEGRATION_API_KEY,
                $commerceCode ?: WebpayPlus::INTEGRATION_COMMERCE_CODE,
            );
        }

        if ($environment !== 'production' || ! $commerceCode || ! $apiKey) {
            throw new RuntimeException('Las credenciales de producción de Transbank no están configuradas.');
        }

        return Transaction::buildForProduction($apiKey, $commerceCode);
    }
}
