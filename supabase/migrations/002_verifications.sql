-- 002_verifications.sql
-- Phase 2: after-the-fact verification of catastrophic worries.
-- See spec §5.1 and §3.2.

create table verifications (
  id             uuid primary key default gen_random_uuid(),
  worry_item_id  uuid not null unique references worry_items(id) on delete cascade,
  scheduled_for  timestamptz not null,
  sent_at        timestamptz,
  token          text unique not null,
  did_happen     boolean,
  user_note      text,
  responded_at   timestamptz,
  created_at     timestamptz not null default now()
);

create index idx_verifications_scheduled
  on verifications (scheduled_for)
  where sent_at is null;

create index idx_verifications_token on verifications (token);
