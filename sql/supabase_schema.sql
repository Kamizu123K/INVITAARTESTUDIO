-- Invita Arte Studio - Esquema inicial Supabase PostgreSQL
-- Ejecutar completo en Supabase > SQL Editor.
-- IMPORTANTE: No pegar service_role key en el frontend. Usar solo anon/public key.

create extension if not exists pgcrypto;

-- Tipos del sistema
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('cliente', 'asesor', 'disenador', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM ('recibido', 'cotizado', 'datos_recibidos', 'diseno', 'revision', 'aprobado', 'entregado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.package_type AS ENUM ('basico', 'estandar', 'premium');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Perfiles de usuario conectados a Supabase Auth
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text unique not null,
  phone text,
  role public.user_role not null default 'cliente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  style text not null,
  package_type public.package_type not null default 'basico',
  base_price numeric(10,2) not null default 0,
  description text,
  features text[] not null default '{}',
  accent text default '#7C3AED',
  preview_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  tracking_code text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  client_name text not null,
  email text not null,
  phone text,
  event_type text not null,
  package_type public.package_type not null default 'basico',
  template_id uuid references public.templates(id) on delete set null,
  event_title text,
  honorees text,
  event_date date,
  event_time time,
  location text,
  map_url text,
  music_url text,
  colors text,
  notes text,
  guests integer default 0,
  urgent boolean default false,
  status public.order_status not null default 'recibido',
  total_amount numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_versions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  designer_id uuid references auth.users(id) on delete set null,
  version_number integer not null default 1,
  preview_url text not null,
  notes text,
  status text not null default 'enviada',
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  amount numeric(10,2) not null,
  method text default 'QR/Transferencia',
  proof_url text,
  status text not null default 'pendiente',
  created_at timestamptz not null default now()
);

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  guest_name text not null,
  guest_phone text,
  attendance text not null default 'pendiente',
  companions integer default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.metrics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Funciones auxiliares
create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','asesor','disenador')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    'cliente'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at before update on public.orders for each row execute procedure public.set_updated_at();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.templates enable row level security;
alter table public.orders enable row level security;
alter table public.order_versions enable row level security;
alter table public.payments enable row level security;
alter table public.rsvps enable row level security;
alter table public.metrics_events enable row level security;

-- Políticas perfiles
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
for insert with check (id = auth.uid());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
for update using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- Políticas plantillas: públicas para lectura, solo admin para modificación
drop policy if exists "templates_public_read" on public.templates;
create policy "templates_public_read" on public.templates
for select using (is_active = true or public.is_staff());

drop policy if exists "templates_admin_all" on public.templates;
create policy "templates_admin_all" on public.templates
for all using (public.is_admin()) with check (public.is_admin());

-- Políticas pedidos
drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders
for insert with check (user_id = auth.uid() or public.is_staff());

drop policy if exists "orders_select_own_or_staff" on public.orders;
create policy "orders_select_own_or_staff" on public.orders
for select using (user_id = auth.uid() or public.is_staff());

drop policy if exists "orders_update_staff_or_owner_approve" on public.orders;
create policy "orders_update_staff_or_owner_approve" on public.orders
for update using (public.is_staff() or user_id = auth.uid())
with check (public.is_staff() or user_id = auth.uid());

-- Versiones: staff puede crear, cliente propietario puede ver
drop policy if exists "versions_select_related" on public.order_versions;
create policy "versions_select_related" on public.order_versions
for select using (
  public.is_staff() or exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

drop policy if exists "versions_insert_staff" on public.order_versions;
create policy "versions_insert_staff" on public.order_versions
for insert with check (public.is_staff());

-- Pagos: cliente ve los suyos, staff ve todo
drop policy if exists "payments_select_related" on public.payments;
create policy "payments_select_related" on public.payments
for select using (
  public.is_staff() or exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

drop policy if exists "payments_insert_related" on public.payments;
create policy "payments_insert_related" on public.payments
for insert with check (
  public.is_staff() or exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

-- RSVP: lectura/registro público por enlace sería ideal con función; para PMV, dueño/staff
drop policy if exists "rsvps_related" on public.rsvps;
create policy "rsvps_related" on public.rsvps
for all using (
  public.is_staff() or exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
) with check (
  public.is_staff() or exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

-- Métricas: cualquiera registra evento, staff lee
drop policy if exists "metrics_insert_any_authenticated" on public.metrics_events;
create policy "metrics_insert_any_authenticated" on public.metrics_events
for insert with check (auth.uid() is not null);

drop policy if exists "metrics_select_staff" on public.metrics_events;
create policy "metrics_select_staff" on public.metrics_events
for select using (public.is_staff());

-- Datos semilla de plantillas
insert into public.templates (title, category, style, package_type, base_price, description, features, accent)
values
('Quinceañera Lila', '15 años', 'Elegante', 'premium', 160, 'Diseño interactivo con cuenta regresiva, música, galería y QR.', array['Cuenta regresiva','Música','Galería','QR','RSVP'], '#7C3AED'),
('Boda Oro Suave', 'Boda', 'Romántico', 'premium', 180, 'Invitación web elegante para boda con mapa, itinerario y confirmación.', array['Mapa','Itinerario','RSVP','Galería'], '#C084FC'),
('Cumple Neon', 'Cumpleaños', 'Moderno', 'estandar', 95, 'Invitación animada para compartir por WhatsApp.', array['Animación','Link','QR'], '#14B8A6'),
('Baby Shower Pastel', 'Baby shower', 'Dulce', 'estandar', 90, 'Diseño tierno con datos claros y confirmación simple.', array['Link','RSVP','Mapa'], '#F9A8D4'),
('Graduación Azul', 'Graduación', 'Formal', 'premium', 150, 'Invitación institucional con programa, mapa y QR.', array['Programa','QR','Mapa','RSVP'], '#2563EB')
on conflict do nothing;

-- Cambiar roles manualmente después de registrar usuarios:
-- update public.profiles set role = 'admin' where email = 'admin@tucorreo.com';
-- update public.profiles set role = 'disenador' where email = 'disenador@tucorreo.com';
-- update public.profiles set role = 'asesor' where email = 'asesor@tucorreo.com';

-- === Actualización opcional para CRUD operativo ===
-- También disponible separada en sql/actualizacion_crud_roles.sql
alter table public.templates add column if not exists preview_url text;
alter table public.templates add column if not exists is_active boolean not null default true;
alter table public.orders add column if not exists updated_at timestamptz not null default now();
alter table public.order_versions add column if not exists status text not null default 'enviada';
alter table public.payments add column if not exists proof_url text;
alter table public.rsvps add column if not exists notes text;

drop policy if exists "orders_delete_staff" on public.orders;
create policy "orders_delete_staff" on public.orders for delete using (public.is_staff());

drop policy if exists "versions_update_staff" on public.order_versions;
create policy "versions_update_staff" on public.order_versions for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists "versions_delete_staff" on public.order_versions;
create policy "versions_delete_staff" on public.order_versions for delete using (public.is_staff());

drop policy if exists "payments_update_related" on public.payments;
create policy "payments_update_related" on public.payments for update using (public.is_staff() or exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())) with check (public.is_staff() or exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

drop policy if exists "payments_delete_staff" on public.payments;
create policy "payments_delete_staff" on public.payments for delete using (public.is_staff());

drop policy if exists "rsvps_update_related" on public.rsvps;
create policy "rsvps_update_related" on public.rsvps for update using (public.is_staff() or exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())) with check (public.is_staff() or exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

drop policy if exists "rsvps_delete_related" on public.rsvps;
create policy "rsvps_delete_related" on public.rsvps for delete using (public.is_staff() or exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
