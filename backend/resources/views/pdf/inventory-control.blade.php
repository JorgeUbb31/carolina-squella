<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Control de inventario {{ $control->number }}</title>
    <style>
        @page { margin: 28px 30px; }
        body { color: #252321; font-family: DejaVu Sans, sans-serif; font-size: 10px; }
        h1 { margin: 0; color: #70432f; font-size: 22px; }
        h2 { margin: 0 0 10px; font-size: 13px; }
        .header { margin-bottom: 20px; padding-bottom: 13px; border-bottom: 2px solid #9b6245; }
        .muted { color: #706b65; }
        .meta { margin-top: 8px; line-height: 1.6; }
        .summary { width: 100%; margin: 16px 0 22px; border-collapse: collapse; }
        .summary td { width: 25%; padding: 10px; border: 1px solid #ded8d2; background: #f8f1e8; }
        .summary strong { display: block; margin-top: 4px; font-size: 16px; }
        table.items { width: 100%; border-collapse: collapse; }
        .items th { padding: 8px 6px; color: #fffdf9; background: #70432f; font-size: 8px; text-align: left; }
        .items td { padding: 7px 6px; border-bottom: 1px solid #ded8d2; }
        .number { text-align: right; }
        .negative { color: #a64e3d; }
        .positive { color: #397257; }
        .footer { margin-top: 18px; color: #706b65; font-size: 8px; }
    </style>
</head>
<body>
    <header class="header">
        <h1>Control de inventario</h1>
        <div class="meta">
            <strong>{{ $control->number }}</strong><br>
            Iniciado: {{ $control->started_at?->format('d/m/Y H:i') }} por {{ $control->startedBy?->name ?? 'Usuario eliminado' }}<br>
            Confirmado: {{ $control->completed_at?->format('d/m/Y H:i') }} por {{ $control->completedBy?->name ?? 'Usuario eliminado' }}
        </div>
    </header>

    <table class="summary">
        <tr>
            <td>Productos contados<strong>{{ $control->items->count() }}</strong></td>
            <td>Coinciden<strong>{{ $summary['matched'] }}</strong></td>
            <td>Faltantes<strong>{{ $summary['shortages'] }}</strong></td>
            <td>Sobrantes<strong>{{ $summary['surpluses'] }}</strong></td>
        </tr>
    </table>

    <h2>Detalle del conteo</h2>
    <table class="items">
        <thead>
            <tr>
                <th>PRODUCTO</th>
                <th>CATEGORÍA</th>
                <th>UNIDAD</th>
                <th class="number">STOCK INICIAL</th>
                <th class="number">ESPERADO AL CONTAR</th>
                <th class="number">CONTEO FÍSICO</th>
                <th class="number">DIFERENCIA</th>
                <th>OBSERVACIÓN</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($control->items as $item)
                <tr>
                    <td>{{ $item->product_name }}</td>
                    <td>{{ $item->category_name ?: 'Sin categoría' }}</td>
                    <td>{{ $item->unit_type }}</td>
                    <td class="number">{{ $item->system_stock_snapshot }}</td>
                    <td class="number">{{ $item->expected_stock }}</td>
                    <td class="number">{{ $item->counted_stock }}</td>
                    <td class="number {{ $item->difference < 0 ? 'negative' : ($item->difference > 0 ? 'positive' : '') }}">
                        {{ $item->difference > 0 ? '+' : '' }}{{ $item->difference }}
                    </td>
                    <td>{{ $item->note ?: '' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <p class="footer">Unidades ajustadas durante este control: {{ $summary['adjustment_units'] }}. El historial de movimientos conserva el detalle de cada ajuste.</p>
</body>
</html>
