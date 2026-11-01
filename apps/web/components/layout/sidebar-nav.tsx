"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@nodedr-restaurant/types";
import { hasPermission } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { useNavBadges } from "@/hooks/use-nav-badges";
import { NavDot } from "./nav-dot";
import { NAV_ITEMS, type NavSection } from "./nav-items";

const SECTIONS: { key: NavSection; label: string }[] = [
  { key: "SERVICE", label: "Front of House" },
  { key: "OPERATIONS", label: "Operations" },
  { key: "ADMINISTRATION", label: "Management" },
];

export function SidebarNav({
  user,
  onNavigate,
}: {
  user?: SessionUser;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const badges = useNavBadges();

  return (
    <nav className="flex flex-col gap-4 px-3 pb-4">
      {SECTIONS.map((section) => {
        const items = NAV_ITEMS.filter(
          (item) =>
            item.section === section.key &&
            (!item.permission || hasPermission(user, item.permission)),
        );

        if (items.length === 0) return null;

        return (
          <div key={section.key} className="flex flex-col gap-0.5">
            <span className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/40">
              {section.label}
            </span>
            <div className="flex flex-col gap-0.5">
              {items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold shadow-xs"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground hover:translate-x-0.5",
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 rounded-r-full bg-primary" />
                    )}
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-105",
                        isActive
                          ? "text-primary"
                          : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground",
                      )}
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                    <span className="truncate">{t(item.labelKey)}</span>
                    {badges.nav[item.href] && !isActive ? <NavDot /> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
