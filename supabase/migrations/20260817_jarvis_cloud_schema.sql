-- Jarvis cloud schema staged for the owner-connected Supabase project.
-- This migration is additive. It does not copy, delete, or expose records from
-- the active managed database. Application access remains server-side only.

create table if not exists public.jarvis_users (
  id bigint generated always as identity primary key,
  open_id text not null unique,
  name text,
  email text,
  login_method text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_signed_in timestamptz not null default now()
);

create table if not exists public.jarvis_conversations (
  id bigint generated always as identity primary key,
  user_open_id text not null references public.jarvis_users(open_id) on delete cascade,
  title varchar(180) not null default 'New Jarvis conversation',
  active_agent text not null default 'general' check (active_agent in ('general', 'coding', 'research', 'files', 'system', 'creative')),
  starred_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jarvis_messages (
  id bigint generated always as identity primary key,
  conversation_id bigint not null references public.jarvis_conversations(id) on delete cascade,
  user_open_id text not null references public.jarvis_users(open_id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  agent varchar(32) not null default 'general',
  created_at timestamptz not null default now()
);

create table if not exists public.jarvis_memories (
  id bigint generated always as identity primary key,
  user_open_id text not null references public.jarvis_users(open_id) on delete cascade,
  content text not null,
  category text not null default 'note' check (category in ('preference', 'project', 'personal', 'fact', 'note')),
  source text not null default 'manual' check (source in ('manual', 'conversation')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jarvis_tasks (
  id bigint generated always as identity primary key,
  user_open_id text not null references public.jarvis_users(open_id) on delete cascade,
  title varchar(240) not null,
  notes text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jarvis_research_records (
  id bigint generated always as identity primary key,
  user_open_id text not null references public.jarvis_users(open_id) on delete cascade,
  conversation_id bigint not null references public.jarvis_conversations(id) on delete cascade,
  topic varchar(500) not null,
  source_ledger text not null,
  summary text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.jarvis_preferences (
  id bigint generated always as identity primary key,
  user_open_id text not null unique references public.jarvis_users(open_id) on delete cascade,
  model varchar(80) not null default 'nemotron-3-ultra',
  personality text not null default 'balanced' check (personality in ('balanced', 'concise', 'strategic', 'creative')),
  voice_enabled boolean not null default true,
  voice_name varchar(240),
  continuous_mode boolean not null default false,
  contextual_suggestions boolean not null default false,
  speech_rate integer not null default 100,
  privacy_mode text not null default 'standard' check (privacy_mode in ('standard', 'minimal')),
  visual_mode text not null default 'hud' check (visual_mode in ('hud', 'reduced_motion')),
  plugin_settings text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jarvis_confirmations (
  id bigint generated always as identity primary key,
  user_open_id text not null references public.jarvis_users(open_id) on delete cascade,
  action varchar(180) not null,
  risk_level text not null default 'high' check (risk_level in ('low', 'medium', 'high')),
  payload text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'executed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.jarvis_workspace_items (
  id bigint generated always as identity primary key,
  user_open_id text not null references public.jarvis_users(open_id) on delete cascade,
  path varchar(700) not null,
  name varchar(255) not null,
  item_type text not null check (item_type in ('file', 'folder')),
  storage_key varchar(1024),
  content_type varchar(160),
  size_bytes integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_open_id, path)
);

create table if not exists public.jarvis_mobile_pairings (
  id bigint generated always as identity primary key,
  code_hash varchar(128) not null unique,
  verifier_hash varchar(128) not null,
  user_open_id text not null references public.jarvis_users(open_id) on delete cascade,
  expires_at timestamptz not null,
  exchanged_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists jarvis_conversation_user_updated_idx on public.jarvis_conversations (user_open_id, updated_at desc);
create index if not exists jarvis_message_conversation_idx on public.jarvis_messages (conversation_id, created_at);
create index if not exists jarvis_message_user_idx on public.jarvis_messages (user_open_id);
create index if not exists jarvis_memory_user_updated_idx on public.jarvis_memories (user_open_id, updated_at desc);
create index if not exists jarvis_task_user_status_idx on public.jarvis_tasks (user_open_id, status, updated_at desc);
create index if not exists jarvis_research_user_created_idx on public.jarvis_research_records (user_open_id, created_at desc);
create index if not exists jarvis_confirmation_user_status_idx on public.jarvis_confirmations (user_open_id, status, created_at desc);
create index if not exists jarvis_workspace_user_updated_idx on public.jarvis_workspace_items (user_open_id, updated_at desc);
create index if not exists jarvis_mobile_pairing_expiry_idx on public.jarvis_mobile_pairings (expires_at);

alter table public.jarvis_users enable row level security;
alter table public.jarvis_conversations enable row level security;
alter table public.jarvis_messages enable row level security;
alter table public.jarvis_memories enable row level security;
alter table public.jarvis_tasks enable row level security;
alter table public.jarvis_research_records enable row level security;
alter table public.jarvis_preferences enable row level security;
alter table public.jarvis_confirmations enable row level security;
alter table public.jarvis_workspace_items enable row level security;
alter table public.jarvis_mobile_pairings enable row level security;

comment on schema public is 'Jarvis private cloud data. RLS is enabled; only a server-side service role may access it until a Supabase Auth mapping is explicitly implemented.';
