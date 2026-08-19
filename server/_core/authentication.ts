import { createClient, type User as SupabaseUser } from "@supabase/supabase-js";
import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import { ForbiddenError } from "../../shared/_core/errors";
import * as db from "../db";
import { sdk, type AuthenticatedUser } from "./sdk";

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

function getBearerToken(req: Request) {
  const value = req.header("authorization");
  return value?.startsWith("Bearer ") ? value.slice(7).trim() : null;
}

function profileName(user: SupabaseUser) {
  const metadata = user.user_metadata ?? {};
  const candidate = metadata.full_name ?? metadata.name ?? metadata.user_name ?? user.email?.split("@")[0] ?? "Jarvis User";
  return typeof candidate === "string" ? candidate.slice(0, 255) : "Jarvis User";
}

function shouldUseLegacyLocalProfileMapping() {
  // The Vercel release uses Supabase for verified identity mapping. Its
  // historical managed MySQL endpoint is not part of the serverless runtime,
  // so attempting an upsert there only adds latency and noisy timeout errors.
  // The existing managed host keeps its local mapping behavior unchanged.
  return process.env.VERCEL !== "1";
}

function toLocalUser(record: {
  id: number | string;
  open_id: string;
  name: string | null;
  email: string | null;
  login_method: string | null;
  role: "admin" | "user";
  created_at: string;
  updated_at: string;
  last_signed_in: string;
}): User {
  return {
    id: Number(record.id),
    openId: record.open_id,
    name: record.name,
    email: record.email,
    loginMethod: record.login_method,
    role: record.role,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at),
    lastSignedIn: new Date(record.last_signed_in),
  };
}

async function authenticateSupabaseRequest(req: Request): Promise<AuthenticatedUser | null> {
  const accessToken = getBearerToken(req);
  if (!accessToken || !supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) throw ForbiddenError("Invalid Supabase access token");

  const now = new Date();
  const openId = data.user.id;
  const name = profileName(data.user);
  const email = data.user.email ?? null;

  if (shouldUseLegacyLocalProfileMapping()) {
    // Preserve the current managed-database runtime when it is configured and
    // reachable. The UUID lives in `openId`; existing protected procedures
    // continue to use the mapped numeric user.id for their private data queries.
    // A configured-but-unreachable local database must not block the staged
    // Supabase profile mapping, or a verified session would be rejected.
    const localDb = await db.getDb();
    if (localDb) {
      try {
        await db.upsertUser({
          openId,
          name,
          email,
          loginMethod: "supabase",
          lastSignedIn: now,
        });
        const localUser = await db.getUserByOpenId(openId);
        if (localUser) return localUser;
        console.warn("[Auth] Local database has no mapped profile; falling back to the staged Supabase profile table.");
      } catch (localDbError) {
        console.warn("[Auth] Local database mapping unavailable; using the staged Supabase profile table:", localDbError);
      }
    }
  }

  // The independently deployed Vercel runtime can authenticate against the
  // staged Supabase profile table even before the complete private-data helper
  // migration replaces the legacy MySQL data layer.
  const { data: cloudUser, error: cloudError } = await supabaseAdmin
    .from("jarvis_users")
    .upsert({
      open_id: openId,
      name,
      email,
      login_method: "supabase",
      last_signed_in: now.toISOString(),
    }, { onConflict: "open_id" })
    .select("id, open_id, name, email, login_method, role, created_at, updated_at, last_signed_in")
    .single();

  if (cloudError || !cloudUser) {
    console.error("[Auth] Failed to map verified Supabase user:", cloudError);
    throw ForbiddenError("Jarvis user profile could not be created");
  }

  return toLocalUser(cloudUser);
}

export type { AuthenticatedUser } from "./sdk";

/**
 * Authorize a request from either the existing managed OAuth session or a
 * Supabase access token verified server-side against Supabase Auth.
 */
export async function authenticateJarvisRequest(req: Request): Promise<AuthenticatedUser> {
  try {
    return await sdk.authenticateRequest(req);
  } catch (managedAuthError) {
    const supabaseUser = await authenticateSupabaseRequest(req);
    if (supabaseUser) return supabaseUser;
    throw managedAuthError;
  }
}
