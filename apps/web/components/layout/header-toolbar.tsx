"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat, Clock, LayoutGrid, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

export function HeaderToolbar() {
  const [timeStr, setTimeStr] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>("");
  const pathname = usePathname();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
      );
      setDateStr(
        now.toLocaleDateString([], {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3">
      {/* Live Operational Clock */}
      <div className="hidden xl:flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs">
        <Clock className="h-3.5 w-3.5 text-primary/80 animate-pulse" />
        <span className="font-mono font-medium tracking-tight text-foreground">
          {timeStr || "--:--:--"}
        </span>
        <span className="text-muted-foreground/60">•</span>
        <span className="text-muted-foreground">{dateStr}</span>
      </div>

      {/* Quick Action Navigation Bar */}
      <nav aria-label="Quick operations" className="flex items-center gap-1.5">
        <Link
          href="/pos"
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
            pathname === "/pos"
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
              : "border border-border/70 bg-card/80 text-foreground hover:bg-secondary hover:border-border",
          )}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          <span>New Order</span>
        </Link>

        <Link
          href="/kds"
          className={cn(
            "hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
            pathname === "/kds"
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
              : "border border-border/70 bg-card/80 text-foreground hover:bg-secondary hover:border-border",
          )}
        >
          <ChefHat className="h-3.5 w-3.5" />
          <span>Kitchen</span>
        </Link>

        <Link
          href="/tables"
          className={cn(
            "hidden md:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
            pathname === "/tables"
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
              : "border border-border/70 bg-card/80 text-foreground hover:bg-secondary hover:border-border",
          )}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          <span>Floor Plan</span>
        </Link>
      </nav>
    </div>
  );
}

