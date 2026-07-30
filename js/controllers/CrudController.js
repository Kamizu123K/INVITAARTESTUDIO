(function(){
  function formData(form){
    const data = Object.fromEntries(new FormData(form));
    form.querySelectorAll('input[type="checkbox"]').forEach(ch=>{ data[ch.name] = ch.checked; });
    return data;
  }
  class CrudController{
    constructor(app){ this.app=app; }
    bind(){
      document.addEventListener('input', e=>{ if(e.target.matches('[data-filter-table]')) this.filterTable(e.target.dataset.filterTable); });
      document.addEventListener('change', e=>{ if(e.target.matches('[data-filter-status]')) this.filterTable(e.target.dataset.filterStatus); });
      document.addEventListener('click', async e=>{
        const t=e.target;
        if(t.closest('[data-new-order]')) return this.openOrderForm();
        if(t.closest('[data-edit-order]')) return this.openOrderForm(t.closest('[data-edit-order]').dataset.editOrder);
        if(t.closest('[data-delete-order]')) return this.deleteOrder(t.closest('[data-delete-order]').dataset.deleteOrder);
        if(t.closest('[data-new-template]')) return this.openTemplateForm();
        if(t.closest('[data-edit-template]')) return this.openTemplateForm(t.closest('[data-edit-template]').dataset.editTemplate);
        if(t.closest('[data-delete-template]')) return this.deleteTemplate(t.closest('[data-delete-template]').dataset.deleteTemplate);
        if(t.closest('[data-edit-profile]')) return this.openProfileForm(t.closest('[data-edit-profile]').dataset.editProfile);
        if(t.closest('[data-version-from-table]')) return this.openVersionForm();
        if(t.closest('[data-add-version]')) return this.openVersionForm(t.closest('[data-add-version]').dataset.addVersion);
        if(t.closest('[data-edit-version]')) return this.openVersionForm(null,t.closest('[data-edit-version]').dataset.editVersion);
        if(t.closest('[data-delete-version]')) return this.deleteVersion(t.closest('[data-delete-version]').dataset.deleteVersion);
        if(t.closest('[data-payment-from-table]')) return this.openPaymentForm();
        if(t.closest('[data-add-payment]')) return this.openPaymentForm(t.closest('[data-add-payment]').dataset.addPayment);
        if(t.closest('[data-edit-payment]')) return this.openPaymentForm(null,t.closest('[data-edit-payment]').dataset.editPayment);
        if(t.closest('[data-delete-payment]')) return this.deletePayment(t.closest('[data-delete-payment]').dataset.deletePayment);
        if(t.closest('[data-export-table]')) return this.exportTable(t.closest('[data-export-table]'));
        if(t.closest('[data-rsvp-from-table]')) return this.openRsvpForm();
        if(t.closest('[data-edit-rsvp]')) return this.openRsvpForm(null,t.closest('[data-edit-rsvp]').dataset.editRsvp);
        if(t.closest('[data-delete-rsvp]')) return this.deleteRsvp(t.closest('[data-delete-rsvp]').dataset.deleteRsvp);
      });
      document.addEventListener('submit', async e=>{
        if(e.target.id==='orderCrudForm') return this.saveOrder(e);
        if(e.target.id==='templateCrudForm') return this.saveTemplate(e);
        if(e.target.id==='profileCrudForm') return this.saveProfile(e);
        if(e.target.id==='paymentForm') return this.savePayment(e);
        if(e.target.id==='rsvpForm') return this.saveRsvp(e);
      });
    }

    exportTable(button){
      const tableId = button.dataset.exportTable;
      const table = document.getElementById(tableId);
      if(!table){ this.app.view.toast('No hay tabla para exportar.','warning'); return; }
      const rows = [...table.querySelectorAll('tr')].filter((tr,i)=> i===0 || tr.style.display !== 'none');
      const csv = rows.map(row => [...row.children].map(cell => {
        const text = cell.innerText.replace(/\s+/g,' ').trim().replace(/"/g,'""');
        return `"${text}"`;
      }).join(',')).join('\n');
      const blob = new Blob(['\ufeff'+csv], {type:'text/csv;charset=utf-8;'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const name = (button.dataset.exportName || tableId || 'reporte') + '-' + new Date().toISOString().slice(0,10) + '.csv';
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      this.app.view.toast('Reporte CSV generado.');
    }

    filterTable(tableId){
      const table=document.getElementById(tableId); if(!table) return;
      const search=document.querySelector(`[data-filter-table="${tableId}"]`); const status=document.querySelector(`[data-filter-status="${tableId}"]`);
      const term=String(search ? search.value : '').toLowerCase().trim(); const st=status ? status.value : 'todos';
      table.querySelectorAll('tbody tr').forEach(tr=>{
        const hay=tr.dataset.search || tr.textContent.toLowerCase(); const okTerm=!term || hay.includes(term); const okStatus=!st || st==='todos' || tr.dataset.status===st;
        tr.style.display= okTerm && okStatus ? '' : 'none';
      });
    }
    getOrder(id){ return this.app.panelData.orders.find(o=>o.id===id) || this.app.orders.getById(id); }
    getVersion(id){ for(const o of this.app.panelData.orders){ const v=(o.versions||[]).find(x=>x.id===id); if(v) return v; } return null; }
    getPayment(id){ for(const o of this.app.panelData.orders){ const p=(o.payments||[]).find(x=>x.id===id); if(p) return p; } return null; }
    getRsvp(id){ for(const o of this.app.panelData.orders){ const r=(o.rsvps||[]).find(x=>x.id===id); if(r) return r; } return null; }
    openOrderForm(id){ const order=id?this.getOrder(id):{}; this.app.view.modal(this.app.dashboardView.orderForm(order,this.app.panelData.templates,true), true); }
    async saveOrder(e){
      e.preventDefault(); const id=e.target.dataset.orderId; const data=formData(e.target); data.guests=Number(data.guests||0); data.totalAmount=Number(data.totalAmount||0);
      try{
        if(id){ await this.app.orders.update(id,data); }
        else { await this.app.orders.create(data,this.app.auth.user); }
        this.app.view.closeModal(); await this.app.refreshPanel(id?'Pedido actualizado.':'Pedido creado.');
      }catch(err){ this.app.view.toast(err.message,'error'); }
    }
    async deleteOrder(id){ if(!confirm('¿Eliminar este pedido y sus registros relacionados?')) return; try{ await this.app.orders.delete(id); await this.app.refreshPanel('Pedido eliminado.'); }catch(err){ this.app.view.toast(err.message,'error'); } }
    openTemplateForm(id){ const t=id?this.app.panelData.templates.find(x=>x.id===id):{}; this.app.view.modal(this.app.dashboardView.templateForm(t), true); }
    async saveTemplate(e){
      e.preventDefault(); const id=e.target.dataset.templateId; const data=formData(e.target);
      try{ if(id) await this.app.catalog.update(id,data); else await this.app.catalog.create(data); this.app.view.closeModal(); await this.app.refreshPanel(id?'Plantilla actualizada.':'Plantilla creada.'); }catch(err){ this.app.view.toast(err.message,'error'); }
    }
    async deleteTemplate(id){ if(!confirm('¿Desactivar esta plantilla del catálogo?')) return; try{ await this.app.catalog.delete(id); await this.app.refreshPanel('Plantilla desactivada.'); }catch(err){ this.app.view.toast(err.message,'error'); } }
    openProfileForm(id){ const p=this.app.panelData.profiles.find(x=>x.id===id); if(p) this.app.view.modal(this.app.dashboardView.profileForm(p)); }
    async saveProfile(e){
      e.preventDefault(); const id=e.target.dataset.profileId; const data=formData(e.target);
      try{ await this.app.api.updateProfile(id,data); this.app.view.closeModal(); await this.app.refreshPanel('Usuario actualizado.'); }catch(err){ this.app.view.toast(err.message,'error'); }
    }
    openVersionForm(orderId,versionId){ const v=versionId?this.getVersion(versionId):{}; this.app.view.modal(this.app.dashboardView.versionForm(orderId,v)); }
    async deleteVersion(id){ if(!confirm('¿Eliminar esta versión?')) return; try{ await this.app.orders.deleteVersion(id); await this.app.refreshPanel('Versión eliminada.'); }catch(err){ this.app.view.toast(err.message,'error'); } }
    openPaymentForm(orderId,paymentId){ const p=paymentId?this.getPayment(paymentId):{}; this.app.view.modal(this.app.dashboardView.paymentForm(orderId,p)); }
    async savePayment(e){
      e.preventDefault(); const id=e.target.dataset.paymentId; const data=formData(e.target); data.orderId=data.orderId || e.target.dataset.orderId; data.amount=Number(data.amount||0);
      try{ if(id) await this.app.orders.updatePayment(id,data); else await this.app.orders.createPayment(data); this.app.view.closeModal(); await this.app.refreshPanel(id?'Pago actualizado.':'Pago registrado.'); }catch(err){ this.app.view.toast(err.message,'error'); }
    }
    async deletePayment(id){ if(!confirm('¿Eliminar pago?')) return; try{ await this.app.orders.deletePayment(id); await this.app.refreshPanel('Pago eliminado.'); }catch(err){ this.app.view.toast(err.message,'error'); } }
    openRsvpForm(orderId,rsvpId){ const r=rsvpId?this.getRsvp(rsvpId):{}; this.app.view.modal(this.app.dashboardView.rsvpForm(orderId,r)); }
    async saveRsvp(e){
      e.preventDefault(); const id=e.target.dataset.rsvpId; const data=formData(e.target); data.orderId=data.orderId || e.target.dataset.orderId; data.companions=Number(data.companions||0);
      try{ let result; if(id) result=await this.app.orders.updateRsvp(id,data); else result=await this.app.orders.createRsvp(data); this.app.view.closeModal(); const message=id?'RSVP actualizado.':(result&&result.duplicateUpdated?'RSVP duplicado detectado y actualizado.':'Invitado agregado y sincronizado.'); await this.app.refreshPanel(message); }catch(err){ this.app.view.toast(err.message,'error'); }
    }
    async deleteRsvp(id){ if(!confirm('¿Eliminar RSVP?')) return; try{ await this.app.orders.deleteRsvp(id); await this.app.refreshPanel('RSVP eliminado.'); }catch(err){ this.app.view.toast(err.message,'error'); } }
  }
  window.CrudController = CrudController;
})();
