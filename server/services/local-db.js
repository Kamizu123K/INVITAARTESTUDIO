'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { normalizePhone, normalizeKey } = require('../utils/validation');

class LocalDatabase {
  constructor(rootDir) {
    this.dir = path.join(rootDir, 'runtime-data');
    this.file = path.join(this.dir, 'local-api-db.json');
    this.ensure();
  }

  ensure() {
    fs.mkdirSync(this.dir, { recursive: true });
    if (!fs.existsSync(this.file)) {
      this.write({ orders: [], rsvps: [], integrationLogs: [], whatsappOutbox: [] });
    }
  }

  read() {
    this.ensure();
    try {
      const parsed = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      return {
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        rsvps: Array.isArray(parsed.rsvps) ? parsed.rsvps : [],
        integrationLogs: Array.isArray(parsed.integrationLogs) ? parsed.integrationLogs : [],
        whatsappOutbox: Array.isArray(parsed.whatsappOutbox) ? parsed.whatsappOutbox : []
      };
    } catch (error) {
      const backup = this.file + '.corrupt-' + Date.now();
      fs.copyFileSync(this.file, backup);
      const empty = { orders: [], rsvps: [], integrationLogs: [], whatsappOutbox: [] };
      this.write(empty);
      return empty;
    }
  }

  write(data) {
    fs.mkdirSync(this.dir, { recursive: true });
    const tmp = this.file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmp, this.file);
    return data;
  }

  upsertOrder(order) {
    const db = this.read();
    const index = db.orders.findIndex(item => item.trackingCode === order.trackingCode);
    if (index >= 0) db.orders[index] = { ...db.orders[index], ...order, updatedAt: new Date().toISOString() };
    else db.orders.unshift(order);
    this.write(db);
    return index >= 0 ? db.orders[index] : db.orders[0];
  }

  findOrder(codeOrId) {
    const search = String(codeOrId || '').trim().toLowerCase();
    if (!search) return null;
    return this.read().orders.find(item =>
      String(item.trackingCode || '').toLowerCase() === search ||
      String(item.id || '').toLowerCase() === search
    ) || null;
  }

  upsertRsvp(rsvp) {
    const db = this.read();
    const phone = normalizePhone(rsvp.guestPhone);
    const phoneKey = phone.length > 8 ? phone.slice(-8) : phone;
    const name = normalizeKey(rsvp.guestName);
    const index = db.rsvps.findIndex(item => {
      if (String(item.orderId) !== String(rsvp.orderId)) return false;
      const itemPhone = normalizePhone(item.guestPhone);
      const itemPhoneKey = itemPhone.length > 8 ? itemPhone.slice(-8) : itemPhone;
      if (phoneKey && itemPhoneKey) return phoneKey === itemPhoneKey;
      return normalizeKey(item.guestName) === name;
    });

    const stored = index >= 0
      ? { ...db.rsvps[index], ...rsvp, id: db.rsvps[index].id, updatedAt: new Date().toISOString(), duplicateUpdated: true }
      : { ...rsvp, id: rsvp.id || `rsvp-api-${Date.now()}`, duplicateUpdated: false };

    if (index >= 0) db.rsvps[index] = stored;
    else db.rsvps.unshift(stored);
    this.write(db);
    return stored;
  }

  addLog(entry) {
    const db = this.read();
    db.integrationLogs.unshift({ id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, at: new Date().toISOString(), ...entry });
    db.integrationLogs = db.integrationLogs.slice(0, 500);
    this.write(db);
  }

  addOutbox(entry) {
    const db = this.read();
    db.whatsappOutbox.unshift({ id: `wa-${Date.now()}`, at: new Date().toISOString(), ...entry });
    db.whatsappOutbox = db.whatsappOutbox.slice(0, 500);
    this.write(db);
  }

  listLogs(limit = 100) {
    return this.read().integrationLogs.slice(0, Math.max(1, Math.min(500, Number(limit || 100))));
  }
}

module.exports = { LocalDatabase };
