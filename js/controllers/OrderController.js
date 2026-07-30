(function(){
  class OrderController{
    constructor(app){ this.app=app; }
    bind(){
      document.addEventListener('input', e=>{ if(e.target.closest('#orderForm')) this.updateQuotePreview(); });
      document.addEventListener('change', e=>{ if(e.target.closest('#orderForm')) this.updateQuotePreview(); });
      document.addEventListener('submit', async e=>{
        if(e.target.id === 'orderForm') return this.submitPublicOrder(e);
        if(e.target.id === 'trackingForm') return this.submitTracking(e);
        if(e.target.id === 'versionForm') return this.submitVersion(e);
      });
      document.addEventListener('click', async e=>{
        const next=e.target.closest('[data-next-status]');
        if(next){ try{ await this.app.orders.updateStatus(next.dataset.nextStatus,next.dataset.status); await this.app.refreshPanel('Estado actualizado.'); }catch(err){ this.app.view.toast(err.message,'error'); } }
        const approve=e.target.closest('[data-approve-order]');
        if(approve){ try{ await this.app.orders.approve(approve.dataset.approveOrder); await this.app.refreshPanel('Pedido aprobado.'); }catch(err){ this.app.view.toast(err.message,'error'); } }
        const view=e.target.closest('[data-view-order]');
        if(view){ const order=this.app.panelData.orders.find(o=>o.id===view.dataset.viewOrder) || this.app.orders.getById(view.dataset.viewOrder); if(order) this.app.view.modal(this.app.dashboardView.orderDetail(order), true); }
      });
    }
    async submitPublicOrder(e){
      e.preventDefault();
      if(!this.app.auth.user){ this.app.view.toast('Primero inicia sesión o crea una cuenta para guardar el pedido.','warning'); location.hash='#login'; return; }
      const form = Object.fromEntries(new FormData(e.target)); form.urgent = e.target.querySelector('[name="urgent"]').checked; form.guests = Number(form.guests||0);
      try{ const order=await this.app.orders.create(form,this.app.auth.user); await this.app.api.trackMetric('quote_submit',{templateId:form.templateId, package:form.package}); const synced=order.integrationSync && order.integrationSync.ok; this.app.view.toast('Solicitud guardada. Código: '+order.trackingCode+(synced?' · 3 integraciones procesadas.':' · guardada localmente.')); location.hash='#panel'; await this.app.render(); }catch(err){ this.app.view.toast(err.message,'error'); }
    }
    async submitTracking(e){
      e.preventDefault(); const data=Object.fromEntries(new FormData(e.target)); const result = document.getElementById('trackingResult');
      try{ const order = await this.app.orders.findByCode(data.trackingCode); result.innerHTML = order ? this.trackingResult(order) : '<div class="empty-state">No encontramos ese código. Revisa que esté escrito igual.</div>'; }catch(err){ result.innerHTML='<div class="empty-state">'+this.app.view.escape(err.message)+'</div>'; }
    }
    async submitVersion(e){
      e.preventDefault(); const versionId=e.target.dataset.versionId; const data=Object.fromEntries(new FormData(e.target)); const orderId=data.orderId || e.target.dataset.orderId;
      try{ if(versionId){ await this.app.orders.updateVersion(versionId,data); } else { await this.app.orders.addVersion(orderId,data,this.app.auth.user); } this.app.view.closeModal(); await this.app.refreshPanel(versionId?'Versión actualizada.':'Versión agregada y enviada a revisión.'); }catch(err){ this.app.view.toast(err.message,'error'); }
    }
    updateQuotePreview(){
      const form=document.getElementById('orderForm'); if(!form) return;
      const data=Object.fromEntries(new FormData(form)); data.urgent = form.querySelector('[name="urgent"]').checked; data.guests=Number(data.guests||0);
      const template=this.app.catalog.getById(data.templateId) || {}; const pkg=window.InvitaArteSeed.packages.find(p=>p.id===data.package) || {};
      const total=Number(pkg.price||template.basePrice||0)+(data.urgent?35:0)+(data.guests>150?20:0);
      const price=document.getElementById('quotePrice'); const details=document.getElementById('quoteDetails'); const live=document.getElementById('liveInvite');
      if(price) price.textContent=this.app.view.money(total);
      if(details) details.textContent=`${pkg.name || 'Paquete'} · ${template.title || 'Plantilla'}${data.urgent?' · entrega urgente':''}${data.guests>150?' · evento grande':''}`;
      if(live) live.innerHTML=`<span class="ornament">✦</span><h3>${this.app.view.escape(data.eventTitle||'Tu evento')}</h3><p><b>${this.app.view.escape(data.honorees||'Nombre principal')}</b></p><p>${this.app.view.escape(data.eventDate||'Fecha pendiente')} · ${this.app.view.escape(data.eventTime||'Hora pendiente')}</p><p>${this.app.view.escape(data.location||'Ubicación pendiente')}</p><div class="qr-box"></div>`;
    }
    trackingResult(order){ return `<div class="card"><h3>${this.app.view.escape(order.eventTitle)}</h3><p>${this.app.view.statusBadge(order.status)} <b>${this.app.view.escape(order.trackingCode)}</b></p>${this.app.view.progress(order.status)}<div class="grid cols-2 mt-3"><div><b>Cliente</b><p>${this.app.view.escape(order.clientName)}</p></div><div><b>Evento</b><p>${this.app.view.escape(order.eventType)} · ${this.app.view.escape(order.eventDate||'sin fecha')}</p></div></div>${(order.versions||[]).length?`<h3>Última versión</h3><a href="${this.app.view.escape(order.versions[order.versions.length-1].previewUrl)}" target="_blank" rel="noopener">Abrir vista previa</a>`:''}</div>`; }
  }
  window.OrderController = OrderController;
})();
