-- Fix the infinite recursion in admin_users RLS policies
-- Drop problematic policies
drop policy if exists "Only admins can view admin users" on public.admin_users;
drop policy if exists "Only admins can update admin users" on public.admin_users;

-- Drop problematic policies that reference admin_users
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can view all complaints" on public.complaints;
drop policy if exists "Admins can update complaints" on public.complaints;

-- Create a function to check if user is admin (with cycle detection)
create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.admin_users 
    where id = user_id and is_admin = true
  )
$$;

-- Recreate admin_users policies using direct checks instead of subqueries
create policy "Admins can view admin users" on public.admin_users for select 
using (public.is_admin(auth.uid()));

create policy "Admins can update admin users" on public.admin_users for update 
using (public.is_admin(auth.uid()));

-- Recreate complaint policies using the helper function
create policy "Admins can view all complaints v2" on public.complaints for select 
using (public.is_admin(auth.uid()));

create policy "Admins can update complaints v2" on public.complaints for update 
using (public.is_admin(auth.uid()));

-- Recreate profile policies using the helper function
create policy "Admins can view all profiles v2" on public.profiles for select 
using (public.is_admin(auth.uid()));
