"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterDto } from "@nodedr-restaurant/types";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowRight, Building2, ShieldCheck, Store } from "lucide-react";
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
    <main className="relative flex min-h-screen flex-1 items-center justify-center bg-background px-4 py-12">
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-[440px]"
      >
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center gap-1.5 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border/80 bg-card text-foreground shadow-2xs mb-2">
            <Building2 className="h-5 w-5 text-primary" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Register Restaurant
          </h1>
          <p className="text-xs text-muted-foreground">
            Initialize an offline-first management console and owner account
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-lg border border-border/80 bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="restaurantName" className="text-xs font-medium text-foreground">
                  Restaurant Name
                </Label>
                <Input
                  id="restaurantName"
                  autoComplete="organization"
                  placeholder="e.g. Bistro Central"
                  className="h-9 rounded-md text-xs"
                  {...field("restaurantName")}
                />
                {errors.restaurantName && (
                  <p className="text-xs text-destructive">{errors.restaurantName.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="branchName" className="text-xs font-medium text-foreground">
                  Initial Branch Name
                </Label>
                <Input
                  id="branchName"
                  placeholder="Main Branch"
                  defaultValue="Main Branch"
                  className="h-9 rounded-md text-xs"
                  {...field("branchName")}
                />
                {errors.branchName && (
                  <p className="text-xs text-destructive">{errors.branchName.message}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ownerName" className="text-xs font-medium text-foreground">
                Administrator Full Name
              </Label>
              <Input
                id="ownerName"
                autoComplete="name"
                placeholder="e.g. Alex Mercer"
                className="h-9 rounded-md text-xs"
                {...field("ownerName")}
              />
              {errors.ownerName && (
                <p className="text-xs text-destructive">{errors.ownerName.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-foreground">
                Administrator Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@restaurant.com"
                className="h-9 rounded-md text-xs"
                {...field("email")}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-foreground">
                Password
              </Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="h-9 rounded-md text-xs"
                {...field("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <StatusNote note={note} onClear={clear} />

            <Button
              type="submit"
              className="mt-1 h-9 rounded-md font-medium text-xs tracking-wide"
              disabled={register.isPending}
            >
              {register.isPending ? "Creating Workspace…" : "Initialize Restaurant Console"}
            </Button>
          </form>

          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-muted-foreground" />
            <span>Local Database Storage · 100% Self-Hosted</span>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Existing installation?{" "}
          <Link href="/login" className="font-medium text-foreground hover:underline transition-colors">
            Sign in to terminal
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
