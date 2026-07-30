
(function(){
  const CHATBOT_ID = 'chatbotWidget';
  const BTN_ID = 'chatbotToggle';
  const MSGS_ID = 'chatbotMessages';
  const FORM_ID = 'chatbotForm';
  const INPUT_ID = 'chatbotInput';
  const QUICKS_ID = 'chatbotQuickActions';
  const CLOSE_ID = 'chatbotClose';
  const WHATSAPP_BTN_ID = 'whatsappFloat';

  function escapeHtml(str){
    return String(str ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  function formatPhone(number){
    const raw = String(number || '').replace(/\D/g,'');
    if(raw.startsWith('591') && raw.length >= 11) return '+591 ' + raw.slice(3);
    return raw;
  }

  function getWhatsAppNumber(){
    return (window.InvitaArteConfig && window.InvitaArteConfig.whatsappNumber) ? String(window.InvitaArteConfig.whatsappNumber).replace(/\D/g,'') : '59174562899';
  }

  function waLink(prefill){
    const base = 'https://wa.me/' + getWhatsAppNumber();
    return prefill ? base + '?text=' + encodeURIComponent(prefill) : base;
  }

  function appendMessage(container, role, html){
    const item = document.createElement('div');
    item.className = 'chatbot-msg ' + role;
    item.innerHTML = `<div class="chatbot-bubble">${html}</div>`;
    container.appendChild(item);
    container.scrollTop = container.scrollHeight;
  }

  function appendChoiceRow(container, choices){
    if(!choices || !choices.length) return;
    const wrap = document.createElement('div');
    wrap.className = 'chatbot-msg bot';
    wrap.innerHTML = '<div class="chatbot-bubble chatbot-choice-wrap"></div>';
    const inner = wrap.firstElementChild;
    inner.appendChild(document.createTextNode('Accesos rápidos:'));
    const row = document.createElement('div');
    row.className = 'chatbot-inline-actions';
    choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chatbot-inline-btn';
      btn.dataset.chatbotIntent = choice.intent;
      btn.textContent = choice.label;
      row.appendChild(btn);
    });
    inner.appendChild(row);
    container.appendChild(wrap);
    container.scrollTop = container.scrollHeight;
  }

  function botReply(intent){
    const display = formatPhone(getWhatsAppNumber());
    const replies = {
      bienvenida: {
        text: `<strong>Hola, soy el asistente virtual de Invita Arte Studio.</strong><br>Puedo ayudarte a cotizar, revisar paquetes, explicarte el proceso o llevarte directo a WhatsApp con el equipo.` ,
        actions: [
          {label:'Cotizar ahora', intent:'cotizar'},
          {label:'Ver paquetes', intent:'paquetes'},
          {label:'Seguimiento', intent:'seguimiento'},
          {label:'Hablar por WhatsApp', intent:'whatsapp'}
        ]
      },
      cotizar: {
        text: `Para cotizar, entra al <strong>Cotizador</strong>, elige tu plantilla, paquete y personalización. El sistema genera una solicitud y organiza tu pedido.` ,
        actions: [
          {label:'Ir al cotizador', intent:'goto-cotizador'},
          {label:'Ver catálogo', intent:'goto-catalogo'}
        ]
      },
      paquetes: {
        text: `<strong>Paquetes disponibles:</strong><br>• Básico: invitación digital esencial.<br>• Estándar: más personalización y funciones.<br>• Premium: experiencia más completa, elegante e interactiva.` ,
        actions: [
          {label:'Ver catálogo', intent:'goto-catalogo'},
          {label:'Cotizar ahora', intent:'goto-cotizador'}
        ]
      },
      seguimiento: {
        text: `Si ya realizaste un pedido, puedes usar la sección <strong>Seguimiento</strong> para consultar tu estado con el código de pedido.` ,
        actions: [
          {label:'Abrir seguimiento', intent:'goto-seguimiento'},
          {label:'Hablar por WhatsApp', intent:'whatsapp'}
        ]
      },
      tiempos: {
        text: `El tiempo de entrega depende del paquete y del nivel de personalización. Si quieres una respuesta rápida, nuestro equipo puede orientarte por WhatsApp: <strong>${display}</strong>.` ,
        actions: [
          {label:'WhatsApp', intent:'whatsapp'},
          {label:'Cotizar', intent:'goto-cotizador'}
        ]
      },
      funciones: {
        text: `Nuestras invitaciones pueden incluir <strong>QR, música, mapa, galería, confirmación RSVP, cuenta regresiva y enlace compartible</strong>, según el paquete elegido.` ,
        actions: [
          {label:'Ver paquetes', intent:'paquetes'},
          {label:'Cotizar', intent:'goto-cotizador'}
        ]
      },
      horario: {
        text: `Atendemos consultas digitales para ventas y coordinación desde <strong>La Paz, Bolivia</strong>. También puedes escribirnos por WhatsApp y responderemos a la brevedad: <strong>${display}</strong>.` ,
        actions: [
          {label:'WhatsApp', intent:'whatsapp'}
        ]
      },
      whatsapp: {
        text: `Perfecto. Puedes escribirnos directamente por <strong>WhatsApp</strong> al número <strong>${display}</strong>.` ,
        actions: [
          {label:'Abrir WhatsApp', intent:'open-whatsapp'}
        ]
      },
      default: {
        text: `Puedo ayudarte con <strong>cotización</strong>, <strong>paquetes</strong>, <strong>seguimiento</strong>, <strong>funciones</strong> o llevarte a <strong>WhatsApp</strong>.`,
        actions: [
          {label:'Cotizar', intent:'cotizar'},
          {label:'Funciones', intent:'funciones'},
          {label:'WhatsApp', intent:'whatsapp'}
        ]
      }
    };
    return replies[intent] || replies.default;
  }

  function resolveTypedIntent(message){
    const m = String(message || '').toLowerCase();
    if(/hola|buenas|hello|inicio/.test(m)) return 'bienvenida';
    if(/cotiz|precio|cost|cu[aá]nto|comprar/.test(m)) return 'cotizar';
    if(/paquete|plan|premium|b[aá]sico|est[aá]ndar/.test(m)) return 'paquetes';
    if(/seguimiento|estado|pedido|c[oó]digo/.test(m)) return 'seguimiento';
    if(/funci[oó]n|qr|m[uú]sica|galer[ií]a|mapa|rsvp/.test(m)) return 'funciones';
    if(/horario|atienden|atenci[oó]n|hora/.test(m)) return 'horario';
    if(/whatsapp|asesor|humano|contacto/.test(m)) return 'whatsapp';
    return 'default';
  }

  function initChatbot(){
    const widget = document.getElementById(CHATBOT_ID);
    const toggle = document.getElementById(BTN_ID);
    const close = document.getElementById(CLOSE_ID);
    const messages = document.getElementById(MSGS_ID);
    const form = document.getElementById(FORM_ID);
    const input = document.getElementById(INPUT_ID);
    const quicks = document.getElementById(QUICKS_ID);
    const waBtn = document.getElementById(WHATSAPP_BTN_ID);

    if(!widget || !toggle || !messages || !form || !input || !quicks) return;

    widget.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');

    if(!messages.dataset.seeded){
      messages.innerHTML = '';
      const welcome = botReply('bienvenida');
      appendMessage(messages, 'bot', welcome.text);
      appendChoiceRow(messages, welcome.actions);
      messages.dataset.seeded = '1';
    }

    const openWidget = ()=>{
      widget.hidden = false;
      widget.classList.add('open');
      toggle.classList.add('active');
      toggle.setAttribute('aria-expanded', 'true');
      setTimeout(()=>input.focus(), 80);
    };
    const closeWidget = ()=>{
      widget.hidden = true;
      widget.classList.remove('open');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.onclick = ()=> widget.hidden ? openWidget() : closeWidget();
    close.onclick = closeWidget;
    if(waBtn){
      waBtn.onclick = ()=> window.open(waLink('Hola, quiero información sobre invitaciones digitales.'), '_blank', 'noopener');
    }

    quicks.onclick = (e)=>{
      const btn = e.target.closest('[data-chatbot-intent]');
      if(!btn) return;
      handleIntent(btn.dataset.chatbotIntent, btn.textContent.trim());
    };

    messages.onclick = (e)=>{
      const btn = e.target.closest('[data-chatbot-intent]');
      if(!btn) return;
      handleIntent(btn.dataset.chatbotIntent, btn.textContent.trim());
    };

    form.onsubmit = (e)=>{
      e.preventDefault();
      const value = input.value.trim();
      if(!value) return;
      appendMessage(messages, 'user', escapeHtml(value));
      const intent = resolveTypedIntent(value);
      const reply = botReply(intent);
      appendMessage(messages, 'bot', reply.text);
      appendChoiceRow(messages, reply.actions);
      input.value = '';
    };

    function handleIntent(intent, label){
      appendMessage(messages, 'user', escapeHtml(label || intent));
      if(intent === 'goto-cotizador'){
        location.hash = '#cotizador';
        const reply = {text:'Te llevé a la sección de <strong>Cotizador</strong>. Completa tus datos para generar tu solicitud.', actions:[{label:'Ver paquetes', intent:'paquetes'}]};
        appendMessage(messages, 'bot', reply.text);
        appendChoiceRow(messages, reply.actions);
        openWidget();
        return;
      }
      if(intent === 'goto-catalogo'){
        location.hash = '#catalogo';
        const reply = {text:'Te llevé al <strong>Catálogo</strong>. Allí puedes revisar plantillas por tipo de evento y estilo.', actions:[{label:'Cotizar ahora', intent:'goto-cotizador'}]};
        appendMessage(messages, 'bot', reply.text);
        appendChoiceRow(messages, reply.actions);
        openWidget();
        return;
      }
      if(intent === 'goto-seguimiento'){
        location.hash = '#seguimiento';
        const reply = {text:'Te llevé a <strong>Seguimiento</strong>. Ingresa tu código para consultar el estado del pedido.', actions:[{label:'WhatsApp', intent:'whatsapp'}]};
        appendMessage(messages, 'bot', reply.text);
        appendChoiceRow(messages, reply.actions);
        openWidget();
        return;
      }
      if(intent === 'open-whatsapp'){
        window.open(waLink('Hola, vengo desde la web de Invita Arte Studio y quiero información.'), '_blank', 'noopener');
        const reply = {text:'Abrí WhatsApp para que continúes con atención directa del equipo.', actions:[{label:'Cotizar', intent:'cotizar'}]};
        appendMessage(messages, 'bot', reply.text);
        appendChoiceRow(messages, reply.actions);
        openWidget();
        return;
      }

      const reply = botReply(intent);
      appendMessage(messages, 'bot', reply.text);
      appendChoiceRow(messages, reply.actions);
      openWidget();
    }
  }

  document.addEventListener('invitaarte:rendered', initChatbot);
  document.addEventListener('DOMContentLoaded', initChatbot);
})();
