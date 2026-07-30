# Invita Arte Studio - Web final con roles, Supabase y CRUD operativo

Proyecto web para usuario final de Invita Arte Studio. Está organizado en Modelo - Vista - Controlador y trabaja con roles reales:

- Cliente: crea solicitudes, consulta estados, aprueba versiones, registra pagos y revisa RSVP.
- Asesor: gestiona solicitudes, edita datos, actualiza estados y registra pagos.
- Diseñador: gestiona pedidos en diseño, carga versiones y controla correcciones.
- Administrador: CRUD completo de pedidos, plantillas, usuarios, pagos, versiones, RSVP y métricas.

## 1. Probar localmente

Dentro de la carpeta del proyecto ejecuta:

```powershell
npx serve .
```

Abre el enlace local que aparezca, por ejemplo:

```text
http://localhost:3000
```

## 2. Configurar Supabase

Abre el archivo:

```text
js/config.js
```

Verifica que estén tus datos reales:

```js
supabaseUrl: 'https://TU-PROYECTO.supabase.co',
supabaseAnonKey: 'TU_ANON_PUBLIC_KEY'
```

No coloques nunca la clave `service_role` en el frontend.

## 3. Base de datos

Si estás creando todo desde cero, ejecuta:

```text
sql/supabase_schema.sql
```

Si ya tenías la base creada y solo quieres agregar los CRUD nuevos, ejecuta:

```text
sql/actualizacion_crud_roles.sql
```

## 4. Roles internos

Primero registra usuarios desde la web. Luego, en Supabase SQL Editor, cambia el rol:

```sql
update public.profiles set role = 'admin' where email = 'correo_admin@ejemplo.com';
update public.profiles set role = 'asesor' where email = 'correo_asesor@ejemplo.com';
update public.profiles set role = 'disenador' where email = 'correo_disenador@ejemplo.com';
```

Los clientes nuevos quedan como `cliente` automáticamente.

## 5. Publicar en Netlify

- Descomprime el ZIP.
- Entra a Netlify.
- Arrastra la carpeta completa del proyecto, no solo el archivo `index.html`.
- Mantén las carpetas `css`, `js`, `assets`, `sql`, `docs`.

## 6. Archivos principales

```text
index.html
css/styles.css
js/config.js
js/services/SupabaseService.js
js/views/DashboardView.js
js/controllers/CrudController.js
sql/supabase_schema.sql
sql/actualizacion_crud_roles.sql
```

## 7. Nota importante

Si algún botón de CRUD dice error de permisos, revisa dos cosas:

1. Que tu usuario realmente tenga el rol correcto en `public.profiles`.
2. Que hayas ejecutado `sql/actualizacion_crud_roles.sql`.

## Datos demo completos agregados

Esta versión incluye más datos para que el sistema no se vea vacío durante la exposición.

Para cargar datos en Supabase real:

1. Abre Supabase > SQL Editor.
2. Ejecuta `sql/supabase_schema.sql` si todavía no tienes tablas.
3. Ejecuta `sql/actualizacion_crud_roles.sql`.
4. Ejecuta `sql/datos_demo_completos.sql`.
5. Registra tus usuarios reales desde la web y asígnales rol en la tabla `profiles`.

En modo local/demo, los datos salen de `js/data/seedData.js` y se guardan en `localStorage`.
Si no ves los datos nuevos, borra el almacenamiento local del navegador o abre la consola y ejecuta:

```js
localStorage.removeItem('invitaarte_operativo_v1')
location.reload()
```
