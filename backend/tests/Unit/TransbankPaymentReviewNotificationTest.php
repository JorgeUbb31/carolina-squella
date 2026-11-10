<?php

use App\Notifications\TransbankPaymentReviewNotification;
use Illuminate\Notifications\Messages\MailMessage;

it('uses mail as its delivery channel', function () {
    $notification = new TransbankPaymentReviewNotification('CS-2026-001', 42, []);

    expect($notification->via(new stdClass))->toBe(['mail']);
});

it('sets a clear subject and greeting for payment review', function () {
    $notification = new TransbankPaymentReviewNotification('CS-2026-001', 42, []);
    $message = $notification->toMail(new stdClass);

    expect($message)->toBeInstanceOf(MailMessage::class)
        ->and($message->subject)->toBe('Acción requerida: pago Webpay en revisión')
        ->and($message->greeting)->toBe('Se requiere revisar un pago Webpay.');
});

it('includes the order and Transbank payment details', function () {
    $notification = new TransbankPaymentReviewNotification('CS-2026-001', 42, [
        'status' => 'AUTHORIZED',
        'response_code' => 0,
        'amount' => 22400,
        'buy_order' => 'BUY-42',
        'session_id' => 'SESSION-42',
    ]);
    $message = $notification->toMail(new stdClass);

    expect($message->introLines)->toContain(
        'Orden: CS-2026-001 (ID 42)',
        'Estado Transbank: AUTHORIZED',
        'Código de respuesta: 0',
        'Monto informado: 22400',
        'Buy order: BUY-42',
        'Session ID: SESSION-42',
    );
});

it('provides safe fallbacks when payment details are missing', function () {
    $notification = new TransbankPaymentReviewNotification('CS-2026-001', 42, []);
    $message = $notification->toMail(new stdClass);

    expect($message->introLines)->toContain(
        'Estado Transbank: desconocido',
        'Código de respuesta: no informado',
        'Monto informado: no informado',
        'Buy order: no informado',
        'Session ID: no informado',
        'La orden conserva el stock reservado y requiere revisión manual.',
    );
});