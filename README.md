# 🛍️ Carolina Squella E-Commerce

Plataforma de e-commerce moderna con arquitectura separada: panel administrativo Livewire + storefront SPA.

## 📋 Descripción General

Este proyecto implementa un e-commerce completo con:

- **👨‍💼 Panel Admin**: Livewire (Laravel)
  - Gestión de productos
  - Control de stock en tiempo real
  - Gestión de órdenes
  - Dashboard de ventas

- **🏪 Storefront**: SPA (Vue/React)
  - Catálogo de productos
  - Carrito de compras
  - Procesamiento de órdenes

## 🏗️ Arquitectura

```
                    ┌─────────────────────┐
                    │   Cliente (Browser) │
                    └──────────┬──────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
        ┌───────▼────────┐        ┌──────────▼────────┐
        │  Admin Panel   │        │   Storefront SPA   │
        │  (Livewire)    │        │  (Vue/React)       │
        │ :8000/admin    │        │  :5173/            │
        └───────┬────────┘        └──────────┬────────┘
                │                             │
                └──────────────┬──────────────┘
                               │
                        ┌──────▼──────┐
                        │ API Backend  │
                        │ (Laravel)    │
                        │ Sanctum      │
                        └──────┬───────┘
                               │
                        ┌──────▼────────┐
                        │   Base Datos  │
                        │  MySQL/Postgres│
                        └───────────────┘
```

## 🚀 Instalación Rápida

### 1️⃣ Backend (Laravel)

```bash
cd backend

# Instalar dependencias
composer install

# Configurar variables de entorno
cp .env.example .env
php artisan key:generate

# Configurar base de datos
# Edita .env con tus credenciales DB, luego:
php artisan migrate

# Iniciar servidor
php artisan serve
```

**Backend disponible en**: `http://localhost:8000`

### 2️⃣ Admin Panel (Livewire)

```bash
# Accesible desde:
http://localhost:8000/admin
```

### 3️⃣ Storefront (Vue/React + Vite)

```bash
cd storefront

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

**Storefront disponible en**: `http://localhost:5173`

## 🗄️ Base de Datos

### Configuración Inicial

```bash
# Crear base de datos
mysql -u root -p -e "CREATE DATABASE carolina_squella;"

# Ejecutar migraciones
php artisan migrate
```

### Archivo .env (Backend)
```env
APP_NAME="Carolina Squella"
APP_URL=http://localhost:8000
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=carolina_squella
DB_USERNAME=root
DB_PASSWORD=
```

## 🛣️ Rutas Principales

### Admin Panel (Livewire)
```
GET  /admin                → Dashboard
GET  /admin/products       → Gestión de productos
GET  /admin/stock          → Control de stock
GET  /admin/orders         → Gestión de órdenes
```

### Storefront (SPA)
```
GET  /                     → Homepage
GET  /products             → Listado de productos
GET  /products/:id         → Detalle de producto
GET  /cart                 → Carrito
GET  /checkout             → Procesar compra
```

### API (Sanctum)
```
POST   /api/auth/login              → Login
POST   /api/auth/logout             → Logout
GET    /api/auth/me                 → Usuario actual

GET    /api/products                → Listar productos
GET    /api/products/{id}           → Detalle

POST   /api/admin/products          → Crear (admin)
PUT    /api/admin/products/{id}     → Actualizar (admin)
DELETE /api/admin/products/{id}     → Eliminar (admin)

GET    /api/admin/stock             → Estado de stock
POST   /api/admin/stock/adjust      → Ajustar stock

GET    /api/admin/orders            → Listar órdenes
GET    /api/admin/orders/{id}       → Detalle
PUT    /api/admin/orders/{id}       → Actualizar estado
```

## 📦 Dependencias

### Backend
- Laravel 11
- Livewire 3
- Laravel Sanctum (autenticación API)
- PHP 8.2+

### Storefront
- Node.js 18+
- Vite
- Vue 3 o React 18 (por elegir)
- TypeScript (opcional)
- Axios

## 📖 Estructura del Proyecto

```
├── backend/          → API Laravel + Livewire admin
├── storefront/       → SPA frontend (Vue/React)
├── admin/            → Componentes Livewire
└── README.md         → Este archivo
```

## 🧪 Desarrollo

### Flujo de Desarrollo

1. **Backend**: Configura migraciones y modelos
2. **API**: Crea endpoints
3. **Admin**: Construye vistas Livewire
4. **Storefront**: Consume API en SPA

### Comandos Útiles

```bash
# Backend
php artisan tinker              # REPL interactivo
php artisan make:model Product  # Generar modelo
php artisan migrate --fresh     # Reset de BD

# Storefront
npm run build                   # Build producción
npm run preview                 # Preview de build
```

## 🚀 Deployment

```bash
# Backend
php artisan config:cache
php artisan migrate --force

# Storefront
npm run build
# Servir carpeta dist/ en producción
```

---

**Versión**: 0.1.0  
**Estado**: En Desarrollo ✨
