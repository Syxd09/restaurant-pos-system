import { ShieldCheck, Wifi } from "lucide-react";

export function BrandFooter() {
  return (
    <div className="flex flex-col gap-2 border-t border-sidebar-border/80 px-4 py-3 bg-sidebar/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[11px] font-medium text-sidebar-foreground/80">Local Server Active</span>
        </div>
        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-secondary/80">
          <Wifi className="h-2.5 w-2.5" /> LAN
        </span>
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground/75 pt-1 border-t border-sidebar-border/40">
        <span className="flex items-center gap-1 font-mono text-[10px]">
          <ShieldCheck className="h-3 w-3 text-primary/70" /> Enterprise POS
        </span>
        <span className="font-mono text-[10px]">v1.0.0</span>
      </div>
    </div>
  );
}
