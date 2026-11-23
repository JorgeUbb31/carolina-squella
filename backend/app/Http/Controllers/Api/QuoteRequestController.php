<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\QuoteMail;
use App\Models\Product;
use App\Models\QuoteRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Throwable;

class QuoteRequestController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'details' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1', 'max:50'],
            'items.*.slug' => ['required', 'string', 'distinct'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:100'],
        ]);

        $products = Product::query()
            ->where('is_active', true)
            ->whereIn('slug', collect($data['items'])->pluck('slug'))
            ->get()
            ->keyBy('slug');

        foreach ($data['items'] as $index => $item) {
            if (! $products->has($item['slug'])) {
                throw ValidationException::withMessages([
                    "items.{$index}.slug" => ['Uno de los productos ya no está disponible.'],
                ]);
            }
        }

        $quoteRequest = DB::transaction(function () use ($data, $products) {
            $lines = collect($data['items'])->map(function ($item) use ($products) {
                $product = $products[$item['slug']];

                return [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_slug' => $product->slug,
                    'unit_type' => $product->unit_type,
                    'unit_price' => $product->price,
                    'quantity' => $item['quantity'],
                    'line_total' => round((float) $product->price * $item['quantity'], 2),
                ];
            });

            $quoteRequest = QuoteRequest::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'details' => $data['details'] ?? '',
                'total' => $lines->sum('line_total'),
            ]);
            $quoteRequest->items()->createMany($lines->all());

            return $quoteRequest->load('items');
        });

        $summary = [
            'quote_number' => $quoteRequest->number,
            'total' => $quoteRequest->total,
        ];

        if (config('mail.default') === 'log') {
            return response()->json([
                ...$summary,
                'message' => 'Guardamos tu solicitud. El correo con el PDF no está habilitado en este entorno.',
                'email_sent' => false,
            ], 201);
        }

        try {
            $mail = Mail::to($quoteRequest->email);
            if ($copy = config('services.quotes.copy_email')) {
                $mail->bcc($copy);
            }
            $mail->send(new QuoteMail($quoteRequest));
        } catch (Throwable $exception) {
            Log::error('No se pudo enviar la cotización en PDF.', [
                'quote_request_id' => $quoteRequest->id,
                'exception' => $exception,
            ]);

            return response()->json([
                ...$summary,
                'message' => 'Guardamos tu solicitud, pero no pudimos enviar el PDF por correo. Te contactaremos.',
                'email_sent' => false,
            ], 201);
        }

        return response()->json([
            ...$summary,
            'message' => "Enviamos la cotización {$quoteRequest->number} en PDF a tu correo.",
            'email_sent' => true,
        ], 201);
    }
}
