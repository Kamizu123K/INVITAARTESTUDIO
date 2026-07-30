(function(){
  class CatalogController{
    constructor(app){ this.app=app; }
    bind(){
      document.addEventListener('input', e=>{
        if(e.target.id === 'filterSearch'){ this.app.catalog.setFilter('search', e.target.value); this.app.renderCatalogOnly(); }
      });
      document.addEventListener('change', e=>{
        if(e.target.id === 'filterCategory'){ this.app.catalog.setFilter('category', e.target.value); this.app.renderCatalogOnly(); }
        if(e.target.id === 'filterPackage'){ this.app.catalog.setFilter('package', e.target.value); this.app.renderCatalogOnly(); }
        if(e.target.id === 'filterStyle'){ this.app.catalog.setFilter('style', e.target.value); this.app.renderCatalogOnly(); }
      });
      document.addEventListener('click', async e=>{
        const fav = e.target.closest('[data-favorite-template]');
        if(fav){ this.app.catalog.toggleFavorite(fav.dataset.favoriteTemplate); this.app.view.toast('Favoritos actualizados.'); this.app.render(); }
        const preview = e.target.closest('[data-preview-template]');
        if(preview){ const t=this.app.catalog.getById(preview.dataset.previewTemplate); if(t){ await this.app.api.trackMetric('template_view',{templateId:t.id}); this.app.view.modal(this.templatePreview(t), true); } }
      });
    }
    templatePreview(t){
      const pkg = (window.InvitaArteSeed.packages || []).find(p=>p.id===t.package) || {};
      const features = (t.features && t.features.length ? t.features : (pkg.features || []));
      const img = t.imageUrl ? `<img class="quick-photo-real" src="${this.app.view.escape(t.imageUrl)}" alt="${this.app.view.escape(t.imageAlt || t.title)}">` : '';
      const published = t.previewUrl ? `<a class="btn secondary" href="${this.app.view.escape(t.previewUrl)}" target="_blank" rel="noopener">Abrir publicada</a>` : '';
      return `<div class="quick-view-modal quick-view-photo">
        <div class="quick-preview-card photo-modal-card" style="--quick-accent:${this.app.view.escape(t.accent || '#7C3AED')}">
          ${img}
          <div class="quick-photo-caption">
            <span class="quick-kicker">Foto realista PNG</span>
            <h2>${this.app.view.escape(t.title)}</h2>
            <p>${this.app.view.escape(t.category)} · ${this.app.view.escape(t.style)}</p>
          </div>
        </div>
        <div class="quick-info-card">
          <span class="eyebrow">Vista rápida</span>
          <h2>${this.app.view.escape(t.title)}</h2>
          <p class="lead">${this.app.view.escape(t.description)}</p>
          <div class="quick-meta-grid">
            <div><small>Categoría</small><strong>${this.app.view.escape(t.category)}</strong></div>
            <div><small>Estilo</small><strong>${this.app.view.escape(t.style)}</strong></div>
            <div><small>Paquete</small><strong>${this.app.view.escape(pkg.name || t.package)}</strong></div>
            <div><small>Desde</small><strong>${this.app.view.money(t.basePrice)}</strong></div>
          </div>
          <h3>Incluye</h3>
          <div class="quick-feature-list">${features.map(f=>`<span>${this.app.view.escape(f)}</span>`).join('')}</div>
          <div class="quick-note"><strong>Entrega digital:</strong> enlace web, QR o WhatsApp. Servicio 100% digital.</div>
          <div class="action-row mt-3">${published}<a class="btn primary" href="#cotizador?template=${this.app.view.escape(t.id)}" data-close-modal>Cotizar esta plantilla</a><button class="btn ghost" data-close-modal>Cerrar</button></div>
        </div>
      </div>`;
    }
  }
  window.CatalogController = CatalogController;
})();
