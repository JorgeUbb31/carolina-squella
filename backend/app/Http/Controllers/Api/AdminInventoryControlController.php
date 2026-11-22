<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryControl;
use App\Models\InventoryControlItem;
use App\Models\Product;
use App\Models\StockMovement;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AdminInventoryControlController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'per_page' => ['sometimes', 'integer', 'between:1,100'],
        ]);

        $controls = InventoryControl::query()
            ->withCount([
                'items as total_items',
                'items as counted_items' => fn ($query) => $query->whereNotNull('counted_stock'),
            ])
            ->latest('started_at')
            ->paginate($filters['per_page'] ?? 20);

        return response()->json($controls);
    }

    public function store(Request $request): JsonResponse
    {
        $control = DB::transaction(function () use ($request) {
            $products = Product::query()->orderBy('id')->lockForUpdate()->get();
            if (InventoryControl::query()->where('status', 'in_progress')->exists()) {
                throw ValidationException::withMessages([
                    'control' => ['Ya existe un control de inventario en curso.'],
                ]);
            }
            if ($products->isEmpty()) {
                throw ValidationException::withMessages([
                    'products' => ['Agrega productos al inventario antes de iniciar un control.'],
                ]);
            }

            $startedAt = now();
            $control = InventoryControl::query()->create([
                'number' => 'INV-'.$startedAt->format('Ymd').'-'.Str::upper(Str::random(5)),
                'status' => 'in_progress',
                'started_by' => $request->user()?->id,
                'started_at' => $startedAt,
            ]);

            foreach ($products as $product) {
                $movementId = StockMovement::query()
                    ->where('product_id', $product->id)
                    ->max('id') ?? 0;

                $control->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_slug' => $product->slug,
                    'category_name' => $product->category?->name,
                    'unit_type' => $product->unit_type ?: 'unidad',
                    'system_stock_snapshot' => $product->stock,
                    'movement_id_snapshot' => $movementId,
                ]);
            }

            return $control;
        });

        return response()->json($this->controlDetails($control), 201);
    }

    public function show(InventoryControl $inventoryControl): JsonResponse
    {
        return response()->json($this->controlDetails($inventoryControl));
    }

    public function updateItem(Request $request, InventoryControl $inventoryControl, InventoryControlItem $item): JsonResponse
    {
        $data = $request->validate([
            'counted_stock' => ['required', 'integer', 'min:0'],
            'note' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ]);

        $updatedItem = DB::transaction(function () use ($data, $inventoryControl, $item) {
            $control = InventoryControl::query()->lockForUpdate()->findOrFail($inventoryControl->id);
            if ($control->status !== 'in_progress') {
                throw ValidationException::withMessages(['control' => ['Este control ya está cerrado.']]);
            }

            $lockedItem = InventoryControlItem::query()
                ->where('inventory_control_id', $control->id)
                ->lockForUpdate()
                ->findOrFail($item->id);

            if (! $lockedItem->product_id) {
                throw ValidationException::withMessages(['product' => ['El producto ya no existe en el inventario.']]);
            }

            Product::query()->lockForUpdate()->findOrFail($lockedItem->product_id);
            $countedMovementId = StockMovement::query()
                ->where('product_id', $lockedItem->product_id)
                ->max('id') ?? 0;
            $movementDelta = (int) StockMovement::query()
                ->where('product_id', $lockedItem->product_id)
                ->where('id', '>', $lockedItem->movement_id_snapshot)
                ->where('id', '<=', $countedMovementId)
                ->sum('quantity_change');
            $expectedStock = (int) $lockedItem->system_stock_snapshot + $movementDelta;

            $lockedItem->update([
                'counted_stock' => $data['counted_stock'],
                'counted_movement_id' => $countedMovementId,
                'expected_stock' => $expectedStock,
                'difference' => $data['counted_stock'] - $expectedStock,
                'counted_at' => now(),
                'note' => $data['note'] ?? null,
            ]);

            return $lockedItem->fresh();
        });

        return response()->json($updatedItem);
    }

    public function complete(Request $request, InventoryControl $inventoryControl): JsonResponse
    {
        $control = DB::transaction(function () use ($inventoryControl, $request) {
            $lockedControl = InventoryControl::query()->lockForUpdate()->findOrFail($inventoryControl->id);
            if ($lockedControl->status !== 'in_progress') {
                throw ValidationException::withMessages(['control' => ['Este control ya está cerrado.']]);
            }

            $items = $lockedControl->items()->orderBy('product_id')->lockForUpdate()->get();
            if ($items->isEmpty() || $items->contains(fn ($item) => $item->counted_stock === null)) {
                throw ValidationException::withMessages([
                    'items' => ['Debes guardar el conteo físico de todos los productos antes de confirmar.'],
                ]);
            }

            foreach ($items as $item) {
                if (! $item->product_id || $item->difference === null) {
                    continue;
                }

                $product = Product::query()->lockForUpdate()->find($item->product_id);
                if (! $product) {
                    continue;
                }

                $stockBefore = (int) $product->stock;
                $stockAfter = $stockBefore + (int) $item->difference;
                if ($stockAfter < 0) {
                    throw ValidationException::withMessages([
                        'items' => ["El ajuste de {$item->product_name} dejaría el stock en negativo. Revisa el conteo y vuelve a guardarlo."],
                    ]);
                }

                if ($stockAfter !== $stockBefore) {
                    $product->update(['stock' => $stockAfter]);
                    $product->stockMovements()->create([
                        'user_id' => $request->user()?->id,
                        'inventory_control_id' => $lockedControl->id,
                        'quantity_change' => $stockAfter - $stockBefore,
                        'stock_before' => $stockBefore,
                        'stock_after' => $stockAfter,
                        'reason' => 'inventory_control',
                    ]);
                }
            }

            $lockedControl->update([
                'status' => 'completed',
                'completed_by' => $request->user()?->id,
                'completed_at' => now(),
            ]);

            return $lockedControl->fresh();
        });

        return response()->json($this->controlDetails($control));
    }

    public function report(InventoryControl $inventoryControl)
    {
        abort_unless($inventoryControl->status === 'completed', 404);

        $control = $inventoryControl->load(['items', 'startedBy', 'completedBy']);
        $summary = [
            'matched' => $control->items->where('difference', 0)->count(),
            'shortages' => $control->items->where('difference', '<', 0)->count(),
            'surpluses' => $control->items->where('difference', '>', 0)->count(),
            'adjustment_units' => $control->items->sum(fn ($item) => abs((int) $item->difference)),
        ];
        $filename = strtolower($control->number).'.pdf';

        return Pdf::loadView('pdf.inventory-control', ['control' => $control, 'summary' => $summary])
            ->setPaper('a4', 'landscape')
            ->stream($filename);
    }

    private function controlDetails(InventoryControl $control): InventoryControl
    {
        return $control->load([
            'items' => fn ($query) => $query->orderBy('product_name'),
            'startedBy:id,name,email',
            'completedBy:id,name,email',
        ])->loadCount([
            'items as total_items',
            'items as counted_items' => fn ($query) => $query->whereNotNull('counted_stock'),
        ]);
    }
}
