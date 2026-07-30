(function(){
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealSelector = '.section-head,.card,.template-card,.hero-card,.phone-preview,.stat,.metric,.table-wrap,.ops-banner,.auth-card,.public-invite,.flow-node,.package-card,.modal,.invite-live';
  const tiltSelector = '.hero-card,.phone-preview,.template-card,.package-card,.card:not(.no-tilt),.auth-card,.public-invite';
  let observer;
  let counterObserver;

  function ready(fn){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true});
    else fn();
  }

  function ensureAmbient(){
    if(prefersReduced || document.querySelector('.ambient-layer')) return;
    const layer = document.createElement('div');
    layer.className = 'ambient-layer';
    const orbColors = ['rgba(124,58,237,.23)','rgba(245,158,11,.22)','rgba(20,184,166,.20)','rgba(216,180,254,.28)'];
    for(let i=0;i<24;i++){
      const el = document.createElement('span');
      const isSpark = i % 5 === 0;
      el.className = isSpark ? 'ambient-spark' : 'ambient-orb';
      el.textContent = isSpark ? '✦' : '';
      const size = isSpark ? (12 + Math.random()*22)+'px' : (8 + Math.random()*18)+'px';
      el.style.setProperty('--s', size);
      el.style.setProperty('--x', (Math.random()*100)+'%');
      el.style.setProperty('--y', (Math.random()*100)+'%');
      el.style.setProperty('--tx', ((Math.random()*80)-40)+'px');
      el.style.setProperty('--ty', ((Math.random()*100)-50)+'px');
      el.style.setProperty('--d', (8 + Math.random()*10)+'s');
      el.style.setProperty('--delay', (-Math.random()*8)+'s');
      el.style.setProperty('--c', orbColors[i % orbColors.length]);
      layer.appendChild(el);
    }
    document.body.appendChild(layer);
  }

  function ensureCursorGlow(){
    if(prefersReduced || !window.matchMedia('(hover:hover)').matches || document.querySelector('.cursor-glow')) return;
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);
    window.addEventListener('pointermove', (e)=>{
      document.body.classList.add('pointer-active');
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    }, {passive:true});
    window.addEventListener('pointerleave', ()=>document.body.classList.remove('pointer-active'), {passive:true});
  }

  function setupReveal(root=document){
    if(prefersReduced) return;
    if(!observer){
      observer = new IntersectionObserver((entries)=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting){
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, {threshold:.13, rootMargin:'0px 0px -6% 0px'});
    }
    root.querySelectorAll(revealSelector).forEach((el, index)=>{
      if(el.dataset.fxReveal) return;
      el.dataset.fxReveal = '1';
      el.classList.add('fx-reveal');
      el.style.transitionDelay = Math.min((index % 10) * 45, 320) + 'ms';
      observer.observe(el);
    });
  }

  function setupTilt(root=document){
    if(prefersReduced || !window.matchMedia('(hover:hover)').matches) return;
    root.querySelectorAll(tiltSelector).forEach(el=>{
      if(el.dataset.fxTilt) return;
      el.dataset.fxTilt = '1';
      el.classList.add('fx-tilt');
      el.addEventListener('pointermove', (e)=>{
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - .5;
        const py = (e.clientY - rect.top) / rect.height - .5;
        const rotateX = (-py * 4.5).toFixed(2);
        const rotateY = (px * 5.5).toFixed(2);
        el.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
      }, {passive:true});
      el.addEventListener('pointerleave', ()=>{
        el.style.transform = '';
      }, {passive:true});
    });
  }

  function setupRipple(root=document){
    root.querySelectorAll('.btn,.tab,.side-nav button,.main-nav a,.nav-toggle').forEach(el=>{
      if(el.dataset.fxRipple) return;
      el.dataset.fxRipple = '1';
      el.addEventListener('click', (e)=>{
        const rect = el.getBoundingClientRect();
        const dot = document.createElement('span');
        dot.className = 'ripple-dot';
        dot.style.left = (e.clientX - rect.left) + 'px';
        dot.style.top = (e.clientY - rect.top) + 'px';
        el.appendChild(dot);
        setTimeout(()=>dot.remove(), 700);
      });
    });
  }

  function parseNumber(text){
    const clean = String(text || '').replace(/[^0-9.]/g,'');
    if(!clean) return null;
    const n = Number(clean);
    return Number.isFinite(n) ? n : null;
  }

  function setupCounters(root=document){
    if(prefersReduced) return;
    if(!counterObserver){
      counterObserver = new IntersectionObserver((entries)=>{
        entries.forEach(entry=>{
          if(!entry.isIntersecting) return;
          const el = entry.target;
          counterObserver.unobserve(el);
          if(el.dataset.counted) return;
          const original = el.textContent.trim();
          const target = parseNumber(original);
          if(target === null || target > 50000) return;
          el.dataset.counted = '1';
          const prefix = original.startsWith('Bs') ? 'Bs ' : '';
          const suffix = original.includes('+') ? '+' : '';
          const duration = 900;
          const start = performance.now();
          const step = (now)=>{
            const p = Math.min((now-start)/duration,1);
            const eased = 1 - Math.pow(1-p,3);
            el.textContent = prefix + Math.round(target*eased).toLocaleString('es-BO') + suffix;
            if(p < 1) requestAnimationFrame(step);
            else el.textContent = original;
          };
          requestAnimationFrame(step);
        });
      }, {threshold:.4});
    }
    root.querySelectorAll('.metric strong,.stat strong,.summary-price').forEach(el=>{
      if(!el.dataset.counterObserve){
        el.dataset.counterObserve = '1';
        counterObserver.observe(el);
      }
    });
  }

  function launchConfetti(x, y){
    if(prefersReduced) return;
    const colors = ['#7c3aed','#f59e0b','#14b8a6','#c084fc','#2e1065'];
    for(let i=0;i<26;i++){
      const p = document.createElement('span');
      p.className = 'confetti-piece';
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      p.style.setProperty('--dx', ((Math.random()*260)-130)+'px');
      p.style.setProperty('--dy', (80 + Math.random()*180)+'px');
      p.style.setProperty('--rot', ((Math.random()*720)-360)+'deg');
      p.style.setProperty('--confetti-color', colors[i % colors.length]);
      p.style.animationDelay = (Math.random()*80)+'ms';
      document.body.appendChild(p);
      setTimeout(()=>p.remove(), 1200);
    }
  }

  function setupConfetti(){
    if(document.body.dataset.fxConfetti) return;
    document.body.dataset.fxConfetti = '1';
    document.addEventListener('click', (e)=>{
      const trigger = e.target.closest('[data-approve-order], [data-add-version], [data-new-order], .btn.primary');
      if(!trigger) return;
      if(trigger.closest('.main-nav')) return;
      const rect = trigger.getBoundingClientRect();
      launchConfetti(rect.left + rect.width/2, rect.top + rect.height/2);
    });
  }

  function polishTables(root=document){
    root.querySelectorAll('.table-wrap').forEach(wrap=>{
      if(wrap.dataset.fxHint) return;
      wrap.dataset.fxHint = '1';
      const table = wrap.querySelector('table');
      if(table && table.scrollWidth > wrap.clientWidth){
        wrap.setAttribute('title','Desliza horizontalmente para ver toda la tabla');
      }
    });
  }

  function applyEffects(){
    ensureAmbient();
    ensureCursorGlow();
    setupReveal(document);
    setupTilt(document);
    setupRipple(document);
    setupCounters(document);
    setupConfetti();
    polishTables(document);
  }

  let scheduled = false;
  function schedule(){
    if(scheduled) return;
    scheduled = true;
    requestAnimationFrame(()=>{ scheduled = false; applyEffects(); });
  }

  ready(()=>{
    applyEffects();
    const app = document.getElementById('app');
    if(app){
      const mo = new MutationObserver(schedule);
      mo.observe(app, {childList:true, subtree:true});
    }
    document.addEventListener('invitaarte:rendered', schedule);
  });
})();
