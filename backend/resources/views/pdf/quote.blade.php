<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <style>
        body { color: #252321; font-family: DejaVu Sans, sans-serif; font-size: 12px; }
        h1 { color: #70432f; font-size: 22px; margin-bottom: 4px; }
        .muted { color: #706b65; }
        .header { border-bottom: 2px solid #9b6245; margin-bottom: 22px; padding-bottom: 14px; }
        table { border-collapse: collapse; margin-top: 20px; width: 100%; }
        th, td { border-bottom: 1px solid #ded8d2; padding: 9px 7px; text-align: left; }
        th { background: #f8f1e8; }
        .number, .quantity, .amount { text-align: right; }
        .total { font-size: 15px; font-weight: bold; margin-top: 18px; text-align: right; }
        .details { background: #f8f1e8; margin-top: 20px; padding: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Carolina Squella</h1>
        <div class="muted">Cotización {{ $quote->number }}</div>
    </div>

    <p><strong>Cliente:</strong> {{ $quote->name }}<br>
        <strong>Correo:</strong> {{ $quote->email }}<br>
        @if ($quote->phone)<strong>Teléfono:</strong> {{ $quote->phone }}<br>@endif
        <strong>Fecha:</strong> {{ $quote->created_at->format('d/m/Y') }}<br>
        <strong>Válida por:</strong> {{ $validityDays }} días</p>

    <table>
        <thead>
            <tr>
                <th>Producto</th>
                <th class="quantity">Cantidad</th>
                <th class="amount">Precio unitario</th>
                <th class="amount">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($quote->items as $item)
                <tr>
                    <td>{{ $item->product_name }} <span class="muted">({{ $item->unit_type }})</span></td>
                    <td class="quantity">{{ $item->quantity }}</td>
                    <td class="amount">${{ number_format((float) $item->unit_price, 0, ',', '.') }}</td>
                    <td class="amount">${{ number_format((float) $item->line_total, 0, ',', '.') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <p class="total">Total: ${{ number_format((float) $quote->total, 0, ',', '.') }}</p>

    @if ($quote->details)
        <div class="details"><strong>Detalles adicionales:</strong><br>{{ $quote->details }}</div>
    @endif
</body>
</html>
