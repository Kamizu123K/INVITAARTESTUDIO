(function(){
  const key = 'invitaarte_operativo_v4_links_fotos_realistas';
  function clone(data){ return JSON.parse(JSON.stringify(data)); }
  class LocalStoreService{
    constructor(){ this.ensure(); }
    ensure(){
      const existing = localStorage.getItem(key);
      if(existing) return;
      const seed = window.InvitaArteSeed;
      localStorage.setItem(key, JSON.stringify({
        users: clone(seed.demoUsers),
        templates: clone(seed.templates),
        orders: clone(seed.demoOrders),
        currentUser: null,
        metrics: clone(seed.metrics || [])
      }));
    }
    read(){ this.ensure(); return JSON.parse(localStorage.getItem(key)); }
    write(data){ localStorage.setItem(key, JSON.stringify(data)); return data; }
    reset(){ localStorage.removeItem(key); this.ensure(); }
  }
  window.LocalStoreService = LocalStoreService;
})();
