-- CleanRoute Phase 1 Schema
-- Run this in Supabase SQL Editor

-- CUSTOMERS
create table customers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users not null,
  name text not null,
  contact_name text,
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamptz default now()
);
alter table customers enable row level security;
create policy "owner access" on customers for all using (auth.uid() = owner_id);

-- WORKERS
create table workers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users not null,
  name text not null,
  phone text,
  email text,
  active boolean default true,
  created_at timestamptz default now()
);
alter table workers enable row level security;
create policy "owner access" on workers for all using (auth.uid() = owner_id);

-- JOBS
create table jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users not null,
  customer_id uuid references customers not null,
  worker_id uuid references workers,
  title text not null,
  address text,
  scheduled_date date not null,
  scheduled_time time,
  frequency text default 'once', -- once, weekly, biweekly, monthly
  status text default 'scheduled', -- scheduled, in_progress, completed, cancelled
  notes text,
  arrived_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);
alter table jobs enable row level security;
create policy "owner access" on jobs for all using (auth.uid() = owner_id);
-- Allow workers to view/update jobs via public mobile page (using job id)
create policy "public job access by id" on jobs for select using (true);
create policy "public job update" on jobs for update using (true);

-- JOB CHECKLIST ITEMS
create table job_checklist_items (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs on delete cascade not null,
  owner_id uuid references auth.users not null,
  label text not null,
  is_checked boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);
alter table job_checklist_items enable row level security;
create policy "owner access" on job_checklist_items for all using (auth.uid() = owner_id);
create policy "public checklist select" on job_checklist_items for select using (true);
create policy "public checklist update" on job_checklist_items for update using (true);

-- JOB PHOTOS
create table job_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs on delete cascade not null,
  owner_id uuid references auth.users not null,
  storage_path text not null,
  photo_type text not null, -- before, after
  uploaded_at timestamptz default now()
);
alter table job_photos enable row level security;
create policy "owner access" on job_photos for all using (auth.uid() = owner_id);
create policy "public photo select" on job_photos for select using (true);
create policy "public photo insert" on job_photos for insert with check (true);

-- Storage bucket for photos
insert into storage.buckets (id, name, public) values ('job-photos', 'job-photos', true);
create policy "public read" on storage.objects for select using (bucket_id = 'job-photos');
create policy "auth upload" on storage.objects for insert with check (bucket_id = 'job-photos');
