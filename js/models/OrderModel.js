(function(){
  class OrderModel{
    constructor(api){ this.api = api; this.orders = []; }
    async load(user){ this.orders = await this.api.listOrders(user); return this.orders; }
    async create(form,user){ const order = await this.api.createOrder(form,user); this.orders.unshift(order); return order; }
    async findByCode(code){ return this.api.findOrderByTracking(code); }
    async update(id,fields){ const order = await this.api.updateOrder(id,fields); const i=this.orders.findIndex(o=>o.id===id); if(i>=0) this.orders[i]=order; return order; }
    async updateStatus(id,status){ return this.update(id,{status}); }
    async addVersion(id,version,user){ return this.api.addVersion(id,version,user); }
    async updateVersion(id,fields){ return this.api.updateVersion(id,fields); }
    async deleteVersion(id){ return this.api.deleteVersion(id); }
    async approve(id){ return this.api.approveOrder(id); }
    async delete(id){ return this.api.deleteOrder(id); }
    async createPayment(input){ return this.api.createPayment(input); }
    async updatePayment(id,fields){ return this.api.updatePayment(id,fields); }
    async deletePayment(id){ return this.api.deletePayment(id); }
    async createRsvp(input){ return this.api.createRsvp(input); }
    async updateRsvp(id,fields){ return this.api.updateRsvp(id,fields); }
    async deleteRsvp(id){ return this.api.deleteRsvp(id); }
    getById(id){ return this.orders.find(o=>o.id===id); }
  }
  window.OrderModel = OrderModel;
})();
