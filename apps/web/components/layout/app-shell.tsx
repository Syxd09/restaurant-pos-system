"use client";

import type { SessionUser } from "@nodedr-restaurant/types";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { EntityDialogHost } from "@/components/layout/entity-dialog-host";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useBranch } from "@/hooks/use-branch";
import { useDisplaySettings } from "@/hooks/use-settings";
import { BrandFooter } from "./brand-footer";
import { BranchSwitcher } from "./branch-switcher";
import { LanguageSwitcher } from "./language-switcher";
import { HeaderToolbar } from "./header-toolbar";
import { Logo } from "./logo";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

function RestaurantBrand() {
  const { branchId } = useBranch();
  const { data } = useDisplaySettings(branchId);
  const restaurant = data?.restaurant;

  if (restaurant?.logoUrl) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element -- uploaded asset served from the backend, not a Next-optimizable remote source */}
        <img
          src={restaurant.logoUrl}
          alt={restaurant.name}
          className="h-8 w-8 shrink-0 rounded-lg object-contain"
        />
        <span className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
          {restaurant.name}
        </span>
      </>
    );
  }

  return (
    <>
      <Logo />
      <span className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
        {restaurant?.name ?? "OrderRestro"}
      </span>
    </>
  );
}

export function AppShell({
  user,
  children,
}: {
  user?: SessionUser;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center gap-2 px-5 border-b border-sidebar-border/40">
          <RestaurantBrand />
        </div>
        <div className="px-3 py-3">
          <BranchSwitcher />
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <SidebarNav user={user} />
        </div>
        <BrandFooter />
      </aside>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-16 items-center gap-2 px-5 border-b border-sidebar-border/40">
            <RestaurantBrand />
          </div>
          <div className="px-3 py-3">
            <BranchSwitcher />
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            <SidebarNav user={user} onNavigate={() => setMobileOpen(false)} />
          </div>
          <BrandFooter />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border/80 bg-background/90 px-4 backdrop-blur-md sm:px-6 shadow-xs">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block">
            <HeaderToolbar />
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <NotificationBell />
            <div className="h-4 w-px bg-border/60 mx-1" />
            <UserMenu user={user} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8">{children}</main>
        <EntityDialogHost />
      </div>
      <MobileBottomNav user={user} onMore={() => setMobileOpen(true)} />
    </div>
  );
}
