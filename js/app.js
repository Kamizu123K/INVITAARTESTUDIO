(function(){
  document.addEventListener('DOMContentLoaded', async function(){
    try{ window.InvitaArteApp = new window.AppController(); await window.InvitaArteApp.init(); }
    catch(error){
      console.error(error);
      const app = document.getElementById('app');
      if(app) app.innerHTML = '<section class="section"><div class="container"><div class="card"><h1>Error al cargar la página</h1><p>Revisa que mantuviste completa la carpeta con css, js y assets.</p><pre>'+String(error.message || error)+'</pre></div></div></section>';
    }
  });
})();
