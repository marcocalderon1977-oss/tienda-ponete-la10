-- ============================================================
-- PONETE LA 10 - ACTUALIZACION FINAL V3
-- Clave del administrador: COCO
-- Este script puede ejecutarse sobre la base ya creada.
-- ============================================================

-- Columnas adicionales
alter table public.catalogos add column if not exists imagen_url text;

-- Contador de visitas
create table if not exists public.visitas (
  id integer primary key default 1,
  cantidad bigint not null default 0,
  actualizado_en timestamptz not null default now(),
  constraint visitas_una_fila check (id = 1)
);

insert into public.visitas (id, cantidad)
values (1, 0)
on conflict (id) do nothing;

alter table public.visitas enable row level security;
drop policy if exists "Visitas visibles publicamente" on public.visitas;
create policy "Visitas visibles publicamente"
on public.visitas for select to anon, authenticated using (true);

create or replace function public.registrar_visita()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare v_total bigint;
begin
  insert into public.visitas(id,cantidad) values(1,0)
  on conflict(id) do nothing;
  update public.visitas
  set cantidad = cantidad + 1, actualizado_en = now()
  where id = 1
  returning cantidad into v_total;
  return v_total;
end;
$$;
revoke all on function public.registrar_visita() from public;
grant execute on function public.registrar_visita() to anon, authenticated;

-- Eliminar firmas anteriores antes de crear las definitivas
-- para evitar conflictos de tipos de retorno.
drop function if exists public.admin_agregar_catalogo(text,text,text,text,text);
drop function if exists public.admin_modificar_catalogo(text,uuid,text,text,text,boolean);
drop function if exists public.admin_mover_catalogo(text,uuid,integer);
drop function if exists public.admin_listar_catalogos(text);

create function public.admin_agregar_catalogo(
  p_clave text,
  p_categoria_slug text,
  p_titulo text,
  p_enlace text,
  p_imagen_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_categoria_id uuid;
  v_catalogo_id uuid;
begin
  if not public.clave_admin_correcta(p_clave) then
    raise exception 'Clave incorrecta';
  end if;
  if trim(coalesce(p_titulo,'')) = '' then
    raise exception 'Debe escribir un titulo';
  end if;
  if trim(coalesce(p_enlace,'')) = '' then
    raise exception 'Debe escribir un enlace';
  end if;

  select id into v_categoria_id
  from public.categorias
  where slug = p_categoria_slug and activa = true;

  if v_categoria_id is null then
    raise exception 'La categoria no existe';
  end if;

  insert into public.catalogos
    (categoria_id,titulo,enlace,imagen_url,orden,activo)
  values
    (v_categoria_id,trim(p_titulo),trim(p_enlace),
     nullif(trim(coalesce(p_imagen_url,'')),''),
     coalesce((select max(orden)+1 from public.catalogos where categoria_id=v_categoria_id),1),
     true)
  returning id into v_catalogo_id;

  return v_catalogo_id;
end;
$$;
revoke all on function public.admin_agregar_catalogo(text,text,text,text,text) from public;
grant execute on function public.admin_agregar_catalogo(text,text,text,text,text) to anon, authenticated;

create function public.admin_modificar_catalogo(
  p_clave text,
  p_catalogo_id uuid,
  p_titulo text,
  p_enlace text,
  p_imagen_url text default null,
  p_activo boolean default true
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.clave_admin_correcta(p_clave) then
    raise exception 'Clave incorrecta';
  end if;
  if trim(coalesce(p_titulo,'')) = '' then
    raise exception 'Debe escribir un titulo';
  end if;
  if trim(coalesce(p_enlace,'')) = '' then
    raise exception 'Debe escribir un enlace';
  end if;

  update public.catalogos
  set titulo = trim(p_titulo),
      enlace = trim(p_enlace),
      imagen_url = nullif(trim(coalesce(p_imagen_url,'')),''),
      activo = p_activo
  where id = p_catalogo_id;

  if not found then raise exception 'El catalogo no existe'; end if;
  return true;
end;
$$;
revoke all on function public.admin_modificar_catalogo(text,uuid,text,text,text,boolean) from public;
grant execute on function public.admin_modificar_catalogo(text,uuid,text,text,text,boolean) to anon, authenticated;

create function public.admin_mover_catalogo(
  p_clave text,
  p_catalogo_id uuid,
  p_direccion integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_categoria uuid;
  v_orden integer;
  v_otro uuid;
  v_otro_orden integer;
begin
  if not public.clave_admin_correcta(p_clave) then
    raise exception 'Clave incorrecta';
  end if;

  select categoria_id, orden into v_categoria, v_orden
  from public.catalogos where id = p_catalogo_id;

  if v_categoria is null then raise exception 'El catalogo no existe'; end if;

  if p_direccion < 0 then
    select id, orden into v_otro, v_otro_orden
    from public.catalogos
    where categoria_id = v_categoria and orden < v_orden
    order by orden desc limit 1;
  else
    select id, orden into v_otro, v_otro_orden
    from public.catalogos
    where categoria_id = v_categoria and orden > v_orden
    order by orden asc limit 1;
  end if;

  if v_otro is null then return true; end if;

  update public.catalogos set orden = -999999 where id = p_catalogo_id;
  update public.catalogos set orden = v_orden where id = v_otro;
  update public.catalogos set orden = v_otro_orden where id = p_catalogo_id;
  return true;
end;
$$;
revoke all on function public.admin_mover_catalogo(text,uuid,integer) from public;
grant execute on function public.admin_mover_catalogo(text,uuid,integer) to anon, authenticated;

create function public.admin_listar_catalogos(p_clave text)
returns table (
  catalogo_id uuid,
  categoria_id uuid,
  categoria_slug text,
  seccion text,
  categoria text,
  titulo text,
  enlace text,
  imagen_url text,
  activo boolean,
  orden integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.clave_admin_correcta(p_clave) then
    raise exception 'Clave incorrecta';
  end if;

  return query
  select cat.id,c.id,c.slug,c.seccion,c.nombre,
         cat.titulo,cat.enlace,cat.imagen_url,cat.activo,cat.orden
  from public.categorias c
  left join public.catalogos cat on cat.categoria_id = c.id
  order by c.orden, cat.orden nulls last;
end;
$$;
revoke all on function public.admin_listar_catalogos(text) from public;
grant execute on function public.admin_listar_catalogos(text) to anon, authenticated;

select 'V3 lista' as resultado,
       (select count(*) from public.categorias) as categorias,
       (select cantidad from public.visitas where id=1) as visitas;
