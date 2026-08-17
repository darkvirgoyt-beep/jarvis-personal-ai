-- Jarvis uses its existing authenticated server as the only data access layer.
-- Direct anon/authenticated Supabase API access is deliberately denied until a
-- separately reviewed Supabase Auth mapping is introduced.

create policy jarvis_users_server_only on public.jarvis_users
  as restrictive for all to anon, authenticated
  using (false) with check (false);

create policy jarvis_conversations_server_only on public.jarvis_conversations
  as restrictive for all to anon, authenticated
  using (false) with check (false);

create policy jarvis_messages_server_only on public.jarvis_messages
  as restrictive for all to anon, authenticated
  using (false) with check (false);

create policy jarvis_memories_server_only on public.jarvis_memories
  as restrictive for all to anon, authenticated
  using (false) with check (false);

create policy jarvis_tasks_server_only on public.jarvis_tasks
  as restrictive for all to anon, authenticated
  using (false) with check (false);

create policy jarvis_research_records_server_only on public.jarvis_research_records
  as restrictive for all to anon, authenticated
  using (false) with check (false);

create policy jarvis_preferences_server_only on public.jarvis_preferences
  as restrictive for all to anon, authenticated
  using (false) with check (false);

create policy jarvis_confirmations_server_only on public.jarvis_confirmations
  as restrictive for all to anon, authenticated
  using (false) with check (false);

create policy jarvis_workspace_items_server_only on public.jarvis_workspace_items
  as restrictive for all to anon, authenticated
  using (false) with check (false);

create policy jarvis_mobile_pairings_server_only on public.jarvis_mobile_pairings
  as restrictive for all to anon, authenticated
  using (false) with check (false);

-- The helper is unrelated to Jarvis; PostgreSQL PUBLIC inherits execution by
-- default, so revoke it explicitly as well as both exposed API roles.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
