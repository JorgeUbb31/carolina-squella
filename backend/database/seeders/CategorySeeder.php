<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Cortinas Blackout',
                'slug' => 'cortinas-blackout',
                'description' => 'Cortinas con aislamiento total y control de luz.',
                'is_active' => true,
            ],
            [
                'name' => 'Cortinas Translúcidas',
                'slug' => 'cortinas-translucidas',
                'description' => 'Diseños ligeros que filtran la luz suavemente.',
                'is_active' => true,
            ],
            [
                'name' => 'Telas para Cortinas',
                'slug' => 'telas-para-cortinas',
                'description' => 'Telas premium para confección a medida.',
                'is_active' => true,
            ],
            [
                'name' => 'Roller y Panel',
                'slug' => 'roller-y-panel',
                'description' => 'Soluciones modernas y funcionales para ventanas.',
                'is_active' => true,
            ],
            [
                'name' => 'Accesorios',
                'slug' => 'accesorios',
                'description' => 'Varillas, ganchos, barras y accesorios de montaje.',
                'is_active' => true,
            ],
        ];

        foreach ($categories as $category) {
            Category::query()->updateOrCreate(
                ['slug' => $category['slug']],
                $category
            );
        }
    }
}
