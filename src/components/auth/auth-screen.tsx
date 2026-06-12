"use client";

import * as React from "react";
import { toast } from "sonner";
import { ArrowRight, Loader2, Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/layout/logo";
import { getSupabaseClient } from "@/lib/supabase/client";

type Mode = "sign-in" | "sign-up";

/**
 * Branded email + password authentication screen, shown only when the app is
 * running on the Supabase backend and no session exists.
 */
export function AuthScreen() {
  const [mode, setMode] = React.useState<Mode>("sign-in");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const client = getSupabaseClient();
    if (!client) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "sign-in") {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
        // Success: onAuthStateChange flips the gate — nothing else to do.
      } else {
        const { data, error } = await client.auth.signUp({ email, password });
        if (error) {
          setError(error.message);
        } else if (!data.session) {
          toast.success("Account created — check your email to confirm, then sign in.");
          setMode("sign-in");
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-background relative flex min-h-dvh items-center justify-center overflow-hidden p-4">
      {/* Ambient backdrop */}
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="bg-primary/20 pointer-events-none absolute -top-40 left-1/2 h-96 w-[44rem] -translate-x-1/2 rounded-full blur-[120px]" />

      <div className="relative w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo />
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">
              {mode === "sign-in" ? "Welcome back" : "Create your workspace"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {mode === "sign-in"
                ? "Sign in to your sales operating system."
                : "Your leads sync securely across every device."}
            </p>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="bg-card/80 space-y-4 rounded-xl border p-6 shadow-lg backdrop-blur"
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@agency.com"
                className="pl-8"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-8"
              />
            </div>
          </div>

          {error && (
            <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-xs">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                {mode === "sign-in" ? "Sign in" : "Create account"}
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>

        <p className="text-muted-foreground text-center text-sm">
          {mode === "sign-in" ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode((m) => (m === "sign-in" ? "sign-up" : "sign-in"));
              setError(null);
            }}
            className="text-primary font-medium hover:underline"
          >
            {mode === "sign-in" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
