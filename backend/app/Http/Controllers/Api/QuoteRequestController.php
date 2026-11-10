<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QuoteRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class QuoteRequestController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'details' => ['required', 'string', 'max:2000'],
        ]);

        $quoteRequest = QuoteRequest::query()->create($data);

        if (config('mail.default') === 'log') {
            return response()->json([
                'message' => 'Guardamos tu solicitud. El correo de confirmación no está habilitado en este entorno.',
                'email_sent' => false,
            ], 201);
        }

        try {
            $message = "Hola {$quoteRequest->name},\n\n"
                ."Recibimos tu solicitud de cotización:\n\n{$quoteRequest->details}\n\n"
                ."Nos pondremos en contacto contigo pronto.\n\n"
                .'Carolina Squella';

            Mail::raw($message, function ($mail) use ($quoteRequest) {
                $mail->to($quoteRequest->email)
                    ->subject('Recibimos tu solicitud de cotización');
            });
        } catch (Throwable $exception) {
            Log::error('No se pudo enviar el correo de confirmación de una solicitud de cotización.', [
                'quote_request_id' => $quoteRequest->id,
                'exception' => $exception,
            ]);

            return response()->json([
                'message' => 'Guardamos tu solicitud, pero no pudimos enviar el correo de confirmación.',
                'email_sent' => false,
            ], 201);
        }

        return response()->json([
            'message' => 'Recibimos tu solicitud y enviamos una confirmación a tu correo.',
            'email_sent' => true,
        ], 201);
    }
}
