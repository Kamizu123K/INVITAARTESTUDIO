(function(){
  'use strict';

  class ApiIntegrationService{
    constructor(){
      const cfg = window.InvitaArteConfig || {};
      this.baseUrl = String(cfg.apiBaseUrl || '/api').replace(/\/$/, '');
      this.lastHealth = null;
    }

    async request(path, options={}){
      const controller = new AbortController();
      const timeout = setTimeout(()=>controller.abort(), 8000);
      try{
        const response = await fetch(this.baseUrl + path, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
          }
        });
        const payload = await response.json().catch(()=>({}));
        if(!response.ok){
          const message = payload.error || (Array.isArray(payload.errors) ? payload.errors.join(' ') : '') || `HTTP ${response.status}`;
          throw new Error(message);
        }
        return payload;
      } finally {
        clearTimeout(timeout);
      }
    }

    async health(){
      try{
        const result = await this.request('/health');
        this.lastHealth = result;
        return result;
      }catch(error){
        const result = {
          ok:false,
          offline:true,
          version:(window.InvitaArteConfig && window.InvitaArteConfig.appVersion) || '1.1.0',
          integrations:[
            {name:'Supabase API', enabled:false, mode:'sin servidor local'},
            {name:'Google Sheets API', enabled:false, mode:'sin servidor local'},
            {name:'WhatsApp Cloud API', enabled:false, mode:'enlace público disponible'}
          ],
          error:error.name === 'AbortError' ? 'Tiempo de espera agotado.' : error.message
        };
        this.lastHealth = result;
        return result;
      }
    }

    async syncOrder(order){
      try{
        return await this.request('/orders', { method:'POST', body:JSON.stringify(order) });
      }catch(error){
        console.warn('La solicitud quedó guardada en el navegador; el servidor local no pudo sincronizarla:', error.message || error);
        return { ok:false, offline:true, error:error.message || String(error) };
      }
    }

    async findOrder(code){
      try{
        const result = await this.request('/orders/' + encodeURIComponent(code));
        return result.order || null;
      }catch(error){
        if(/no encontrado/i.test(error.message || '')) return null;
        console.warn(error);
        return null;
      }
    }

    async syncRsvp(rsvp){
      try{
        return await this.request('/rsvps', { method:'POST', body:JSON.stringify(rsvp) });
      }catch(error){
        console.warn('El RSVP quedó guardado localmente; el servidor local no pudo sincronizarlo:', error.message || error);
        return { ok:false, offline:true, error:error.message || String(error) };
      }
    }
  }

  window.ApiIntegrationService = ApiIntegrationService;
})();
