<?php

namespace App\Providers;

use App\Contracts\TransbankGateway;
use App\Services\Transbank\SdkTransbankGateway;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(TransbankGateway::class, SdkTransbankGateway::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
