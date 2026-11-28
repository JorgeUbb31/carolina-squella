<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Ventas de {{ $summary['month'] }}</title>
    <style>
        @page { margin: 28px 30px; }
        body { color: #252321; font-family: DejaVu Sans, sans-serif; font-size: 9px; }
        h1 { margin: 0; color: #70432f; font-size: 22px; }
        h2 { margin: 18px 0 8px; color: #70432f; font-size: 13px; }
        .muted { color: #706b65; }
        .header { margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #9b6245; }
        .summary { width: 100%; margin: 14px 0 18px; border-collapse: collapse; }
        .summary td { width: 25%; padding: 10px; border: 1px solid #ded8d2; background: #f8f1e8; }
        .summary span, .summary strong { display: block; }
        .summary span { color: #706b65; font-size: 8px; }
        .summary strong { margin-top: 5px; color: #252321; font-size: 15px; }
        table.sales { width: 100%; border-collapse: collapse; }
        .sales th { padding: 7px 6px; color: #fffdf9; background: #70432f; font-size: 7px; text-align: left; }
        .sales td { padding: 7px 6px; border-bottom: 1px solid #ded8d2; vertical-align: top; }
        .sales td small { display: block; margin-top: 3px; color: #706b65; font-size: 7px; }
        .amount, .right { text-align: right; white-space: nowrap; }
        .status { color: #706b65; }
        .status-paid { color: #477153; }
        .status-pending { color: #8b5e3c; }
        .status-other { color: #a64e3d; }
        .empty { padding: 24px; color: #706b65; text-align: center; }
        .footer { margin-top: 14px; color: #706b65; font-size: 7px; }
    </style>
</head>
<body>
    <header class="header">
        <h1>Informe mensual de ventas</h1>
        <div class="muted">Carolina Squella · {{ $summary['month'] }}</div>
    </header>

    <table class="summary">
        <tr>
            <td><span>Operaciones</span><strong>{{ $summary['operations'] }}</strong></td>
            <td><span>Ventas pagadas</span><strong>{{ $summary['paid'] }}</strong></td>
            <td><span>Pendientes de pago</span><strong>{{ $summary['pending'] }}</strong></td>
            <td><span>Total ganado</span><strong>${{ number_format($summary['paid_total'], 0, ',', '.') }}</strong></td>
        </tr>
    </table>

    <table class="summary">
        <tr>
            <td><span>Ganado online</span><strong>${{ number_format($summary['online_total'], 0, ',', '.') }}</strong></td>
            <td><span>Ganado presencial</span><strong>${{ number_format($summary['in_person_total'], 0, ',', '.') }}</strong></td>
            <td colspan="2"><span>Otros estados (canceladas, fallidas o expiradas)</span><strong>{{ $summary['other_status'] }}</strong></td>
        </tr>
    </table>

    <h2>Detalle de operaciones</h2>
    <table class="sales">
        <thead>
            <tr>
                <th>FECHA</th>
                <th>FOLIO Y PRODUCTOS</th>
                <th>CANAL</th>
                <th>CLIENTE</th>
                <th>PAGO</th>
                <th>ESTADO</th>
                <th class="amount">TOTAL</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($orders as $order)
                @php
                    $statusLabel = match ($order->status) {
                        'paid' => 'Pagada',
                        'pending_payment' => 'Pendiente',
                        'payment_cancelled' => 'Cancelada',
                        'payment_failed' => 'Fallida',
                        'expired' => 'Expirada',
                        default => $order->status,
                    };
                    $statusClass = match ($order->status) {
                        'paid' => 'status-paid',
                        'pending_payment' => 'status-pending',
                        default => 'status-other',
                    };
                    $paymentLabel = match ($order->payment_method) {
                        'bank_transfer' => 'Transferencia',
                        'webpay_plus' => 'Webpay Plus',
                        'cash' => 'Efectivo',
                        'debit_card' => 'Tarjeta de débito',
                        'credit_card' => 'Tarjeta de crédito',
                        default => $order->payment_method,
                    };
                @endphp
                <tr>
                    <td>{{ $order->created_at?->format('d/m/Y H:i') }}</td>
                    <td>
                        <strong>{{ $order->order_number }}</strong>
                        @foreach ($order->items as $item)
                            <small>{{ $item->product_name }} × {{ $item->quantity }}</small>
                        @endforeach
                    </td>
                    <td>{{ $order->sale_source === 'in_person' ? 'Presencial' : 'Online' }}</td>
                    <td>{{ $order->customer_name }}</td>
                    <td>{{ $paymentLabel }}</td>
                    <td class="status {{ $statusClass }}">{{ $statusLabel }}</td>
                    <td class="amount">${{ number_format((float) $order->total, 0, ',', '.') }}</td>
                </tr>
            @empty
                <tr><td class="empty" colspan="7">No se registraron ventas durante este mes.</td></tr>
            @endforelse
        </tbody>
    </table>

    <p class="footer">El total ganado incluye únicamente operaciones pagadas. Los montos de las operaciones pendientes o con otros estados no se suman a los ingresos.</p>
</body>
</html>
