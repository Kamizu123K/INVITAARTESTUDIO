# Estructura MVC

## Modelo

Ubicación: `js/models/`

- `AuthModel.js`: maneja usuario y rol activo.
- `CatalogModel.js`: maneja plantillas, filtros y favoritos.
- `OrderModel.js`: maneja pedidos, estados, aprobación y versiones.

## Vista

Ubicación: `js/views/`

- `LayoutView.js`: funciones comunes, modal, toast y badges.
- `PublicView.js`: inicio, catálogo, cotizador, seguimiento y configuración.
- `AuthView.js`: login y registro.
- `DashboardView.js`: panel de roles.

## Controlador

Ubicación: `js/controllers/`

- `AppController.js`: rutas, renderizado y carga de datos.
- `AuthController.js`: login, registro y cierre de sesión.
- `CatalogController.js`: búsqueda, filtros, favoritos y vista rápida.
- `OrderController.js`: cotización, creación de pedidos, seguimiento, estados y versiones.

## Servicios

Ubicación: `js/services/`

- `SupabaseService.js`: conexión real con Supabase o fallback demo.
- `LocalStoreService.js`: almacenamiento local para modo demo.
