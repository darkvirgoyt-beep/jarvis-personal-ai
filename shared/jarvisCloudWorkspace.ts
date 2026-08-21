export const jarvisCloudWorkspaceStates = [
  { name: "GitHub", status: "Source synchronized; repository actions require explicit approval", tone: "text-cyan-100" },
  { name: "Browser workspace", status: "Active — private files, folders, and code proposals are created only after explicit approval", tone: "text-cyan-100" },
  { name: "Supabase backend", status: "Private Vercel runtime active with server-only access and user-scoped data controls", tone: "text-cyan-100" },
  { name: "Cloud build runner", status: "Ready for a reviewed web, Android, or cloud-service runner proposal — no runner is connected and no build can start automatically", tone: "text-amber-100" },
  { name: "Managed computer", status: "Not attached — Ubuntu or Kali-compatible runner requirements can be prepared, but a persistent computer needs an owner-approved provider and user-controlled visible sessions", tone: "text-slate-500" },
  { name: "Debug telemetry", status: "Active — Jarvis keeps visible routing, activity, artifact, and approval status; it does not fabricate terminal output", tone: "text-cyan-100" },
  { name: "Maps & location", status: "Available on request; location stays on demand", tone: "text-cyan-100" },
  { name: "Messages & apps", status: "Approval required before any handoff", tone: "text-amber-100" },
  { name: "Future OAuth services", status: "Not connected — credentials are never shown here", tone: "text-slate-500" },
] as const;

export const jarvisEngineeringPrinciples = [
  "Compress a user request into the smallest complete implementation brief before generation.",
  "Diagnose the root cause before editing; prefer the smallest tested patch that resolves it.",
  "Do not trade correctness, user privacy, security controls, or reviewability for shorter output.",
] as const;

export function isStealthAutomationAllowed() {
  return false;
}
