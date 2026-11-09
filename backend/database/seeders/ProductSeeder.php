<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $categories = Category::query()->pluck('id', 'slug');

        $products = [
            [
                'category_slug' => 'cortinas-blackout',
                'name' => 'Cortina Blackout Nube',
                'slug' => 'cortina-blackout-nube',
                'description' => 'Cortina blackout de gran opacidad con textura suave y elegante.',
                'price' => 48900,
                'stock' => 18,
                'material' => 'Microfiber',
                'color' => 'Gris',
                'pattern' => 'Liso',
                'width_cm' => 140,
                'height_cm' => 220,
                'is_blackout' => true,
                'is_thermal' => true,
                'is_waterproof' => false,
                'sample_available' => true,
                'unit_type' => 'pieza',
                'image_url' => 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
                'is_active' => true,
            ],
            [
                'category_slug' => 'cortinas-translucidas',
                'name' => 'Cortina Translúcida Aura',
                'slug' => 'cortina-translucida-aura',
                'description' => 'Filtra la luz con un efecto luminoso y moderno.',
                'price' => 35900,
                'stock' => 24,
                'material' => 'Polyester',
                'color' => 'Blanco',
                'pattern' => 'Textura',
                'width_cm' => 150,
                'height_cm' => 230,
                'is_blackout' => false,
                'is_thermal' => false,
                'is_waterproof' => false,
                'sample_available' => true,
                'unit_type' => 'pieza',
                'image_url' => 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80',
                'is_active' => true,
            ],
            [
                'category_slug' => 'telas-para-cortinas',
                'name' => 'Tela de Cortina Linen Natural',
                'slug' => 'tela-cortina-linen-natural',
                'description' => 'Tela premium tipo lino para cortinas a medida.',
                'price' => 18900,
                'stock' => 42,
                'material' => 'Linen',
                'color' => 'Natural',
                'pattern' => 'Textura',
                'width_cm' => 300,
                'height_cm' => 160,
                'is_blackout' => false,
                'is_thermal' => false,
                'is_waterproof' => false,
                'sample_available' => true,
                'unit_type' => 'metro',
                'image_url' => 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80',
                'is_active' => true,
            ],
            [
                'category_slug' => 'cortinas-roller',
                'name' => 'Roller Minimalista Oak',
                'slug' => 'roller-minimalista-oak',
                'description' => 'Sistema roller con diseño minimalista para espacios modernos.',
                'price' => 42900,
                'stock' => 12,
                'material' => 'Technical fabric',
                'color' => 'Marrón',
                'pattern' => 'Liso',
                'width_cm' => 120,
                'height_cm' => 210,
                'is_blackout' => true,
                'is_thermal' => true,
                'is_waterproof' => false,
                'sample_available' => false,
                'unit_type' => 'pieza',
                'image_url' => 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80',
                'is_active' => true,
            ],
            [
                'category_slug' => 'accesorios',
                'name' => 'Kit Montaje Cortina Deluxe',
                'slug' => 'kit-montaje-cortina-deluxe',
                'description' => 'Barras, ganchos y accesorios para instalación completa.',
                'price' => 14900,
                'stock' => 30,
                'material' => 'Metal',
                'color' => 'Negro',
                'pattern' => 'Industrial',
                'width_cm' => 200,
                'height_cm' => 10,
                'is_blackout' => false,
                'is_thermal' => false,
                'is_waterproof' => false,
                'sample_available' => false,
                'unit_type' => 'kit',
                'image_url' => 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
                'is_active' => true,
            ],
        ];

        foreach ($products as $productData) {
            $categoryId = $categories[$productData['category_slug']] ?? null;

            Product::query()->updateOrCreate(
                ['slug' => $productData['slug']],
                [
                    'category_id' => $categoryId,
                    'name' => $productData['name'],
                    'slug' => $productData['slug'],
                    'description' => $productData['description'],
                    'price' => $productData['price'],
                    'stock' => $productData['stock'],
                    'material' => $productData['material'],
                    'color' => $productData['color'],
                    'pattern' => $productData['pattern'],
                    'width_cm' => $productData['width_cm'],
                    'height_cm' => $productData['height_cm'],
                    'is_blackout' => $productData['is_blackout'],
                    'is_thermal' => $productData['is_thermal'],
                    'is_waterproof' => $productData['is_waterproof'],
                    'sample_available' => $productData['sample_available'],
                    'unit_type' => $productData['unit_type'],
                    'image_url' => $productData['image_url'],
                    'is_active' => $productData['is_active'],
                ]
            );
        }
    }
}
