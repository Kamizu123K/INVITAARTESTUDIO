(function(){
  class CatalogModel{
    constructor(api){ this.api = api; this.templates = []; this.filters = { search:'', category:'todas', package:'todos', style:'todos' }; this.favorites = JSON.parse(localStorage.getItem('invitaarte_favorites') || '[]'); }
    async load(includeInactive=false){ this.templates = await this.api.listTemplates(includeInactive); return this.templates; }
    setFilter(name,value){ this.filters[name]=value; }
    toggleFavorite(id){ this.favorites = this.favorites.includes(id) ? this.favorites.filter(x=>x!==id) : [...this.favorites,id]; localStorage.setItem('invitaarte_favorites', JSON.stringify(this.favorites)); }
    isFavorite(id){ return this.favorites.includes(id); }
    getCategories(){ return ['todas', ...Array.from(new Set(this.templates.map(t=>t.category).filter(Boolean)))]; }
    getStyles(){ return ['todos', ...Array.from(new Set(this.templates.map(t=>t.style).filter(Boolean)))]; }
    filtered(){
      const f=this.filters; const term=String(f.search||'').toLowerCase().trim();
      return this.templates.filter(t => {
        const hay=[t.title,t.category,t.style,t.description,(t.features||[]).join(' ')].join(' ').toLowerCase();
        return (!term || hay.includes(term)) && (f.category==='todas'||t.category===f.category) && (f.package==='todos'||t.package===f.package) && (f.style==='todos'||t.style===f.style) && t.isActive !== false;
      });
    }
    getById(id){ return this.templates.find(t=>t.id===id); }
    async create(payload){ const t=await this.api.createTemplate(payload); this.templates.unshift(t); return t; }
    async update(id,payload){ const t=await this.api.updateTemplate(id,payload); const i=this.templates.findIndex(x=>x.id===id); if(i>=0) this.templates[i]=t; return t; }
    async delete(id){ await this.api.deleteTemplate(id); this.templates=this.templates.filter(t=>t.id!==id); return true; }
  }
  window.CatalogModel = CatalogModel;
})();
