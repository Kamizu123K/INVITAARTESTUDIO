'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { LocalDatabase } = require('../server/services/local-db');
const { IntegrationHub } = require('../server/services/integration-hub');

test('las tres integraciones funcionan con respaldo local sin credenciales', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'invita-api-'));
  const db = new LocalDatabase(root);
  const hub = new IntegrationHub({ WHATSAPP_PUBLIC_NUMBER: '59174562899' }, root, db);
  const order = { id:'ord-1', trackingCode:'IA-2026-111111', clientName:'Camila', email:'camila@example.com', phone:'59174562899', eventType:'Boda', package:'premium', templateTitle:'Elegante', eventTitle:'Boda', totalAmount:100, status:'recibido' };
  db.upsertOrder(order);
  const result = await hub.syncOrder(order);
  assert.equal(result.ok, true);
  assert.equal(result.completed, 3);
  assert.equal(hub.status().length, 3);
  assert.ok(fs.existsSync(path.join(root, 'runtime-data', 'google-sheets-fallback.csv')));
  assert.equal(db.read().whatsappOutbox.length, 1);
  fs.rmSync(root, { recursive: true, force: true });
});
