-- 001_initial_schema.sql
-- Anxiety Decoder · Phase 0 + Phase 1 schema
-- See spec §5.1 for column-level rationale

-- Anonymous users: identified by browser fingerprint stored in localStorage.
-- Email is optional and added later via Phase 2.
create table anonymous_users (
  id          uuid primary key default gen_random_uuid(),
  fingerprint text unique not null,
  email       text,
  created_at  timestamptz not null default now()
);

-- A decode_session is one full use of the product.
create table decode_sessions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references anonymous_users(id) on delete cascade,
  state          text check (state in ('starting', 'rescue')),
  initial_dump   text,
  conversation   jsonb not null default '[]'::jsonb,
  primary_action text,
  card_headline  text,
  status         text not null default 'draft'
                   check (status in ('draft', 'conversing', 'decoded', 'launched', 'returned', 'completed')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_decode_sessions_user_id on decode_sessions(user_id);
create index idx_decode_sessions_status on decode_sessions(status);

-- Each worry item is one piece of anxiety extracted by the AI.
create table worry_items (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null references decode_sessions(id) on delete cascade,
  content             text not null,
  category            text not null check (category in ('real', 'catastrophic', 'fog')),
  display_order       int not null default 0,
  was_manually_edited boolean not null default false
);

create index idx_worry_items_session_id on worry_items(session_id);

-- Return-feedback is the second touch point.
create table return_feedback (
  session_id uuid primary key references decode_sessions(id) on delete cascade,
  emoji      text not null check (emoji in ('🙂', '😐', '😣')),
  one_liner  text,
  created_at timestamptz not null default now()
);

-- Updated_at trigger for decode_sessions
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_decode_sessions_updated
  before update on decode_sessions
  for each row execute function set_updated_at();
