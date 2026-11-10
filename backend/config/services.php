<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'transbank' => [
        'environment' => env('TRANSBANK_ENVIRONMENT', 'production'),
        'commerce_code' => env('TRANSBANK_COMMERCE_CODE'),
        'api_key' => env('TRANSBANK_API_KEY'),
        'storefront_url' => env('STOREFRONT_URL', 'http://localhost:5173'),
        'payment_expiration_minutes' => env('TRANSBANK_PAYMENT_EXPIRATION_MINUTES', 30),
        'bank_transfer_payment_expiration_hours' => env('BANK_TRANSFER_PAYMENT_EXPIRATION_HOURS', 72),
        'payment_review_alert_email' => env('PAYMENT_REVIEW_ALERT_EMAIL'),
    ],

];
