'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function base64url(value) {
  return Buffer.from(value).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

class GoogleSheetsIntegration {
  constructor(env, rootDir) {
    this.sheetId = env.GOOGLE_SHEET_ID || '';
    this.ordersRange = env.GOOGLE_SHEET_ORDERS_RANGE || 'Solicitudes!A:Q';
    this.rsvpRange = env.GOOGLE_SHEET_RSVP_RANGE || 'RSVP!A:I';
    this.email = env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
    this.privateKey = String(env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    this.enabled = Boolean(this.sheetId && this.email && this.privateKey);
    this.fallbackFile = path.join(rootDir, 'runtime-data', 'google-sheets-fallback.csv');
    this.cachedToken = null;
    this.tokenExpiresAt = 0;
  }

  status() {
    return {
      name: 'Google Sheets API',
      enabled: this.enabled,
      mode: this.enabled ? 'real' : 'CSV local',
      detail: this.enabled ? `Hoja configurada: ${this.sheetId.slice(0, 8)}…` : 'Las filas se registran en runtime-data/google-sheets-fallback.csv.'
    };
  }

  appendFallback(type, values) {
    fs.mkdirSync(path.dirname(this.fallbackFile), { recursive: true });
    const line = [type, ...values].map(csvCell).join(',') + '\n';
    fs.appendFileSync(this.fallbackFile, line, 'utf8');
    return { ok: true, skipped: false, mode: 'csv-local', file: path.basename(this.fallbackFile) };
  }

  async accessToken() {
    if (this.cachedToken && Date.now() < this.tokenExpiresAt - 60_000) return this.cachedToken;
    const now = Math.floor(Date.now() / 1000);
    const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claim = base64url(JSON.stringify({
      iss: this.email,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    }));
    const unsigned = `${header}.${claim}`;
    const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), this.privateKey);
    const assertion = `${unsigned}.${base64url(signature)}`;
    const body = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    });
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`Google Sheets: ${payload.error_description || payload.error || response.statusText}`);
    this.cachedToken = payload.access_token;
    this.tokenExpiresAt = Date.now() + Number(payload.expires_in || 3600) * 1000;
    return this.cachedToken;
  }

  async append(range, values) {
    if (!this.enabled) return this.appendFallback(range.startsWith('RSVP') ? 'RSVP' : 'SOLICITUD', values);
    const token = await this.accessToken();
    const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(this.sheetId)}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [values] })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`Google Sheets: ${payload.error && payload.error.message ? payload.error.message : response.statusText}`);
    return { ok: true, skipped: false, updatedRange: payload.updates && payload.updates.updatedRange };
  }

  async syncOrder(order) {
    return this.append(this.ordersRange, [new Date().toISOString(), order.trackingCode, order.clientName, order.email, order.phone, order.eventType, order.package, order.templateTitle, order.eventTitle, order.honorees, order.eventDate, order.eventTime, order.location, Number(order.guests || 0), order.urgent ? 'Sí' : 'No', Number(order.totalAmount || 0), order.status]);
  }

  async syncRsvp(rsvp, order) {
    return this.append(this.rsvpRange, [new Date().toISOString(), (order && order.trackingCode) || rsvp.trackingCode, rsvp.guestName, rsvp.guestPhone, rsvp.attendance, Number(rsvp.companions || 0), rsvp.notes, rsvp.duplicateUpdated ? 'Actualizado' : 'Nuevo', rsvp.orderId]);
  }
}

module.exports = { GoogleSheetsIntegration };
