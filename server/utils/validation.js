'use strict';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

function sanitizeText(value, maxLength = 250) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

function normalizePhone(value) {
  return String(value ?? '').replace(/\D/g, '').slice(0, 15);
}

function normalizeKey(value) {
  return sanitizeText(value, 180).toLocaleLowerCase('es').replace(/\s+/g, ' ');
}

function parseBoolean(value) {
  return value === true || value === 'true' || value === 'on' || value === 1 || value === '1';
}

function validateOrder(input = {}) {
  const order = {
    id: sanitizeText(input.id, 80),
    trackingCode: sanitizeText(input.trackingCode, 40),
    userId: sanitizeText(input.userId, 100) || null,
    clientName: sanitizeText(input.clientName, 120),
    email: sanitizeText(input.email, 180).toLowerCase(),
    phone: normalizePhone(input.phone),
    eventType: sanitizeText(input.eventType, 80),
    package: sanitizeText(input.package || input.packageType || 'basico', 30).toLowerCase(),
    templateId: sanitizeText(input.templateId, 100) || null,
    templateTitle: sanitizeText(input.templateTitle, 160),
    eventTitle: sanitizeText(input.eventTitle, 160),
    honorees: sanitizeText(input.honorees, 180),
    eventDate: sanitizeText(input.eventDate, 20) || null,
    eventTime: sanitizeText(input.eventTime, 20) || null,
    location: sanitizeText(input.location, 240),
    mapUrl: sanitizeText(input.mapUrl, 500),
    musicUrl: sanitizeText(input.musicUrl, 500),
    colors: sanitizeText(input.colors, 160),
    guests: Math.max(0, Math.min(10000, Number(input.guests || 0))),
    urgent: parseBoolean(input.urgent),
    notes: sanitizeText(input.notes, 1200),
    status: sanitizeText(input.status || 'recibido', 40),
    totalAmount: Math.max(0, Number(input.totalAmount || 0)),
    createdAt: sanitizeText(input.createdAt, 50) || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const errors = [];
  if (order.clientName.length < 3) errors.push('El nombre del cliente debe tener al menos 3 caracteres.');
  if (!EMAIL_RE.test(order.email)) errors.push('El correo electrónico no tiene un formato válido.');
  if (order.phone && order.phone.length < 8) errors.push('El teléfono debe tener al menos 8 dígitos.');
  if (!order.eventType) errors.push('El tipo de evento es obligatorio.');
  if (!['basico', 'estandar', 'premium'].includes(order.package)) errors.push('El paquete seleccionado no es válido.');
  if (!order.eventTitle) errors.push('El título del evento es obligatorio.');
  if (!order.trackingCode) errors.push('El código de seguimiento es obligatorio.');

  return { valid: errors.length === 0, errors, value: order };
}

function validateRsvp(input = {}) {
  const rsvp = {
    id: sanitizeText(input.id, 80),
    orderId: sanitizeText(input.orderId, 100),
    trackingCode: sanitizeText(input.trackingCode, 40),
    guestName: sanitizeText(input.guestName, 140),
    guestPhone: normalizePhone(input.guestPhone),
    attendance: sanitizeText(input.attendance || 'confirmado', 30).toLowerCase(),
    companions: Math.max(0, Math.min(20, Number(input.companions || 0))),
    notes: sanitizeText(input.notes, 500),
    createdAt: sanitizeText(input.createdAt, 50) || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const errors = [];
  if (!rsvp.orderId && !rsvp.trackingCode) errors.push('Debe indicarse el pedido asociado.');
  if (rsvp.guestName.length < 2) errors.push('El nombre del invitado es obligatorio.');
  if (rsvp.guestPhone && rsvp.guestPhone.length < 8) errors.push('El teléfono del invitado debe tener al menos 8 dígitos.');
  if (!['confirmado', 'rechazado', 'pendiente'].includes(rsvp.attendance)) errors.push('El estado de asistencia no es válido.');

  return { valid: errors.length === 0, errors, value: rsvp };
}

module.exports = {
  EMAIL_RE,
  sanitizeText,
  normalizePhone,
  normalizeKey,
  parseBoolean,
  validateOrder,
  validateRsvp
};
