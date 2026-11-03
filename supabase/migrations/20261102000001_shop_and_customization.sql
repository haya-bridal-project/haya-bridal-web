-- =========================================================================
-- HAYA BRIDAL: E-COMMERCE PURCHASE, DRESS CUSTOMIZATION & SHIPPING SCHEMA
-- =========================================================================
-- Run this script in the Supabase Dashboard -> SQL Editor to apply all recent
-- database additions (product categories, dress customization, and shipping).
-- This script is safe and idempotent (can be run multiple times safely).

-- 1. PRODUCTS: Add category ('dress' or 'ornament'), customization toggle, and direct buy price
alter table if exists public.products
  add column if not exists category text not null default 'dress' check (category in ('dress', 'ornament', 'ornaments')),
  add column if not exists allow_customization boolean not null default true,
  add column if not exists price_paise integer;

-- Backfill price_paise with rental_price_paise for any existing products where price_paise is null
update public.products
set price_paise = rental_price_paise
where price_paise is null and rental_price_paise is not null;

-- Index for fast category filtering (Dresses vs Fine Ornaments)
create index if not exists products_category_idx 
  on public.products (category) 
  where is_published and not is_archived;

-- 2. BOOKINGS / ORDERS: Add dress customization payload and order_type
alter table if exists public.bookings
  add column if not exists customization jsonb default '{}'::jsonb,
  add column if not exists order_type text default 'dress';

-- Set default security deposit to 0 (since outfits and ornaments are direct purchases, not rentals)
alter table if exists public.bookings
  alter column deposit_paise set default 0;

-- 3. SITE SETTINGS: Ensure default shipping configuration exists (0 GST policy)
insert into public.site_settings (key, value)
values (
  'shipping',
  '{"fee_paise": 0, "label": "Insured Shipping Across India", "estimated_days": "3-5 Business Days"}'::jsonb
)
on conflict (key) do nothing;
