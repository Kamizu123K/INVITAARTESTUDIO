(function(){
  const cfg = () => window.InvitaArteConfig || {};
  const seed = () => window.InvitaArteSeed || { templates:[], demoUsers:[], demoOrders:[], packages:[] };

  function isConfigured(){
    const c = cfg();
    return Boolean(c.legacyDirectSupabase === true && c.supabaseUrl && c.supabaseAnonKey && window.supabase && /^https:\/\/.+\.supabase\.co/i.test(c.supabaseUrl));
  }
  function makeTrackingCode(){
    const n = Math.floor(100000 + Math.random()*900000);
    return (cfg().trackingPrefix || 'IA') + '-' + new Date().getFullYear() + '-' + n;
  }
  function toArray(value){
    if(Array.isArray(value)) return value;
    if(value == null || value === '') return [];
    return String(value).split(',').map(x=>x.trim()).filter(Boolean);
  }
  function normalizeBool(value){ return value === true || value === 'on' || value === 'true' || value === 1 || value === '1'; }

  function normalizePhone(value){ return String(value || '').replace(/\D/g,'').slice(0,15); }
  function normalizeKey(value){ return String(value || '').trim().toLowerCase().replace(/\s+/g,' '); }
  function phoneKey(value){ const p=normalizePhone(value); return p.length>8?p.slice(-8):p; }
  function validateOrderInput(data,user){
    const name=String(data.clientName || (user && user.name) || '').trim();
    const email=String(data.email || (user && user.email) || '').trim();
    const phone=normalizePhone(data.phone || (user && user.phone) || '');
    const errors=[];
    if(name.length < 3) errors.push('El nombre del cliente debe tener al menos 3 caracteres.');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email)) errors.push('Ingresa un correo electrónico válido.');
    if(phone && phone.length < 8) errors.push('El teléfono debe tener al menos 8 dígitos.');
    if(!String(data.eventType || '').trim()) errors.push('Selecciona el tipo de evento.');
    if(!String(data.eventTitle || '').trim()) errors.push('Ingresa el título del evento.');
    if(errors.length) throw new Error(errors.join(' '));
  }
  function snakeOrderFields(input){
    const out = {};
    const map = {
      clientName:'client_name', email:'email', phone:'phone', eventType:'event_type', package:'package_type', packageType:'package_type', templateId:'template_id',
      eventTitle:'event_title', honorees:'honorees', eventDate:'event_date', eventTime:'event_time', location:'location', mapUrl:'map_url', musicUrl:'music_url',
      colors:'colors', notes:'notes', guests:'guests', urgent:'urgent', status:'status', totalAmount:'total_amount', trackingCode:'tracking_code', userId:'user_id'
    };
    Object.entries(map).forEach(([k,v])=>{ if(Object.prototype.hasOwnProperty.call(input,k)) out[v] = input[k] === '' ? null : input[k]; });
    if(Object.prototype.hasOwnProperty.call(out,'guests')) out.guests = Number(out.guests || 0);
    if(Object.prototype.hasOwnProperty.call(out,'urgent')) out.urgent = normalizeBool(out.urgent);
    out.updated_at = new Date().toISOString();
    return out;
  }
  function templatePayload(input){
    return {
      title: input.title,
      category: input.category,
      style: input.style,
      package_type: input.package || input.packageType || 'basico',
      base_price: Number(input.basePrice || input.base_price || 0),
      description: input.description || '',
      features: toArray(input.features),
      accent: input.accent || '#7C3AED',
      preview_url: input.previewUrl || input.preview_url || null,
      is_active: !Object.prototype.hasOwnProperty.call(input,'isActive') ? true : normalizeBool(input.isActive),
      updated_at: new Date().toISOString()
    };
  }
  function orderFromForm(data, user){
    const t = (seed().templates || []).find(x => x.id === data.templateId) || {};
    const p = (seed().packages || []).find(x => x.id === (data.package || data.packageType)) || {};
    const base = Number(p.price || t.basePrice || 0);
    const total = base + (normalizeBool(data.urgent) ? 35 : 0) + (Number(data.guests || 0) > 150 ? 20 : 0);
    return {
      id: 'ord-' + Date.now(), trackingCode: makeTrackingCode(), userId: user ? user.id : null,
      clientName: data.clientName || (user ? user.name : ''), email: data.email || (user ? user.email : ''), phone: data.phone || '',
      eventType: data.eventType || t.category || '', templateId: data.templateId || null, templateTitle: t.title || 'Plantilla personalizada', package: data.package || data.packageType || 'basico',
      eventTitle: data.eventTitle || 'Mi evento', honorees: data.honorees || '', eventDate: data.eventDate || '', eventTime: data.eventTime || '', location: data.location || '',
      mapUrl: data.mapUrl || '', musicUrl: data.musicUrl || '', colors: data.colors || '', guests: Number(data.guests || 0), urgent: normalizeBool(data.urgent), notes: data.notes || '',
      status: data.status || 'recibido', totalAmount: Number(data.totalAmount || total), createdAt: data.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(), versions:[], payments:[], rsvps:[]
    };
  }

  class SupabaseService{
    constructor(){
      this.store = new window.LocalStoreService();
      this.integrations = window.ApiIntegrationService ? new window.ApiIntegrationService() : null;
      this.real = isConfigured();
      this.client = this.real ? window.supabase.createClient(cfg().supabaseUrl, cfg().supabaseAnonKey) : null;
    }
    mode(){ return this.real ? 'real' : (this.integrations ? 'local-api' : 'demo'); }
    async safe(fn, fallback){ try{ return await fn(); }catch(err){ console.warn(err); return fallback; } }
    async getIntegrationHealth(){ return this.integrations ? this.integrations.health() : {ok:false,offline:true,integrations:[]}; }

    async signIn(email,password){
      if(this.real){
        const { data, error } = await this.client.auth.signInWithPassword({ email, password });
        if(error) throw new Error(error.message);
        return this.getCurrentUser(data.user);
      }
      const db = this.store.read();
      const user = db.users.find(u => u.email.toLowerCase() === String(email).toLowerCase() && u.password === password);
      if(!user) throw new Error('Correo o contraseña incorrectos. En demo usa 123456.');
      db.currentUser = { id:user.id, name:user.name, email:user.email, role:user.role, phone:user.phone };
      this.store.write(db); return db.currentUser;
    }
    async signUp({name,email,password,phone}){
      if(this.real){
        const { data, error } = await this.client.auth.signUp({ email, password, options:{ data:{ full_name:name, phone } } });
        if(error) throw new Error(error.message);
        if(data.user){ await this.client.from('profiles').upsert({ id:data.user.id, full_name:name, email, phone, role:'cliente' }); }
        return this.getCurrentUser(data.user);
      }
      const db = this.store.read();
      if(db.users.some(u => u.email.toLowerCase() === String(email).toLowerCase())) throw new Error('Ese correo ya está registrado en modo demo.');
      const user = { id:'u-' + Date.now(), name, email, password, role:'cliente', phone };
      db.users.push(user); db.currentUser = { id:user.id, name:user.name, email:user.email, role:user.role, phone:user.phone };
      this.store.write(db); return db.currentUser;
    }
    async signOut(){
      if(this.real) await this.client.auth.signOut();
      const db = this.store.read(); db.currentUser = null; this.store.write(db);
    }
    async getCurrentUser(authUser){
      if(this.real){
        let user = authUser;
        if(!user){ const { data } = await this.client.auth.getUser(); user = data && data.user; }
        if(!user) return null;
        const { data:profile } = await this.client.from('profiles').select('*').eq('id', user.id).maybeSingle();
        return { id:user.id, name:(profile && profile.full_name) || user.email, email:user.email, role:(profile && profile.role) || 'cliente', phone:(profile && profile.phone) || '' };
      }
      return this.store.read().currentUser;
    }

    async listProfiles(){
      if(this.real){
        const { data, error } = await this.client.from('profiles').select('*').order('created_at', { ascending:false });
        if(error) throw new Error(error.message);
        return (data || []).map(this.mapProfile);
      }
      return this.store.read().users.map(u=>({ id:u.id, name:u.name, email:u.email, phone:u.phone, role:u.role, createdAt:u.createdAt || '' }));
    }
    async updateProfile(id, fields){
      if(this.real){
        const row = { updated_at:new Date().toISOString() };
        if(fields.name != null) row.full_name = fields.name;
        if(fields.fullName != null) row.full_name = fields.fullName;
        if(fields.phone != null) row.phone = fields.phone;
        if(fields.role != null) row.role = fields.role;
        const { data, error } = await this.client.from('profiles').update(row).eq('id', id).select('*').single();
        if(error) throw new Error(error.message);
        return this.mapProfile(data);
      }
      const db=this.store.read(); const u=db.users.find(x=>x.id===id); if(!u) throw new Error('Usuario no encontrado.');
      if(fields.name != null || fields.fullName != null) u.name = fields.name || fields.fullName;
      if(fields.phone != null) u.phone = fields.phone;
      if(fields.role != null) u.role = fields.role;
      if(db.currentUser && db.currentUser.id === id){ db.currentUser.name=u.name; db.currentUser.phone=u.phone; db.currentUser.role=u.role; }
      this.store.write(db); return { id:u.id, name:u.name, email:u.email, phone:u.phone, role:u.role };
    }

    async listTemplates(includeInactive=false){
      if(this.real){
        let query = this.client.from('templates').select('*').order('created_at', { ascending:false });
        if(!includeInactive) query = query.eq('is_active', true);
        const { data, error } = await query;
        if(error) throw new Error(error.message);
        return (data || []).map(this.mapTemplate);
      }
      return this.store.read().templates.filter(t => includeInactive || t.isActive !== false);
    }
    async createTemplate(input){
      if(this.real){
        const { data, error } = await this.client.from('templates').insert(templatePayload(input)).select('*').single();
        if(error) throw new Error(error.message);
        return this.mapTemplate(data);
      }
      const db=this.store.read(); const t={ id:'tpl-'+Date.now(), title:input.title, category:input.category, style:input.style, package:input.package || 'basico', basePrice:Number(input.basePrice||0), description:input.description||'', features:toArray(input.features), accent:input.accent||'#7C3AED', previewUrl:input.previewUrl||'', isActive:true, createdAt:new Date().toISOString() };
      db.templates.unshift(t); this.store.write(db); return t;
    }
    async updateTemplate(id,input){
      if(this.real){
        const { data, error } = await this.client.from('templates').update(templatePayload(input)).eq('id', id).select('*').single();
        if(error) throw new Error(error.message);
        return this.mapTemplate(data);
      }
      const db=this.store.read(); const t=db.templates.find(x=>x.id===id); if(!t) throw new Error('Plantilla no encontrada.');
      Object.assign(t,{ title:input.title, category:input.category, style:input.style, package:input.package || input.packageType, basePrice:Number(input.basePrice||0), description:input.description||'', features:toArray(input.features), accent:input.accent||'#7C3AED', previewUrl:input.previewUrl||'', isActive:normalizeBool(input.isActive) });
      this.store.write(db); return t;
    }
    async deleteTemplate(id){
      if(this.real){
        const { error } = await this.client.from('templates').update({ is_active:false, updated_at:new Date().toISOString() }).eq('id', id);
        if(error) throw new Error(error.message);
        return true;
      }
      const db=this.store.read(); db.templates = db.templates.filter(t=>t.id!==id); this.store.write(db); return true;
    }

    async createOrder(formData, user){
      validateOrderInput(formData,user);
      const order = orderFromForm(formData, user);
      order.clientName=String(order.clientName||'').trim();
      order.email=String(order.email||'').trim().toLowerCase();
      order.phone=normalizePhone(order.phone);
      let saved=order;
      if(this.real){
        const row = snakeOrderFields(order); row.created_at = new Date().toISOString(); row.updated_at = new Date().toISOString();
        const { data, error } = await this.client.from('orders').insert(row).select('*, templates(title)').single();
        if(error) throw new Error(error.message);
        await this.trackMetric('order_created',{orderId:data.id, package:data.package_type});
        saved=this.mapOrder(data);
      }else{
        const db=this.store.read(); db.orders.unshift(order); db.metrics.push({event:'order_created', orderId:order.id, createdAt:new Date().toISOString()}); this.store.write(db);
      }
      if(this.integrations){ saved.integrationSync=await this.integrations.syncOrder(saved); }
      return saved;
    }
    async listOrders(user){
      if(this.real){
        let query = this.client.from('orders').select('*, templates(title)').order('created_at', { ascending:false });
        if(user && user.role === 'cliente') query = query.eq('user_id', user.id);
        const { data, error } = await query;
        if(error) throw new Error(error.message);
        const orders = (data || []).map(row => this.mapOrder(row));
        await this.attachRelated(orders);
        return orders;
      }
      const db=this.store.read();
      let orders = !user ? [] : (user.role === 'cliente' ? db.orders.filter(o => o.userId === user.id) : db.orders);
      return orders.map(o => ({...o, versions:o.versions||[], payments:o.payments||[], rsvps:o.rsvps||[]}));
    }
    async findOrderByTracking(code){
      if(this.real){
        const { data, error } = await this.client.from('orders').select('*, templates(title)').eq('tracking_code', String(code).trim()).maybeSingle();
        if(error) throw new Error(error.message);
        if(data){ const order = this.mapOrder(data); await this.attachRelated([order]); return order; }
      }else{
        const db=this.store.read(); const local=db.orders.find(o => o.trackingCode.toLowerCase() === String(code).trim().toLowerCase()) || null;
        if(local) return local;
      }
      return this.integrations ? this.integrations.findOrder(code) : null;
    }
    async updateOrder(id,fields){
      if(this.real){
        const row = snakeOrderFields(fields);
        const { data, error } = await this.client.from('orders').update(row).eq('id', id).select('*, templates(title)').single();
        if(error) throw new Error(error.message);
        const order = this.mapOrder(data); await this.attachRelated([order]); return order;
      }
      const db=this.store.read(); const o=db.orders.find(x=>x.id===id); if(!o) throw new Error('Pedido no encontrado.');
      Object.assign(o, fields, { updatedAt:new Date().toISOString() }); this.store.write(db); return o;
    }
    async updateStatus(orderId,status){ return this.updateOrder(orderId,{ status }); }
    async approveOrder(orderId){ return this.updateOrder(orderId,{ status:'aprobado' }); }
    async deleteOrder(id){
      if(this.real){ const { error } = await this.client.from('orders').delete().eq('id', id); if(error) throw new Error(error.message); return true; }
      const db=this.store.read(); db.orders=db.orders.filter(o=>o.id!==id); this.store.write(db); return true;
    }

    async addVersion(orderId, version, user){
      if(this.real){
        const { data, error } = await this.client.from('order_versions').insert({ order_id:orderId, designer_id:user ? user.id : null, preview_url:version.previewUrl, notes:version.notes || '', status:version.status || 'enviada' }).select('*').single();
        if(error) throw new Error(error.message);
        await this.updateStatus(orderId,'revision');
        return this.mapVersion(data);
      }
      const db=this.store.read(); const o=db.orders.find(x=>x.id===orderId); if(!o) throw new Error('Pedido no encontrado.');
      o.versions=o.versions||[]; const v={ id:'ver-'+Date.now(), orderId, versionNumber:o.versions.length+1, status:version.status||'enviada', previewUrl:version.previewUrl, notes:version.notes||'', createdAt:new Date().toISOString() };
      o.versions.push(v); o.status='revision'; this.store.write(db); return v;
    }
    async updateVersion(id, fields){
      if(this.real){
        const row={}; if(fields.previewUrl!=null) row.preview_url=fields.previewUrl; if(fields.notes!=null) row.notes=fields.notes; if(fields.status!=null) row.status=fields.status;
        const { data,error }=await this.client.from('order_versions').update(row).eq('id',id).select('*').single(); if(error) throw new Error(error.message); return this.mapVersion(data);
      }
      const db=this.store.read(); let found=null; db.orders.forEach(o=>{ (o.versions||[]).forEach(v=>{ if(v.id===id) found=v; }); }); if(!found) throw new Error('Versión no encontrada.'); Object.assign(found,fields); this.store.write(db); return found;
    }
    async deleteVersion(id){
      if(this.real){ const { error }=await this.client.from('order_versions').delete().eq('id',id); if(error) throw new Error(error.message); return true; }
      const db=this.store.read(); db.orders.forEach(o=>{ o.versions=(o.versions||[]).filter(v=>v.id!==id); }); this.store.write(db); return true;
    }

    async createPayment(input){
      if(this.real){
        const { data,error }=await this.client.from('payments').insert({ order_id:input.orderId, amount:Number(input.amount||0), method:input.method||'QR/Transferencia', proof_url:input.proofUrl||null, status:input.status||'pendiente' }).select('*').single();
        if(error) throw new Error(error.message); return this.mapPayment(data);
      }
      const db=this.store.read(); const o=db.orders.find(x=>x.id===input.orderId); if(!o) throw new Error('Pedido no encontrado.'); o.payments=o.payments||[]; const p={ id:'pay-'+Date.now(), orderId:input.orderId, amount:Number(input.amount||0), method:input.method||'QR/Transferencia', proofUrl:input.proofUrl||'', status:input.status||'pendiente', createdAt:new Date().toISOString() }; o.payments.push(p); this.store.write(db); return p;
    }
    async updatePayment(id, fields){
      if(this.real){
        const row={}; if(fields.amount!=null) row.amount=Number(fields.amount); if(fields.method!=null) row.method=fields.method; if(fields.proofUrl!=null) row.proof_url=fields.proofUrl; if(fields.status!=null) row.status=fields.status;
        const { data,error }=await this.client.from('payments').update(row).eq('id',id).select('*').single(); if(error) throw new Error(error.message); return this.mapPayment(data);
      }
      const db=this.store.read(); let found=null; db.orders.forEach(o=>{ (o.payments||[]).forEach(p=>{ if(p.id===id) found=p; }); }); if(!found) throw new Error('Pago no encontrado.'); Object.assign(found,fields); this.store.write(db); return found;
    }
    async deletePayment(id){
      if(this.real){ const { error }=await this.client.from('payments').delete().eq('id',id); if(error) throw new Error(error.message); return true; }
      const db=this.store.read(); db.orders.forEach(o=>{ o.payments=(o.payments||[]).filter(p=>p.id!==id); }); this.store.write(db); return true;
    }

    async createRsvp(input){
      if(!String(input.guestName||'').trim()) throw new Error('El nombre del invitado es obligatorio.');
      input.guestPhone=normalizePhone(input.guestPhone);
      let saved;
      let trackingCode='';
      if(this.real){
        const { data:orderRow }=await this.client.from('orders').select('tracking_code').eq('id',input.orderId).maybeSingle();
        trackingCode=orderRow && orderRow.tracking_code || '';
        let query=this.client.from('rsvps').select('id').eq('order_id',input.orderId);
        query=input.guestPhone?query.eq('guest_phone',input.guestPhone):query.eq('guest_name',String(input.guestName).trim());
        const { data:existing }=await query.maybeSingle();
        const row={ order_id:input.orderId, guest_name:String(input.guestName).trim(), guest_phone:input.guestPhone||'', attendance:input.attendance||'confirmado', companions:Number(input.companions||0), notes:input.notes||'' };
        const request=existing?this.client.from('rsvps').update(row).eq('id',existing.id):this.client.from('rsvps').insert(row);
        const { data,error }=await request.select('*').single();
        if(error) throw new Error(error.message); saved=this.mapRsvp(data); saved.duplicateUpdated=Boolean(existing);
      }else{
        const db=this.store.read(); const o=db.orders.find(x=>x.id===input.orderId); if(!o) throw new Error('Pedido no encontrado.'); trackingCode=o.trackingCode; o.rsvps=o.rsvps||[];
        const phone=normalizePhone(input.guestPhone); const name=normalizeKey(input.guestName);
        const existing=o.rsvps.find(r=>phoneKey(phone) && phoneKey(r.guestPhone)?phoneKey(r.guestPhone)===phoneKey(phone):normalizeKey(r.guestName)===name);
        if(existing){ Object.assign(existing,{guestName:String(input.guestName).trim(),guestPhone:phone,attendance:input.attendance||'confirmado',companions:Number(input.companions||0),notes:input.notes||'',updatedAt:new Date().toISOString(),duplicateUpdated:true}); saved=existing; }
        else{ saved={ id:'rsvp-'+Date.now(), orderId:input.orderId, guestName:String(input.guestName).trim(), guestPhone:phone, attendance:input.attendance||'confirmado', companions:Number(input.companions||0), notes:input.notes||'', createdAt:new Date().toISOString(), duplicateUpdated:false }; o.rsvps.push(saved); }
        this.store.write(db);
      }
      if(this.integrations){ saved.integrationSync=await this.integrations.syncRsvp({...saved,trackingCode}); }
      return saved;
    }
    async updateRsvp(id,fields){
      if(this.real){
        const row={}; if(fields.guestName!=null) row.guest_name=fields.guestName; if(fields.guestPhone!=null) row.guest_phone=fields.guestPhone; if(fields.attendance!=null) row.attendance=fields.attendance; if(fields.companions!=null) row.companions=Number(fields.companions); if(fields.notes!=null) row.notes=fields.notes;
        const { data,error }=await this.client.from('rsvps').update(row).eq('id',id).select('*').single(); if(error) throw new Error(error.message); return this.mapRsvp(data);
      }
      const db=this.store.read(); let found=null; db.orders.forEach(o=>{ (o.rsvps||[]).forEach(r=>{ if(r.id===id) found=r; }); }); if(!found) throw new Error('RSVP no encontrado.'); Object.assign(found,fields); this.store.write(db); return found;
    }
    async deleteRsvp(id){
      if(this.real){ const { error }=await this.client.from('rsvps').delete().eq('id',id); if(error) throw new Error(error.message); return true; }
      const db=this.store.read(); db.orders.forEach(o=>{ o.rsvps=(o.rsvps||[]).filter(r=>r.id!==id); }); this.store.write(db); return true;
    }

    async trackMetric(event,payload){
      try{
        if(this.real){ await this.client.from('metrics_events').insert({ event_name:event, payload:payload||{} }); return; }
        const db=this.store.read(); db.metrics.push({event, ...(payload||{}), createdAt:new Date().toISOString()}); this.store.write(db);
      }catch(err){ console.warn('Métrica no registrada:', err.message || err); }
    }
    async listMetrics(){
      if(this.real){
        const { data,error }=await this.client.from('metrics_events').select('*').order('created_at',{ascending:false}).limit(100);
        if(error) return [];
        return (data||[]).map(m=>({ id:m.id, event:m.event_name, payload:m.payload||{}, createdAt:m.created_at }));
      }
      return this.store.read().metrics || [];
    }
    async getMetrics(){
      const orders = await this.listOrders({role:'admin'});
      const byStatus = orders.reduce((acc,o)=>{ acc[o.status]=(acc[o.status]||0)+1; return acc; },{});
      const total = orders.reduce((sum,o)=> sum + Number(o.totalAmount || 0),0);
      const rsvpTotal = orders.reduce((sum,o)=> sum + (o.rsvps||[]).length,0);
      const paymentsTotal = orders.reduce((sum,o)=> sum + (o.payments||[]).reduce((s,p)=>s+Number(p.amount||0),0),0);
      return { totalOrders:orders.length, totalSales:total, paidTotal:paymentsTotal, rsvpTotal, revision:byStatus.revision||0, delivered:byStatus.entregado||0, byStatus };
    }
    async attachRelated(orders){
      if(!this.real || !orders.length) return orders;
      const ids = orders.map(o=>o.id);
      const [versions,payments,rsvps] = await Promise.all([
        this.safe(async()=>{ const {data,error}=await this.client.from('order_versions').select('*').in('order_id',ids).order('created_at',{ascending:true}); if(error) throw error; return (data||[]).map(this.mapVersion); }, []),
        this.safe(async()=>{ const {data,error}=await this.client.from('payments').select('*').in('order_id',ids).order('created_at',{ascending:true}); if(error) throw error; return (data||[]).map(this.mapPayment); }, []),
        this.safe(async()=>{ const {data,error}=await this.client.from('rsvps').select('*').in('order_id',ids).order('created_at',{ascending:true}); if(error) throw error; return (data||[]).map(this.mapRsvp); }, [])
      ]);
      orders.forEach(o=>{ o.versions=versions.filter(v=>v.orderId===o.id); o.payments=payments.filter(p=>p.orderId===o.id); o.rsvps=rsvps.filter(r=>r.orderId===o.id); });
      return orders;
    }

    mapProfile(row){ return { id:row.id, name:row.full_name || row.name || row.email, email:row.email, phone:row.phone || '', role:row.role || 'cliente', createdAt:row.created_at || '' }; }
    mapTemplate(t){ return { id:t.id, title:t.title, category:t.category, style:t.style, package:t.package_type || t.package || 'basico', basePrice:Number(t.base_price ?? t.basePrice ?? 0), description:t.description || '', features:t.features || [], accent:t.accent || '#7C3AED', previewUrl:t.preview_url || t.previewUrl || '', isActive:t.is_active !== false, createdAt:t.created_at || '' }; }
    mapOrder(row){ return { id:row.id, trackingCode:row.tracking_code || row.trackingCode, userId:row.user_id || row.userId, clientName:row.client_name || row.clientName, email:row.email, phone:row.phone || '', eventType:row.event_type || row.eventType, templateId:row.template_id || row.templateId, templateTitle:(row.templates && row.templates.title) || row.template_title || row.templateTitle || 'Plantilla', package:row.package_type || row.package || 'basico', eventTitle:row.event_title || row.eventTitle || 'Mi evento', honorees:row.honorees || '', eventDate:row.event_date || row.eventDate || '', eventTime:row.event_time || row.eventTime || '', location:row.location || '', mapUrl:row.map_url || row.mapUrl || '', musicUrl:row.music_url || row.musicUrl || '', colors:row.colors || '', guests:row.guests || 0, urgent:row.urgent || false, notes:row.notes || '', status:row.status || 'recibido', totalAmount:Number(row.total_amount ?? row.totalAmount ?? 0), createdAt:row.created_at || row.createdAt || '', updatedAt:row.updated_at || row.updatedAt || '', versions:row.versions || [], payments:row.payments || [], rsvps:row.rsvps || [] }; }
    mapVersion(v){ return { id:v.id, orderId:v.order_id || v.orderId, designerId:v.designer_id || v.designerId, versionNumber:v.version_number || v.versionNumber || 1, previewUrl:v.preview_url || v.previewUrl || '', notes:v.notes || '', status:v.status || 'enviada', createdAt:v.created_at || v.createdAt || '' }; }
    mapPayment(p){ return { id:p.id, orderId:p.order_id || p.orderId, amount:Number(p.amount||0), method:p.method || 'QR/Transferencia', proofUrl:p.proof_url || p.proofUrl || '', status:p.status || 'pendiente', createdAt:p.created_at || p.createdAt || '' }; }
    mapRsvp(r){ return { id:r.id, orderId:r.order_id || r.orderId, guestName:r.guest_name || r.guestName, guestPhone:r.guest_phone || r.guestPhone || '', attendance:r.attendance || 'pendiente', companions:Number(r.companions||0), notes:r.notes || '', createdAt:r.created_at || r.createdAt || '' }; }
  }
  window.SupabaseService = SupabaseService;
})();
