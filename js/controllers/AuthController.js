(function(){
  class AuthController{
    constructor(app){ this.app=app; }
    bind(){
      document.addEventListener('click', async e => {
        const tab = e.target.closest('[data-auth-tab]');
        if(tab){ location.hash = tab.dataset.authTab === 'registro' ? '#registro' : '#login'; }
        if(e.target.matches('[data-logout]')){ await this.app.auth.logout(); this.app.view.toast('Sesión cerrada.'); location.hash='#inicio'; this.app.render(); }
      });
      document.addEventListener('submit', async e => {
        if(e.target.id === 'loginForm'){
          e.preventDefault(); const data = Object.fromEntries(new FormData(e.target));
          try{ await this.app.auth.login(data.email,data.password); this.app.view.toast('Bienvenida/o al sistema.'); location.hash='#panel'; this.app.render(); }catch(err){ this.app.view.toast(err.message,'error'); }
        }
        if(e.target.id === 'registerForm'){
          e.preventDefault(); const data = Object.fromEntries(new FormData(e.target));
          try{ await this.app.auth.register(data); this.app.view.toast('Cuenta creada como cliente.'); location.hash='#panel'; this.app.render(); }catch(err){ this.app.view.toast(err.message,'error'); }
        }
      });
    }
  }
  window.AuthController = AuthController;
})();
