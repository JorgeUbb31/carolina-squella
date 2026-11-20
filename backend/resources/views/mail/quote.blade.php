<p>Hola {{ $quoteRequest->name }},</p>

<p>Adjuntamos tu cotización {{ $quoteRequest->number }} en PDF. La cotización es válida por {{ (int) config('services.quotes.validity_days', 3) }} días.</p>

<p>Si tienes preguntas, responde a este correo.</p>

<p>Carolina Squella</p>
