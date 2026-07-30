'use strict';

class WhatsAppIntegration {
  constructor(env, localDb) {
    this.token = env.WHATSAPP_CLOUD_TOKEN || '';
    this.phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.notifyTo = String(env.WHATSAPP_NOTIFY_TO || env.WHATSAPP_PUBLIC_NUMBER || '').replace(/\D/g, '');
    this.publicNumber = String(env.WHATSAPP_PUBLIC_NUMBER || this.notifyTo || '59174562899').replace(/\D/g, '');
    this.graphVersion = env.META_GRAPH_API_VERSION || 'v23.0';
    this.sendToClient = String(env.WHATSAPP_SEND_TO_CLIENT || 'false').toLowerCase() === 'true';
    this.enabled = Boolean(this.token && this.phoneNumberId && this.notifyTo);
    this.localDb = localDb;
  }

  status() {
    return {
      name: 'WhatsApp Cloud API',
      enabled: this.enabled,
      mode: this.enabled ? 'real' : 'bandeja local + wa.me',
      detail: this.enabled ? 'Notificaciones automáticas habilitadas.' : 'Los mensajes se guardan en runtime-data/local-api-db.json.'
    };
  }

  publicLink(text) {
    const base = `https://wa.me/${this.publicNumber}`;
    return text ? `${base}?text=${encodeURIComponent(text)}` : base;
  }

  async sendText(to, text) {
    const cleanTo = String(to || '').replace(/\D/g, '');
    if (!this.enabled) {
      const entry = { to: cleanTo || this.notifyTo, text, mode: 'local', waLink: this.publicLink(text) };
      this.localDb.addOutbox(entry);
      return { ok: true, skipped: false, mode: 'local-outbox', waLink: entry.waLink };
    }

    const endpoint = `https://graph.facebook.com/${this.graphVersion}/${this.phoneNumberId}/messages`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanTo,
        type: 'text',
        text: { preview_url: false, body: text.slice(0, 4000) }
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`WhatsApp: ${payload.error && payload.error.message ? payload.error.message : response.statusText}`);
    return { ok: true, skipped: false, mode: 'cloud-api', messageId: payload.messages && payload.messages[0] && payload.messages[0].id };
  }

  async notifyOrder(order) {
    const adminText = [
      'Nueva solicitud - Invita Arte Studio',
      `Código: ${order.trackingCode}`,
      `Cliente: ${order.clientName}`,
      `Evento: ${order.eventType} / ${order.eventTitle}`,
      `Paquete: ${order.package}`,
      `Total estimado: Bs ${Number(order.totalAmount || 0).toFixed(0)}`
    ].join('\n');
    const admin = await this.sendText(this.notifyTo, adminText);
    let client = { ok: true, skipped: true };
    if (this.sendToClient && order.phone) {
      client = await this.sendText(order.phone, `Hola ${order.clientName}. Recibimos tu solicitud ${order.trackingCode}. Te contactaremos para confirmar los datos.`);
    }
    return { ok: true, admin, client, contactLink: this.publicLink(`Hola, consulto por mi solicitud ${order.trackingCode}.`) };
  }

  async notifyRsvp(rsvp, order) {
    const text = [
      'Actualización RSVP - Invita Arte Studio',
      `Pedido: ${(order && order.trackingCode) || rsvp.trackingCode || rsvp.orderId}`,
      `Invitado: ${rsvp.guestName}`,
      `Asistencia: ${rsvp.attendance}`,
      `Acompañantes: ${Number(rsvp.companions || 0)}`,
      rsvp.duplicateUpdated ? 'Resultado: confirmación existente actualizada.' : 'Resultado: nueva confirmación.'
    ].join('\n');
    return this.sendText(this.notifyTo, text);
  }
}

module.exports = { WhatsAppIntegration };
