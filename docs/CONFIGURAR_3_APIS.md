# Configuración de las tres APIs

## 0. Preparación

Copia `.env.example` como `.env`:

```powershell
Copy-Item .env.example .env
```

El sistema ya funciona localmente sin modificar ese archivo. Completa cada bloque únicamente cuando dispongas de las credenciales reales.

---

## 1. Supabase API

### Qué hace

Al crear una solicitud, el servidor ejecuta un `upsert` sobre `orders` usando `tracking_code`. Para RSVP, busca el pedido remoto y crea o actualiza la confirmación.

### Preparación

1. Crea o abre tu proyecto en Supabase.
2. Abre el editor SQL.
3. Ejecuta `sql/supabase_schema.sql` si todavía no existen las tablas.
4. En la configuración del proyecto copia:
   - URL del proyecto.
   - clave `service_role` para uso exclusivo en el servidor local.
5. Completa en `.env`:

```env
SUPABASE_URL=https://TU_PROYECTO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=TU_CLAVE_SERVICE_ROLE
```

### Comprobación

Reinicia el servidor y abre:

```text
http://localhost:3000/api/health
```

`Supabase API` debe indicar `real`.

> La clave `service_role` nunca debe colocarse en archivos JavaScript del navegador.

---

## 2. Google Sheets API

### Qué hace

La integración usa el método de anexado de valores para agregar una fila al final de las pestañas `Solicitudes` y `RSVP`.

### Preparación de la hoja

Crea un archivo de Google Sheets y agrega dos pestañas:

- `Solicitudes`
- `RSVP`

Encabezados recomendados para `Solicitudes`:

```text
Fecha | Código | Cliente | Correo | Teléfono | Evento | Paquete | Plantilla | Título | Homenajeados | Fecha evento | Hora | Lugar | Invitados | Urgente | Total | Estado
```

Encabezados recomendados para `RSVP`:

```text
Fecha | Código | Invitado | Teléfono | Asistencia | Acompañantes | Notas | Operación | Pedido local
```

### Cuenta de servicio

1. En Google Cloud crea un proyecto.
2. Habilita Google Sheets API.
3. Crea una cuenta de servicio y una clave JSON.
4. Comparte la hoja con el correo de la cuenta de servicio como Editor.
5. Copia los valores a `.env`:

```env
GOOGLE_SHEET_ID=ID_QUE_APARECE_EN_LA_URL
GOOGLE_SERVICE_ACCOUNT_EMAIL=cuenta@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="CLAVE_PRIVADA_DE_GOOGLE"
```

### Comprobación

Reinicia el servidor, crea una solicitud y revisa que aparezca una nueva fila. En `/api/health`, `Google Sheets API` debe indicar `real`.

---

## 3. WhatsApp Cloud API

### Qué hace

El servidor puede enviar una notificación al número administrativo cuando se crea una solicitud o se registra RSVP. En modo local guarda el mensaje en la bandeja `runtime-data/local-api-db.json` y genera un enlace de contacto.

### Preparación

En la aplicación de Meta/WhatsApp Business obtén:

- token de acceso;
- identificador del número telefónico (`phone_number_id`);
- número destinatario habilitado para prueba o producción;
- versión Graph API habilitada para la aplicación.

Completa:

```env
WHATSAPP_CLOUD_TOKEN=TOKEN
WHATSAPP_PHONE_NUMBER_ID=PHONE_NUMBER_ID
WHATSAPP_NOTIFY_TO=59174562899
META_GRAPH_API_VERSION=v23.0
WHATSAPP_SEND_TO_CLIENT=false
```

`WHATSAPP_SEND_TO_CLIENT=false` evita mensajes automáticos al cliente durante las pruebas. Para activarlos, cambia a `true` y confirma previamente las reglas de mensajería aplicables.

### Comprobación

Reinicia, crea una solicitud y verifica el mensaje en el número de prueba. En `/api/health`, `WhatsApp Cloud API` debe indicar `real`.

---

## Diagnóstico común

### El servidor no inicia

```powershell
node --version
npm install
npm run check
```

Se necesita Node.js 18.18 o superior.

### Una API falla pero el pedido sí se guarda

Ese comportamiento es intencional. La API local registra cada resultado en:

```text
runtime-data/local-api-db.json
```

Consulta también:

```text
http://localhost:3000/api/integrations/logs
```

La release no pierde la solicitud por una caída externa; el registro local permite repetir la sincronización posteriormente.
