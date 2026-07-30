# Evidencias reales de la release 1.1.0

## 1. Ejecución local

1. Ejecuta `INSTALAR_Y_EJECUTAR.bat`.
2. Captura la terminal mostrando:
   - `Invita Arte Studio v1.1.0`;
   - `Local: http://localhost:3000`;
   - estado de Supabase, Google Sheets y WhatsApp.
3. Nombre sugerido: `E-01_servidor_local.png`.

## 2. Estado de las tres APIs

Abre:

```text
http://localhost:3000/api/health
```

Captura el JSON completo. Aunque no existan credenciales, deben aparecer las tres integraciones y su respaldo local.

Nombre: `E-02_health_3_apis.png`.

## 3. Página principal

Abre `http://localhost:3000`. En la sección “Tres APIs integradas” deben aparecer las tres tarjetas.

Nombre: `E-03_interfaz_integraciones.png`.

## 4. Solicitud y validación

1. Inicia sesión o crea una cuenta demo.
2. Abre Cotizador.
3. Intenta enviar datos inválidos y captura el mensaje.
4. Completa datos válidos y envía.
5. Captura el código `IA-2026-XXXXXX`.

Nombres:

- `E-04_validacion_formulario.png`
- `E-05_solicitud_creada.png`

## 5. Registro local y tres resultados

Después de crear la solicitud, abre:

```text
http://localhost:3000/api/integrations/logs
```

Deben aparecer entradas para:

- `supabase`
- `google-sheets`
- `whatsapp`

Nombre: `E-06_logs_integraciones.png`.

## 6. Evidencia Google Sheets local

Abre:

```text
runtime-data/google-sheets-fallback.csv
```

Captura la fila de la solicitud. Cuando configures Google Sheets real, reemplaza esta evidencia por la fila de la hoja en línea.

Nombre: `E-07_google_sheets.png`.

## 7. Evidencia WhatsApp local

Abre `runtime-data/local-api-db.json` y busca `whatsappOutbox`. No muestres tokens, porque ese archivo no contiene claves.

Cuando configures Cloud API real, usa una captura del mensaje recibido en el número de prueba.

Nombre: `E-08_whatsapp.png`.

## 8. Evidencia Supabase

Sin credenciales, utiliza `/api/health` y los logs indicando `skipped: true, mode: local`.

Con Supabase real, captura la tabla `orders` mostrando el mismo código de seguimiento. Oculta datos personales que no sean necesarios.

Nombre: `E-09_supabase.png`.

## 9. RSVP duplicado

1. Desde el panel agrega RSVP a un pedido.
2. Vuelve a registrar el mismo teléfono.
3. Cambia la asistencia.
4. El sistema debe indicar que detectó el duplicado y lo actualizó.
5. Verifica que exista una sola fila lógica.

Nombre: `E-10_rsvp_duplicado.png`.

## 10. Pruebas automáticas

Ejecuta:

```powershell
npm test
```

Captura todas las pruebas aprobadas.

Nombre: `E-11_pruebas.png`.

## 11. Revisión sintáctica

```powershell
npm run check
```

Nombre: `E-12_sintaxis.png`.

## 12. Build y manifiesto

```powershell
npm run build
```

Muestra:

- `dist/invita-arte-studio-1.1.0`
- `dist/manifest-1.1.0.json`

Nombre: `E-13_build_manifest.png`.

## 13. Captura final de release

Ejecuta:

```powershell
npm run release:verify
```

La evidencia debe mostrar revisión, pruebas y build exitosos en una misma ejecución.

Nombre: `E-14_release_verify.png`.
