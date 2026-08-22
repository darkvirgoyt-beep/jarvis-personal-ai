import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { describeJarvisAuthError, validateJarvisCredentials, validateJarvisEmail, type JarvisEmailAuthMode } from "@/lib/jarvisAuthFeedback";
import { beginJarvisOAuthSignIn, getJarvisAuthReturnUrl, type JarvisOAuthProvider } from "@/lib/jarvisOAuth";
import { beginJarvisPasswordReset } from "@/lib/jarvisRecovery";
import { hasSupabaseAuthConfiguration, requireSupabaseClient } from "@/lib/supabaseClient";
import { Github, LoaderCircle, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import React, { FormEvent, useState } from "react";

type JarvisAuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthenticated: () => void;
};

type Status = { message: string; tone: "error" | "info" };

export function JarvisAuthDialog({ open, onOpenChange, onAuthenticated }: JarvisAuthDialogProps) {
  const [mode, setMode] = useState<JarvisEmailAuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetStatus = () => setStatus(null);
  const changeMode = (nextMode: JarvisEmailAuthMode) => {
    setMode(nextMode);
    resetStatus();
  };

  const onOAuthSignIn = async (provider: JarvisOAuthProvider) => {
    if (!hasSupabaseAuthConfiguration) {
      setStatus({ message: "Jarvis sign-in is not configured for this deployment yet.", tone: "error" });
      return;
    }

    setStatus(null);
    setIsSubmitting(true);
    try {
      await beginJarvisOAuthSignIn(requireSupabaseClient(), provider, window.location.origin);
      setStatus({ message: `Redirecting securely to ${provider === "google" ? "Google" : "GitHub"}…`, tone: "info" });
    } catch (error) {
      setStatus({ message: describeJarvisAuthError(error, provider), tone: "error" });
      setIsSubmitting(false);
    }
  };

  const onPasswordReset = async () => {
    if (!hasSupabaseAuthConfiguration) {
      setStatus({ message: "Jarvis sign-in is not configured for this deployment yet.", tone: "error" });
      return;
    }

    const emailError = validateJarvisEmail(email);
    if (emailError) {
      setStatus({ message: emailError, tone: "error" });
      return;
    }

    setStatus(null);
    setIsSubmitting(true);
    try {
      await beginJarvisPasswordReset(requireSupabaseClient(), email, window.location.origin);
      setStatus({ message: "If this email has a Jarvis account, a secure password-reset link is on its way. Open the newest email to choose a new password.", tone: "info" });
    } catch (error) {
      setStatus({ message: describeJarvisAuthError(error, "sign-in"), tone: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasSupabaseAuthConfiguration) {
      setStatus({ message: "Jarvis sign-in is not configured for this deployment yet.", tone: "error" });
      return;
    }

    const validationError = validateJarvisCredentials(email, password, mode);
    if (validationError) {
      setStatus({ message: validationError, tone: "error" });
      return;
    }

    setStatus(null);
    setIsSubmitting(true);
    try {
      const client = requireSupabaseClient();
      if (mode === "sign-up") {
        const { data, error } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: getJarvisAuthReturnUrl(window.location.origin) },
        });
        if (error) throw error;
        if (data.session) {
          onAuthenticated();
          onOpenChange(false);
          return;
        }

        changeMode("sign-in");
        if (data.user?.identities?.length === 0) {
          setStatus({
            message: "For privacy, Jarvis cannot confirm whether this email already has an account. Try Sign in; if needed, confirm the newest Jarvis email in your inbox first.",
            tone: "info",
          });
          return;
        }
        setStatus({
          message: "Account request received. Check your inbox to confirm your email, then return here and select Sign in.",
          tone: "info",
        });
        return;
      }

      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      if (!data.session) throw new Error("Jarvis could not establish a secure sign-in session.");
      onAuthenticated();
      onOpenChange(false);
    } catch (error) {
      setStatus({ message: describeJarvisAuthError(error, mode), tone: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] overflow-y-auto border-cyan-300/25 bg-slate-950 p-4 text-slate-100 shadow-[0_0_48px_rgba(34,211,238,0.12)] sm:p-6">
        <DialogHeader>
          <div className="mb-1 flex size-10 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-100">
            <LockKeyhole className="size-5" />
          </div>
          <DialogTitle className="font-mono tracking-[0.12em] text-cyan-50">PRIVATE JARVIS ACCESS</DialogTitle>
          <DialogDescription className="text-slate-400">
            {mode === "sign-in"
              ? "Sign in with the email and password you used for Jarvis. If you just registered, confirm the newest email first."
              : "Create a private Jarvis workspace with a real email address. You will receive a confirmation email before first sign-in."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 rounded-lg border border-cyan-300/15 bg-cyan-300/[0.045] px-3 py-3 text-xs leading-5 text-slate-300" role="note">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-cyan-200" aria-hidden />
          <p><span className="font-medium text-cyan-50">Keep me signed in on this browser.</span> Jarvis securely retains your renewable session after sign-in, but never stores your password. Use Sign out on a shared device or clear browser data to remove this session.</p>
        </div>

        <div className="grid grid-cols-1 gap-1 rounded-lg border border-white/10 bg-white/[0.025] p-1 sm:grid-cols-2" aria-label="Email access mode">
          <Button type="button" variant={mode === "sign-in" ? "secondary" : "ghost"} onClick={() => changeMode("sign-in")}>I already have an account</Button>
          <Button type="button" variant={mode === "sign-up" ? "secondary" : "ghost"} onClick={() => changeMode("sign-up")}>Create account</Button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            className="min-h-11 w-full border-white/10 bg-white/[0.035] text-slate-100 hover:bg-white/[0.08] hover:text-white"
            onClick={() => void onOAuthSignIn("google")}
          >
            <span aria-hidden className="mr-2 font-semibold text-cyan-100">G</span>
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            className="min-h-11 w-full border-white/10 bg-white/[0.035] text-slate-100 hover:bg-white/[0.08] hover:text-white"
            onClick={() => void onOAuthSignIn("github")}
          >
            <Github className="mr-2 size-4" aria-hidden />
            GitHub
          </Button>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono tracking-[0.18em] text-slate-500" aria-hidden>
          <span className="h-px flex-1 bg-white/10" />
          OR EMAIL
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form className="grid gap-4" onSubmit={onSubmit} noValidate aria-busy={isSubmitting}>
          <div className="grid gap-2">
            <Label htmlFor="jarvis-auth-email" className="text-slate-300">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cyan-200/70" />
              <Input
                id="jarvis-auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => { setEmail(event.target.value); resetStatus(); }}
                aria-invalid={Boolean(status?.tone === "error" && status.message.toLowerCase().includes("email"))}
                className="border-white/10 bg-white/[0.045] pl-10 text-slate-100 placeholder:text-slate-600"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="jarvis-auth-password" className="text-slate-300">Password</Label>
            <Input
              id="jarvis-auth-password"
              type="password"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              minLength={6}
              value={password}
              onChange={(event) => { setPassword(event.target.value); resetStatus(); }}
              aria-invalid={Boolean(status?.tone === "error" && status.message.toLowerCase().includes("password"))}
              className="border-white/10 bg-white/[0.045] text-slate-100 placeholder:text-slate-600"
              placeholder={mode === "sign-in" ? "Your Jarvis password" : "At least 6 characters"}
              required
            />
          </div>
          {status && (
            <p
              role={status.tone === "error" ? "alert" : "status"}
              aria-live="polite"
              className={status.tone === "error"
                ? "rounded-lg border border-rose-300/25 bg-rose-300/10 px-3 py-2 text-sm text-rose-100"
                : "rounded-lg border border-cyan-200/15 bg-cyan-300/5 px-3 py-2 text-sm text-cyan-100"}
            >
              {status.message}
            </p>
          )}
          <DialogFooter className="gap-3 pt-2">
            <div className="flex w-full flex-wrap gap-1 sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                disabled={isSubmitting}
                className="text-slate-300 hover:bg-white/[0.06] hover:text-white"
                onClick={() => changeMode(mode === "sign-in" ? "sign-up" : "sign-in")}
              >
                {mode === "sign-in" ? "Need an account? Create one" : "Already have an account? Sign in"}
              </Button>
              {mode === "sign-in" && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isSubmitting}
                  className="text-cyan-100 hover:bg-cyan-300/10 hover:text-cyan-50"
                  onClick={() => void onPasswordReset()}
                >
                  Forgot password?
                </Button>
              )}
            </div>
            <Button type="submit" disabled={isSubmitting} className="min-h-11 w-full bg-cyan-300 text-slate-950 hover:bg-cyan-200 sm:w-auto">
              {isSubmitting && <LoaderCircle className="mr-2 size-4 animate-spin" />}
              {mode === "sign-in" ? "Sign in securely" : "Create private workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
