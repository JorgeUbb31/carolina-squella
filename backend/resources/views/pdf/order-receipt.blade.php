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
        .quantity, .amount { text-align: right; }
        .total { font-size: 15px; font-weight: bold; margin-top: 18px; text-align: right; }
        .notice { border-top: 1px solid #ded8d2; color: #706b65; margin-top: 28px; padding-top: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Carolina Squella</h1>
        <div class="muted">Comprobante de compra {{ $order->order_number }}</div>
    </div>

    <p>
        <strong>Cliente:</strong> {{ $order->customer_name }}<br>
        <strong>Correo:</strong> {{ $order->customer_email }}<br>
        <strong>Fecha de pago:</strong> {{ $order->paid_at?->format('d/m/Y H:i') }}<br>
        <strong>Método de pago:</strong> Webpay Plus<br>
        @if ($order->transbank_authorization_code)
            <strong>Código de autorización:</strong> {{ $order->transbank_authorization_code }}<br>
        @endif
        <strong>Despacho:</strong> {{ $order->delivery_address }}, {{ $order->delivery_city }}, {{ $order->delivery_region }}
    </p>

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
            @foreach ($order->items as $item)
                <tr>
                    <td>{{ $item->product_name }}</td>
                    <td class="quantity">{{ $item->quantity }}</td>
                    <td class="amount">${{ number_format((float) $item->unit_price, 0, ',', '.') }}</td>
                    <td class="amount">${{ number_format((float) $item->line_total, 0, ',', '.') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <p class="total">Total pagado: ${{ number_format((float) $order->total, 0, ',', '.') }}</p>

    <p class="notice">Este es un comprobante de compra y no reemplaza una boleta electrónica tributaria emitida conforme a las normas del SII.</p>
</body>
</html>
