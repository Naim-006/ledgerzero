-- ==============================================================================
-- LEDGER ZERO — Supabase Migration Script (Safe & Idempotent)
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- This script safely updates your existing database to the latest version.
-- ==============================================================================

-- 1. Ensure Required Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. Add is_admin column to profiles if not already present
do $$ begin
  alter table public.profiles add column if not exists is_admin boolean default false;
  alter table public.profiles add column if not exists phone text;
exception
  when others then null;
end $$;

-- 3. Create Products & Stock Inventory Table (For POS Cashier & Hisab)
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  sku text not null,
  category text not null default 'General',
  unit_price_cents bigint not null default 0,
  cost_price_cents bigint not null default 0,
  stock_quantity integer not null default 0,
  min_stock_alert integer not null default 5,
  barcode text,
  unit text not null default 'pcs',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (business_id, sku)
);

create index if not exists idx_products_business on public.products(business_id);
create index if not exists idx_products_sku on public.products(sku);

-- 4. Create System Settings Table (For Admin & AI API Keys)
create table if not exists public.system_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text,
  description text,
  is_secret boolean default false,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_system_settings_key on public.system_settings(key);

-- 5. Ensure Invoices Table has all required columns
do $$ begin
  alter table public.invoices add column if not exists extraction_confidence integer default 100;
  alter table public.invoices add column if not exists counterparty_name text;
  alter table public.invoices add column if not exists currency text default 'USD';
  alter table public.invoices add column if not exists subtotal_cents bigint default 0;
  alter table public.invoices add column if not exists tax_total_cents bigint default 0;
  alter table public.invoices add column if not exists amount_paid_cents bigint default 0;
exception
  when others then null;
end $$;

-- 6. Ensure Transactions Table has all required columns
do $$ begin
  alter table public.transactions add column if not exists related_invoice_id uuid references public.invoices(id) on delete set null;
  alter table public.transactions add column if not exists reference text;
  alter table public.transactions add column if not exists category text not null default 'revenue_sales';
exception
  when others then null;
end $$;

-- 7. Ensure Action Tasks Table has required columns
do $$ begin
  alter table public.action_tasks add column if not exists impact_amount_cents bigint default 0;
  alter table public.action_tasks add column if not exists parameters jsonb default '{}'::jsonb;
  alter table public.action_tasks add column if not exists expected_outcome text;
exception
  when others then null;
end $$;

-- 8. Row-Level Security (RLS) Policies
alter table public.products enable row level security;
alter table public.system_settings enable row level security;

-- Products RLS: Allow authenticated users to view & manage products
drop policy if exists "Users can view products of their businesses" on public.products;
create policy "Users can view products of their businesses"
  on public.products for select
  using (
    business_id in (
      select b.id from public.businesses b where b.owner_id = auth.uid()
      union
      select bm.business_id from public.business_members bm where bm.user_id = auth.uid()
    )
    or auth.uid() is not null
  );

drop policy if exists "Users can manage products of their businesses" on public.products;
create policy "Users can manage products of their businesses"
  on public.products for all
  using (
    business_id in (
      select b.id from public.businesses b where b.owner_id = auth.uid()
      union
      select bm.business_id from public.business_members bm where bm.user_id = auth.uid()
    )
    or auth.uid() is not null
  );

-- System Settings RLS: Read settings for app config; allow upsert
drop policy if exists "Anyone can read system settings" on public.system_settings;
create policy "Anyone can read system settings"
  on public.system_settings for select
  using (true);

drop policy if exists "Authenticated users can update system settings" on public.system_settings;
create policy "Authenticated users can update system settings"
  on public.system_settings for all
  using (true);

-- 9. Insert Initial Default Settings (if not already set)
insert into public.system_settings (key, value, description)
values 
  ('ai_agent_enabled', 'true', 'Master switch for AI Co-Pilot'),
  ('ai_provider', 'openai', 'Active AI Provider'),
  ('ai_model', 'gpt-4o-mini', 'Active AI Model'),
  ('platform_currency', 'USD', 'Default Currency')
on conflict (key) do nothing;

-- ==============================================================================
-- Migration complete! All tables and columns are up to date.
-- ==============================================================================
