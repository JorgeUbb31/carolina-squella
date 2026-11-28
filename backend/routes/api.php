<?php

use App\Http\Controllers\Api\AdminCategoryController;
use App\Http\Controllers\Api\AdminInventoryControlController;
use App\Http\Controllers\Api\AdminOrderController;
use App\Http\Controllers\Api\AdminProductController;
use App\Http\Controllers\Api\AdminQuoteRequestController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\QuoteRequestController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('categories', [CategoryController::class, 'index']);
    Route::get('categories/{category:slug}/products', [CategoryController::class, 'products']);
    Route::get('products', [ProductController::class, 'index']);
    Route::get('products/{product:slug}', [ProductController::class, 'show']);
    Route::get('cart', [CartController::class, 'show']);
    Route::put('cart', [CartController::class, 'update']);
    Route::delete('cart', [CartController::class, 'destroy']);
    Route::post('orders', [OrderController::class, 'store']);
    Route::post('quote-requests', [QuoteRequestController::class, 'store'])->middleware('throttle:5,1');
    Route::get('orders/{order:order_number}/payment-status', [OrderController::class, 'paymentStatus'])
        ->middleware('throttle:10,1');
    Route::match(['get', 'post'], 'payments/transbank/return', [OrderController::class, 'transbankReturn'])
        ->name('payments.transbank.return');
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);

        Route::prefix('admin')->middleware('admin')->group(function () {
            Route::get('products', [AdminProductController::class, 'index'])->name('admin.products.index');
            Route::post('products', [AdminProductController::class, 'store'])->name('admin.products.store');
            Route::get('products/{product}', [AdminProductController::class, 'show'])->name('admin.products.show');
            Route::put('products/{product}', [AdminProductController::class, 'update'])->name('admin.products.update');
            Route::patch('products/{product}', [AdminProductController::class, 'update']);
            Route::delete('products/{product}', [AdminProductController::class, 'destroy'])->name('admin.products.destroy');

            Route::get('categories', [AdminCategoryController::class, 'index'])->name('admin.categories.index');
            Route::post('categories', [AdminCategoryController::class, 'store'])->name('admin.categories.store');
            Route::put('categories/{category}', [AdminCategoryController::class, 'update'])->name('admin.categories.update');
            Route::patch('categories/{category}', [AdminCategoryController::class, 'update']);
            Route::delete('categories/{category}', [AdminCategoryController::class, 'destroy'])->name('admin.categories.destroy');

            Route::get('quote-requests', [AdminQuoteRequestController::class, 'index'])->name('admin.quote-requests.index');
            Route::patch('quote-requests/{quoteRequest}', [AdminQuoteRequestController::class, 'update'])->name('admin.quote-requests.update');

            Route::get('orders', [AdminOrderController::class, 'index'])->name('admin.orders.index');
            Route::get('orders/customer', [AdminOrderController::class, 'customerByRut'])->name('admin.orders.customer');
            Route::get('orders/monthly-report', [AdminOrderController::class, 'monthlyReport'])->name('admin.orders.monthly-report');
            Route::post('orders', [AdminOrderController::class, 'store'])->name('admin.orders.store');
            Route::put('orders/{order}', [AdminOrderController::class, 'updateInPerson'])->name('admin.orders.update');

            Route::get('inventory-controls', [AdminInventoryControlController::class, 'index'])->name('admin.inventory-controls.index');
            Route::post('inventory-controls', [AdminInventoryControlController::class, 'store'])->name('admin.inventory-controls.store');
            Route::get('inventory-controls/{inventoryControl}/report', [AdminInventoryControlController::class, 'report'])->name('admin.inventory-controls.report');
            Route::get('inventory-controls/{inventoryControl}', [AdminInventoryControlController::class, 'show'])->name('admin.inventory-controls.show');
            Route::patch('inventory-controls/{inventoryControl}/items/{item}', [AdminInventoryControlController::class, 'updateItem'])->name('admin.inventory-controls.items.update');
            Route::post('inventory-controls/{inventoryControl}/complete', [AdminInventoryControlController::class, 'complete'])->name('admin.inventory-controls.complete');
        });
    });
});
