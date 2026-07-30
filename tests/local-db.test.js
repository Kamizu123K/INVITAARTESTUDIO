'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { LocalDatabase } = require('../server/services/local-db');

test('actualiza un RSVP duplicado en lugar de crear dos', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'invita-db-'));
  const db = new LocalDatabase(root);
  db.upsertOrder({ id: 'ord-1', trackingCode: 'IA-2026-000001' });
  const first = db.upsertRsvp({ orderId: 'ord-1', guestName: 'Ana Pérez', guestPhone: '74562899', attendance: 'confirmado' });
  const second = db.upsertRsvp({ orderId: 'ord-1', guestName: 'Ana Pérez', guestPhone: '+591 74562899', attendance: 'rechazado' });
  assert.equal(first.duplicateUpdated, false);
  assert.equal(second.duplicateUpdated, true);
  assert.equal(db.read().rsvps.length, 1);
  assert.equal(db.read().rsvps[0].attendance, 'rechazado');
  fs.rmSync(root, { recursive: true, force: true });
});

test('permite recuperar un pedido por código', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'invita-db-'));
  const db = new LocalDatabase(root);
  db.upsertOrder({ id: 'ord-2', trackingCode: 'IA-2026-000002', clientName: 'Camila' });
  assert.equal(db.findOrder('ia-2026-000002').clientName, 'Camila');
  fs.rmSync(root, { recursive: true, force: true });
});
