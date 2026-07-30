-- Invita Arte Studio - Actualización para paneles operativos CRUD por roles
-- Ejecutar en Supabase > SQL Editor después del esquema inicial.
-- Mantiene el proyecto solo para invitaciones digitales.

-- Asegurar columnas operativas que usa el frontend
alter table public.templates add column if not exists preview_url text;
alter table public.templates add column if not exists is_active boolean not null default true;
alter table public.orders add column if not exists updated_at timestamptz not null default now();
alter table public.order_versions add column if not exists status text not null default 'enviada';
alter table public.payments add column if not exists proof_url text;
alter table public.rsvps add column if not exists notes text;

-- Reemplazar políticas para permitir CRUD real según rol
alter table public.profiles enable row level security;
alter table public.templates enable row level security;
alter table public.orders enable row level security;
alter table public.order_versions enable row level security;
alter table public.payments enable row level security;
alter table public.rsvps enable row level security;
alter table public.metrics_events enable row level security;

-- Pedidos: cliente maneja sus pedidos; staff maneja todos.
drop policy if exists "orders_delete_staff" on public.orders;
create policy "orders_delete_staff" on public.orders
for delete using (public.is_staff());

-- Versiones: staff hace CRUD, cliente propietario consulta.
drop policy if exists "versions_update_staff" on public.order_versions;
create policy "versions_update_staff" on public.order_versions
for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists "versions_delete_staff" on public.order_versions;
create policy "versions_delete_staff" on public.order_versions
for delete using (public.is_staff());

-- Pagos: cliente propietario registra/actualiza comprobante; staff confirma y administra.
drop policy if exists "payments_update_related" on public.payments;
create policy "payments_update_related" on public.payments
for update using (
  public.is_staff() or exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
) with check (
  public.is_staff() or exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

drop policy if exists "payments_delete_staff" on public.payments;
create policy "payments_delete_staff" on public.payments
for delete using (public.is_staff());

-- RSVP: cliente propietario y staff administran confirmaciones del pedido.
drop policy if exists "rsvps_update_related" on public.rsvps;
create policy "rsvps_update_related" on public.rsvps
for update using (
  public.is_staff() or exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
) with check (
  public.is_staff() or exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

drop policy if exists "rsvps_delete_related" on public.rsvps;
create policy "rsvps_delete_related" on public.rsvps
for delete using (
  public.is_staff() or exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

-- Métricas: permitir registrar eventos desde usuario autenticado y lectura por staff.
drop policy if exists "metrics_insert_any_authenticated" on public.metrics_events;
create policy "metrics_insert_any_authenticated" on public.metrics_events
for insert with check (auth.uid() is not null);

drop policy if exists "metrics_select_staff" on public.metrics_events;
create policy "metrics_select_staff" on public.metrics_events
for select using (public.is_staff());

-- Recomendado: asignar roles internos después de registrar cuentas.
-- update public.profiles set role = 'admin' where email = 'tu_admin@correo.com';
-- update public.profiles set role = 'asesor' where email = 'asesor@correo.com';
-- update public.profiles set role = 'disenador' where email = 'disenador@correo.com';
