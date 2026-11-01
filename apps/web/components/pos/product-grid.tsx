"use client";

import { useState } from "react";
import { Plus, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { QueryError } from "@/components/ui/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveTabs } from "@/components/ui/nav-picker";
import { useCategories, useMenuItems, type MenuItem } from "@/hooks/use-menu";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ProductGrid({
  branchId,
  onSelect,
}: {
  branchId: string | null;
  onSelect: (item: MenuItem) => void;
}) {
  const { data: categories } = useCategories(branchId);
  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const {
    data: items,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useMenuItems(branchId, activeCategoryId);

  const filtered = items?.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Search Header Bar */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search menu items or barcode…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 pl-10 pr-9 text-sm transition-all focus-visible:ring-primary/25 bg-background/60"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Mobile Category Tabs */}
      {categories && categories.length > 0 && (
        <ResponsiveTabs
          mobileOnly
          className="lg:hidden"
          label="Category"
          value={activeCategoryId ?? "all"}
          onChange={(id) => setActiveCategoryId(id === "all" ? undefined : id)}
          desktopListClassName="justify-start lg:h-auto lg:flex-wrap"
          items={[
            { id: "all", label: "All Items" },
            ...categories.map((c) => ({
              id: c.id,
              label: c.name,
              hint: `${c._count.items}`,
            })),
          ]}
        />
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:gap-5">
        {/* Desktop Category Sidebar */}
        {categories && categories.length > 0 && (
          <nav
            aria-label="Category"
            className="hidden w-52 shrink-0 flex-col gap-1.5 overflow-y-auto border-r border-border/70 pr-3.5 lg:flex xl:w-56"
          >
            <div className="px-2 pb-1 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/70">
              Menu Categories
            </div>
            {[
              {
                id: undefined as string | undefined,
                name: "All Dishes",
                count: categories.reduce((sum, c) => sum + c._count.items, 0),
              },
              ...categories.map((c) => ({
                id: c.id as string | undefined,
                name: c.name,
                count: c._count.items,
              })),
            ].map((c) => {
              const active = c.id === activeCategoryId;
              return (
                <button
                  key={c.id ?? "all"}
                  type="button"
                  aria-current={active ? "true" : undefined}
                  onClick={() => setActiveCategoryId(c.id)}
                  className={cn(
                    "flex min-h-10 items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition-all duration-150",
                    active
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/25"
                      : "text-foreground hover:bg-secondary/80 hover:translate-x-0.5",
                  )}
                >
                  <span className="min-w-0 truncate" title={c.name}>
                    {c.name}
                  </span>
                  {c.count !== undefined && (
                    <span
                      className={cn(
                        "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] tabular-nums font-semibold",
                        active
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-secondary text-muted-foreground",
                      )}
                    >
                      {c.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Product Cards Grid */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {isError && !items ? (
            <QueryError
              error={error}
              what="the menu"
              onRetry={() => void refetch()}
              retrying={isFetching}
            />
          ) : (
            <div className="grid flex-1 auto-rows-min grid-cols-2 gap-3 overflow-y-auto pb-4 sm:grid-cols-3 lg:grid-cols-3 lg:gap-3.5 xl:grid-cols-4 2xl:grid-cols-5">
              {isLoading &&
                Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-2xl" />
                ))}

              {filtered?.map((item) => {
                const hasOptions =
                  item.modifierGroups.length > 0 || item.halfPrice != null;

                return (
                  <button
                    key={item.id}
                    type="button"
                    title={item.name}
                    onClick={() => onSelect(item)}
                    className="group relative flex min-h-28 flex-col justify-between rounded-xl border border-border/80 bg-card/95 p-3.5 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md active:scale-[0.98] lg:min-h-32"
                  >
                    {/* Top Row: Dietary Indicator & Custom Badge */}
                    <div className="flex w-full items-start justify-between gap-1">
                      {/* Dietary Symbol (Veg / Non-veg square) */}
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                          item.isVeg
                            ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                            : "border-red-600 bg-red-50 dark:bg-red-950/40",
                        )}
                        title={item.isVeg ? "Vegetarian" : "Non-Vegetarian"}
                      >
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            item.isVeg ? "bg-emerald-600" : "bg-red-600",
                          )}
                        />
                      </span>

                      {/* Options / Custom Tag */}
                      {hasOptions && (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-secondary/90 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground group-hover:text-foreground">
                          <SlidersHorizontal className="h-2.5 w-2.5" />
                          <span>Custom</span>
                        </span>
                      )}
                    </div>

                    {/* Dish Name */}
                    <div className="my-1.5">
                      <span className="line-clamp-2 text-xs font-semibold leading-snug text-foreground group-hover:text-primary transition-colors lg:text-[13px]">
                        {item.name}
                      </span>
                    </div>

                    {/* Bottom Row: Price & Quick Action */}
                    <div className="flex w-full items-baseline justify-between pt-1 border-t border-border/40">
                      <div>
                        <span className="text-xs font-bold tabular-nums text-foreground lg:text-sm">
                          {formatCurrency(item.price)}
                        </span>
                        {item.halfPrice != null && (
                          <span className="block text-[10px] text-muted-foreground tabular-nums">
                            ½ {formatCurrency(item.halfPrice)}
                          </span>
                        )}
                      </div>

                      {/* Add button icon */}
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-all duration-200 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-xs">
                        <Plus className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </button>
                );
              })}

              {filtered?.length === 0 && !isLoading && (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center mb-2">
                    <Search className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    No matching items
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {search ? `Nothing matches "${search}"` : "This category is currently empty"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
