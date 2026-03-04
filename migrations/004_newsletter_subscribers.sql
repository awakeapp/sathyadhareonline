-- Newsletter subscribers table
create table if not exists newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table newsletter_subscribers enable row level security;

-- Only admins can read
create policy "Admins can view subscribers"
  on newsletter_subscribers for select
  using (exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));

-- Anyone can insert their own email
create policy "Anyone can subscribe"
  on newsletter_subscribers for insert
  with check (true);
