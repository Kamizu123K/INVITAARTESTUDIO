-- Invita Arte Studio v1.1.0
-- Ejecutar después de sql/supabase_schema.sql.

-- Evita RSVP duplicado por teléfono dentro del mismo pedido.
create unique index if not exists uq_rsvps_order_phone
on public.rsvps(order_id, guest_phone)
where guest_phone is not null and btrim(guest_phone) <> '';

-- Facilita búsquedas y sincronización por código de seguimiento.
create index if not exists idx_orders_tracking_code
on public.orders(tracking_code);

-- Auditoría opcional de integraciones externas.
create table if not exists public.integration_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  tracking_code text,
  integration_name text not null,
  status text not null,
  detail jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.integration_events enable row level security;
