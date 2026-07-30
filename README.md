# Invita Arte Studio v1.1.0

Versión local completa del sistema MVC de invitaciones digitales. Conserva la página pública, catálogo, cotizador, autenticación demo, paneles por rol, pedidos, versiones, pagos, RSVP y métricas. Añade un servidor Node.js/Express y tres integraciones:

1. **Supabase API**: sincroniza solicitudes y RSVP con PostgreSQL/Supabase.
2. **Google Sheets API**: registra solicitudes en la hoja `Solicitudes` y confirmaciones en `RSVP`.
3. **WhatsApp Cloud API**: genera notificaciones de solicitudes y confirmaciones.

## Funcionamiento sin claves

El proyecto funciona inmediatamente en modo local:

- La interfaz y los paneles usan `localStorage`.
- El servidor conserva una copia verificable en `runtime-data/local-api-db.json`.
- Google Sheets usa temporalmente `runtime-data/google-sheets-fallback.csv`.
- WhatsApp guarda una bandeja de salida local y genera un enlace `wa.me`.
- Supabase queda marcado como respaldo local hasta completar `.env`.

Esto permite demostrar la integración sin inventar credenciales ni depender de Internet.

## Ejecución rápida en Windows

1. Extrae la carpeta completa.
2. Haz doble clic en `INSTALAR_Y_EJECUTAR.bat`.
3. Espera a que se abra `http://localhost:3000`.
4. Mantén abierta la ventana negra mientras utilices el sistema.

También puedes ejecutar manualmente:

```powershell
npm install
npm start
```

Luego abre:

```text
http://localhost:3000
```

## Cuentas demo

Las cuentas de demostración continúan dentro de `js/data/seedData.js`. Son únicamente para la ejecución académica local. No deben usarse como credenciales productivas.

## Verificación de la release

```powershell
npm run release:verify
```

El comando realiza:

- revisión sintáctica de archivos JavaScript;
- pruebas de validación;
- prueba de actualización de RSVP duplicado;
- prueba de las tres integraciones en modo local;
- construcción de la carpeta `dist/invita-arte-studio-1.1.0`;
- generación de un manifiesto SHA-256 por archivo.

## Archivos principales nuevos

- `server.js`: servidor web y API local.
- `server/services/`: conectores de Supabase, Sheets y WhatsApp.
- `js/services/ApiIntegrationService.js`: puente entre el MVC y la API local.
- `.env.example`: plantilla segura de configuración.
- `docs/CONFIGURAR_3_APIS.md`: configuración real paso a paso.
- `docs/EVIDENCIAS_RELEASE_PASO_A_PASO.md`: capturas que deben presentarse.
- `RELEASE_NOTES_v1.1.0.md`: notas de la nueva versión.

## Seguridad

Las claves reales se guardan solo en `.env`, archivo excluido por `.gitignore`. Nunca coloques `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_PRIVATE_KEY` o `WHATSAPP_CLOUD_TOKEN` en `js/config.js`, capturas o repositorios públicos.
