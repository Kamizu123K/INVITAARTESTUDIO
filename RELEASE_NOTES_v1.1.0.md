# Invita Arte Studio 1.1.0

**Fecha:** 30 de julio de 2026  
**Tipo:** release menor  
**Ambiente:** local y staging

## Nuevas funciones

- Servidor local Node.js/Express para ejecutar el sistema desde `http://localhost:3000`.
- Integración de Supabase API del lado servidor.
- Integración de Google Sheets API mediante cuenta de servicio.
- Integración de WhatsApp Cloud API para notificaciones.
- Modo de respaldo local para las tres integraciones cuando faltan credenciales.
- Endpoint de salud `/api/health` y registro `/api/integrations/logs`.
- Manifiesto de construcción con SHA-256 por archivo.

## Correcciones

- Validación del nombre, correo, teléfono, tipo y título del evento.
- Normalización de teléfonos.
- Detección y actualización de RSVP duplicados por teléfono o nombre.
- Claves externas retiradas del frontend; se gestionan mediante `.env`.
- Persistencia atómica del registro local.

## Pruebas incorporadas

- Solicitud válida.
- Rechazo de correo inválido.
- Sanitización de caracteres de control.
- Validación de RSVP.
- Actualización de RSVP duplicado.
- Recuperación de pedido por código.
- Ejecución de las tres integraciones con respaldo local.

## Compatibilidad

- Node.js 18.18 o superior.
- Navegadores modernos con soporte de módulos web básicos y `fetch`.
- Windows 10/11 para los iniciadores `.bat` y `.ps1`.

## Problemas conocidos

- Sin credenciales, las APIs externas no envían datos a servicios remotos; utilizan evidencia local.
- Las cuentas demo son académicas y no deben utilizarse en producción.
- El despliegue estático de Netlify no ejecuta `server.js`; para staging completo se necesita un host Node.js o funciones serverless.

## Rollback

1. Detener el servidor 1.1.0.
2. Restaurar la carpeta de la versión 1.0.0.
3. Ejecutar su comando de inicio.
4. Conservar `runtime-data` como respaldo antes de reemplazar archivos.
5. Comprobar página principal, catálogo, login y seguimiento.
