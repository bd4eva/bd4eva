-- Create the pto_dates table if it doesn't exist yet.
create table if not exists pto_dates (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  note text,
  is_half_day boolean not null default false,
  created_at timestamptz not null default now()
);

-- If the table already exists but is missing is_half_day, add it.
-- This is idempotent: it does nothing if the column already exists.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'pto_dates' and column_name = 'is_half_day'
  ) then
    alter table pto_dates
      add column is_half_day boolean not null default false;
  end if;
end $$;

-- Existing rows without is_half_day are treated as full days (false = full day).
