'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const { loadEnv } = require('./server/utils/env');
const { LocalDatabase } = require('./server/services/local-db');
const { IntegrationHub } = require('./server/services/integration-hub');
const { validateOrder, validateRsvp, sanitizeText } = require('./server/utils/validation');

const ROOT = __dirname;
loadEnv(ROOT);
const port = Number(process.env.PORT || 3000);
const localDb = new LocalDatabase(ROOT);
const hub = new IntegrationHub(process.env, ROOT, localDb);
const rateState = new Map();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.sql': 'text/plain; charset=utf-8'
};

function securityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
}

function json(res, status, payload) {
  securityHeaders(res);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload, null, 2));
}

function checkRate(req) {
  const limit = Number(process.env.API_RATE_LIMIT_PER_MINUTE || 120);
  const key = req.socket.remoteAddress || 'local';
  const now = Date.now();
  const state = rateState.get(key) || { start: now, count: 0 };
  if (now - state.start >= 60_000) {
    state.start = now;
    state.count = 0;
  }
  state.count += 1;
  rateState.set(key, state);
  return state.count <= limit;
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 300 * 1024) throw new Error('La solicitud supera el límite permitido.');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new Error('El cuerpo JSON no es válido.');
  }
}


function isBlockedPath(urlPath) {
  const decoded = decodeURIComponent(String(urlPath || '')).toLowerCase();
  const blocked = ['/server', '/runtime-data', '/tests', '/scripts', '/node_modules', '/dist', '/.env', '/.git', '/package-lock.json'];
  return blocked.some(prefix => decoded === prefix || decoded.startsWith(prefix + '/'));
}

function safeStaticPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const clean = path.normalize(decoded).replace(/^([.][.][/\\])+/, '').replace(/^[/\\]+/, '');
  const resolved = path.join(ROOT, clean || 'index.html');
  return resolved.startsWith(ROOT) ? resolved : null;
}

function sendFile(res, filePath) {
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return false;
  const ext = path.extname(filePath).toLowerCase();
  securityHeaders(res);
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': ['.html', '.json'].includes(ext) ? 'no-store' : 'public, max-age=300'
  });
  fs.createReadStream(filePath).pipe(res);
  return true;
}

async function handleApi(req, res, url) {
  if (!checkRate(req)) return json(res, 429, { ok: false, error: 'Demasiadas solicitudes. Intenta nuevamente en un minuto.' });

  if (req.method === 'GET' && url.pathname === '/api/health') {
    return json(res, 200, {
      ok: true,
      product: 'Invita Arte Studio',
      version: process.env.APP_VERSION || '1.1.0',
      environment: 'local',
      time: new Date().toISOString(),
      integrations: hub.status()
    });
  }

  if (req.method === 'GET' && url.pathname === '/api/config') {
    return json(res, 200, {
      version: process.env.APP_VERSION || '1.1.0',
      whatsappPublicNumber: String(process.env.WHATSAPP_PUBLIC_NUMBER || '59174562899').replace(/\D/g, ''),
      integrations: hub.status().map(({ name, enabled, mode }) => ({ name, enabled, mode }))
    });
  }

  if (req.method === 'POST' && url.pathname === '/api/orders') {
    const body = await readJson(req);
    const checked = validateOrder(body);
    if (!checked.valid) return json(res, 422, { ok: false, errors: checked.errors });
    const order = localDb.upsertOrder(checked.value);
    const integrations = await hub.syncOrder(order);
    return json(res, 201, { ok: true, order, integrations });
  }

  if (req.method === 'GET' && url.pathname.startsWith('/api/orders/')) {
    const code = sanitizeText(url.pathname.slice('/api/orders/'.length), 100);
    const order = localDb.findOrder(code);
    if (!order) return json(res, 404, { ok: false, error: 'Pedido no encontrado en el servicio local.' });
    return json(res, 200, { ok: true, order });
  }

  if (req.method === 'POST' && url.pathname === '/api/rsvps') {
    const body = await readJson(req);
    const checked = validateRsvp(body);
    if (!checked.valid) return json(res, 422, { ok: false, errors: checked.errors });
    const order = localDb.findOrder(checked.value.orderId) || localDb.findOrder(checked.value.trackingCode);
    if (!order) return json(res, 404, { ok: false, error: 'El pedido debe sincronizarse antes de registrar RSVP.' });
    const rsvp = localDb.upsertRsvp({ ...checked.value, orderId: order.id, trackingCode: order.trackingCode });
    const integrations = await hub.syncRsvp(rsvp, order);
    return json(res, rsvp.duplicateUpdated ? 200 : 201, { ok: true, rsvp, integrations });
  }

  if (req.method === 'GET' && url.pathname === '/api/integrations/logs') {
    return json(res, 200, { ok: true, logs: localDb.listLogs(url.searchParams.get('limit')) });
  }

  return json(res, 404, { ok: false, error: 'Ruta API no encontrada.' });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    if (isBlockedPath(url.pathname)) return json(res, 404, { ok: false, error: 'Recurso no disponible.' });

    let filePath = safeStaticPath(url.pathname);
    if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html');
    if (sendFile(res, filePath)) return;
    return sendFile(res, path.join(ROOT, 'index.html')) || json(res, 404, { ok: false, error: 'Archivo no encontrado.' });
  } catch (error) {
    console.error('[SERVER]', error);
    return json(res, /JSON|límite/i.test(error.message || '') ? 400 : 500, { ok: false, error: error.message || 'Error interno controlado.' });
  }
});

if (require.main === module) {
  server.listen(port, () => {
    console.log('');
    console.log('Invita Arte Studio v1.1.0');
    console.log(`Local: http://localhost:${port}`);
    console.log('Integraciones:');
    hub.status().forEach(item => console.log(`- ${item.name}: ${item.mode}`));
    console.log('');
  });
}

module.exports = { server, localDb, hub };
