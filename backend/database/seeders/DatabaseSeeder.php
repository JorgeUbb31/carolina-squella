<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('local', 'testing')) {
            $admin = User::query()->updateOrCreate(
                ['email' => 'test@example.com'],
                [
                    'name' => 'Test User',
                    'password' => 'password',
                ]
            );
            $admin->forceFill(['is_admin' => true])->save();
        }

        $this->call([
            CategorySeeder::class,
            ProductSeeder::class,
        ]);
    }
}
