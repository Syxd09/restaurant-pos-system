"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginDto } from "@nodedr-restaurant/types";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle, ArrowRight, KeyRound, Sparkles, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const [needsCode, setNeedsCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginDto>({ resolver: zodResolver(loginSchema) });

  const fillDemoCredentials = () => {
    setValue("email", "owner@demo.local", { shouldValidate: true });
    setValue("password", "Password123!", { shouldValidate: true });
    setError(null);
  };

  const onSubmit = (dto: LoginDto) => {
    setError(null);
    login.mutate(dto, {
      onSuccess: (data) => {
        const user = (data as { user?: { roleName?: string; permissions?: string[] } }).user;
        const rider = user?.roleName === "DELIVERY_STAFF" && user.permissions?.includes("delivery.rider");
        router.push(rider ? "/my-deliveries" : "/dashboard");
      },
      onError: (err) => {
        if (err instanceof ApiError && err.message === "TWO_FACTOR_REQUIRED") {
          setNeedsCode(true);
          return;
        }
        if (err instanceof ApiError && err.status >= 500) {
          setError("The server is encountering an issue. Please try again shortly.");
        } else if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Cannot reach the POS server. Please verify your connection.");
        }
      },
    });
  };

  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Ambient background glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[550px] w-[900px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--primary),transparent_88%),transparent_65%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-10 -z-10 h-72 w-72 rounded-full bg-primary/5 blur-3xl"
      />

      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px]"
      >
        {/* Top Branding Lockup */}
        <div className="mb-7 flex flex-col items-center gap-2 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25 text-primary-foreground mb-1 ring-4 ring-primary/10">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              OrderRestro
            </h1>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-primary border border-primary/20">
              POS POS PRO
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Offline-first Restaurant Management & Billing Console
          </p>
        </div>

        {/* Elevated Form Card */}
        <div className="rounded-2xl border border-border/80 bg-card/95 p-7 shadow-xl shadow-foreground/5 backdrop-blur-md">
          {/* Quick Demo Credentials Pill */}
          <div className="mb-6 rounded-xl border border-primary/15 bg-primary/[0.04] p-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Demo Workspace</span>
              </div>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground shadow-sm transition hover:opacity-90 active:scale-95"
              >
                Autofill Demo Login
                <ArrowRight className="h-2.5 w-2.5" />
              </button>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>User: <code className="font-mono text-foreground">owner@demo.local</code></span>
              <span>PIN: <code className="font-mono text-foreground">1234</code></span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-foreground/90">
                Email or Operator ID
              </Label>
              <Input
                id="email"
                type="text"
                autoComplete="username"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="next"
                autoFocus
                className="h-10 text-sm transition-all focus-visible:ring-primary/25"
                placeholder="owner@demo.local or phone number"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground/90">
                  Password
                </Label>
              </div>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                enterKeyHint="go"
                className="h-10 text-sm transition-all focus-visible:ring-primary/25"
                placeholder="••••••••••••"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {needsCode && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="totp" className="text-xs font-semibold text-foreground/90">
                  Two-Factor Verification Code
                </Label>
                <Input
                  id="totp"
                  inputMode="text"
                  autoComplete="one-time-code"
                  autoFocus
                  placeholder="6-digit authenticator code"
                  {...register("totp")}
                />
                <p className="text-[11px] text-muted-foreground">
                  Open your authenticator app or enter a recovery code.
                </p>
                {errors.totp && <p className="text-xs text-destructive">{errors.totp.message}</p>}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-xs text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="mt-2 h-11 w-full font-medium shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30 active:scale-[0.99]"
              disabled={login.isPending}
            >
              {login.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Authenticating…
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  Sign In to Terminal
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Quick PIN Switch Note */}
          <div className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
            <KeyRound className="h-3.5 w-3.5 text-muted-foreground/80" />
            <span>Shared tills support fast 4-digit PIN handoff</span>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-6 flex items-center justify-between px-2 text-xs text-muted-foreground">
          <Link href="/signup" className="hover:text-foreground hover:underline transition-colors">
            Register new restaurant
          </Link>
          <span className="text-muted-foreground/40">•</span>
          <Link href="/kiosk" className="hover:text-foreground hover:underline transition-colors">
            Self-service kiosk mode
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
