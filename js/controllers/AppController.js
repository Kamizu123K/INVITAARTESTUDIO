(function(){
  class AppController{
    constructor(){
      this.api = new window.SupabaseService();
      this.auth = new window.AuthModel(this.api);
      this.catalog = new window.CatalogModel(this.api);
      this.orders = new window.OrderModel(this.api);
      this.view = new window.LayoutView();
      this.publicView = new window.PublicView(this.view);
      this.authView = new window.AuthView(this.view);
      this.dashboardView = new window.DashboardView(this.view);
      this.panelTab = 'resumen';
      this.panelData = { orders:[], templates:[], profiles:[], metrics:{}, metricEvents:[] };
      this.apiStatus = { ok:false, integrations:[] };
    }
    async init(){
      this.bindShell(); this.view.bindModalClose();
      await this.auth.load();
      await this.catalog.load(false);
      this.apiStatus = await this.api.getIntegrationHealth();
      new window.AuthController(this).bind();
      new window.CatalogController(this).bind();
      new window.OrderController(this).bind();
      new window.CrudController(this).bind();
      window.addEventListener('hashchange',()=>this.render());
      await this.render();
    }
    bindShell(){
      const navToggle=document.getElementById('navToggle'); const mainNav=document.getElementById('mainNav');
      if(navToggle && mainNav){
        navToggle.addEventListener('click',()=>{ const open=mainNav.classList.toggle('open'); navToggle.setAttribute('aria-expanded',String(open)); });
        mainNav.addEventListener('click',()=>mainNav.classList.remove('open'));
      }
      document.addEventListener('click', async e=>{
        const btn=e.target.closest('[data-panel-tab]');
        if(btn){ this.panelTab=btn.dataset.panelTab; await this.renderPanel(); }
      });
    }
    parseHash(){
      const raw=(location.hash || '#inicio').slice(1); const [route,query='']=raw.split('?');
      const params=Object.fromEntries(new URLSearchParams(query));
      return {route:route||'inicio', params};
    }
    async loadPanelData(){
      if(!this.auth.user) return;
      const includeInactive = ['admin','asesor','disenador'].includes(this.auth.user.role);
      const [orders, templates, metrics, events, profiles] = await Promise.all([
        this.orders.load(this.auth.user),
        this.catalog.load(includeInactive),
        this.api.getMetrics(),
        this.api.listMetrics(),
        this.auth.user.role === 'admin' ? this.api.listProfiles() : Promise.resolve([])
      ]);
      this.panelData = { orders, templates, metrics, metricEvents:events, profiles };
    }
    async refreshPanel(message){
      await this.loadPanelData();
      this.renderPanel();
      if(message) this.view.toast(message);
    }
    async render(){
      const {route,params}=this.parseHash();
      document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active', a.getAttribute('href') === '#'+route));
      const panelLink=document.getElementById('panelLink'); if(panelLink) panelLink.textContent=this.auth.user?'Mi panel':'Mi cuenta';
      if(route==='login'){ this.view.set(this.authView.page('login')); return; }
      if(route==='registro'){ this.view.set(this.authView.page('registro')); return; }
      if(['panel','admin','cliente','asesor','disenador'].includes(route)){
        if(!this.auth.user){ location.hash='#login'; return; }
        await this.loadPanelData(); this.renderPanel(); return;
      }
      if(route==='catalogo'){ this.view.set(this.publicView.catalogPage(this.catalog)); return; }
      if(route==='cotizador'){ this.view.set(this.publicView.quotePage(this.catalog, params)); setTimeout(()=>{ const oc=new window.OrderController(this); oc.updateQuotePreview(); },0); return; }
      if(route==='seguimiento'){ this.view.set(this.publicView.trackingPage()); return; }
      if(route==='modelo'){ this.view.set(this.publicView.setupPage()); return; }
      this.view.set(this.publicView.home({catalog:this.catalog, mode:this.api.mode(), user:this.auth.user, apiStatus:this.apiStatus}));
    }
    renderCatalogOnly(){ this.view.set(this.publicView.catalogPage(this.catalog)); }
    renderPanel(){ this.view.set(this.dashboardView.dashboard(this.auth.user, this.panelData, this.panelTab)); }
  }
  window.AppController = AppController;
})();
