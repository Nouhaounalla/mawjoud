-- =====================================================================
-- Mawjoud - database schema
-- Run this file FIRST in the Supabase SQL Editor, then run seed.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------

-- A medicine (one row per brand + dosage + form).
create table if not exists medications (
  id      bigint generated always as identity primary key,
  name    text not null,   -- e.g. "Doliprane"
  dosage  text,            -- e.g. "1000 mg"
  form    text             -- e.g. "comprimé", "sirop", "sachet"
);

-- Barcodes (code à barres). One medicine can have several barcodes
-- (different pack sizes, reprints...), so they live in their own table.
create table if not exists barcodes (
  id             bigint generated always as identity primary key,
  barcode        text not null unique,   -- the number printed under the bars
  medication_id  bigint not null references medications(id) on delete cascade
);

-- A pharmacy with its GPS position (used for the map and the distance).
create table if not exists pharmacies (
  id         bigint generated always as identity primary key,
  name       text not null,
  address    text,
  phone      text,
  latitude   double precision not null,
  longitude  double precision not null
);

-- Which pharmacy has which medicine, and in what quantity level.
-- We use a simple status instead of an exact number: it is much easier
-- for a pharmacist to keep up to date.
create table if not exists stock (
  id             bigint generated always as identity primary key,
  pharmacy_id    bigint not null references pharmacies(id) on delete cascade,
  medication_id  bigint not null references medications(id) on delete cascade,
  status         text not null check (status in ('in_stock', 'low', 'out')),
  updated_at     timestamptz not null default now(),
  -- one row per (pharmacy, medicine): this makes "upsert" possible
  unique (pharmacy_id, medication_id)
);

-- Indexes that make the most common lookups fast.
create index if not exists stock_medication_idx on stock (medication_id);
create index if not exists barcodes_medication_idx on barcodes (medication_id);

-- ---------------------------------------------------------------------
-- 2. Automatic "updated_at"
-- Every time a stock row is updated, refresh its timestamp. This is what
-- the app shows as "mis à jour il y a 15 min".
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists stock_set_updated_at on stock;
create trigger stock_set_updated_at
  before update on stock
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- 3. Row Level Security (RLS) - basic notes
--
-- RLS decides who can read/write each row. It is what makes it safe to
-- use the public "anon" key in the browser. Once RLS is enabled, a table
-- is locked until you add policies.
--
--  * Everybody (visitors, not logged in) can READ all four tables.
--  * Only logged-in users (Supabase Auth) can INSERT/UPDATE stock.
--  * Nobody can delete stock from the app.
--  * medications, barcodes and pharmacies are NOT writable from the app:
--    add them from the Supabase dashboard (Table Editor) or SQL Editor.
-- ---------------------------------------------------------------------
alter table medications enable row level security;
alter table barcodes    enable row level security;
alter table pharmacies  enable row level security;
alter table stock       enable row level security;

drop policy if exists "Public can read medications" on medications;
create policy "Public can read medications"
  on medications for select using (true);

drop policy if exists "Public can read barcodes" on barcodes;
create policy "Public can read barcodes"
  on barcodes for select using (true);

drop policy if exists "Public can read pharmacies" on pharmacies;
create policy "Public can read pharmacies"
  on pharmacies for select using (true);

drop policy if exists "Public can read stock" on stock;
create policy "Public can read stock"
  on stock for select using (true);

-- MVP rule: any logged-in user may change stock.
-- This is fine for a first demo, but NOT safe for real use, because a
-- logged-in pharmacist could edit another pharmacy's stock.
drop policy if exists "Logged-in users can insert stock" on stock;
create policy "Logged-in users can insert stock"
  on stock for insert to authenticated with check (true);

drop policy if exists "Logged-in users can update stock" on stock;
create policy "Logged-in users can update stock"
  on stock for update to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------
-- 4. UPGRADE PATH (recommended before real pharmacies use the app)
--
-- Link each user to the pharmacy they work in, and only allow them to
-- edit that pharmacy's stock. Uncomment and adapt when you are ready:
--
-- create table pharmacy_staff (
--   user_id      uuid   not null references auth.users(id) on delete cascade,
--   pharmacy_id  bigint not null references pharmacies(id) on delete cascade,
--   primary key (user_id, pharmacy_id)
-- );
-- alter table pharmacy_staff enable row level security;
-- create policy "Users read their own links"
--   on pharmacy_staff for select to authenticated using (user_id = auth.uid());
--
-- drop policy "Logged-in users can insert stock" on stock;
-- drop policy "Logged-in users can update stock" on stock;
--
-- create policy "Staff can insert stock of their pharmacy"
--   on stock for insert to authenticated
--   with check (exists (
--     select 1 from pharmacy_staff s
--     where s.user_id = auth.uid() and s.pharmacy_id = stock.pharmacy_id));
--
-- create policy "Staff can update stock of their pharmacy"
--   on stock for update to authenticated
--   using (exists (
--     select 1 from pharmacy_staff s
--     where s.user_id = auth.uid() and s.pharmacy_id = stock.pharmacy_id))
--   with check (exists (
--     select 1 from pharmacy_staff s
--     where s.user_id = auth.uid() and s.pharmacy_id = stock.pharmacy_id));
-- ---------------------------------------------------------------------
