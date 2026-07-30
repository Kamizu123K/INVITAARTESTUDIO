(function(){
  class AuthModel{
    constructor(api){ this.api = api; this.user = null; }
    async load(){ this.user = await this.api.getCurrentUser(); return this.user; }
    async login(email,password){ this.user = await this.api.signIn(email,password); return this.user; }
    async register(payload){ this.user = await this.api.signUp(payload); return this.user; }
    async logout(){ await this.api.signOut(); this.user = null; }
    isAuthenticated(){ return Boolean(this.user); }
    role(){ return this.user ? this.user.role : 'visitante'; }
  }
  window.AuthModel = AuthModel;
})();
