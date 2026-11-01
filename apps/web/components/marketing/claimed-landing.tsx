import Link from "next/link";
import { ArrowRight, MonitorCheck, ShieldCheck, Store } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ClaimedLanding() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center sm:px-6 bg-background">
      <div className="mx-auto flex w-full max-w-md flex-col items-center">
        {/* Brand Icon */}
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md border border-border/80 bg-card text-foreground shadow-2xs">
          <Store className="h-5 w-5 text-primary" strokeWidth={2} />
        </div>

        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground border border-border/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Terminal Operational
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          OrderRestro
        </h1>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm">
          Offline-first restaurant management system, point of sale, and kitchen dispatch.
        </p>

        {/* Action Grid */}
        <div className="mt-6 grid w-full grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <Link
            href="/login"
            className="group flex flex-col justify-between rounded-lg border border-border/80 bg-card p-4 shadow-2xs transition-all duration-150 hover:border-primary/40 hover:bg-secondary/30"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
              <h2 className="text-xs font-semibold text-foreground">Terminal & Backoffice</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Access POS till, floor plan, kitchen display, and reports.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-border/40 text-[11px] font-medium text-primary">
              Sign In
            </div>
          </Link>

          <Link
            href="/kiosk"
            className="group flex flex-col justify-between rounded-lg border border-border/80 bg-card p-4 shadow-2xs transition-all duration-150 hover:border-primary/40 hover:bg-secondary/30"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <MonitorCheck className="h-4 w-4 text-muted-foreground" />
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
              <h2 className="text-xs font-semibold text-foreground">Self-Order Kiosk</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Guest touch ordering terminal for dine-in & takeaway.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-border/40 text-[11px] font-medium text-muted-foreground group-hover:text-foreground">
              Launch Kiosk
            </div>
          </Link>
        </div>

        {/* Documentation Links */}
        <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
          <Link href="/docs" className="hover:text-foreground hover:underline transition-colors">
            Documentation
          </Link>
          <span className="text-muted-foreground/30">•</span>
          <Link href="/signup" className="hover:text-foreground hover:underline transition-colors">
            Register New Branch
          </Link>
        </div>
      </div>
    </div>
  );
}
