
(function(){
  class AuthView{
    constructor(layout){ this.v=layout; }

    page(mode='login'){
      const loginActive = mode !== 'registro';
      return `<section class="auth-shell"><div class="auth-card"><aside class="auth-side"><div><img src="assets/logo-invitaarte-studio.png" alt="Invita Arte Studio" style="width:250px;background:#fff;border-radius:18px;padding:8px;box-shadow:0 12px 28px rgba(0,0,0,.18)"><h1>Portal de usuarios</h1><p>Ingresa según tu rol para gestionar solicitudes, versiones, estados y entregas digitales.</p></div></aside><div class="auth-form"><div class="tabs"><button class="tab ${loginActive?'active':''}" data-auth-tab="login">Iniciar sesión</button><button class="tab ${!loginActive?'active':''}" data-auth-tab="registro">Registrarse</button></div>${loginActive?this.loginForm():this.registerForm()}</div></div></section>`;
    }

    loginForm(){ return `<form id="loginForm" class="grid"><div class="field"><label>Correo electrónico</label><input type="email" name="email" required placeholder="correo@ejemplo.com"></div><div class="field"><label>Contraseña</label><input type="password" name="password" required placeholder="Ingresa tu contraseña"></div><button class="btn primary" type="submit">Entrar al sistema</button><p class="muted">Al iniciar sesión se abrirá el panel correspondiente al rol.</p></form>`; }

    registerForm(){ return `<form id="registerForm" class="grid"><div class="field"><label>Nombre completo</label><input name="name" required placeholder="Tu nombre"></div><div class="field"><label>Correo electrónico</label><input type="email" name="email" required placeholder="correo@ejemplo.com"></div><div class="field"><label>Teléfono WhatsApp</label><input name="phone" required placeholder="59174562899"></div><div class="field"><label>Contraseña</label><input type="password" name="password" required minlength="6" placeholder="Mínimo 6 caracteres"></div><button class="btn primary" type="submit">Crear cuenta de cliente</button><p class="muted">Por seguridad, toda cuenta nueva entra como cliente. El administrador asigna roles internos desde Supabase.</p></form>`; }
  }

  window.AuthView = AuthView;
})();

