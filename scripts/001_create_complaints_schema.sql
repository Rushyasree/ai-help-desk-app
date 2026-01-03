-- Create profiles table for users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone_number text,
  created_at timestamp with time zone default now()
);

-- Create complaints table
create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  
  -- Address information
  state text not null,
  district text not null,
  town_village text not null,
  area_street text not null,
  
  -- Complaint details
  title text not null,
  description text not null,
  image_url text,
  voice_transcript text,
  
  -- AI categorization
  category text,
  severity text,
  keywords text[],
  
  -- Status tracking
  status text default 'pending',
  assigned_to uuid references public.profiles(id),
  resolution_notes text,
  
  -- Timestamps
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create admin_users table
create table if not exists public.admin_users (
  id uuid primary key references public.profiles(id) on delete cascade,
  department text not null,
  is_admin boolean default false,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.complaints enable row level security;
alter table public.admin_users enable row level security;

-- Profiles RLS Policies
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select using (
  exists (select 1 from public.admin_users where id = auth.uid() and is_admin = true)
);

-- Complaints RLS Policies
create policy "Users can view their own complaints" on public.complaints for select using (user_id = auth.uid());
create policy "Users can insert their own complaints" on public.complaints for insert with check (user_id = auth.uid());
create policy "Users can update their own complaints" on public.complaints for update using (user_id = auth.uid());
create policy "Admins can view all complaints" on public.complaints for select using (
  exists (select 1 from public.admin_users where id = auth.uid() and is_admin = true)
);
create policy "Admins can update complaints" on public.complaints for update using (
  exists (select 1 from public.admin_users where id = auth.uid() and is_admin = true)
);

-- Admin Users RLS Policies
create policy "Only admins can view admin users" on public.admin_users for select using (
  exists (select 1 from public.admin_users where id = auth.uid() and is_admin = true)
);
create policy "Only admins can update admin users" on public.admin_users for update using (
  exists (select 1 from public.admin_users where id = auth.uid() and is_admin = true)
);

-- Create function to auto-create admin user for first user (optional)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone_number)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), coalesce(new.raw_user_meta_data ->> 'phone_number', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
