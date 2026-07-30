'use strict';

class SupabaseIntegration {
  constructor(env) {
    this.url = String(env.SUPABASE_URL || '').replace(/\/$/, '');
    this.key = env.SUPABASE_SERVICE_ROLE_KEY || '';
    this.enabled = Boolean(this.url && this.key);
  }

  status() {
    return {
      name: 'Supabase API',
      enabled: this.enabled,
      mode: this.enabled ? 'real' : 'respaldo local',
      detail: this.enabled ? 'Sincronización REST servidor a servidor configurada.' : 'Completa SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.'
    };
  }

 async request(path, options = {}) {
  const headers = {
    apikey: this.key,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Las claves legacy service_role son JWT y aceptan Bearer.
  // Las nuevas sb_secret_ son opacas y deben enviarse como apikey.
  if (!this.key.startsWith('sb_secret_')) {
    headers.Authorization = `Bearer ${this.key}`;
  }

  const response = await fetch(`${this.url}/rest/v1/${path}`, {
    ...options,
    headers
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && (payload.message || payload.hint || payload.details);

    throw new Error(`Supabase: ${message || response.statusText}`);
  }

  return payload;
}

  async syncOrder(order) {
    if (!this.enabled) return { ok: true, skipped: true, mode: 'local' };
    const row = {
      tracking_code: order.trackingCode,
      user_id: null,
      client_name: order.clientName,
      email: order.email,
      phone: order.phone || null,
      event_type: order.eventType,
      package_type: order.package,
      template_id: null,
      event_title: order.eventTitle || null,
      honorees: order.honorees || null,
      event_date: order.eventDate || null,
      event_time: order.eventTime || null,
      location: order.location || null,
      map_url: order.mapUrl || null,
      music_url: order.musicUrl || null,
      colors: order.colors || null,
      notes: order.notes || null,
      guests: Number(order.guests || 0),
      urgent: Boolean(order.urgent),
      status: order.status || 'recibido',
      total_amount: Number(order.totalAmount || 0),
      updated_at: new Date().toISOString()
    };
    const data = await this.request('orders?on_conflict=tracking_code&select=id,tracking_code', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify([row])
    });
    const saved = Array.isArray(data) ? data[0] : data;
    return { ok: true, skipped: false, id: saved && saved.id, trackingCode: saved && saved.tracking_code };
  }

  async syncRsvp(rsvp, order) {
    if (!this.enabled) return { ok: true, skipped: true, mode: 'local' };
    const trackingCode = rsvp.trackingCode || (order && order.trackingCode);
    if (!trackingCode) throw new Error('Supabase: no se encontró código de seguimiento para RSVP.');

    const orders = await this.request(`orders?tracking_code=eq.${encodeURIComponent(trackingCode)}&select=id&limit=1`, { method: 'GET' });
    const remoteOrder = Array.isArray(orders) ? orders[0] : null;
    if (!remoteOrder) throw new Error('Supabase: el pedido debe sincronizarse antes del RSVP.');

    const filter = rsvp.guestPhone
      ? `guest_phone=eq.${encodeURIComponent(rsvp.guestPhone)}`
      : `guest_name=eq.${encodeURIComponent(rsvp.guestName)}`;
    const existingRows = await this.request(`rsvps?order_id=eq.${remoteOrder.id}&${filter}&select=id&limit=1`, { method: 'GET' });
    const existing = Array.isArray(existingRows) ? existingRows[0] : null;
    const row = {
      order_id: remoteOrder.id,
      guest_name: rsvp.guestName,
      guest_phone: rsvp.guestPhone || null,
      attendance: rsvp.attendance,
      companions: Number(rsvp.companions || 0),
      notes: rsvp.notes || null
    };

    const data = existing
      ? await this.request(`rsvps?id=eq.${existing.id}&select=id`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(row) })
      : await this.request('rsvps?select=id', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify([row]) });
    const saved = Array.isArray(data) ? data[0] : data;
    return { ok: true, skipped: false, id: saved && saved.id, updated: Boolean(existing) };
  }
}

module.exports = { SupabaseIntegration };
