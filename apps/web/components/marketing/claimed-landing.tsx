import Link from "next/link";
import { ArrowRight, LayoutGrid, MonitorCheck, ShieldCheck, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ClaimedLanding() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-20 text-center sm:px-6 bg-background overflow-hidden">
      {/* Background radial gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--primary),transparent_90%),transparent_70%)]"
      />

      <div className="mx-auto flex w-full max-w-lg flex-col items-center">
        {/* Brand Icon */}
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20 text-primary-foreground ring-4 ring-primary/10">
          <UtensilsCrossed className="h-7 w-7" />
        </div>

        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Terminal Online
          </span>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground border border-border/60">
            LAN Active
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          OrderRestro
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          Self-hosted restaurant management system, point-of-sale terminal, and live kitchen dispatch.
        </p>

        {/* Action Grid */}
        <div className="mt-8 grid w-full grid-cols-1 sm:grid-cols-2 gap-3.5 text-left">
          <Link
            href="/login"
            className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card/90 p-5 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Management & Till</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Sign in to POS, kitchen display, inventory, and floor manager.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 text-xs font-medium text-primary flex items-center gap-1">
              <span>Open Staff Portal</span>
            </div>
          </Link>

          <Link
            href="/kiosk"
            className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card/90 p-5 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-foreground">
                  <MonitorCheck className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Self-Order Kiosk</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Touchscreen guest ordering terminal for dine-in & takeaway.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 text-xs font-medium text-muted-foreground group-hover:text-foreground flex items-center gap-1">
              <span>Launch Kiosk</span>
            </div>
          </Link>
        </div>

        {/* Documentation & Manual */}
        <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
          <Link href="/docs" className="hover:text-foreground hover:underline transition-colors">
            System Documentation
          </Link>
          <span>•</span>
          <Link href="/signup" className="hover:text-foreground hover:underline transition-colors">
            Branch Onboarding
          </Link>
        </div>
      </div>
    </div>
  );
}
