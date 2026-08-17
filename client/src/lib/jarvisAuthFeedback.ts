export type JarvisEmailAuthMode = "sign-in" | "sign-up";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateJarvisCredentials(email: string, password: string, mode: JarvisEmailAuthMode) {
  const normalizedEmail = email.trim();

  if (!normalizedEmail) return "Enter your email address to continue.";
  if (!emailPattern.test(normalizedEmail)) return "Enter a valid email address, such as you@example.com.";
  if (!password) return "Enter your password to continue.";
  if (mode === "sign-up" && password.length < 6) return "Choose a password with at least 6 characters.";

  return null;
}

export function describeJarvisAuthError(error: unknown, mode: JarvisEmailAuthMode | "google" | "github") {
  const message = error instanceof Error ? error.message : "";
  const normalized = message.toLowerCase();

  if (normalized.includes("unsupported provider") || normalized.includes("provider is not enabled")) {
    const provider = mode === "github" ? "GitHub" : "Google";
    return `${provider} sign-in is not configured yet. Use email and password for now, or enable ${provider} in Supabase Authentication → Providers.`;
  }

  if (normalized.includes("email not confirmed")) {
    return "Your account needs email confirmation first. Open the newest Jarvis confirmation email, then sign in again.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "That email and password were not accepted. If you already created an account, first confirm it from your inbox; otherwise choose Create account.";
  }

  if (normalized.includes("signups not allowed") || normalized.includes("signup is disabled")) {
    return "New email accounts are disabled in Supabase right now. Enable Email sign-in in Supabase Authentication → Providers.";
  }

  return message || (mode === "sign-up" ? "Jarvis could not create the account. Please try again." : "Jarvis could not sign you in. Please try again.");
}
