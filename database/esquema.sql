-- Esquema de la base de datos: catálogo de tienda de ropa
-- Se ejecuta en el SQL Editor de Supabase. Se puede repetir sin romper nada.

-- ============================================================
-- PARTE 1: TABLAS (PostgreSQL estándar, funciona también en pgAdmin)
-- ============================================================

create table if not exists categorias (
  id bigint generated always as identity primary key,
  nombre text not null unique,
  slug text not null unique
);

create table if not exists productos (
  id bigint generated always as identity primary key,
  categoria_id bigint not null references categorias(id),
  nombre text not null,
  descripcion text,
  precio numeric(10,2) not null check (precio >= 0),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create table if not exists variantes (
  id bigint generated always as identity primary key,
  producto_id bigint not null references productos(id) on delete cascade,
  talla text not null,
  color text not null,
  stock integer not null default 0 check (stock >= 0),
  unique (producto_id, talla, color)
);

create table if not exists imagenes (
  id bigint generated always as identity primary key,
  producto_id bigint not null references productos(id) on delete cascade,
  url text not null,
  orden smallint not null default 1
);

create index if not exists idx_productos_categoria on productos (categoria_id);
create index if not exists idx_variantes_producto on variantes (producto_id);
create index if not exists idx_imagenes_producto on imagenes (producto_id);

insert into categorias (nombre, slug) values
  ('Hombre', 'hombre'), ('Mujer', 'mujer'), ('Niños', 'ninos')
on conflict (slug) do nothing;

-- ============================================================
-- PARTE 2: SEGURIDAD (solo Supabase: usa los roles anon y authenticated)
-- El público solo lee. Solo un usuario con sesión escribe.
-- ============================================================

alter table categorias enable row level security;
alter table productos  enable row level security;
alter table variantes  enable row level security;
alter table imagenes   enable row level security;

drop policy if exists "leer categorias" on categorias;
drop policy if exists "leer productos"  on productos;
drop policy if exists "leer variantes"  on variantes;
drop policy if exists "leer imagenes"   on imagenes;
drop policy if exists "admin categorias" on categorias;
drop policy if exists "admin productos"  on productos;
drop policy if exists "admin variantes"  on variantes;
drop policy if exists "admin imagenes"   on imagenes;

create policy "leer categorias" on categorias for select using (true);
create policy "leer productos"  on productos  for select using (activo = true);
create policy "leer variantes"  on variantes  for select using (true);
create policy "leer imagenes"   on imagenes   for select using (true);

create policy "admin categorias" on categorias for all to authenticated using (true) with check (true);
create policy "admin productos"  on productos  for all to authenticated using (true) with check (true);
create policy "admin variantes"  on variantes  for all to authenticated using (true) with check (true);
create policy "admin imagenes"   on imagenes   for all to authenticated using (true) with check (true);

grant usage on schema public to anon, authenticated;
grant select on categorias, productos, variantes, imagenes to anon, authenticated;
grant all on categorias, productos, variantes, imagenes to authenticated;

-- ============================================================
-- PARTE 3: ALMACENAMIENTO DE FOTOS (solo Supabase Storage)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

drop policy if exists "subir fotos admin" on storage.objects;
drop policy if exists "borrar fotos admin" on storage.objects;

create policy "subir fotos admin" on storage.objects
  for insert to authenticated with check (bucket_id = 'productos');

create policy "borrar fotos admin" on storage.objects
  for delete to authenticated using (bucket_id = 'productos');