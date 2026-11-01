"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginDto } from "@nodedr-restaurant/types";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle, ArrowRight, KeyRound, Lock, Store } from "lucide-react";
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
          setError("Server unreachable. Please verify the local service is running.");
        } else if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Connection failed. Check network link.");
        }
      },
    });
  };

  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center bg-background px-4 py-12">
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-[380px]"
      >
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center gap-1.5 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border/80 bg-card text-foreground shadow-2xs mb-2">
            <Store className="h-5 w-5 text-primary" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            OrderRestro
          </h1>
          <p className="text-xs text-muted-foreground">
            Restaurant Operations & Point of Sale Console
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-lg border border-border/80 bg-card p-6 shadow-sm">
          {/* Quick Demo Credentials Bar */}
          <div className="mb-5 rounded-md border border-border/70 bg-secondary/50 p-2.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-muted-foreground">
                owner@demo.local
              </span>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="inline-flex items-center gap-1 rounded-sm border border-border/80 bg-card px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-muted transition-colors active:scale-95"
              >
                Autofill
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-foreground">
                Email / Operator ID
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
                className="h-9 rounded-md text-xs font-normal"
                placeholder="operator@restaurant.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-foreground">
                Password
              </Label>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                enterKeyHint="go"
                className="h-9 rounded-md text-xs font-normal"
                placeholder="••••••••••••"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {needsCode && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="totp" className="text-xs font-medium text-foreground">
                  Security Code
                </Label>
                <Input
                  id="totp"
                  inputMode="text"
                  autoComplete="one-time-code"
                  autoFocus
                  className="h-9 rounded-md text-xs"
                  placeholder="6-digit code"
                  {...register("totp")}
                />
                {errors.totp && <p className="text-xs text-destructive">{errors.totp.message}</p>}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive"
              >
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="mt-1 h-9 rounded-md font-medium text-xs tracking-wide"
              disabled={login.isPending}
            >
              {login.isPending ? "Authenticating…" : "Sign In to Terminal"}
            </Button>
          </form>

          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
            <KeyRound className="h-3 w-3 text-muted-foreground" />
            <span>Shared terminals support 4-digit PIN handoff</span>
          </div>
        </div>

        {/* Clean Footer */}
        <div className="mt-4 flex items-center justify-between px-1 text-xs text-muted-foreground">
          <Link href="/signup" className="hover:text-foreground hover:underline transition-colors">
            Register new branch
          </Link>
          <span className="text-muted-foreground/30">•</span>
          <Link href="/kiosk" className="hover:text-foreground hover:underline transition-colors">
            Kiosk Mode
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
