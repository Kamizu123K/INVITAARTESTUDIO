window.InvitaArteConfig = {
  appVersion: '1.1.0',
  apiBaseUrl: '/api',
  // La conexión real a Supabase ahora se ejecuta en el servidor local mediante .env.
  // Se conservan estos campos vacíos solo por compatibilidad con la versión anterior.
  supabaseUrl: '',
  supabaseAnonKey: '',
  legacyDirectSupabase: false,
  whatsappNumber: '59174562899',
  trackingPrefix: 'IA',
  brandSlogan: 'Invitaciones digitales',
  currency: 'Bs',
  projectName: 'Invita Arte Studio',
  statusLabels: {
    recibido: 'Recibido',
    cotizado: 'Cotizado',
    datos_recibidos: 'Datos recibidos',
    diseno: 'En diseño',
    revision: 'En revisión',
    aprobado: 'Aprobado',
    entregado: 'Entregado'
  },
  statusFlow: ['recibido', 'cotizado', 'datos_recibidos', 'diseno', 'revision', 'aprobado', 'entregado']
};
