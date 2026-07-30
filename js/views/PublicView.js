(function(){
  class PublicView{
    constructor(layout){ this.v=layout; }

    home({catalog,mode,user,apiStatus}){
      const templates = catalog.templates.filter(t=>t.isActive !== false).slice(0,3);
      const status = apiStatus && apiStatus.ok ? '<span class="supabase-status real">● Servidor local activo</span>' : '<span class="supabase-status demo">● Modo navegador activo</span>';
      return `<section class="hero" id="inicio"><div class="container hero-grid"><div><span class="eyebrow">Invita Arte Studio</span><h1 class="h1">Invitaciones digitales elegantes, rápidas y con seguimiento.</h1><p class="lead">Creamos invitaciones digitales personalizadas para eventos especiales, con enlace web, QR, mapa, música, galería, cuenta regresiva y confirmación de asistencia.</p><div class="hero-actions"><a class="btn primary" href="#catalogo">Ver catálogo</a><a class="btn ghost" href="#cotizador">Cotizar ahora</a><a class="btn soft" href="#login">Acceder a mi cuenta</a></div><div class="tag-row"><span class="tag">${status}</span><span class="tag">Solo digital</span><span class="tag">Entrega por enlace o WhatsApp</span><span class="tag">Control de versiones</span></div><div class="hero-stats"><div class="stat"><strong>12</strong><span>publicadas</span></div><div class="stat"><strong>7</strong><span>estados de pedido</span></div><div class="stat"><strong>4</strong><span>roles operativos</span></div></div></div><div class="hero-card hero-card-preview"><img src="assets/logo-invitaarte-studio.png" alt="Invita Arte Studio - Invitaciones digitales" class="hero-logo"><div class="hero-preview-image mt-2"><img src="assets/invitacion-previa-smartphone.png" alt="Invitación digital previa en smartphone"><div class="hero-preview-badge"><span>Vista previa real</span><h3>Invitación digital en smartphone</h3><p>Diseño listo para compartir por enlace, WhatsApp o QR.</p></div></div></div></div></section>${this.apiIntegrations(apiStatus)}${this.howItWorks()}${this.packages()}${this.featured(templates,catalog)}${this.clientArea()}${this.digitalBenefits()}${this.team()}${this.footer()}`;
    }

    apiIntegrations(apiStatus){
      const list=(apiStatus && Array.isArray(apiStatus.integrations) && apiStatus.integrations.length) ? apiStatus.integrations : [
        {name:'Supabase API',enabled:false,mode:'respaldo local'},
        {name:'Google Sheets API',enabled:false,mode:'CSV local'},
        {name:'WhatsApp Cloud API',enabled:false,mode:'enlace público'}
      ];
      return `<section class="section compact api-integrations"><div class="container"><div class="section-head"><div><span class="eyebrow">Release 1.1.0</span><h2 class="h2">Tres APIs integradas con funcionamiento local.</h2><p class="lead">El sistema trabaja sin claves externas y activa cada servicio real al completar el archivo .env.</p></div><span class="tag">Versión ${this.v.escape((apiStatus&&apiStatus.version)||'1.1.0')}</span></div><div class="grid cols-3">${list.map(item=>`<article class="card api-card"><span class="status-badge ${item.enabled?'aprobado':'revision'}">${item.enabled?'API real':'Respaldo local'}</span><h3>${this.v.escape(item.name)}</h3><p class="muted">Modo: ${this.v.escape(item.mode||'local')}</p><p>${this.v.escape(item.detail||'Integración preparada y verificable.')}</p></article>`).join('')}</div></div></section>`;
    }

    howItWorks(){
      const nodes=['Cliente se registra','Elige plantilla','Cotiza automáticamente','Revisa versiones','Aprueba y recibe enlace'];
      return `<section class="section compact"><div class="container"><div class="section-head"><div><span class="eyebrow">Proceso oficial</span><h2 class="h2">Todo el pedido queda ordenado desde el inicio.</h2><p class="lead">El sistema evita datos perdidos, cotizaciones dispersas y versiones confundidas.</p></div></div><div class="flow-diagram"><div class="flow-line">${nodes.map(n=>`<div class="flow-node">${n}</div>`).join('')}</div></div></div></section>`;
    }

    packages(){
      return `<section class="section" id="paquetes"><div class="container"><span class="eyebrow">Paquetes digitales</span><h2 class="h2">Opciones claras según el tipo de evento.</h2><div class="grid cols-3 mt-3">${window.InvitaArteSeed.packages.map((p,i)=>`<article class="card package-card ${i===2?'featured':''}"><h3>${this.v.escape(p.name)}</h3><p class="muted">${this.v.escape(p.summary)}</p><div class="summary-price">${this.v.money(p.price)}</div><ul class="checklist">${p.features.map(f=>`<li>${this.v.escape(f)}</li>`).join('')}</ul><a class="btn ${i===2?'primary':'ghost'}" href="#cotizador?package=${this.v.escape(p.id)}">Cotizar paquete</a></article>`).join('')}</div></div></section>`;
    }

    featured(templates,catalog){
      return `<section class="section compact"><div class="container"><div class="section-head"><div><span class="eyebrow">Catálogo digital</span><h2 class="h2">Plantillas listas para personalizar.</h2></div><a class="btn ghost" href="#catalogo">Ver catálogo completo</a></div><div class="grid cols-3">${templates.map(t=>this.templateCard(t,catalog)).join('')}</div></div></section>`;
    }

    templateCard(t,catalog){
      const img = t.imageUrl ? `<img class="template-photo" src="${this.v.escape(t.imageUrl)}" alt="${this.v.escape(t.imageAlt || t.title)}" loading="lazy">` : '';
      const published = t.previewUrl ? `<a class="btn small secondary" href="${this.v.escape(t.previewUrl)}" target="_blank" rel="noopener">Ver publicada</a>` : '';
      return `<article class="card template-card template-card-photo">
        <div class="template-preview photo-preview" style="--card-accent:${this.v.escape(t.accent || '#7C3AED')}">
          ${img}
          <div class="photo-shade"></div>
          <div class="photo-label">
            <div class="mini-title">${this.v.escape(t.title)}</div>
            <div class="mini-date">${this.v.escape(t.category)} · ${this.v.escape(t.style)}</div>
          </div>
        </div>
        <div class="template-body">
          <div class="tag-row"><span class="tag">${this.v.escape(t.package)}</span><span class="tag">${this.v.money(t.basePrice)}</span><span class="tag">Foto realista PNG</span></div>
          <p class="muted">${this.v.escape(t.description)}</p>
          <div class="template-actions"><button class="btn small ghost" data-preview-template="${this.v.escape(t.id)}">Vista rápida</button><button class="btn small soft" data-favorite-template="${this.v.escape(t.id)}">${catalog && catalog.isFavorite(t.id)?'Quitar favorito':'Favorito'}</button>${published}<a class="btn small primary" href="#cotizador?template=${this.v.escape(t.id)}">Cotizar</a></div>
        </div>
      </article>`;
    }

    clientArea(){
      const roles=[['Cliente','Crea solicitudes, ve estados, revisa versiones, carga pagos y aprueba la invitación.'],['Asesor','Ordena solicitudes, valida datos, registra pagos y mueve el pedido al área de diseño.'],['Diseñador','Carga propuestas, controla versiones y envía la invitación a revisión.'],['Administrador','Gestiona usuarios, roles, plantillas, pedidos, pagos, RSVP y métricas.']];
      return `<section class="section"><div class="container"><span class="eyebrow">Portal por roles</span><h2 class="h2">Cada usuario entra a su propio panel.</h2><div class="grid cols-4 mt-3">${roles.map(r=>`<article class="card icon-card"><div class="icon">${r[0][0]}</div><h3>${r[0]}</h3><p class="muted">${r[1]}</p></article>`).join('')}</div></div></section>`;
    }

    digitalBenefits(){
      const items=[['Entrega digital','Se comparte por enlace, QR o WhatsApp.'],['Aprobación clara','El cliente revisa la versión correcta antes de la entrega final.'],['Seguimiento','Cada pedido tiene código y estado visible.'],['Confirmación RSVP','Los invitados pueden confirmar asistencia.'],['Catálogo ordenado','Plantillas por evento, estilo y paquete.'],['Control operativo','Paneles con tablas, formularios y métricas.']];
      return `<section class="section compact" id="modelo"><div class="container"><span class="eyebrow">Sistema operativo MVC</span><h2 class="h2">Modelo, vista y controlador organizados para una operación real.</h2><div class="grid cols-3 mt-3">${items.map(i=>`<article class="card"><h3>${i[0]}</h3><p class="muted">${i[1]}</p></article>`).join('')}</div></div></section>`;
    }

    team(){
      return `<section class="section compact"><div class="container"><span class="eyebrow">Equipo</span><h2 class="h2">Invita Arte Studio</h2><div class="grid cols-4 mt-3">${window.InvitaArteSeed.team.map(m=>`<article class="card"><h3>${this.v.escape(m.name)}</h3><p class="muted">${this.v.escape(m.role)}</p></article>`).join('')}</div></div></section>`;
    }

    footer(){
      const wa = this.v.escape(window.InvitaArteConfig.whatsappNumber || '59174562899');
      const waDisplay = wa.startsWith('591') ? `+591 ${wa.slice(3)}` : wa;
      return `<footer class="site-footer"><div class="container"><div class="footer-grid footer-grid-pro"><div><img src="assets/logo-invitaarte-studio.png" alt="Invita Arte Studio" class="footer-logo"><p class="footer-brand-text">Invitaciones digitales personalizadas para momentos inolvidables. Gestiona catálogos, cotizaciones, seguimiento y entregas en una experiencia moderna y profesional.</p><div class="footer-badges"><span>Entrega por enlace</span><span>Soporte por WhatsApp</span><span>Experiencia digital</span></div></div><div><h3>Servicios</h3><ul class="footer-list"><li>Invitación web interactiva</li><li>QR, RSVP, mapa y música</li><li>Galería, cuenta regresiva y seguimiento</li><li>Diseño personalizado para eventos</li></ul></div><div><h3>Accesos rápidos</h3><ul class="footer-list"><li><a href="#catalogo">Ver catálogo</a></li><li><a href="#cotizador">Cotizar invitación</a></li><li><a href="#seguimiento">Seguir pedido</a></li><li><a href="#login">Mi cuenta</a></li><li><a href="privacidad.html">Privacidad</a></li></ul></div><div><h3>Contacto</h3><ul class="footer-list"><li><strong>WhatsApp:</strong> <a href="https://wa.me/${wa}" target="_blank" rel="noopener">${waDisplay}</a></li><li><strong>Ubicación:</strong> La Paz, Bolivia</li><li><strong>Atención:</strong> Consultas y coordinación digital</li><li><strong>Canal principal:</strong> Enlace web y WhatsApp</li></ul></div></div><div class="footer-bottom"><p>© 2026 Invita Arte Studio · Invitaciones digitales.</p><p>Plataforma operativa con estructura MVC, catálogo, cotizador, seguimiento y panel por roles.</p></div></div></footer><div class="floating-contact-tools"><button type="button" class="floating-btn chatbot" id="chatbotToggle" aria-controls="chatbotWidget" aria-expanded="false"><span class="icon">✦</span><span class="label">Asistente</span></button><button type="button" class="floating-btn whatsapp" id="whatsappFloat"><span class="icon">✆</span><span class="label">WhatsApp</span></button></div><section class="chatbot-widget" id="chatbotWidget" hidden><div class="chatbot-head"><div class="chatbot-title"><div class="chatbot-avatar">IA</div><div><strong>Asistente virtual</strong><small>Sin internet · respuestas rápidas</small></div></div><button type="button" class="chatbot-close" id="chatbotClose" aria-label="Cerrar chat">×</button></div><div class="chatbot-body" id="chatbotMessages"></div><div class="chatbot-foot"><div class="chatbot-quick-actions" id="chatbotQuickActions"><button type="button" class="chatbot-chip" data-chatbot-intent="cotizar">Cotizar</button><button type="button" class="chatbot-chip" data-chatbot-intent="paquetes">Paquetes</button><button type="button" class="chatbot-chip" data-chatbot-intent="funciones">Funciones</button><button type="button" class="chatbot-chip" data-chatbot-intent="seguimiento">Seguimiento</button><button type="button" class="chatbot-chip" data-chatbot-intent="whatsapp">WhatsApp</button></div><form class="chatbot-form" id="chatbotForm"><input id="chatbotInput" type="text" placeholder="Escribe: precio, paquetes, seguimiento..." autocomplete="off"><button type="submit">Enviar</button></form><p class="chatbot-note">Este asistente funciona localmente y guía la conversación con opciones rápidas.</p></div></section>`;
    }

    catalogPage(catalog){
      const cats=catalog.getCategories(); const styles=catalog.getStyles(); const f=catalog.filters; const cards=catalog.filtered().map(t=>this.templateCard(t,catalog)).join('') || '<div class="empty-state">No se encontraron plantillas con esos filtros.</div>';
      return `<section class="section" id="catalogo"><div class="container"><span class="eyebrow">Catálogo digital</span><h1 class="h2">Elige una plantilla y cotiza en segundos.</h1><div class="filters"><div class="field"><label>Buscar</label><input id="filterSearch" value="${this.v.escape(f.search)}" placeholder="Boda, 15 años, QR, música..."></div><div class="field"><label>Categoría</label><select id="filterCategory">${cats.map(c=>`<option ${c===f.category?'selected':''}>${this.v.escape(c)}</option>`).join('')}</select></div><div class="field"><label>Paquete</label><select id="filterPackage">${['todos','basico','estandar','premium'].map(p=>`<option value="${p}" ${p===f.package?'selected':''}>${p}</option>`).join('')}</select></div><div class="field"><label>Estilo</label><select id="filterStyle">${styles.map(s=>`<option ${s===f.style?'selected':''}>${this.v.escape(s)}</option>`).join('')}</select></div></div><div class="grid cols-3">${cards}</div></div></section>${this.footer()}`;
    }

    quotePage(catalog, params){
      const template = params.template ? catalog.getById(params.template) : catalog.templates[0];
      const pkg = params.package || (template && template.package) || 'basico';
      return `<section class="section" id="cotizador"><div class="container"><span class="eyebrow">Cotizador automático</span><h1 class="h2">Solicita tu invitación digital.</h1><p class="lead">Inicia sesión o crea una cuenta para guardar el pedido, revisar versiones y aprobar la invitación final.</p><div class="quote-layout mt-3"><form class="card" id="orderForm"><div class="form-grid"><div class="field"><label>Nombre del cliente</label><input name="clientName" required placeholder="Ej. Camila Costas"></div><div class="field"><label>Correo</label><input type="email" name="email" required placeholder="correo@ejemplo.com"></div><div class="field"><label>Teléfono WhatsApp</label><input name="phone" required placeholder="59174562899"></div><div class="field"><label>Tipo de evento</label><select name="eventType">${catalog.getCategories().filter(c=>c!=='todas').map(c=>`<option>${this.v.escape(c)}</option>`).join('')}</select></div><div class="field"><label>Plantilla</label><select name="templateId" id="templateSelect">${catalog.templates.filter(t=>t.isActive!==false).map(t=>`<option value="${this.v.escape(t.id)}" ${template&&template.id===t.id?'selected':''}>${this.v.escape(t.title)}</option>`).join('')}</select></div><div class="field"><label>Paquete</label><select name="package" id="packageSelect">${window.InvitaArteSeed.packages.map(p=>`<option value="${this.v.escape(p.id)}" ${pkg===p.id?'selected':''}>${this.v.escape(p.name)}</option>`).join('')}</select></div><div class="field"><label>Título del evento</label><input name="eventTitle" placeholder="Ej. Mis 15 años"></div><div class="field"><label>Nombre(s) principal(es)</label><input name="honorees" placeholder="Ej. Valentina"></div><div class="field"><label>Fecha</label><input type="date" name="eventDate"></div><div class="field"><label>Hora</label><input type="time" name="eventTime"></div><div class="field full"><label>Ubicación</label><input name="location" placeholder="Ej. Salón Imperial, La Paz"></div><div class="field"><label>Cantidad de invitados</label><input type="number" min="1" name="guests" value="80"></div><div class="field"><label>Colores preferidos</label><input name="colors" placeholder="Lila, dorado, blanco"></div><div class="field full"><label>Notas y personalización</label><textarea name="notes" placeholder="Música, frase, estilo, programa, fotos, colores..."></textarea></div><div class="field full"><label><input type="checkbox" name="urgent"> Entrega urgente (+Bs 35)</label></div></div><div class="action-row mt-3"><button class="btn primary" type="submit">Guardar solicitud</button><a class="btn ghost" href="#login">Iniciar sesión</a></div></form><aside class="card quote-summary"><h3>Resumen de cotización</h3><div class="summary-price" id="quotePrice">Bs 0</div><p class="muted" id="quoteDetails">Selecciona plantilla y paquete para calcular.</p><div class="invite-live mt-2" id="liveInvite"><span class="ornament">✦</span><h3>Tu evento</h3><p>La vista previa aparecerá con los datos del formulario.</p><div class="countdown"><div><strong>30</strong><span>días</span></div><div><strong>12</strong><span>hrs</span></div><div><strong>45</strong><span>min</span></div></div></div></aside></div></div></section>${this.footer()}`;
    }

    trackingPage(){
      return `<section class="section" id="seguimiento"><div class="container"><span class="eyebrow">Seguimiento de pedido</span><h1 class="h2">Consulta el estado de tu invitación.</h1><div class="card"><form id="trackingForm" class="form-grid"><div class="field"><label>Código de seguimiento</label><input name="trackingCode" placeholder="Ej. IA-2026-001" required></div><div class="field" style="align-self:end"><button class="btn primary" type="submit">Consultar</button></div></form><div id="trackingResult" class="mt-3"></div></div></div></section>${this.footer()}`;
    }

    setupPage(){
      return `<section class="section"><div class="container"><span class="eyebrow">Sistema MVC</span><h1 class="h2">Invita Arte Studio operativo.</h1><div class="grid cols-3 mt-3"><div class="card"><h3>Modelo</h3><p>Usuarios, plantillas, pedidos, pagos, versiones, RSVP y métricas.</p></div><div class="card"><h3>Vista</h3><p>Página pública, login, panel cliente, asesor, diseñador y administrador.</p></div><div class="card"><h3>Controlador</h3><p>Autenticación, cotización, CRUD, estados, aprobación y exportación.</p></div></div></div></section>${this.footer()}`;
    }
  }
  window.PublicView = PublicView;
})();
