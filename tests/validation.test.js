'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { validateOrder, validateRsvp, sanitizeText } = require('../server/utils/validation');

test('acepta una solicitud válida', () => {
  const result = validateOrder({
    trackingCode: 'IA-2026-123456',
    clientName: 'Camila Costas',
    email: 'camila@example.com',
    phone: '+591 74562899',
    eventType: 'Boda',
    package: 'premium',
    eventTitle: 'Nuestra boda',
    guests: 120
  });
  assert.equal(result.valid, true);
  assert.equal(result.value.phone, '59174562899');
});

test('rechaza correo inválido y datos incompletos', () => {
  const result = validateOrder({ trackingCode: 'IA-1', clientName: 'A', email: 'incorrecto', package: 'otro' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.length >= 4);
});

test('sanitiza caracteres de control y limita longitud', () => {
  assert.equal(sanitizeText('  Hola\u0000 mundo  ', 20), 'Hola mundo');
  assert.equal(sanitizeText('abcdefgh', 4), 'abcd');
});

test('valida RSVP y normaliza teléfono', () => {
  const result = validateRsvp({ orderId: 'ord-1', guestName: 'Ana', guestPhone: '7456-2899', attendance: 'confirmado' });
  assert.equal(result.valid, true);
  assert.equal(result.value.guestPhone, '74562899');
});
