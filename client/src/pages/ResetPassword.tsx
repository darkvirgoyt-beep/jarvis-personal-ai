import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hasSupabaseAuthConfiguration, requireSupabaseClient } from "@/lib/supabaseClient";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle2, KeyRound, LoaderCircle, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link } from "wouter";

export default function ResetPassword() {
  const utils = trpc.useUtils();
  const [ready, setReady] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<{ tone: "error" | "success"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!hasSupabaseAuthConfiguration) {
      setReady(true);
      return;
    }

    const client = requireSupabaseClient();
    const checkSession = async () => {
      const { data } = await client.auth.getSession();
      setHasRecoverySession(Boolean(data.session));
      setReady(true);
    };

    void checkSession();
    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      setHasRecoverySession(Boolean(session));
      setReady(true);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < 6) {
      setStatus({ tone: "error", message: "Choose a new password with at least 6 characters." });
      return;
    }
    if (password !== confirmPassword) {
      setStatus({ tone: "error", message: "The two new passwords do not match." });
      return;
    }
    if (!hasRecoverySession || !hasSupabaseAuthConfiguration) {
      setStatus({ tone: "error", message: "This recovery link is missing or has expired. Request a fresh password reset from Jarvis sign-in." });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);
    try {
      const { error } = await requireSupabaseClient().auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      setConfirmPassword("");
      await utils.auth.me.invalidate();
      // Recovery URLs can contain temporary access material in their fragment.
      // Replace the document URL after the identity cache is fresh so the user
      // reaches the private workspace without leaving sensitive callback data.
      window.location.replace("/");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Jarvis could not update the password. Request a fresh recovery email and try again.";
      setStatus({ tone: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#020712] px-5 py-10 text-slate-100">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-md place-items-center">
        <section className="w-full rounded-2xl border border-cyan-300/20 bg-slate-950/90 p-6 shadow-[0_0_56px_rgba(34,211,238,0.12)] sm:p-8">
          <div className="mb-6 flex size-12 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-100">
            <KeyRound className="size-6" />
          </div>
          <p className="font-mono text-xs tracking-[0.22em] text-cyan-200">JARVIS SECURITY</p>
          <h1 className="mt-2 font-mono text-2xl tracking-wide text-white">RESET PASSWORD</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">Choose a new password after opening the secure recovery link from your email. Jarvis never displays or stores readable passwords.</p>

          {!ready ? (
            <div className="mt-7 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
              <LoaderCircle className="size-4 animate-spin text-cyan-200" /> Checking recovery link…
            </div>
          ) : !hasRecoverySession ? (
            <div className="mt-7 rounded-xl border border-amber-200/20 bg-amber-100/5 p-4 text-sm leading-6 text-amber-100">
              This link is missing or expired. Return to Jarvis, select <strong>I already have an account</strong>, then choose <strong>Forgot password?</strong> to receive a new recovery email.
            </div>
          ) : (
            <form className="mt-7 grid gap-4" onSubmit={onSubmit} noValidate>
              <div className="grid gap-2">
                <Label htmlFor="jarvis-new-password" className="text-slate-300">New password</Label>
                <Input id="jarvis-new-password" type="password" autoComplete="new-password" minLength={6} value={password} onChange={(event) => { setPassword(event.target.value); setStatus(null); }} className="border-white/10 bg-white/[0.045] text-slate-100" placeholder="At least 6 characters" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="jarvis-confirm-password" className="text-slate-300">Confirm new password</Label>
                <Input id="jarvis-confirm-password" type="password" autoComplete="new-password" minLength={6} value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setStatus(null); }} className="border-white/10 bg-white/[0.045] text-slate-100" placeholder="Repeat your new password" required />
              </div>
              {status && (
                <p role={status.tone === "error" ? "alert" : "status"} className={status.tone === "error" ? "rounded-lg border border-rose-300/25 bg-rose-300/10 px-3 py-2 text-sm text-rose-100" : "rounded-lg border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-100"}>
                  {status.tone === "success" && <CheckCircle2 className="mr-2 inline size-4" />} {status.message}
                </p>
              )}
              <Button type="submit" disabled={isSubmitting} className="bg-cyan-300 text-slate-950 hover:bg-cyan-200">
                {isSubmitting && <LoaderCircle className="mr-2 size-4 animate-spin" />} Update password
              </Button>
            </form>
          )}

          <div className="mt-6 flex items-center gap-2 text-xs text-slate-500"><ShieldCheck className="size-4 text-cyan-200" /> Recovery email links are single-use and time-limited.</div>
          <Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm text-cyan-100 hover:text-cyan-50"><ArrowLeft className="size-4" /> Return to Jarvis sign-in</Link>
        </section>
      </div>
    </main>
  );
}
