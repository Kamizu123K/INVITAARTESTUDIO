(function(){
  const escape = (v)=>String(v ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  class LayoutView{
    constructor(){ this.app=document.getElementById('app'); this.modalRoot=document.getElementById('modalRoot'); this.toastRoot=document.getElementById('toastRoot'); }
    html(strings,...values){ return strings.map((s,i)=>s+(values[i]??'')).join(''); }
    escape(v){ return escape(v); }
    set(content){ this.app.innerHTML = content; window.scrollTo({top:0, behavior:'smooth'}); setTimeout(()=>document.dispatchEvent(new CustomEvent('invitaarte:rendered')),0); }
    toast(message,type='success'){ const el=document.createElement('div'); el.className='toast '+type; el.textContent=message; this.toastRoot.appendChild(el); setTimeout(()=>{el.remove();},4600); }
    modal(content, wide=false){
      document.body.classList.add('modal-open');
      this.modalRoot.className='modal-root open';
      this.modalRoot.innerHTML=`<div class="modal-backdrop" data-close-modal></div><section class="modal ${wide?'modal-wide':''}" role="dialog" aria-modal="true" tabindex="-1"><button class="modal-close" data-close-modal aria-label="Cerrar ventana">×</button><div class="modal-body">${content}</div></section>`;
      const dialog=this.modalRoot.querySelector('.modal');
      if(dialog) setTimeout(()=>dialog.focus(), 20);
    }
    closeModal(){ document.body.classList.remove('modal-open'); this.modalRoot.className='modal-root'; this.modalRoot.innerHTML=''; }
    bindModalClose(){
      this.modalRoot.addEventListener('click', e=>{ if(e.target.matches('[data-close-modal]')) this.closeModal(); });
      document.addEventListener('keydown', e=>{ if(e.key==='Escape' && this.modalRoot.classList.contains('open')) this.closeModal(); });
    }
    statusBadge(status){ const labels = window.InvitaArteConfig.statusLabels || {}; return `<span class="status-badge ${escape(status)}">${escape(labels[status] || status || 'sin estado')}</span>`; }
    progress(status){
      const labels=window.InvitaArteConfig.statusLabels || {}; const flow=window.InvitaArteConfig.statusFlow || []; const idx=flow.indexOf(status);
      return `<div class="progress">${flow.map((s,i)=>`<div class="step ${i<idx?'done':i===idx?'active':''}"><span class="step-dot"></span><span class="step-label">${escape(labels[s] || s)}</span></div>`).join('')}</div>`;
    }
    money(value){ return `${window.InvitaArteConfig.currency || 'Bs'} ${Number(value||0).toFixed(0)}`; }
    date(value){ return value ? new Date(value).toLocaleDateString('es-BO') : 'Sin fecha'; }
    input(name,label,value='',type='text',extra=''){ return `<div class="field"><label>${escape(label)}</label><input type="${type}" name="${escape(name)}" value="${escape(value)}" ${extra}></div>`; }
    select(name,label,options,value=''){ return `<div class="field"><label>${escape(label)}</label><select name="${escape(name)}">${options.map(o=>Array.isArray(o)?`<option value="${escape(o[0])}" ${o[0]===value?'selected':''}>${escape(o[1])}</option>`:`<option value="${escape(o)}" ${o===value?'selected':''}>${escape(o)}</option>`).join('')}</select></div>`; }
    empty(text){ return `<div class="empty-state">${escape(text)}</div>`; }
  }
  window.LayoutView = LayoutView;
})();
