import type { InsertUser } from "../drizzle/schema";
import { requireSupabaseRuntimeClient } from "./supabaseRuntime";

type Row = Record<string, any>;
const iso = (value?: Date | string | null) => value ? new Date(value).toISOString() : null;
const date = (value?: string | null) => value ? new Date(value) : null;
const number = (value: number | string) => Number(value);
const compact = <T extends Record<string, unknown>>(value: T) => Object.fromEntries(
  Object.entries(value).filter(([, item]) => item !== undefined),
) as T;

async function openIdForUserId(userId: number) {
  const runtime = requireSupabaseRuntimeClient();
  const { data, error } = await runtime.from("jarvis_users").select("open_id").eq("id", userId).maybeSingle();
  if (error) throw new Error(`Jarvis profile lookup failed: ${error.message}`);
  if (!data?.open_id) throw new Error("Jarvis authenticated profile is unavailable");
  return data.open_id as string;
}

function fail(error: { message: string } | null, context: string) {
  if (error) throw new Error(`${context}: ${error.message}`);
}

function conversation(row: Row, userId: number) {
  return { id: number(row.id), userId, title: row.title, activeAgent: row.active_agent, starredAt: date(row.starred_at), createdAt: date(row.created_at)!, updatedAt: date(row.updated_at)! };
}
function message(row: Row, userId: number) {
  return { id: number(row.id), conversationId: number(row.conversation_id), userId, role: row.role, content: row.content, agent: row.agent, createdAt: date(row.created_at)! };
}
function memory(row: Row, userId: number) {
  return { id: number(row.id), userId, content: row.content, category: row.category, source: row.source, createdAt: date(row.created_at)!, updatedAt: date(row.updated_at)! };
}
function task(row: Row, userId: number) {
  return { id: number(row.id), userId, title: row.title, notes: row.notes, status: row.status, priority: row.priority, dueAt: date(row.due_at), createdAt: date(row.created_at)!, updatedAt: date(row.updated_at)! };
}
function research(row: Row, userId: number) {
  return { id: number(row.id), userId, conversationId: number(row.conversation_id), topic: row.topic, sourceLedger: row.source_ledger, summary: row.summary, createdAt: date(row.created_at)! };
}
function preference(row: Row, userId: number) {
  return { id: number(row.id), userId, model: row.model, personality: row.personality, voiceEnabled: row.voice_enabled ? 1 : 0, voiceName: row.voice_name, continuousMode: row.continuous_mode ? 1 : 0, contextualSuggestions: row.contextual_suggestions ? 1 : 0, speechRate: row.speech_rate, privacyMode: row.privacy_mode, visualMode: row.visual_mode, pluginSettings: row.plugin_settings, createdAt: date(row.created_at)!, updatedAt: date(row.updated_at)! };
}
function confirmation(row: Row, userId: number) {
  return { id: number(row.id), userId, action: row.action, riskLevel: row.risk_level, payload: row.payload, status: row.status, createdAt: date(row.created_at)!, resolvedAt: date(row.resolved_at) };
}
function workspaceItem(row: Row, userId: number) {
  return { id: number(row.id), userId, path: row.path, name: row.name, itemType: row.item_type, storageKey: row.storage_key, contentType: row.content_type, sizeBytes: row.size_bytes, createdAt: date(row.created_at)!, updatedAt: date(row.updated_at)! };
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const runtime = requireSupabaseRuntimeClient();
  const { error } = await runtime.from("jarvis_users").upsert(compact({
    open_id: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    login_method: user.loginMethod ?? null,
    role: user.role,
    last_signed_in: iso(user.lastSignedIn ?? new Date()),
  }), { onConflict: "open_id" });
  fail(error, "Jarvis profile upsert failed");
}

export async function getUserByOpenId(openId: string) {
  const runtime = requireSupabaseRuntimeClient();
  const { data, error } = await runtime.from("jarvis_users").select("*").eq("open_id", openId).maybeSingle();
  fail(error, "Jarvis profile lookup failed");
  if (!data) return undefined;
  return { id: number(data.id), openId: data.open_id, name: data.name, email: data.email, loginMethod: data.login_method, role: data.role, createdAt: date(data.created_at)!, updatedAt: date(data.updated_at)!, lastSignedIn: date(data.last_signed_in)! };
}

export async function createJarvisMobilePairing(input: { codeHash: string; verifierHash: string; userOpenId: string; expiresAt: Date }) {
  const runtime = requireSupabaseRuntimeClient();
  const { error } = await runtime.from("jarvis_mobile_pairings").insert({ code_hash: input.codeHash, verifier_hash: input.verifierHash, user_open_id: input.userOpenId, expires_at: iso(input.expiresAt) });
  fail(error, "Jarvis mobile pairing creation failed");
}

export async function consumeJarvisMobilePairing(input: { codeHash: string; verifierHash: string }) {
  const runtime = requireSupabaseRuntimeClient();
  const { data, error } = await runtime.from("jarvis_mobile_pairings").update({ exchanged_at: iso(new Date()) })
    .eq("code_hash", input.codeHash).eq("verifier_hash", input.verifierHash).is("exchanged_at", null).gt("expires_at", iso(new Date())!)
    .select("user_open_id");
  fail(error, "Jarvis mobile pairing redemption failed");
  return data?.[0]?.user_open_id as string | undefined;
}

export async function listJarvisConversations(userId: number) {
  const runtime = requireSupabaseRuntimeClient(); const openId = await openIdForUserId(userId);
  const { data, error } = await runtime.from("jarvis_conversations").select("*").eq("user_open_id", openId).order("updated_at", { ascending: false });
  fail(error, "Jarvis conversation listing failed"); return (data ?? []).map((row) => conversation(row, userId));
}
export async function createJarvisConversation(userId: number, title: string, activeAgent: "general" | "coding" | "research" | "files" | "system" | "creative") {
  const runtime = requireSupabaseRuntimeClient(); const openId = await openIdForUserId(userId);
  const { data, error } = await runtime.from("jarvis_conversations").insert({ user_open_id: openId, title, active_agent: activeAgent }).select("*").single();
  fail(error, "Jarvis conversation creation failed"); return conversation(data!, userId);
}
export async function getJarvisConversation(userId: number, conversationId: number) {
  const runtime = requireSupabaseRuntimeClient(); const openId = await openIdForUserId(userId);
  const { data, error } = await runtime.from("jarvis_conversations").select("*").eq("id", conversationId).eq("user_open_id", openId).maybeSingle();
  fail(error, "Jarvis conversation lookup failed"); return data ? conversation(data, userId) : undefined;
}
export async function setJarvisConversationStar(userId: number, conversationId: number, starred: boolean) {
  const runtime = requireSupabaseRuntimeClient(); const openId = await openIdForUserId(userId);
  const { data, error } = await runtime.from("jarvis_conversations").update({ starred_at: starred ? iso(new Date()) : null, updated_at: iso(new Date()) }).eq("id", conversationId).eq("user_open_id", openId).select("id");
  fail(error, "Jarvis conversation update failed"); return Boolean(data?.length);
}
export async function deleteJarvisConversation(userId: number, conversationId: number) {
  const runtime = requireSupabaseRuntimeClient(); const openId = await openIdForUserId(userId);
  const { error: messagesError } = await runtime.from("jarvis_messages").delete().eq("conversation_id", conversationId).eq("user_open_id", openId);
  fail(messagesError, "Jarvis conversation message cleanup failed");
  const { data, error } = await runtime.from("jarvis_conversations").delete().eq("id", conversationId).eq("user_open_id", openId).select("id");
  fail(error, "Jarvis conversation deletion failed"); return data?.length ?? 0;
}
export async function listJarvisMessages(userId: number, conversationId: number) {
  const runtime = requireSupabaseRuntimeClient(); const openId = await openIdForUserId(userId);
  const { data, error } = await runtime.from("jarvis_messages").select("*").eq("user_open_id", openId).eq("conversation_id", conversationId).order("created_at", { ascending: true });
  fail(error, "Jarvis message listing failed"); return (data ?? []).map((row) => message(row, userId));
}
export async function createJarvisMessage(input: { userId: number; conversationId: number; role: "user" | "assistant" | "system"; content: string; agent: string }) {
  const runtime = requireSupabaseRuntimeClient(); const openId = await openIdForUserId(input.userId);
  const { error } = await runtime.from("jarvis_messages").insert({ user_open_id: openId, conversation_id: input.conversationId, role: input.role, content: input.content, agent: input.agent });
  fail(error, "Jarvis message creation failed");
  const { error: updateError } = await runtime.from("jarvis_conversations").update({ updated_at: iso(new Date()) }).eq("id", input.conversationId).eq("user_open_id", openId);
  fail(updateError, "Jarvis conversation timestamp update failed");
}
export async function listJarvisMemories(userId: number) {
  const runtime = requireSupabaseRuntimeClient(); const openId = await openIdForUserId(userId);
  const { data, error } = await runtime.from("jarvis_memories").select("*").eq("user_open_id", openId).order("updated_at", { ascending: false });
  fail(error, "Jarvis memory listing failed"); return (data ?? []).map((row) => memory(row, userId));
}
export async function createJarvisMemory(input: { userId: number; content: string; category: "preference" | "project" | "personal" | "fact" | "note"; source?: "manual" | "conversation" }) {
  const runtime = requireSupabaseRuntimeClient(); const openId = await openIdForUserId(input.userId);
  const { error } = await runtime.from("jarvis_memories").insert({ user_open_id: openId, content: input.content, category: input.category, source: input.source ?? "manual" }); fail(error, "Jarvis memory creation failed");
}
export async function updateJarvisMemory(userId: number, id: number, content: string, category: "preference" | "project" | "personal" | "fact" | "note") {
  const runtime = requireSupabaseRuntimeClient(); const openId = await openIdForUserId(userId);
  const { data, error } = await runtime.from("jarvis_memories").update({ content, category, updated_at: iso(new Date()) }).eq("id", id).eq("user_open_id", openId).select("id"); fail(error, "Jarvis memory update failed"); return data?.length ?? 0;
}
export async function deleteJarvisMemory(userId: number, id: number) {
  const runtime = requireSupabaseRuntimeClient(); const openId = await openIdForUserId(userId);
  const { data, error } = await runtime.from("jarvis_memories").delete().eq("id", id).eq("user_open_id", openId).select("id"); fail(error, "Jarvis memory deletion failed"); return data?.length ?? 0;
}
export async function listJarvisTasks(userId: number) {
  const runtime = requireSupabaseRuntimeClient(); const openId = await openIdForUserId(userId);
  const { data, error } = await runtime.from("jarvis_tasks").select("*").eq("user_open_id", openId).order("updated_at", { ascending: false }); fail(error, "Jarvis task listing failed"); return (data ?? []).map((row) => task(row, userId));
}
export async function createJarvisTask(input: { userId: number; title: string; notes?: string | null; priority: "low" | "medium" | "high"; dueAt?: Date | null }) {
  const runtime = requireSupabaseRuntimeClient(); const openId = await openIdForUserId(input.userId);
  const { error } = await runtime.from("jarvis_tasks").insert({ user_open_id: openId, title: input.title, notes: input.notes ?? null, priority: input.priority, due_at: iso(input.dueAt) }); fail(error, "Jarvis task creation failed");
}
export async function updateJarvisTask(input: { userId: number; id: number; title?: string; notes?: string | null; status?: "todo" | "in_progress" | "done"; priority?: "low" | "medium" | "high"; dueAt?: Date | null }) {
  const runtime = requireSupabaseRuntimeClient(); const openId = await openIdForUserId(input.userId);
  const { data, error } = await runtime.from("jarvis_tasks").update(compact({ title: input.title, notes: input.notes, status: input.status, priority: input.priority, due_at: input.dueAt === undefined ? undefined : iso(input.dueAt), updated_at: iso(new Date()) })).eq("id", input.id).eq("user_open_id", openId).select("id"); fail(error, "Jarvis task update failed"); return data?.length ?? 0;
}
export async function deleteJarvisTask(userId: number, id: number) {
  const runtime = requireSupabaseRuntimeClient(); const openId = await openIdForUserId(userId);
  const { data, error } = await runtime.from("jarvis_tasks").delete().eq("id", id).eq("user_open_id", openId).select("id"); fail(error, "Jarvis task deletion failed"); return data?.length ?? 0;
}
export async function listJarvisResearchRecords(userId: number) {
  const runtime = requireSupabaseRuntimeClient(); const openId = await openIdForUserId(userId);
  const { data, error } = await runtime.from("jarvis_research_records").select("*").eq("user_open_id", openId).order("created_at", { ascending: false }); fail(error, "Jarvis research listing failed"); return (data ?? []).map((row) => research(row, userId));
}
export async function createJarvisResearchRecord(input: { userId: number; conversationId: number; topic: string; sourceLedger: string; summary: string }) {
  const runtime = requireSupabaseRuntimeClient(); const openId = await openIdForUserId(input.userId);
  const { error } = await runtime.from("jarvis_research_records").insert({ user_open_id: openId, conversation_id: input.conversationId, topic: input.topic, source_ledger: input.sourceLedger, summary: input.summary }); fail(error, "Jarvis research creation failed");
}
export async function getJarvisPreferences(userId: number) {
  const runtime = requireSupabaseRuntimeClient(); const openId = await openIdForUserId(userId);
  let { data, error } = await runtime.from("jarvis_preferences").select("*").eq("user_open_id", openId).maybeSingle(); fail(error, "Jarvis preferences lookup failed");
  if (!data) { const inserted = await runtime.from("jarvis_preferences").upsert({ user_open_id: openId }, { onConflict: "user_open_id", ignoreDuplicates: true }).select("*").maybeSingle(); fail(inserted.error, "Jarvis preferences initialization failed"); data = inserted.data; }
  if (!data) { const retry = await runtime.from("jarvis_preferences").select("*").eq("user_open_id", openId).single(); fail(retry.error, "Jarvis preferences retrieval failed"); data = retry.data; }
  return preference(data!, userId);
}
export async function updateJarvisPreferences(input: { userId: number; model?: string; personality?: "balanced" | "concise" | "strategic" | "creative"; voiceEnabled?: number; voiceName?: string | null; continuousMode?: number; contextualSuggestions?: number; speechRate?: number; privacyMode?: "standard" | "minimal"; visualMode?: "hud" | "reduced_motion"; pluginSettings?: string | null }) {
  const runtime = requireSupabaseRuntimeClient(); const openId = await openIdForUserId(input.userId);
  const values = compact({ model: input.model, personality: input.personality, voice_enabled: input.voiceEnabled === undefined ? undefined : Boolean(input.voiceEnabled), voice_name: input.voiceName, continuous_mode: input.continuousMode === undefined ? undefined : Boolean(input.continuousMode), contextual_suggestions: input.contextualSuggestions === undefined ? undefined : Boolean(input.contextualSuggestions), speech_rate: input.speechRate, privacy_mode: input.privacyMode, visual_mode: input.visualMode, plugin_settings: input.pluginSettings, updated_at: iso(new Date()) });
  const { error } = await runtime.from("jarvis_preferences").upsert({ user_open_id: openId, ...values }, { onConflict: "user_open_id" }); fail(error, "Jarvis preferences update failed"); return getJarvisPreferences(input.userId);
}
export async function listJarvisConfirmations(userId: number) {
  const runtime = requireSupabaseRuntimeClient(); const openId = await openIdForUserId(userId);
  const { data, error } = await runtime.from("jarvis_confirmations").select("*").eq("user_open_id", openId).order("created_at", { ascending: false }); fail(error, "Jarvis confirmation listing failed"); return (data ?? []).map((row) => confirmation(row, userId));
}
export async function createJarvisConfirmation(input: { userId: number; action: string; riskLevel: "low" | "medium" | "high"; payload: string }) {
  const runtime = requireSupabaseRuntimeClient(); const openId = await openIdForUserId(input.userId);
  const { data, error } = await runtime.from("jarvis_confirmations").insert({ user_open_id: openId, action: input.action, risk_level: input.riskLevel, payload: input.payload }).select("*").single(); fail(error, "Jarvis confirmation creation failed"); return confirmation(data!, input.userId);
}
export async function resolveJarvisConfirmation(userId: number, id: number, status: "approved" | "rejected") {
  const runtime = requireSupabaseRuntimeClient(); const openId = await openIdForUserId(userId);
  const { data, error } = await runtime.from("jarvis_confirmations").update({ status, resolved_at: iso(new Date()) }).eq("id", id).eq("user_open_id", openId).eq("status", "pending").select("id"); fail(error, "Jarvis confirmation resolution failed"); return data?.length ?? 0;
}
export async function getJarvisConfirmation(userId: number, id: number) {
  const runtime = requireSupabaseRuntimeClient(); const openId = await openIdForUserId(userId);
  const { data, error } = await runtime.from("jarvis_confirmations").select("*").eq("id", id).eq("user_open_id", openId).maybeSingle(); fail(error, "Jarvis confirmation lookup failed"); return data ? confirmation(data, userId) : undefined;
}
export async function markJarvisConfirmationExecuted(userId: number, id: number) {
  const runtime = requireSupabaseRuntimeClient(); const openId = await openIdForUserId(userId);
  const { data, error } = await runtime.from("jarvis_confirmations").update({ status: "executed", resolved_at: iso(new Date()) }).eq("id", id).eq("user_open_id", openId).eq("status", "approved").select("id"); fail(error, "Jarvis confirmation execution failed"); return data?.length ?? 0;
}
export async function deleteJarvisConfirmation(userId: number, id: number) {
  const runtime = requireSupabaseRuntimeClient(); const openId = await openIdForUserId(userId);
  const { data, error } = await runtime.from("jarvis_confirmations").delete().eq("id", id).eq("user_open_id", openId).select("id");
  fail(error, "Jarvis confirmation deletion failed"); return data?.length ?? 0;
}
export async function listJarvisWorkspaceItems(userId: number) {
  const runtime = requireSupabaseRuntimeClient(); const openId = await openIdForUserId(userId);
  const { data, error } = await runtime.from("jarvis_workspace_items").select("*").eq("user_open_id", openId).order("updated_at", { ascending: false }); fail(error, "Jarvis workspace listing failed"); return (data ?? []).map((row) => workspaceItem(row, userId));
}
export async function createJarvisWorkspaceItem(input: { userId: number; path: string; name: string; itemType: "file" | "folder"; storageKey?: string | null; contentType?: string | null; sizeBytes?: number }) {
  const runtime = requireSupabaseRuntimeClient(); const openId = await openIdForUserId(input.userId);
  const { data, error } = await runtime.from("jarvis_workspace_items").insert({ user_open_id: openId, path: input.path, name: input.name, item_type: input.itemType, storage_key: input.storageKey ?? null, content_type: input.contentType ?? null, size_bytes: input.sizeBytes ?? 0 }).select("*").single(); fail(error, "Jarvis workspace item creation failed"); return workspaceItem(data!, input.userId);
}
