<?php

use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\OrderController;
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
});
