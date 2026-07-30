(function(){
  const roles = ['cliente','asesor','disenador','admin'];
  const statusOptions = ['recibido','cotizado','datos_recibidos','diseno','revision','aprobado','entregado'];
  const paymentStatuses = ['pendiente','confirmado','rechazado'];
  const attendanceOptions = ['pendiente','confirmado','rechazado'];

  class DashboardView{
    constructor(layout){ this.v=layout; }

    shell(user, content, active='resumen'){
      const mode = window.InvitaArteApp ? window.InvitaArteApp.api.mode() : 'demo';
      return `<section class="dashboard"><aside class="sidebar"><div class="user-box"><img src="assets/logo-invitaarte-studio.png" alt="Invita Arte Studio" class="sidebar-logo"><span class="role-pill">${this.v.escape(user.role)}</span><h3>${this.v.escape(user.name)}</h3><p>${this.v.escape(user.email)}</p><p class="muted-on-dark">${mode === 'real' ? 'Supabase conectado' : 'Demo local'}</p></div><nav class="side-nav">${this.navFor(user.role,active)}<a href="#inicio">Ver sitio público</a><button data-logout>Cerrar sesión</button></nav></aside><main class="dash-content"><div class="ops-banner"><strong>Invita Arte Studio · Panel operativo</strong><span>Solicitudes, cotizaciones, estados, versiones, pagos, RSVP y métricas.</span></div>${content}</main></section>`;
    }

    navFor(role, active){
      const common=[['resumen','Resumen']];
      const cliente=[...common,['mis-pedidos','Mis pedidos'],['nuevo','Nueva solicitud'],['mis-versiones','Mis versiones'],['mis-pagos','Mis pagos'],['mis-rsvp','Mis invitados']];
      const asesor=[...common,['pedidos','Solicitudes'],['pagos','Pagos'],['rsvp','RSVP'],['metricas','Métricas']];
      const disenador=[...common,['diseno','En diseño'],['versiones','Versiones'],['pedidos','Pedidos'],['metricas','Métricas']];
      const admin=[...common,['pedidos','Pedidos CRUD'],['plantillas','Plantillas CRUD'],['usuarios','Usuarios y roles'],['versiones','Versiones'],['pagos','Pagos'],['rsvp','RSVP'],['metricas','Dashboard'],['supabase','Supabase']];
      const list = role==='admin'?admin:(role==='disenador'?disenador:(role==='asesor'?asesor:cliente));
      return list.map(i=>`<button data-panel-tab="${i[0]}" class="${active===i[0]?'active':''}">${i[1]}</button>`).join('');
    }

    dashboard(user, data, tab='resumen'){
      const orders=data.orders||[];
      let content='';
      if(tab==='resumen') content=this.summary(user,data);
      if(tab==='mis-pedidos') content=this.ordersTable(user,orders.filter(o=>o.userId===user.id || user.role!=='cliente'), 'Mis pedidos');
      if(tab==='nuevo') content=this.clientNewOrder();
      if(tab==='mis-versiones') content=this.versionsTable(user, orders.filter(o=>(o.versions||[]).length), true);
      if(tab==='mis-pagos') content=this.paymentsTable(user, orders);
      if(tab==='mis-rsvp') content=this.rsvpTable(user, orders);
      if(tab==='pedidos') content=this.ordersTable(user,orders,'Pedidos digitales');
      if(tab==='diseno') content=this.ordersTable(user,orders.filter(o=>['datos_recibidos','diseno','revision'].includes(o.status)),'Pedidos en diseño');
      if(tab==='versiones') content=this.versionsTable(user, orders);
      if(tab==='pagos') content=this.paymentsTable(user, orders);
      if(tab==='rsvp') content=this.rsvpTable(user, orders);
      if(tab==='plantillas') content=this.templatesTable(user,data.templates||[]);
      if(tab==='usuarios') content=this.usersTable(user,data.profiles||[]);
      if(tab==='metricas') content=this.metrics(data.metrics||{}, data.metricEvents||[], orders);
      if(tab==='supabase') content=this.supabaseGuide();
      return this.shell(user, content || this.summary(user,data), tab);
    }

    summary(user,data){
      const orders=data.orders||[];
      const metrics=data.metrics||{};
      const latest=orders.slice(0,6);
      const cta = user.role==='cliente' ? '<a class="btn primary" href="#cotizador">Solicitar nueva invitación</a>' : '<button class="btn primary" data-panel-tab="pedidos">Gestionar pedidos</button>';
      return `<div class="section-head"><div><span class="eyebrow">Panel ${this.v.escape(user.role)}</span><h1 class="h2">Bienvenida/o, ${this.v.escape(user.name)}</h1><p class="lead">Control oficial de Invitaciones digitales: pedidos, clientes, versiones, pagos, RSVP y métricas.</p></div>${cta}</div>${this.metricCards(metrics,orders)}${this.pipeline(orders)}<div class="grid cols-2 mt-3"><article class="card"><h3>Flujo de estados</h3>${this.v.progress('diseno')}<p class="muted mt-2">Cada pedido avanza con trazabilidad hasta la entrega digital.</p></article><article class="card"><h3>Responsabilidad del rol</h3><p>${this.roleDescription(user.role)}</p></article></div><div class="card mt-3"><div class="section-head"><div><h3>Últimos movimientos</h3><p class="muted">Pedidos recientes disponibles para este rol.</p></div></div>${this.smallOrders(latest,user)}</div>`;
    }

    metricCards(metrics,orders){
      const paid = Number(metrics.paidTotal || 0);
      const total = orders.reduce((s,o)=>s+Number(o.totalAmount||0),0);
      const pending = orders.filter(o=>['recibido','cotizado','datos_recibidos'].includes(o.status)).length;
      return `<div class="metric-grid"><div class="metric"><span>Pedidos</span><strong>${orders.length}</strong></div><div class="metric"><span>Pendientes</span><strong>${pending}</strong></div><div class="metric"><span>En revisión</span><strong>${orders.filter(o=>o.status==='revision').length}</strong></div><div class="metric"><span>Entregados</span><strong>${orders.filter(o=>o.status==='entregado').length}</strong></div><div class="metric"><span>Venta estimada</span><strong>${this.v.money(total)}</strong></div><div class="metric"><span>Pagado</span><strong>${this.v.money(paid)}</strong></div><div class="metric"><span>RSVP</span><strong>${metrics.rsvpTotal||0}</strong></div><div class="metric"><span>Plantillas</span><strong>${(window.InvitaArteApp && window.InvitaArteApp.panelData.templates || []).length}</strong></div></div>`;
    }

    pipeline(orders){
      const labels = window.InvitaArteConfig.statusLabels || {};
      const max = Math.max(1,...statusOptions.map(s=>orders.filter(o=>o.status===s).length));
      return `<div class="card mt-3"><div class="section-head"><div><h3>Pipeline operativo</h3><p class="muted">Distribución actual de pedidos por estado.</p></div></div><div class="pipeline-grid">${statusOptions.map(s=>{const n=orders.filter(o=>o.status===s).length; const pct=Math.max(8,Math.round((n/max)*100)); return `<div class="pipeline-item"><div><span>${this.v.escape(labels[s]||s)}</span><strong>${n}</strong></div><div class="pipeline-bar"><i style="width:${pct}%"></i></div></div>`}).join('')}</div></div>`;
    }

    roleDescription(role){
      return {cliente:'Crea solicitudes, consulta estados, revisa versiones, registra pagos y aprueba la invitación final.',asesor:'Valida solicitudes, completa datos, registra pagos y organiza el paso hacia diseño.',disenador:'Gestiona versiones, enlaces de vista previa, correcciones y revisión del cliente.',admin:'Administra usuarios, roles, plantillas, pedidos, pagos, RSVP, métricas y permisos.'}[role] || 'Usuario del sistema.';
    }

    smallOrders(orders,user){
      if(!orders.length) return this.v.empty('Todavía no hay pedidos registrados.');
      return `<div class="table-wrap"><table class="table compact"><thead><tr><th>Código</th><th>Cliente</th><th>Evento</th><th>Estado</th><th>Total</th><th></th></tr></thead><tbody>${orders.map(o=>`<tr><td><b>${this.v.escape(o.trackingCode)}</b></td><td>${this.v.escape(o.clientName)}</td><td>${this.v.escape(o.eventTitle)}</td><td>${this.v.statusBadge(o.status)}</td><td>${this.v.money(o.totalAmount)}</td><td><button class="btn small ghost" data-view-order="${this.v.escape(o.id)}">Ver</button></td></tr>`).join('')}</tbody></table></div>`;
    }

    toolbar(tableId, placeholder='Buscar...'){
      return `<div class="ops-toolbar"><input data-filter-table="${tableId}" placeholder="${this.v.escape(placeholder)}"><select data-filter-status="${tableId}"><option value="todos">Todos los estados</option>${statusOptions.map(s=>`<option value="${s}">${this.v.escape((window.InvitaArteConfig.statusLabels||{})[s]||s)}</option>`).join('')}</select><button class="btn ghost" data-export-table="${tableId}" data-export-name="${tableId}">Exportar CSV</button></div>`;
    }

    ordersTable(user,orders,title){
      const canCreate = user.role==='admin' || user.role==='asesor';
      const id='ordersOps';
      return `<div class="section-head"><div><span class="eyebrow">Operación</span><h1 class="h2">${this.v.escape(title)}</h1><p class="lead">Tabla de solicitudes con trazabilidad, estados, pagos y acciones por rol.</p></div><div class="action-row">${canCreate?'<button class="btn primary" data-new-order>Nuevo pedido</button>':''}<a class="btn ghost" href="#cotizador">Cotizador público</a></div></div>${this.toolbar(id,'Buscar por código, cliente, evento o correo...')}${orders.length?`<div class="table-wrap"><table class="table" id="${id}"><thead><tr><th>Código</th><th>Cliente</th><th>Evento</th><th>Plantilla/paquete</th><th>Estado</th><th>Pagos</th><th>Total</th><th>Acciones</th></tr></thead><tbody>${orders.map(o=>this.orderRow(user,o)).join('')}</tbody></table></div>`:this.v.empty('No hay pedidos para mostrar.')}`;
    }

    orderRow(user,o){
      const paid=(o.payments||[]).reduce((s,p)=>s+Number(p.amount||0),0);
      return `<tr data-search="${this.v.escape([o.trackingCode,o.clientName,o.email,o.phone,o.eventTitle,o.eventType,o.status].join(' ').toLowerCase())}" data-status="${this.v.escape(o.status)}"><td><b>${this.v.escape(o.trackingCode)}</b><br><small>${this.v.date(o.createdAt)}</small></td><td>${this.v.escape(o.clientName)}<br><small>${this.v.escape(o.email)} · ${this.v.escape(o.phone)}</small></td><td>${this.v.escape(o.eventTitle)}<br><small>${this.v.escape(o.eventType)} · ${this.v.escape(o.eventDate||'sin fecha')} ${this.v.escape(o.eventTime||'')}</small></td><td>${this.v.escape(o.templateTitle)}<br><small>${this.v.escape(o.package)}</small></td><td>${this.v.statusBadge(o.status)}</td><td>${this.v.money(paid)}<br><small>${(o.payments||[]).length} registro(s)</small></td><td><b>${this.v.money(o.totalAmount)}</b></td><td>${this.orderActions(user,o)}</td></tr>`;
    }

    orderActions(user,o){
      const flow=window.InvitaArteConfig.statusFlow || [];
      const idx=flow.indexOf(o.status);
      const next=flow[idx+1];
      let buttons=`<button class="btn small ghost" data-view-order="${this.v.escape(o.id)}">Ver</button>`;
      if(user.role !== 'cliente') buttons += `<button class="btn small soft" data-edit-order="${this.v.escape(o.id)}">Editar</button>`;
      if(user.role !== 'cliente' && next) buttons += `<button class="btn small primary" data-next-status="${this.v.escape(o.id)}" data-status="${this.v.escape(next)}">${this.v.escape((window.InvitaArteConfig.statusLabels||{})[next]||next)}</button>`;
      if(['disenador','admin'].includes(user.role)) buttons += `<button class="btn small soft" data-add-version="${this.v.escape(o.id)}">Versión</button>`;
      if(['asesor','admin'].includes(user.role) || user.role==='cliente') buttons += `<button class="btn small soft" data-add-payment="${this.v.escape(o.id)}">Pago</button>`;
      if(user.role === 'cliente' && o.status === 'revision') buttons += `<button class="btn small primary" data-approve-order="${this.v.escape(o.id)}">Aprobar</button>`;
      if(user.role === 'admin') buttons += `<button class="btn small danger" data-delete-order="${this.v.escape(o.id)}">Eliminar</button>`;
      return `<div class="action-row row-actions">${buttons}</div>`;
    }

    clientNewOrder(){
      return `<span class="eyebrow">Nueva solicitud</span><h1 class="h2">Crear pedido desde el cotizador</h1><p class="lead">El cliente crea su solicitud desde el cotizador para que el precio, paquete y datos del evento queden estructurados.</p><a class="btn primary" href="#cotizador">Abrir cotizador</a>`;
    }

    versionsTable(user,orders,own=false){
      const rows=[]; orders.forEach(o=>(o.versions||[]).forEach(v=>rows.push({order:o,...v})));
      const id='versionsOps';
      return `<div class="section-head"><div><span class="eyebrow">Control de versiones</span><h1 class="h2">Versiones de invitaciones</h1><p class="lead">Historial de propuestas, enlaces de vista previa y aprobación.</p></div><div class="action-row">${['disenador','admin'].includes(user.role)?'<button class="btn primary" data-version-from-table>Agregar versión</button>':''}<button class="btn ghost" data-export-table="${id}" data-export-name="versiones">Exportar CSV</button></div></div>${rows.length?`<div class="table-wrap"><table class="table" id="${id}"><thead><tr><th>Pedido</th><th>Cliente/evento</th><th>Versión</th><th>Vista previa</th><th>Estado</th><th>Notas</th><th>Acciones</th></tr></thead><tbody>${rows.map(r=>`<tr data-search="${this.v.escape([r.order.trackingCode,r.order.clientName,r.order.eventTitle,r.status,r.notes].join(' ').toLowerCase())}"><td><b>${this.v.escape(r.order.trackingCode)}</b></td><td>${this.v.escape(r.order.clientName)}<br><small>${this.v.escape(r.order.eventTitle)}</small></td><td>V${this.v.escape(r.versionNumber)}</td><td><a href="${this.v.escape(r.previewUrl)}" target="_blank" rel="noopener">Abrir enlace</a></td><td><span class="tag">${this.v.escape(r.status)}</span></td><td>${this.v.escape(r.notes)}</td><td><div class="action-row">${['disenador','admin'].includes(user.role)?`<button class="btn small soft" data-edit-version="${this.v.escape(r.id)}">Editar</button><button class="btn small danger" data-delete-version="${this.v.escape(r.id)}">Eliminar</button>`:''}${user.role==='cliente'&&r.order.status==='revision'?`<button class="btn small primary" data-approve-order="${this.v.escape(r.order.id)}">Aprobar</button>`:''}</div></td></tr>`).join('')}</tbody></table></div>`:this.v.empty(own?'Todavía no tienes versiones cargadas.':'No hay versiones registradas.')}`;
    }

    paymentsTable(user,orders){
      const rows=[]; orders.forEach(o=>(o.payments||[]).forEach(p=>rows.push({order:o,...p})));
      const id='paymentsOps';
      return `<div class="section-head"><div><span class="eyebrow">Finanzas</span><h1 class="h2">Pagos y comprobantes</h1><p class="lead">Registro de QR, transferencia o comprobante digital por pedido.</p></div><div class="action-row"><button class="btn primary" data-payment-from-table>Registrar pago</button><button class="btn ghost" data-export-table="${id}" data-export-name="pagos">Exportar CSV</button></div></div>${rows.length?`<div class="table-wrap"><table class="table" id="${id}"><thead><tr><th>Pedido</th><th>Cliente</th><th>Monto</th><th>Método</th><th>Comprobante</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${rows.map(p=>`<tr data-search="${this.v.escape([p.order.trackingCode,p.order.clientName,p.method,p.status].join(' ').toLowerCase())}"><td><b>${this.v.escape(p.order.trackingCode)}</b></td><td>${this.v.escape(p.order.clientName)}<br><small>${this.v.escape(p.order.eventTitle)}</small></td><td><b>${this.v.money(p.amount)}</b></td><td>${this.v.escape(p.method)}</td><td>${p.proofUrl?`<a href="${this.v.escape(p.proofUrl)}" target="_blank" rel="noopener">Ver</a>`:'Sin enlace'}</td><td><span class="tag">${this.v.escape(p.status)}</span></td><td><div class="action-row">${user.role!=='cliente'?`<button class="btn small soft" data-edit-payment="${this.v.escape(p.id)}">Editar</button><button class="btn small danger" data-delete-payment="${this.v.escape(p.id)}">Eliminar</button>`:`<button class="btn small soft" data-edit-payment="${this.v.escape(p.id)}">Actualizar</button>`}</div></td></tr>`).join('')}</tbody></table></div>`:this.v.empty('No hay pagos registrados todavía.')}`;
    }

    rsvpTable(user,orders){
      const rows=[]; orders.forEach(o=>(o.rsvps||[]).forEach(r=>rows.push({order:o,...r})));
      const id='rsvpOps';
      return `<div class="section-head"><div><span class="eyebrow">Confirmaciones</span><h1 class="h2">RSVP / Invitados</h1><p class="lead">Control de confirmaciones para invitaciones interactivas.</p></div><div class="action-row"><button class="btn primary" data-rsvp-from-table>Agregar invitado</button><button class="btn ghost" data-export-table="${id}" data-export-name="rsvp">Exportar CSV</button></div></div>${rows.length?`<div class="table-wrap"><table class="table" id="${id}"><thead><tr><th>Pedido</th><th>Invitado</th><th>Teléfono</th><th>Asistencia</th><th>Acompañantes</th><th>Notas</th><th>Acciones</th></tr></thead><tbody>${rows.map(r=>`<tr data-search="${this.v.escape([r.order.trackingCode,r.order.eventTitle,r.guestName,r.attendance].join(' ').toLowerCase())}"><td><b>${this.v.escape(r.order.trackingCode)}</b><br><small>${this.v.escape(r.order.eventTitle)}</small></td><td>${this.v.escape(r.guestName)}</td><td>${this.v.escape(r.guestPhone)}</td><td><span class="tag">${this.v.escape(r.attendance)}</span></td><td>${this.v.escape(r.companions)}</td><td>${this.v.escape(r.notes)}</td><td><div class="action-row"><button class="btn small soft" data-edit-rsvp="${this.v.escape(r.id)}">Editar</button><button class="btn small danger" data-delete-rsvp="${this.v.escape(r.id)}">Eliminar</button></div></td></tr>`).join('')}</tbody></table></div>`:this.v.empty('No hay confirmaciones todavía.')}`;
    }

    templatesTable(user,templates){
      const id='templatesOps';
      return `<div class="section-head"><div><span class="eyebrow">Catálogo</span><h1 class="h2">Plantillas CRUD</h1><p class="lead">Crear, editar y desactivar plantillas digitales disponibles para clientes.</p></div><div class="action-row"><button class="btn primary" data-new-template>Nueva plantilla</button><button class="btn ghost" data-export-table="${id}" data-export-name="plantillas">Exportar CSV</button></div></div>${templates.length?`<div class="table-wrap"><table class="table" id="${id}"><thead><tr><th>Plantilla</th><th>Categoría</th><th>Estilo</th><th>Paquete</th><th>Precio</th><th>Funciones</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${templates.map(t=>`<tr data-search="${this.v.escape([t.title,t.category,t.style,t.package,t.description].join(' ').toLowerCase())}"><td><b>${this.v.escape(t.title)}</b><br><small>${this.v.escape(t.description)}</small></td><td>${this.v.escape(t.category)}</td><td>${this.v.escape(t.style)}</td><td>${this.v.escape(t.package)}</td><td><b>${this.v.money(t.basePrice)}</b></td><td>${(t.features||[]).map(f=>`<span class="tag">${this.v.escape(f)}</span>`).join(' ')}</td><td>${t.isActive!==false?'<span class="tag">Activo</span>':'<span class="tag">Inactivo</span>'}</td><td><div class="action-row"><button class="btn small soft" data-edit-template="${this.v.escape(t.id)}">Editar</button><button class="btn small danger" data-delete-template="${this.v.escape(t.id)}">Desactivar</button></div></td></tr>`).join('')}</tbody></table></div>`:this.v.empty('No hay plantillas registradas.')}`;
    }

    usersTable(user,profiles){
      const id='usersOps';
      return `<div class="section-head"><div><span class="eyebrow">Accesos</span><h1 class="h2">Usuarios y roles</h1><p class="lead">Control de perfiles internos. Las cuentas nuevas entran como cliente.</p></div><button class="btn ghost" data-export-table="${id}" data-export-name="usuarios">Exportar CSV</button></div>${profiles.length?`<div class="table-wrap"><table class="table" id="${id}"><thead><tr><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Rol</th><th>Registro</th><th>Acciones</th></tr></thead><tbody>${profiles.map(p=>`<tr data-search="${this.v.escape([p.name,p.email,p.phone,p.role].join(' ').toLowerCase())}"><td><b>${this.v.escape(p.name)}</b></td><td>${this.v.escape(p.email)}</td><td>${this.v.escape(p.phone)}</td><td><span class="role-pill light">${this.v.escape(p.role)}</span></td><td>${this.v.date(p.createdAt)}</td><td><button class="btn small soft" data-edit-profile="${this.v.escape(p.id)}">Editar rol</button></td></tr>`).join('')}</tbody></table></div>`:this.v.empty('No se pudieron cargar perfiles. Revisa el rol del administrador.')}`;
    }

    metrics(metrics,events,orders){
      const status=metrics.byStatus||{};
      return `<span class="eyebrow">Dashboard</span><h1 class="h2">Métricas de operación</h1>${this.metricCards(metrics,orders)}<div class="grid cols-2 mt-3"><article class="card"><h3>Estados de pedidos</h3><div class="chart-list">${statusOptions.map(s=>`<div><span>${this.v.escape((window.InvitaArteConfig.statusLabels||{})[s]||s)}</span><strong>${status[s]||0}</strong></div>`).join('')}</div></article><article class="card"><h3>Eventos recientes</h3>${events.length?`<div class="timeline">${events.slice(0,12).map(e=>`<div class="timeline-item"><span class="timeline-dot"></span><div><b>${this.v.escape(e.event)}</b><p class="muted">${this.v.date(e.createdAt)} ${this.v.escape(JSON.stringify(e.payload||{}))}</p></div></div>`).join('')}</div>`:this.v.empty('Todavía no hay eventos medidos.')}</article></div>`;
    }

    supabaseGuide(){
      return `<span class="eyebrow">Base de datos</span><h1 class="h2">Supabase operativo</h1><div class="grid cols-2"><article class="card"><h3>Tablas del sistema</h3><ul class="checklist"><li><span class="code">profiles</span>: usuarios y roles.</li><li><span class="code">templates</span>: catálogo digital.</li><li><span class="code">orders</span>: pedidos y estados.</li><li><span class="code">order_versions</span>: control de versiones.</li><li><span class="code">payments</span>: pagos y comprobantes.</li><li><span class="code">rsvps</span>: confirmaciones.</li><li><span class="code">metrics_events</span>: métricas.</li></ul></article><article class="card"><h3>Archivos SQL</h3><ul class="checklist"><li><span class="code">sql/supabase_schema.sql</span></li><li><span class="code">sql/actualizacion_crud_roles.sql</span></li><li><span class="code">sql/datos_demo_completos.sql</span></li></ul></article></div>`;
    }

    orderDetail(o){
      return `<h2>${this.v.escape(o.eventTitle)}</h2><p>${this.v.statusBadge(o.status)} <b>${this.v.escape(o.trackingCode)}</b></p>${this.v.progress(o.status)}<div class="grid cols-2 mt-3"><div><h3>Cliente</h3><p>${this.v.escape(o.clientName)}<br>${this.v.escape(o.email)}<br>${this.v.escape(o.phone)}</p></div><div><h3>Evento</h3><p>${this.v.escape(o.eventType)}<br>${this.v.escape(o.eventDate||'sin fecha')} · ${this.v.escape(o.eventTime||'sin hora')}<br>${this.v.escape(o.location||'sin ubicación')}</p></div></div><div class="grid cols-2"><div><h3>Pedido</h3><p>Plantilla: <b>${this.v.escape(o.templateTitle)}</b><br>Paquete: <b>${this.v.escape(o.package)}</b><br>Total: <b>${this.v.money(o.totalAmount)}</b></p></div><div><h3>Personalización</h3><p>${this.v.escape(o.notes||'Sin notas')}</p></div></div><h3>Versiones</h3>${(o.versions||[]).length?`<div class="timeline">${o.versions.map(v=>`<div class="timeline-item"><span class="timeline-dot"></span><div><b>Versión ${this.v.escape(v.versionNumber)} · ${this.v.escape(v.status)}</b><p class="muted">${this.v.escape(v.notes)}</p><a href="${this.v.escape(v.previewUrl)}" target="_blank" rel="noopener">Abrir vista previa</a></div></div>`).join('')}</div>`:this.v.empty('Sin versiones.')}<h3>Pagos</h3>${(o.payments||[]).length?`<div class="timeline">${o.payments.map(p=>`<div class="timeline-item"><span class="timeline-dot"></span><div><b>${this.v.money(p.amount)} · ${this.v.escape(p.status)}</b><p class="muted">${this.v.escape(p.method)} ${p.proofUrl?`· ${this.v.escape(p.proofUrl)}`:''}</p></div></div>`).join('')}</div>`:this.v.empty('Sin pagos.')}<h3>RSVP</h3>${(o.rsvps||[]).length?`<div class="timeline">${o.rsvps.slice(0,8).map(r=>`<div class="timeline-item"><span class="timeline-dot"></span><div><b>${this.v.escape(r.guestName)} · ${this.v.escape(r.attendance)}</b><p class="muted">Acompañantes: ${this.v.escape(r.companions)} ${this.v.escape(r.notes||'')}</p></div></div>`).join('')}</div>`:this.v.empty('Sin confirmaciones.')}`;
    }

    orderForm(order={}, templates=[], isAdmin=false){
      const tplOptions = [['','Sin plantilla'], ...templates.map(t=>[t.id,t.title])];
      return `<h2>${order.id?'Editar pedido':'Nuevo pedido'}</h2><form id="orderCrudForm" data-order-id="${this.v.escape(order.id||'')}" class="form-grid"><div class="field"><label>Cliente</label><input name="clientName" required value="${this.v.escape(order.clientName||'')}"></div><div class="field"><label>Correo</label><input type="email" name="email" required value="${this.v.escape(order.email||'')}"></div><div class="field"><label>Teléfono</label><input name="phone" value="${this.v.escape(order.phone||'')}"></div>${this.v.select('eventType','Tipo de evento',['15 años','Boda','Cumpleaños','Baby shower','Graduación','Bautizo','Empresarial','Aniversario','Otro'],order.eventType||'15 años')}${this.v.select('templateId','Plantilla',tplOptions,order.templateId||'')}${this.v.select('package','Paquete',[['basico','Básico'],['estandar','Estándar'],['premium','Premium']],order.package||'basico')}<div class="field"><label>Título del evento</label><input name="eventTitle" value="${this.v.escape(order.eventTitle||'')}"></div><div class="field"><label>Nombre principal</label><input name="honorees" value="${this.v.escape(order.honorees||'')}"></div><div class="field"><label>Fecha</label><input type="date" name="eventDate" value="${this.v.escape(order.eventDate||'')}"></div><div class="field"><label>Hora</label><input type="time" name="eventTime" value="${this.v.escape(order.eventTime||'')}"></div><div class="field full"><label>Ubicación</label><input name="location" value="${this.v.escape(order.location||'')}"></div><div class="field"><label>Invitados</label><input type="number" name="guests" value="${this.v.escape(order.guests||0)}"></div><div class="field"><label>Total Bs</label><input type="number" name="totalAmount" value="${this.v.escape(order.totalAmount||0)}"></div>${this.v.select('status','Estado',statusOptions,order.status||'recibido')}<div class="field"><label><input type="checkbox" name="urgent" ${order.urgent?'checked':''}> Urgente</label></div><div class="field full"><label>Notas</label><textarea name="notes">${this.v.escape(order.notes||'')}</textarea></div><button class="btn primary" type="submit">Guardar pedido</button></form>`;
    }

    templateForm(t={}){
      return `<h2>${t.id?'Editar plantilla':'Nueva plantilla'}</h2><form id="templateCrudForm" data-template-id="${this.v.escape(t.id||'')}" class="form-grid"><div class="field"><label>Título</label><input name="title" required value="${this.v.escape(t.title||'')}"></div><div class="field"><label>Categoría</label><input name="category" required value="${this.v.escape(t.category||'')}"></div><div class="field"><label>Estilo</label><input name="style" required value="${this.v.escape(t.style||'')}"></div>${this.v.select('package','Paquete',[['basico','Básico'],['estandar','Estándar'],['premium','Premium']],t.package||'basico')}<div class="field"><label>Precio base Bs</label><input type="number" name="basePrice" required value="${this.v.escape(t.basePrice||0)}"></div><div class="field"><label>Color principal</label><input name="accent" value="${this.v.escape(t.accent||'#7C3AED')}"></div><div class="field full"><label>Descripción</label><textarea name="description">${this.v.escape(t.description||'')}</textarea></div><div class="field full"><label>Funciones separadas por coma</label><input name="features" value="${this.v.escape((t.features||[]).join(', '))}"></div><div class="field full"><label>URL de vista previa</label><input name="previewUrl" value="${this.v.escape(t.previewUrl||'')}"></div><div class="field"><label><input type="checkbox" name="isActive" ${t.isActive!==false?'checked':''}> Activa</label></div><button class="btn primary" type="submit">Guardar plantilla</button></form>`;
    }

    profileForm(p){ return `<h2>Editar usuario</h2><form id="profileCrudForm" data-profile-id="${this.v.escape(p.id)}" class="grid"><div class="field"><label>Nombre</label><input name="name" value="${this.v.escape(p.name)}"></div><div class="field"><label>Teléfono</label><input name="phone" value="${this.v.escape(p.phone)}"></div>${this.v.select('role','Rol',roles,p.role)}<button class="btn primary" type="submit">Guardar usuario</button></form>`; }
    versionForm(orderId, v={}){ return `<h2>${v.id?'Editar versión':'Cargar versión'}</h2><form id="versionForm" data-version-id="${this.v.escape(v.id||'')}" data-order-id="${this.v.escape(orderId||v.orderId||'')}" class="grid"><div class="field"><label>Pedido</label>${this.orderSelect(orderId||v.orderId,'orderId')}</div><div class="field"><label>Enlace de vista previa</label><input name="previewUrl" required value="${this.v.escape(v.previewUrl||'')}" placeholder="https://..."></div>${this.v.select('status','Estado',['enviada','corregida','aprobada'],v.status||'enviada')}<div class="field"><label>Notas</label><textarea name="notes">${this.v.escape(v.notes||'')}</textarea></div><button class="btn primary" type="submit">Guardar versión</button></form>`; }
    paymentForm(orderId,p={}){ return `<h2>${p.id?'Editar pago':'Registrar pago'}</h2><form id="paymentForm" data-payment-id="${this.v.escape(p.id||'')}" data-order-id="${this.v.escape(orderId||p.orderId||'')}" class="grid"><div class="field"><label>Pedido</label>${this.orderSelect(orderId||p.orderId,'orderId')}</div><div class="field"><label>Monto</label><input type="number" name="amount" required value="${this.v.escape(p.amount||'')}"></div>${this.v.select('method','Método',['QR/Transferencia','QR','Transferencia','Efectivo','Otro'],p.method||'QR/Transferencia')}${this.v.select('status','Estado',paymentStatuses,p.status||'pendiente')}<div class="field"><label>URL comprobante</label><input name="proofUrl" value="${this.v.escape(p.proofUrl||'')}" placeholder="https://..."></div><button class="btn primary" type="submit">Guardar pago</button></form>`; }
    rsvpForm(orderId,r={}){ return `<h2>${r.id?'Editar RSVP':'Agregar invitado'}</h2><form id="rsvpForm" data-rsvp-id="${this.v.escape(r.id||'')}" data-order-id="${this.v.escape(orderId||r.orderId||'')}" class="grid"><div class="field"><label>Pedido</label>${this.orderSelect(orderId||r.orderId,'orderId')}</div><div class="field"><label>Nombre del invitado</label><input name="guestName" required value="${this.v.escape(r.guestName||'')}"></div><div class="field"><label>Teléfono</label><input name="guestPhone" value="${this.v.escape(r.guestPhone||'')}"></div>${this.v.select('attendance','Asistencia',attendanceOptions,r.attendance||'confirmado')}<div class="field"><label>Acompañantes</label><input type="number" name="companions" value="${this.v.escape(r.companions||0)}"></div><div class="field"><label>Notas</label><textarea name="notes">${this.v.escape(r.notes||'')}</textarea></div><button class="btn primary" type="submit">Guardar RSVP</button></form>`; }

    orderSelect(value,name='orderId'){
      const app=window.InvitaArteApp;
      const orders=(app && app.panelData && app.panelData.orders) || [];
      return `<select name="${name}">${orders.map(o=>`<option value="${this.v.escape(o.id)}" ${o.id===value?'selected':''}>${this.v.escape(o.trackingCode)} · ${this.v.escape(o.eventTitle)}</option>`).join('')}</select>`;
    }
  }

  window.DashboardView = DashboardView;
})();
