# Guía rápida: datos demo, Supabase y operación por roles

## 1. Qué se aumentó

Esta versión agrega datos suficientes para demostrar el sistema como operación real:

- 20 plantillas digitales activas.
- 12 pedidos de ejemplo en diferentes estados.
- Usuarios demo para cliente, asesor, diseñador y administrador.
- Pagos confirmados, pendientes y rechazados.
- Versiones de diseño con enlaces de vista previa.
- Confirmaciones RSVP de invitados.
- Métricas Lean de navegación, cotización, WhatsApp, versión y RSVP.

## 2. Por qué en modo Supabase no basta con cambiar seedData.js

`js/data/seedData.js` sirve para el modo demo/localStorage. Cuando Supabase está conectado, la página trae datos reales desde tablas: `templates`, `orders`, `payments`, `order_versions`, `rsvps`, `profiles` y `metrics_events`.

Por eso, para ver más datos en Supabase real debes ejecutar el archivo:

```sql
sql/datos_demo_completos.sql
```

## 3. Orden correcto en Supabase SQL Editor

1. Ejecuta `sql/supabase_schema.sql` si todavía no creaste las tablas.
2. Ejecuta `sql/actualizacion_crud_roles.sql` para habilitar CRUD y permisos.
3. Ejecuta `sql/datos_demo_completos.sql` para cargar datos demo completos.
4. Registra tus usuarios reales desde la web.
5. En SQL Editor, asigna roles reales:

```sql
update public.profiles set role = 'admin' where email = 'tu_correo_admin@gmail.com';
update public.profiles set role = 'asesor' where email = 'correo_asesor@gmail.com';
update public.profiles set role = 'disenador' where email = 'correo_disenador@gmail.com';
```

## 4. Qué prueba cada rol

- Cliente: crea pedido, revisa estado, ve versiones, registra pago y RSVP.
- Asesor: revisa solicitudes, edita pedidos, registra pagos y avanza estados.
- Diseñador: carga versiones, manda pedidos a revisión y corrige diseños.
- Administrador: administra todo el CRUD: pedidos, plantillas, usuarios, roles, pagos, versiones, RSVP y métricas.

## 5. Recomendación para exposición

Para exponer, entra como admin y muestra:

1. Catálogo público.
2. Cotizador.
3. Registro o inicio de sesión.
4. Panel de cliente.
5. Panel de asesor.
6. Panel de diseñador.
7. Panel de administrador.
8. Tablas CRUD y métricas Lean.
