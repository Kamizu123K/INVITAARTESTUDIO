'use strict';

const { SupabaseIntegration } = require('./supabase-integration');
const { GoogleSheetsIntegration } = require('./google-sheets-integration');
const { WhatsAppIntegration } = require('./whatsapp-integration');

class IntegrationHub {
  constructor(env, rootDir, localDb) {
    this.localDb = localDb;
    this.supabase = new SupabaseIntegration(env);
    this.sheets = new GoogleSheetsIntegration(env, rootDir);
    this.whatsapp = new WhatsAppIntegration(env, localDb);
  }

  status() {
    return [this.supabase.status(), this.sheets.status(), this.whatsapp.status()];
  }

  async run(name, action, context) {
    const started = Date.now();
    try {
      const result = await action();
      this.localDb.addLog({ integration: name, ok: true, durationMs: Date.now() - started, context, result });
      return { integration: name, ok: true, ...result };
    } catch (error) {
      const result = { integration: name, ok: false, error: error.message || String(error) };
      this.localDb.addLog({ ...result, durationMs: Date.now() - started, context });
      return result;
    }
  }

  async syncOrder(order) {
    const results = await Promise.all([
      this.run('supabase', () => this.supabase.syncOrder(order), { type: 'order', trackingCode: order.trackingCode }),
      this.run('google-sheets', () => this.sheets.syncOrder(order), { type: 'order', trackingCode: order.trackingCode }),
      this.run('whatsapp', () => this.whatsapp.notifyOrder(order), { type: 'order', trackingCode: order.trackingCode })
    ]);
    return this.summary(results);
  }

  async syncRsvp(rsvp, order) {
    const results = await Promise.all([
      this.run('supabase', () => this.supabase.syncRsvp(rsvp, order), { type: 'rsvp', orderId: rsvp.orderId }),
      this.run('google-sheets', () => this.sheets.syncRsvp(rsvp, order), { type: 'rsvp', orderId: rsvp.orderId }),
      this.run('whatsapp', () => this.whatsapp.notifyRsvp(rsvp, order), { type: 'rsvp', orderId: rsvp.orderId })
    ]);
    return this.summary(results);
  }

  summary(results) {
    const failed = results.filter(item => !item.ok);
    return {
      ok: failed.length === 0,
      completed: results.length - failed.length,
      failed: failed.length,
      results
    };
  }
}

module.exports = { IntegrationHub };
