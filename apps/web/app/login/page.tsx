"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginDto } from "@nodedr-restaurant/types";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle, Lock, ShieldCheck, Store, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useCurrentUser, useLogin } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const { data: auth, isSuccess } = useCurrentUser();
  const [needsCode, setNeedsCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const [brandName, setBrandName] = useState("OrderRestro");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("nodedr_restaurant_name");
      const savedLogo = localStorage.getItem("nodedr_logo_url");
      if (savedName) setBrandName(savedName);
      if (savedLogo) setLogoUrl(savedLogo);
    }
  }, []);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isSuccess && auth?.user) {
      router.replace("/dashboard");
    }
  }, [isSuccess, auth, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDto>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (dto: LoginDto) => {
    setError(null);
    login.mutate(dto, {
      onSuccess: () => {
        router.push("/dashboard");
      },
      onError: (err) => {
        if (err instanceof ApiError && err.message === "TWO_FACTOR_REQUIRED") {
          setNeedsCode(true);
          return;
        }
        if (err instanceof ApiError && err.status >= 500) {
          setError("Server unreachable. Please verify local service is active.");
        } else if (err instanceof ApiError) {
          setError(err.message === "Invalid credentials" ? "Invalid login credentials. Please check your email and password." : err.message);
        } else {
          setError("Connection failed. Check network connection.");
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
        className="w-full max-w-[390px]"
      >
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center gap-1.5 text-center">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-12 w-12 object-contain rounded-md mb-1 border border-border/60 bg-card p-1 shadow-2xs" />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border/80 bg-card text-foreground shadow-2xs mb-1">
              <Store className="h-5 w-5 text-primary" strokeWidth={2} />
            </div>
          )}
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {brandName}
          </h1>
          <p className="text-xs text-muted-foreground">
            Restaurant Operations &amp; POS Console
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-lg border border-border/80 bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-foreground">
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
                placeholder="staff@restaurant.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-foreground">
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
                <Label htmlFor="totp" className="text-xs font-semibold text-foreground">
                  Security Code
                </Label>
                <Input
                  id="totp"
                  inputMode="text"
                  autoComplete="one-time-code"
                  autoFocus
                  className="h-9 rounded-md text-xs font-mono"
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
              className="mt-2 h-9 rounded-md font-semibold text-xs tracking-wide shadow-xs"
              disabled={login.isPending}
            >
              {login.isPending ? "Signing In…" : "Sign In to Terminal"}
            </Button>
          </form>

          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span>Authorized staff &amp; team access only</span>
          </div>
        </div>

        {/* Clean System Footer */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <span>OrderRestro Enterprise POS · Offline-First Architecture</span>
        </div>
      </motion.div>
    </main>
  );
}
