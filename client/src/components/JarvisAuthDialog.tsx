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
import { beginJarvisOAuthSignIn, type JarvisOAuthProvider } from "@/lib/jarvisOAuth";
import { hasSupabaseAuthConfiguration, requireSupabaseClient } from "@/lib/supabaseClient";
import { Github, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { FormEvent, useState } from "react";

type JarvisAuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthenticated: () => void;
};

export function JarvisAuthDialog({ open, onOpenChange, onAuthenticated }: JarvisAuthDialogProps) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetStatus = () => setStatus(null);

  const onOAuthSignIn = async (provider: JarvisOAuthProvider) => {
    if (!hasSupabaseAuthConfiguration) {
      setStatus("Jarvis sign-in is not configured for this deployment yet.");
      return;
    }

    setStatus(null);
    setIsSubmitting(true);
    try {
      await beginJarvisOAuthSignIn(requireSupabaseClient(), provider, window.location.origin);
      setStatus(`Redirecting securely to ${provider === "google" ? "Google" : "GitHub"}…`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Jarvis could not begin provider sign-in.");
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasSupabaseAuthConfiguration) {
      setStatus("Jarvis sign-in is not configured for this deployment yet.");
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
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) {
          onAuthenticated();
          onOpenChange(false);
          return;
        }
        setStatus("Check your inbox to confirm your account, then return here to sign in.");
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
      setStatus(error instanceof Error ? error.message : "Jarvis could not complete sign-in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-cyan-300/25 bg-slate-950 text-slate-100 shadow-[0_0_48px_rgba(34,211,238,0.12)]">
        <DialogHeader>
          <div className="mb-1 flex size-10 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-100">
            <LockKeyhole className="size-5" />
          </div>
          <DialogTitle className="font-mono tracking-[0.12em] text-cyan-50">PRIVATE JARVIS ACCESS</DialogTitle>
          <DialogDescription className="text-slate-400">
            {mode === "sign-in"
              ? "Sign in to continue to your encrypted workspace, conversations, and memory."
              : "Create a private Jarvis workspace. You may be asked to verify your email first."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            className="border-white/10 bg-white/[0.035] text-slate-100 hover:bg-white/[0.08] hover:text-white"
            onClick={() => void onOAuthSignIn("google")}
          >
            <span aria-hidden className="mr-2 font-semibold text-cyan-100">G</span>
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            className="border-white/10 bg-white/[0.035] text-slate-100 hover:bg-white/[0.08] hover:text-white"
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

        <form className="grid gap-4" onSubmit={onSubmit}>
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
              className="border-white/10 bg-white/[0.045] text-slate-100 placeholder:text-slate-600"
              placeholder="At least 6 characters"
              required
            />
          </div>
          {status && <p role="status" className="rounded-lg border border-cyan-200/15 bg-cyan-300/5 px-3 py-2 text-sm text-cyan-100">{status}</p>}
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              className="text-slate-300 hover:bg-white/[0.06] hover:text-white"
              onClick={() => { setMode((current) => current === "sign-in" ? "sign-up" : "sign-in"); resetStatus(); }}
            >
              {mode === "sign-in" ? "Create an account" : "I already have an account"}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-cyan-300 text-slate-950 hover:bg-cyan-200">
              {isSubmitting && <LoaderCircle className="mr-2 size-4 animate-spin" />}
              {mode === "sign-in" ? "Sign in securely" : "Create private workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
