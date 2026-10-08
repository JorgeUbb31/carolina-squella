<?php

use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminProductController;
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
        });
    });
});
