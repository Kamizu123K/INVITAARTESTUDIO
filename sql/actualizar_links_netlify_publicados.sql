-- Actualización de enlaces Netlify oficiales para Invita Arte Studio
-- Ejecutar en Supabase SQL Editor si ya tienes la base creada.

update public.templates set preview_url = 'https://6a358fa967d5ad0a202eeed6--superlative-dasik-4f324a.netlify.app/', updated_at = now() where id = '11111111-1111-4111-8111-111111111111'::uuid;
update public.templates set preview_url = 'https://jazzy-paletas-40528a.netlify.app/', updated_at = now() where id = '11111111-1111-4111-8111-111111111119'::uuid;
update public.templates set preview_url = 'https://dulcet-toffee-8ce1a3.netlify.app/', updated_at = now() where id = '11111111-1111-4111-8111-111111111113'::uuid;
update public.templates set preview_url = 'https://verdant-puppy-8fdb9f.netlify.app/', updated_at = now() where id = '11111111-1111-4111-8111-111111111124'::uuid;
update public.templates set preview_url = 'https://eclectic-creponne-f9e5ed.netlify.app/', updated_at = now() where id = '11111111-1111-4111-8111-111111111117'::uuid;
update public.templates set preview_url = 'https://animated-pegasus-d3ebba.netlify.app/', updated_at = now() where id = '11111111-1111-4111-8111-111111111115'::uuid;
update public.templates set preview_url = 'https://regal-seahorse-6b0c81.netlify.app/', updated_at = now() where id = '11111111-1111-4111-8111-111111111122'::uuid;
update public.templates set preview_url = 'https://tangerine-melba-9d6207.netlify.app/', updated_at = now() where id = '11111111-1111-4111-8111-111111111125'::uuid;
update public.templates set preview_url = 'https://quiet-sunflower-b4ec57.netlify.app/', updated_at = now() where id = '11111111-1111-4111-8111-111111111127'::uuid;
update public.templates set preview_url = 'https://nimble-concha-486067.netlify.app/', updated_at = now() where id = '11111111-1111-4111-8111-111111111129'::uuid;
update public.templates set preview_url = 'https://inquisitive-malasada-5e626b.netlify.app/', updated_at = now() where id = '11111111-1111-4111-8111-111111111126'::uuid;
update public.templates set preview_url = 'https://cozy-arithmetic-838edb.netlify.app/', updated_at = now() where id = '11111111-1111-4111-8111-111111111130'::uuid;

insert into public.order_versions (id, order_id, designer_id, version_number, preview_url, notes, status, created_at) values ('33333333-3333-4333-8333-333333333401'::uuid, '22222222-2222-4222-8222-222222222201'::uuid, null, 99, 'https://6a358fa967d5ad0a202eeed6--superlative-dasik-4f324a.netlify.app/', 'Versión final publicada en Netlify.', 'aprobada', now()) on conflict (id) do update set preview_url=excluded.preview_url, notes=excluded.notes, status=excluded.status;
insert into public.order_versions (id, order_id, designer_id, version_number, preview_url, notes, status, created_at) values ('33333333-3333-4333-8333-333333333402'::uuid, '22222222-2222-4222-8222-222222222202'::uuid, null, 99, 'https://jazzy-paletas-40528a.netlify.app/', 'Versión final publicada en Netlify.', 'aprobada', now()) on conflict (id) do update set preview_url=excluded.preview_url, notes=excluded.notes, status=excluded.status;
insert into public.order_versions (id, order_id, designer_id, version_number, preview_url, notes, status, created_at) values ('33333333-3333-4333-8333-333333333403'::uuid, '22222222-2222-4222-8222-222222222203'::uuid, null, 99, 'https://dulcet-toffee-8ce1a3.netlify.app/', 'Versión final publicada en Netlify.', 'aprobada', now()) on conflict (id) do update set preview_url=excluded.preview_url, notes=excluded.notes, status=excluded.status;
insert into public.order_versions (id, order_id, designer_id, version_number, preview_url, notes, status, created_at) values ('33333333-3333-4333-8333-333333333404'::uuid, '22222222-2222-4222-8222-222222222204'::uuid, null, 99, 'https://verdant-puppy-8fdb9f.netlify.app/', 'Versión final publicada en Netlify.', 'aprobada', now()) on conflict (id) do update set preview_url=excluded.preview_url, notes=excluded.notes, status=excluded.status;
insert into public.order_versions (id, order_id, designer_id, version_number, preview_url, notes, status, created_at) values ('33333333-3333-4333-8333-333333333405'::uuid, '22222222-2222-4222-8222-222222222205'::uuid, null, 99, 'https://eclectic-creponne-f9e5ed.netlify.app/', 'Versión final publicada en Netlify.', 'aprobada', now()) on conflict (id) do update set preview_url=excluded.preview_url, notes=excluded.notes, status=excluded.status;
insert into public.order_versions (id, order_id, designer_id, version_number, preview_url, notes, status, created_at) values ('33333333-3333-4333-8333-333333333406'::uuid, '22222222-2222-4222-8222-222222222206'::uuid, null, 99, 'https://animated-pegasus-d3ebba.netlify.app/', 'Versión final publicada en Netlify.', 'aprobada', now()) on conflict (id) do update set preview_url=excluded.preview_url, notes=excluded.notes, status=excluded.status;
insert into public.order_versions (id, order_id, designer_id, version_number, preview_url, notes, status, created_at) values ('33333333-3333-4333-8333-333333333407'::uuid, '22222222-2222-4222-8222-222222222207'::uuid, null, 99, 'https://regal-seahorse-6b0c81.netlify.app/', 'Versión final publicada en Netlify.', 'aprobada', now()) on conflict (id) do update set preview_url=excluded.preview_url, notes=excluded.notes, status=excluded.status;
insert into public.order_versions (id, order_id, designer_id, version_number, preview_url, notes, status, created_at) values ('33333333-3333-4333-8333-333333333408'::uuid, '22222222-2222-4222-8222-222222222208'::uuid, null, 99, 'https://tangerine-melba-9d6207.netlify.app/', 'Versión final publicada en Netlify.', 'aprobada', now()) on conflict (id) do update set preview_url=excluded.preview_url, notes=excluded.notes, status=excluded.status;
insert into public.order_versions (id, order_id, designer_id, version_number, preview_url, notes, status, created_at) values ('33333333-3333-4333-8333-333333333409'::uuid, '22222222-2222-4222-8222-222222222209'::uuid, null, 99, 'https://quiet-sunflower-b4ec57.netlify.app/', 'Versión final publicada en Netlify.', 'aprobada', now()) on conflict (id) do update set preview_url=excluded.preview_url, notes=excluded.notes, status=excluded.status;
insert into public.order_versions (id, order_id, designer_id, version_number, preview_url, notes, status, created_at) values ('33333333-3333-4333-8333-333333333410'::uuid, '22222222-2222-4222-8222-222222222210'::uuid, null, 99, 'https://nimble-concha-486067.netlify.app/', 'Versión final publicada en Netlify.', 'aprobada', now()) on conflict (id) do update set preview_url=excluded.preview_url, notes=excluded.notes, status=excluded.status;
insert into public.order_versions (id, order_id, designer_id, version_number, preview_url, notes, status, created_at) values ('33333333-3333-4333-8333-333333333411'::uuid, '22222222-2222-4222-8222-222222222211'::uuid, null, 99, 'https://inquisitive-malasada-5e626b.netlify.app/', 'Versión final publicada en Netlify.', 'aprobada', now()) on conflict (id) do update set preview_url=excluded.preview_url, notes=excluded.notes, status=excluded.status;
insert into public.order_versions (id, order_id, designer_id, version_number, preview_url, notes, status, created_at) values ('33333333-3333-4333-8333-333333333412'::uuid, '22222222-2222-4222-8222-222222222212'::uuid, null, 99, 'https://cozy-arithmetic-838edb.netlify.app/', 'Versión final publicada en Netlify.', 'aprobada', now()) on conflict (id) do update set preview_url=excluded.preview_url, notes=excluded.notes, status=excluded.status;

update public.orders set status = 'entregado'::public.order_status, updated_at = now() where id in (
  '22222222-2222-4222-8222-222222222201'::uuid,
  '22222222-2222-4222-8222-222222222202'::uuid,
  '22222222-2222-4222-8222-222222222203'::uuid,
  '22222222-2222-4222-8222-222222222204'::uuid,
  '22222222-2222-4222-8222-222222222205'::uuid,
  '22222222-2222-4222-8222-222222222206'::uuid,
  '22222222-2222-4222-8222-222222222207'::uuid,
  '22222222-2222-4222-8222-222222222208'::uuid,
  '22222222-2222-4222-8222-222222222209'::uuid,
  '22222222-2222-4222-8222-222222222210'::uuid,
  '22222222-2222-4222-8222-222222222211'::uuid,
  '22222222-2222-4222-8222-222222222212'::uuid
);
