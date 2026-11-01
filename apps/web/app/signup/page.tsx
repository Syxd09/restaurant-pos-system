"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterDto } from "@nodedr-restaurant/types";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowRight, Building2, ShieldCheck, Sparkles, UtensilsCrossed } from "lucide-react";
import { StatusNote, useNoteToast } from "@/components/ui/status-note";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useRegister } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const register = useRegister();
  const { note, clear, toast } = useNoteToast();
  const prefersReducedMotion = useReducedMotion();
  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterDto>({ resolver: zodResolver(registerSchema) });

  const onSubmit = (dto: RegisterDto) => {
    register.mutate(dto, {
      onSuccess: () => router.push("/dashboard"),
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "Could not create account");
      },
    });
  };

  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Background radial ambient lights */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[550px] w-[900px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--primary),transparent_88%),transparent_65%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-10 -z-10 h-72 w-72 rounded-full bg-primary/5 blur-3xl"
      />

      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[480px]"
      >
        {/* Brand Header */}
        <div className="mb-7 flex flex-col items-center gap-2 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25 text-primary-foreground mb-1 ring-4 ring-primary/10">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              OrderRestro
            </h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary border border-primary/20">
              New Restaurant
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Configure your restaurant workspace and master owner account
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-border/80 bg-card/95 p-7 shadow-xl shadow-foreground/5 backdrop-blur-md">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="restaurantName" className="text-xs font-semibold text-foreground/90">
                  Restaurant Name
                </Label>
                <Input
                  id="restaurantName"
                  autoComplete="organization"
                  placeholder="e.g. Bella Italia Bistro"
                  className="h-10 text-xs transition-all focus-visible:ring-primary/25"
                  {...field("restaurantName")}
                />
                {errors.restaurantName && (
                  <p className="text-xs text-destructive">{errors.restaurantName.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="branchName" className="text-xs font-semibold text-foreground/90">
                  First Branch Name
                </Label>
                <Input
                  id="branchName"
                  placeholder="Main Outlet"
                  defaultValue="Main Branch"
                  className="h-10 text-xs transition-all focus-visible:ring-primary/25"
                  {...field("branchName")}
                />
                {errors.branchName && (
                  <p className="text-xs text-destructive">{errors.branchName.message}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ownerName" className="text-xs font-semibold text-foreground/90">
                Owner Full Name
              </Label>
              <Input
                id="ownerName"
                autoComplete="name"
                placeholder="e.g. Chef Marco Silva"
                className="h-10 text-xs transition-all focus-visible:ring-primary/25"
                {...field("ownerName")}
              />
              {errors.ownerName && (
                <p className="text-xs text-destructive">{errors.ownerName.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-foreground/90">
                Master Login Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="owner@restaurant.com"
                className="h-10 text-xs transition-all focus-visible:ring-primary/25"
                {...field("email")}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-foreground/90">
                Master Password
              </Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="h-10 text-xs transition-all focus-visible:ring-primary/25"
                {...field("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <StatusNote note={note} onClear={clear} />

            <Button
              type="submit"
              className="mt-2 h-11 w-full font-medium shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30 active:scale-[0.99]"
              disabled={register.isPending}
            >
              {register.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Creating Workspace…
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  Launch Restaurant Workspace
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Guarantee Badge */}
          <div className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>100% Offline-First · Zero Cloud Lock-in · Self-Hosted</span>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Already initialized your workspace?{" "}
          <Link href="/login" className="font-medium text-foreground hover:underline transition-colors">
            Sign in to existing terminal
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
