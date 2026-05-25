-- Migration: Create diagnosis_responses table for Survey v2
-- Run this in your Supabase SQL editor

create table if not exists public.diagnosis_responses (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  -- Identity (both nullable until auth is wired up in phase 2)
  user_id       uuid references auth.users(id) on delete set null,
  school_id     uuid references public.schools(id) on delete set null,

  -- The 3-gate path taken
  gate1_branch  text not null,  -- 'prism' | 'cq' | 'values'
  gate2_choice  text not null,  -- e.g. 'timing', 'drive', 'uncertainty'
  gate3_choice  text,           -- only populated when disambiguation gate fires

  -- Computed diagnosis  
  framework     text not null,  -- 'PRISM' | 'CQ Quadrants' | 'Cultural Values'
  dimension     text not null,  -- e.g. 'Pace', 'CQ Drive', 'Power Distance'
  polarity      text not null   -- e.g. 'Fast vs. Slow', 'High vs. Low'
);

-- Enable Row Level Security
alter table public.diagnosis_responses enable row level security;

-- Policy: Users can insert their own records (phase 2 — requires auth)
-- create policy "Users can insert own diagnosis"
--   on public.diagnosis_responses for insert
--   with check (auth.uid() = user_id);

-- Policy: Admins can read all records for their school
-- (add when auth roles are wired up)

-- Index for dashboard queries (aggregate by school + dimension)
create index if not exists diagnosis_responses_school_framework_idx
  on public.diagnosis_responses(school_id, framework);

create index if not exists diagnosis_responses_school_dimension_idx
  on public.diagnosis_responses(school_id, dimension);

-- ─── Future: Sunburst chart query (phase 2) ──────────────────────────────────
-- SELECT
--   framework,
--   dimension,
--   count(*) as count
-- FROM diagnosis_responses
-- WHERE school_id = <school_id>
-- GROUP BY framework, dimension
-- ORDER BY framework, count DESC;
