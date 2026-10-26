-- =====================================================================
-- Haya Premium Bridal Rental — core schema
-- Money: all amounts are stored as INTEGER paise (INR * 100).
-- Dates: rental dates are DATE values interpreted in Asia/Kolkata.
-- Overlap rule: a booking occupies [start_date, end_date + buffer_days]
--               (inclusive). Two bookings conflict when those ranges overlap.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Admin authorization (explicit allowlist, never client-editable)
-- ---------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('owner','admin','staff')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

create or replace function public.is_owner_or_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid() and role in ('owner','admin'));
$$;

-- ---------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (new.id, new.email,
          nullif(new.raw_user_meta_data->>'full_name',''),
          nullif(new.raw_user_meta_data->>'phone',''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Site settings & editable content
-- ---------------------------------------------------------------------
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
create trigger site_settings_updated before update on public.site_settings
  for each row execute function public.set_updated_at();

create table if not exists public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  eyebrow text,
  heading text not null,
  body text,
  cta_label text,
  cta_href text,
  side_text text,
  image_url text,
  image_public_id text,
  image_alt text,
  mobile_image_url text,
  mobile_image_public_id text,
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger hero_slides_updated before update on public.hero_slides
  for each row execute function public.set_updated_at();

create table if not exists public.promo_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  cta_label text,
  cta_href text,
  image_url text,
  image_public_id text,
  image_alt text,
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger promo_banners_updated before update on public.promo_banners
  for each row execute function public.set_updated_at();

create table if not exists public.content_pages (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  body text not null default '',
  is_published boolean not null default false,
  seo_description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
create trigger content_pages_updated before update on public.content_pages
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$' and slug <> 'all'),
  tagline text,
  description text,
  image_url text,
  image_public_id text,
  image_alt text,
  is_published boolean not null default false,
  show_on_home boolean not null default true,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists collections_published_idx on public.collections (is_published, sort_order);
create trigger collections_updated before update on public.collections
  for each row execute function public.set_updated_at();

create table if not exists public.size_guides (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  notes text,
  columns text[] not null default '{}',
  rows jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger size_guides_updated before update on public.size_guides
  for each row execute function public.set_updated_at();

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid references public.collections(id) on delete set null,
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  short_description text,
  description text,
  rental_price_paise integer not null check (rental_price_paise >= 0),
  compare_at_price_paise integer check (compare_at_price_paise is null or compare_at_price_paise >= 0),
  rental_duration_days integer not null default 3 check (rental_duration_days between 1 and 60),
  deposit_paise integer not null default 0 check (deposit_paise >= 0),
  quantity integer not null default 1 check (quantity >= 0),
  buffer_days integer check (buffer_days is null or buffer_days between 0 and 30),
  colors jsonb not null default '[]'::jsonb,   -- [{ "name": "Ivory", "hex": "#F3E9DA" }]
  sizes text[] not null default '{}',
  size_guide_id uuid references public.size_guides(id) on delete set null,
  care_instructions text,
  rental_conditions text,
  is_published boolean not null default false,
  is_featured boolean not null default false,
  is_archived boolean not null default false,
  sort_order int not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_collection_idx on public.products (collection_id) where is_published and not is_archived;
create index if not exists products_listing_idx on public.products (is_published, is_archived, sort_order);
create index if not exists products_featured_idx on public.products (is_featured) where is_published and not is_archived;
create index if not exists products_sizes_idx on public.products using gin (sizes);
create index if not exists products_colors_idx on public.products using gin (colors);
create trigger products_updated before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products add column if not exists color_names text[] not null default '{}';
create index if not exists products_color_names_idx on public.products using gin (color_names);
create or replace function public.products_sync_color_names()
returns trigger language plpgsql as $$
begin
  new.color_names := coalesce(array(select c->>'name' from jsonb_array_elements(coalesce(new.colors,'[]'::jsonb)) c where c->>'name' is not null), '{}');
  return new;
end $$;
create trigger products_color_names before insert or update of colors on public.products
  for each row execute function public.products_sync_color_names();

-- Additional rental duration options (the base option lives on products).
create table if not exists public.product_rental_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  duration_days integer not null check (duration_days between 1 and 60),
  price_paise integer not null check (price_paise >= 0),
  sort_order int not null default 0,
  unique (product_id, duration_days)
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  public_id text not null,
  alt text,
  color_name text,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  width int,
  height int,
  created_at timestamptz not null default now()
);
create index if not exists product_images_product_idx on public.product_images (product_id, sort_order);
create unique index if not exists product_images_one_primary on public.product_images (product_id) where is_primary;

create table if not exists public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade, -- null = applies to every product
  start_date date not null,
  end_date date not null,
  reason text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);
create index if not exists blocked_dates_product_idx on public.blocked_dates (product_id, start_date, end_date);

create table if not exists public.wishlist_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ---------------------------------------------------------------------
-- Bookings & payments
-- ---------------------------------------------------------------------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_id uuid references auth.users(id) on delete set null,
  product_id uuid not null references public.products(id) on delete restrict,
  product_name text not null,
  size text,
  color text,
  start_date date not null,
  end_date date not null,
  duration_days integer not null check (duration_days > 0),
  buffer_days integer not null default 0,
  rental_amount_paise integer not null check (rental_amount_paise >= 0),
  deposit_paise integer not null default 0 check (deposit_paise >= 0),
  fees_paise integer not null default 0 check (fees_paise >= 0),
  discount_paise integer not null default 0 check (discount_paise >= 0),
  total_paise integer not null check (total_paise >= 0),
  currency text not null default 'INR',
  workflow text not null check (workflow in ('payment','request')),
  status text not null check (status in (
    'pending_payment','requested','confirmed','rejected','cancelled',
    'picked_up','returned','completed','expired')),
  payment_status text not null default 'unpaid' check (payment_status in (
    'unpaid','pending','paid','failed','refunded','partially_refunded')),
  hold_expires_at timestamptz,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  customer_address text,
  event_date date,
  notes text,
  admin_notes text,
  cancellation_reason text,
  cancelled_at timestamptz,
  picked_up_at timestamptz,
  returned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);
create index if not exists bookings_customer_idx on public.bookings (customer_id, created_at desc);
create index if not exists bookings_product_dates_idx on public.bookings (product_id, start_date, end_date);
create index if not exists bookings_status_idx on public.bookings (status, created_at desc);
create trigger bookings_updated before update on public.bookings
  for each row execute function public.set_updated_at();

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  razorpay_order_id text not null unique,
  razorpay_payment_id text unique,
  amount_paise integer not null check (amount_paise > 0),
  currency text not null default 'INR',
  status text not null default 'created' check (status in (
    'created','authorized','captured','failed','refunded','partially_refunded')),
  method text,
  verified_at timestamptz,
  refund_id text,
  refund_status text,
  refund_amount_paise integer,
  error_code text,
  error_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payments_booking_idx on public.payments (booking_id);
create trigger payments_updated before update on public.payments
  for each row execute function public.set_updated_at();

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,          -- x-razorpay-event-id (idempotency key)
  event_type text not null,
  razorpay_order_id text,
  razorpay_payment_id text,
  summary jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  actor_id uuid references auth.users(id),
  note text,
  created_at timestamptz not null default now()
);
create index if not exists booking_events_booking_idx on public.booking_events (booking_id, created_at);

-- ---------------------------------------------------------------------
-- Enquiries & consultations
-- ---------------------------------------------------------------------
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  kind text not null default 'product' check (kind in ('product','contact')),
  name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  preferred_date date,
  size text,
  status text not null default 'new' check (status in ('new','in_progress','closed')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists enquiries_status_idx on public.enquiries (status, created_at desc);
create trigger enquiries_updated before update on public.enquiries
  for each row execute function public.set_updated_at();

create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  phone text not null,
  preferred_date date not null,
  preferred_time text,
  mode text not null default 'in_store' check (mode in ('in_store','video','phone')),
  message text,
  status text not null default 'requested' check (status in ('requested','confirmed','completed','cancelled')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists consultations_status_idx on public.consultations (status, preferred_date);
create trigger consultations_updated before update on public.consultations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Logs
-- ---------------------------------------------------------------------
create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text unique,
  event_type text not null,
  to_email text not null,
  subject text not null,
  status text not null default 'queued' check (status in ('queued','sent','failed','skipped')),
  provider_message_id text,
  error text,
  attempts int not null default 0,
  related_type text,
  related_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists email_logs_status_idx on public.email_logs (status, created_at desc);
create trigger email_logs_updated before update on public.email_logs
  for each row execute function public.set_updated_at();

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);

-- =====================================================================
-- Booking rules & availability
-- =====================================================================

-- Booking rules are read from site_settings key 'booking':
-- { "workflow": "payment"|"request", "hold_minutes": 20, "request_hold_hours": 48,
--   "buffer_days": 2, "min_lead_days": 1, "max_advance_days": 365, "fees_paise": 0,
--   "collect_deposit_online": true }
create or replace function public.booking_rules()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce((select value from public.site_settings where key = 'booking'), '{}'::jsonb);
$$;

-- Active bookings that occupy inventory.
create or replace function public.booking_is_blocking(b public.bookings)
returns boolean language sql stable as $$
  select b.status in ('confirmed','picked_up')
      or (b.status in ('pending_payment','requested') and b.hold_expires_at is not null and b.hold_expires_at > now());
$$;

-- Units still free for [p_start, p_end] (inclusive), honouring buffers & blocked dates.
create or replace function public.product_units_available(p_product_id uuid, p_start date, p_end date, p_exclude_booking uuid default null)
returns integer language plpgsql stable security definer set search_path = public as $$
declare
  v_qty int;
  v_buffer int;
  v_used int;
  v_blocked boolean;
begin
  select p.quantity, coalesce(p.buffer_days, (public.booking_rules()->>'buffer_days')::int, 0)
    into v_qty, v_buffer
    from public.products p
   where p.id = p_product_id and p.is_published and not p.is_archived;
  if v_qty is null then return 0; end if;

  select exists (
    select 1 from public.blocked_dates bd
     where (bd.product_id = p_product_id or bd.product_id is null)
       and daterange(bd.start_date, bd.end_date, '[]') && daterange(p_start, p_end + v_buffer, '[]')
  ) into v_blocked;
  if v_blocked then return 0; end if;

  select count(*) into v_used
    from public.bookings b
   where b.product_id = p_product_id
     and (p_exclude_booking is null or b.id <> p_exclude_booking)
     and public.booking_is_blocking(b)
     and daterange(b.start_date, b.end_date + b.buffer_days, '[]')
         && daterange(p_start, p_end + v_buffer, '[]');

  return greatest(v_qty - v_used, 0);
end $$;

-- Public availability check (no booking data is exposed).
create or replace function public.check_availability(p_product_id uuid, p_start date, p_duration int)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_end date := p_start + (p_duration - 1);
  v_rules jsonb := public.booking_rules();
  v_today date := (now() at time zone 'Asia/Kolkata')::date;
  v_units int;
begin
  if p_duration is null or p_duration < 1 then
    return jsonb_build_object('available', false, 'reason', 'invalid_duration');
  end if;
  if p_start < v_today + coalesce((v_rules->>'min_lead_days')::int, 1) then
    return jsonb_build_object('available', false, 'reason', 'too_soon');
  end if;
  if p_start > v_today + coalesce((v_rules->>'max_advance_days')::int, 365) then
    return jsonb_build_object('available', false, 'reason', 'too_far');
  end if;
  v_units := public.product_units_available(p_product_id, p_start, v_end);
  return jsonb_build_object('available', v_units > 0, 'units', v_units,
                            'start_date', p_start, 'end_date', v_end,
                            'reason', case when v_units > 0 then null else 'unavailable' end);
end $$;

-- Product ids available for a date range (used by listing filters).
create or replace function public.available_product_ids(p_start date, p_end date)
returns setof uuid language sql stable security definer set search_path = public as $$
  select p.id from public.products p
   where p.is_published and not p.is_archived
     and public.product_units_available(p.id, p_start, p_end) > 0;
$$;

-- Generates a short human-friendly reference: HAYA-YYMMDD-XXXXX
create or replace function public.generate_booking_reference()
returns text language plpgsql as $$
declare
  v_ref text;
begin
  loop
    v_ref := 'HAYA-' || to_char(now() at time zone 'Asia/Kolkata', 'YYMMDD') || '-' ||
             upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 5));
    exit when not exists (select 1 from public.bookings where reference = v_ref);
  end loop;
  return v_ref;
end $$;

-- Creates a booking hold. Prices come only from the database.
-- Concurrency: the product row is locked FOR UPDATE so concurrent holds for
-- the same product serialize; availability is re-counted inside the lock.
create or replace function public.create_booking(
  p_product_id uuid,
  p_start date,
  p_duration int,
  p_size text,
  p_color text,
  p_name text,
  p_email text,
  p_phone text,
  p_address text,
  p_event_date date,
  p_notes text,
  p_workflow text
) returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_p public.products;
  v_rules jsonb := public.booking_rules();
  v_price int;
  v_end date;
  v_buffer int;
  v_units int;
  v_fees int := coalesce((v_rules->>'fees_paise')::int, 0);
  v_total int;
  v_hold timestamptz;
  v_status text;
  v_ref text;
  v_id uuid;
  v_avail jsonb;
begin
  if v_uid is null then
    raise exception 'auth_required' using errcode = 'P0001';
  end if;
  if p_workflow not in ('payment','request') then
    raise exception 'invalid_workflow' using errcode = 'P0001';
  end if;

  select * into v_p from public.products
   where id = p_product_id and is_published and not is_archived
   for update;
  if not found then
    raise exception 'product_unavailable' using errcode = 'P0001';
  end if;

  if p_duration = v_p.rental_duration_days then
    v_price := v_p.rental_price_paise;
  else
    select price_paise into v_price from public.product_rental_options
     where product_id = v_p.id and duration_days = p_duration;
    if v_price is null then
      raise exception 'invalid_duration' using errcode = 'P0001';
    end if;
  end if;

  if array_length(v_p.sizes, 1) > 0 and (p_size is null or not (p_size = any (v_p.sizes))) then
    raise exception 'invalid_size' using errcode = 'P0001';
  end if;
  if jsonb_array_length(v_p.colors) > 0 and (p_color is null or not exists (
      select 1 from jsonb_array_elements(v_p.colors) c where c->>'name' = p_color)) then
    raise exception 'invalid_color' using errcode = 'P0001';
  end if;

  v_avail := public.check_availability(v_p.id, p_start, p_duration);
  if not (v_avail->>'available')::boolean then
    raise exception '%', coalesce(v_avail->>'reason', 'unavailable') using errcode = 'P0001';
  end if;

  v_end := p_start + (p_duration - 1);
  v_buffer := coalesce(v_p.buffer_days, (v_rules->>'buffer_days')::int, 0);
  v_total := v_price + v_p.deposit_paise + v_fees;

  if p_workflow = 'payment' then
    v_status := 'pending_payment';
    v_hold := now() + make_interval(mins => coalesce((v_rules->>'hold_minutes')::int, 20));
  else
    v_status := 'requested';
    v_hold := now() + make_interval(hours => coalesce((v_rules->>'request_hold_hours')::int, 48));
  end if;

  v_ref := public.generate_booking_reference();

  insert into public.bookings (
    reference, customer_id, product_id, product_name, size, color,
    start_date, end_date, duration_days, buffer_days,
    rental_amount_paise, deposit_paise, fees_paise, discount_paise, total_paise,
    workflow, status, payment_status, hold_expires_at,
    customer_name, customer_email, customer_phone, customer_address, event_date, notes)
  values (
    v_ref, v_uid, v_p.id, v_p.name, nullif(p_size,''), nullif(p_color,''),
    p_start, v_end, p_duration, v_buffer,
    v_price, v_p.deposit_paise, v_fees, 0, v_total,
    p_workflow, v_status, case when p_workflow = 'payment' then 'pending' else 'unpaid' end, v_hold,
    p_name, lower(p_email), p_phone, nullif(p_address,''), p_event_date, nullif(p_notes,''))
  returning id into v_id;

  insert into public.booking_events (booking_id, event_type, to_status, actor_id)
  values (v_id, 'created', v_status, v_uid);

  return jsonb_build_object('id', v_id, 'reference', v_ref, 'total_paise', v_total,
                            'status', v_status, 'hold_expires_at', v_hold);
end $$;

-- Marks stale holds as expired (called opportunistically by the app/admin).
create or replace function public.expire_stale_holds()
returns integer language plpgsql volatile security definer set search_path = public as $$
declare v_count int;
begin
  with x as (
    update public.bookings
       set status = 'expired', payment_status = case when payment_status = 'pending' then 'unpaid' else payment_status end
     where status in ('pending_payment','requested')
       and hold_expires_at is not null and hold_expires_at < now()
       and payment_status <> 'paid'
    returning id
  )
  select count(*) into v_count from x;
  return v_count;
end $$;

-- Confirms a paid booking, re-checking inventory inside a product lock.
-- Only callable by the service role (payment verification / webhook).
create or replace function public.confirm_paid_booking(p_booking_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_b public.bookings;
  v_units int;
begin
  select * into v_b from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'booking_not_found'; end if;
  if v_b.status = 'confirmed' then
    return jsonb_build_object('status', 'confirmed', 'changed', false);
  end if;
  perform 1 from public.products where id = v_b.product_id for update;
  v_units := public.product_units_available(v_b.product_id, v_b.start_date, v_b.end_date, v_b.id);
  if v_units <= 0 then
    update public.bookings set payment_status = 'paid', admin_notes = coalesce(admin_notes || E'\n', '') ||
      'Payment received but inventory conflicted at confirmation. Manual review / refund required.'
     where id = v_b.id;
    insert into public.booking_events (booking_id, event_type, from_status, to_status, note)
    values (v_b.id, 'conflict_after_payment', v_b.status, v_b.status, 'Inventory unavailable at confirmation');
    return jsonb_build_object('status', v_b.status, 'changed', false, 'conflict', true);
  end if;
  update public.bookings set status = 'confirmed', payment_status = 'paid', hold_expires_at = null
   where id = v_b.id;
  insert into public.booking_events (booking_id, event_type, from_status, to_status, note)
  values (v_b.id, 'payment_confirmed', v_b.status, 'confirmed', 'Payment verified');
  return jsonb_build_object('status', 'confirmed', 'changed', true);
end $$;

-- Customer cancellation of own unpaid holds / requests.
create or replace function public.cancel_own_booking(p_booking_id uuid, p_reason text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare v_b public.bookings;
begin
  select * into v_b from public.bookings where id = p_booking_id and customer_id = auth.uid() for update;
  if not found then raise exception 'booking_not_found' using errcode = 'P0001'; end if;
  if v_b.status not in ('pending_payment','requested') or v_b.payment_status = 'paid' then
    raise exception 'cannot_cancel' using errcode = 'P0001';
  end if;
  update public.bookings set status = 'cancelled', cancelled_at = now(),
         cancellation_reason = nullif(p_reason,''), hold_expires_at = null,
         payment_status = case when payment_status = 'pending' then 'unpaid' else payment_status end
   where id = v_b.id;
  insert into public.booking_events (booking_id, event_type, from_status, to_status, actor_id, note)
  values (v_b.id, 'cancelled_by_customer', v_b.status, 'cancelled', auth.uid(), p_reason);
  return jsonb_build_object('status','cancelled');
end $$;

-- Admin status transitions (validated, auditable).
create or replace function public.admin_update_booking_status(p_booking_id uuid, p_status text, p_note text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_b public.bookings;
  v_units int;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into v_b from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'booking_not_found' using errcode = 'P0001'; end if;

  if not (
       (v_b.status = 'requested' and p_status in ('confirmed','rejected','cancelled'))
    or (v_b.status = 'pending_payment' and p_status in ('cancelled'))
    or (v_b.status = 'confirmed' and p_status in ('picked_up','cancelled'))
    or (v_b.status = 'picked_up' and p_status in ('returned'))
    or (v_b.status = 'returned' and p_status in ('completed'))
  ) then
    raise exception 'invalid_transition' using errcode = 'P0001';
  end if;

  if p_status = 'confirmed' then
    perform 1 from public.products where id = v_b.product_id for update;
    v_units := public.product_units_available(v_b.product_id, v_b.start_date, v_b.end_date, v_b.id);
    if v_units <= 0 then raise exception 'unavailable' using errcode = 'P0001'; end if;
  end if;

  update public.bookings set
    status = p_status,
    hold_expires_at = case when p_status in ('confirmed','rejected','cancelled') then null else hold_expires_at end,
    cancelled_at = case when p_status in ('cancelled','rejected') then now() else cancelled_at end,
    cancellation_reason = case when p_status in ('cancelled','rejected') then coalesce(nullif(p_note,''), cancellation_reason) else cancellation_reason end,
    picked_up_at = case when p_status = 'picked_up' then now() else picked_up_at end,
    returned_at = case when p_status = 'returned' then now() else returned_at end
  where id = v_b.id;

  insert into public.booking_events (booking_id, event_type, from_status, to_status, actor_id, note)
  values (v_b.id, 'status_changed', v_b.status, p_status, auth.uid(), nullif(p_note,''));
  insert into public.audit_logs (actor_id, action, entity, entity_id, details)
  values (auth.uid(), 'booking.status', 'bookings', v_b.id::text,
          jsonb_build_object('from', v_b.status, 'to', p_status, 'note', p_note));

  return jsonb_build_object('status', p_status);
end $$;

-- Dashboard metrics (admin only).
create or replace function public.admin_dashboard_metrics()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_today date := (now() at time zone 'Asia/Kolkata')::date;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return jsonb_build_object(
    'published_products', (select count(*) from products where is_published and not is_archived),
    'total_products', (select count(*) from products where not is_archived),
    'collections', (select count(*) from collections),
    'new_enquiries', (select count(*) from enquiries where status = 'new'),
    'new_consultations', (select count(*) from consultations where status = 'requested'),
    'pending_bookings', (select count(*) from bookings where status in ('pending_payment','requested') and (hold_expires_at is null or hold_expires_at > now())),
    'confirmed_bookings', (select count(*) from bookings where status = 'confirmed'),
    'payments_received_paise', (select coalesce(sum(amount_paise),0) from payments where status = 'captured'),
    'payments_count', (select count(*) from payments where status = 'captured'),
    'upcoming_rentals', (select count(*) from bookings where status = 'confirmed' and start_date >= v_today)
  );
end $$;

-- =====================================================================
-- Grants for RPCs
-- =====================================================================
revoke all on function public.create_booking(uuid,date,int,text,text,text,text,text,text,date,text,text) from public, anon;
grant execute on function public.create_booking(uuid,date,int,text,text,text,text,text,text,date,text,text) to authenticated;
grant execute on function public.check_availability(uuid,date,int) to anon, authenticated;
grant execute on function public.available_product_ids(date,date) to anon, authenticated;
revoke all on function public.product_units_available(uuid,date,date,uuid) from public, anon, authenticated;
revoke all on function public.confirm_paid_booking(uuid) from public, anon, authenticated;
grant execute on function public.confirm_paid_booking(uuid) to service_role;
revoke all on function public.expire_stale_holds() from public, anon;
grant execute on function public.expire_stale_holds() to authenticated, service_role;
revoke all on function public.cancel_own_booking(uuid,text) from public, anon;
grant execute on function public.cancel_own_booking(uuid,text) to authenticated;
revoke all on function public.admin_update_booking_status(uuid,text,text) from public, anon;
grant execute on function public.admin_update_booking_status(uuid,text,text) to authenticated;
revoke all on function public.admin_dashboard_metrics() from public, anon;
grant execute on function public.admin_dashboard_metrics() to authenticated;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.admin_users enable row level security;
alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.hero_slides enable row level security;
alter table public.promo_banners enable row level security;
alter table public.content_pages enable row level security;
alter table public.collections enable row level security;
alter table public.size_guides enable row level security;
alter table public.products enable row level security;
alter table public.product_rental_options enable row level security;
alter table public.product_images enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
alter table public.booking_events enable row level security;
alter table public.enquiries enable row level security;
alter table public.consultations enable row level security;
alter table public.email_logs enable row level security;
alter table public.audit_logs enable row level security;

-- admin_users: admins can see the list; only owners manage it.
create policy admin_users_select on public.admin_users for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid() and role = 'owner');
$$;
create policy admin_users_owner_manage on public.admin_users for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

-- profiles
create policy profiles_own_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_own_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_own_insert on public.profiles for insert to authenticated
  with check (id = auth.uid());

-- Public content (read when published) + admin write
create policy site_settings_read on public.site_settings for select to anon, authenticated using (true);
create policy site_settings_admin on public.site_settings for all to authenticated
  using (public.is_owner_or_admin()) with check (public.is_owner_or_admin());

create policy hero_read on public.hero_slides for select to anon, authenticated using (is_published or public.is_admin());
create policy hero_admin on public.hero_slides for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy promo_read on public.promo_banners for select to anon, authenticated using (is_published or public.is_admin());
create policy promo_admin on public.promo_banners for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy pages_read on public.content_pages for select to anon, authenticated using (is_published or public.is_admin());
create policy pages_admin on public.content_pages for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy collections_read on public.collections for select to anon, authenticated using (is_published or public.is_admin());
create policy collections_admin on public.collections for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy size_guides_read on public.size_guides for select to anon, authenticated using (true);
create policy size_guides_admin on public.size_guides for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy products_read on public.products for select to anon, authenticated
  using ((is_published and not is_archived) or public.is_admin());
create policy products_admin on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy rental_options_read on public.product_rental_options for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and ((p.is_published and not p.is_archived) or public.is_admin())));
create policy rental_options_admin on public.product_rental_options for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy product_images_read on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and ((p.is_published and not p.is_archived) or public.is_admin())));
create policy product_images_admin on public.product_images for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy blocked_dates_admin on public.blocked_dates for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- wishlist
create policy wishlist_own on public.wishlist_items for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- bookings: customers read their own; inserts only via create_booking().
create policy bookings_own_select on public.bookings for select to authenticated
  using (customer_id = auth.uid() or public.is_admin());
-- No direct UPDATE policy: admins change status via admin_update_booking_status()
-- and notes via admin_set_booking_notes(), so payment status cannot be hand-edited.
create or replace function public.admin_set_booking_notes(p_booking_id uuid, p_notes text)
returns void language plpgsql volatile security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.bookings set admin_notes = nullif(p_notes,'') where id = p_booking_id;
  insert into public.audit_logs (actor_id, action, entity, entity_id, details)
  values (auth.uid(), 'booking.notes', 'bookings', p_booking_id::text, '{}'::jsonb);
end $$;
revoke all on function public.admin_set_booking_notes(uuid,text) from public, anon;
grant execute on function public.admin_set_booking_notes(uuid,text) to authenticated;

create policy payments_own_select on public.payments for select to authenticated
  using (public.is_admin() or exists (select 1 from public.bookings b where b.id = booking_id and b.customer_id = auth.uid()));

create policy payment_events_admin on public.payment_events for select to authenticated using (public.is_admin());

create policy booking_events_select on public.booking_events for select to authenticated
  using (public.is_admin() or exists (select 1 from public.bookings b where b.id = booking_id and b.customer_id = auth.uid()));

-- enquiries & consultations: anyone may create (validated server-side); read own or admin.
create policy enquiries_insert on public.enquiries for insert to anon, authenticated
  with check (status = 'new' and admin_notes is null and (customer_id is null or customer_id = auth.uid()));
create policy enquiries_select on public.enquiries for select to authenticated
  using (public.is_admin() or customer_id = auth.uid());
create policy enquiries_admin_update on public.enquiries for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy enquiries_admin_delete on public.enquiries for delete to authenticated using (public.is_admin());

create policy consultations_insert on public.consultations for insert to anon, authenticated
  with check (status = 'requested' and admin_notes is null and (customer_id is null or customer_id = auth.uid()));
create policy consultations_select on public.consultations for select to authenticated
  using (public.is_admin() or customer_id = auth.uid());
create policy consultations_admin_update on public.consultations for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy consultations_admin_delete on public.consultations for delete to authenticated using (public.is_admin());

create policy email_logs_admin on public.email_logs for select to authenticated using (public.is_admin());
create policy audit_logs_admin_select on public.audit_logs for select to authenticated using (public.is_admin());
create policy audit_logs_admin_insert on public.audit_logs for insert to authenticated
  with check (public.is_admin() and actor_id = auth.uid());

-- =====================================================================
-- Default (non-business) configuration rows. No products/collections are seeded.
-- Text below is the approved design copy; edit it in /admin/homepage.
-- =====================================================================
insert into public.site_settings (key, value) values
  ('booking', '{"workflow":"request","hold_minutes":20,"request_hold_hours":48,"buffer_days":2,"min_lead_days":1,"max_advance_days":365,"fees_paise":0}'::jsonb),
  ('brand', '{"site_name":"Haya","tagline":"Premium Bridal Rental","logo_url":null,"logo_public_id":null,"logo_light_url":null,"logo_light_public_id":null}'::jsonb),
  ('contact', '{"email":null,"phone":null,"whatsapp":null,"address":null,"hours":null,"map_url":null}'::jsonb),
  ('social', '{"instagram":null,"facebook":null,"pinterest":null,"youtube":null}'::jsonb),
  ('home', '{"highlights":["Premium Collection","Personal Styling","Affordable Rental","Hassle Free Process"],"show_collection_cards":true,"show_featured_collections":true,"show_featured_products":true,"featured_heading":"Featured Collections","products_heading":"Curated For You"}'::jsonb),
  ('product_services', '{"items":["Personal Styling Assistance","Customization Available","Secure Payment","Hassle Free Pickup & Return"]}'::jsonb),
  ('email', '{"admin_notification_email":null}'::jsonb)
on conflict (key) do nothing;

insert into public.content_pages (slug, title, body, is_published) values
  ('about', 'About Haya', '', false),
  ('how-it-works', 'How It Works', '', false),
  ('rental-policy', 'Rental Policy', '', false),
  ('privacy-policy', 'Privacy Policy', '', false),
  ('terms', 'Terms and Conditions', '', false),
  ('cancellation-refund', 'Cancellation and Refund Policy', '', false)
on conflict (slug) do nothing;
