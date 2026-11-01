"use client";

import { useState } from "react";
import { Plus, Search, SlidersHorizontal, X } from "lucide-react";
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
    <div className="flex h-full flex-col gap-3">
      {/* Search Header Bar */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search menu items…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 pl-9 pr-8 text-xs rounded-md border-border/80 bg-background"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-2.5 p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
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

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:gap-4">
        {/* Desktop Category Sidebar */}
        {categories && categories.length > 0 && (
          <nav
            aria-label="Category"
            className="hidden w-48 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border/70 pr-3 lg:flex xl:w-52"
          >
            <div className="px-2 pb-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground/60">
              Categories
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
                    "flex min-h-8 items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                      : "text-foreground hover:bg-secondary",
                  )}
                >
                  <span className="min-w-0 truncate" title={c.name}>
                    {c.name}
                  </span>
                  {c.count !== undefined && (
                    <span
                      className={cn(
                        "shrink-0 rounded-xs px-1 py-0.2 text-[10px] tabular-nums font-semibold",
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
            <div className="grid flex-1 auto-rows-min grid-cols-2 gap-2.5 overflow-y-auto pb-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {isLoading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-md" />
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
                    className="group flex min-h-24 flex-col justify-between rounded-md border border-border/80 bg-card p-3 text-left shadow-2xs transition-colors hover:border-primary/50 hover:bg-secondary/20 active:scale-[0.99] lg:min-h-28"
                  >
                    {/* Top Row: Dietary Indicator & Custom Badge */}
                    <div className="flex w-full items-start justify-between gap-1">
                      <span
                        className={cn(
                          "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-xs border",
                          item.isVeg
                            ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                            : "border-red-600 bg-red-50 dark:bg-red-950/40",
                        )}
                        title={item.isVeg ? "Vegetarian" : "Non-Vegetarian"}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            item.isVeg ? "bg-emerald-600" : "bg-red-600",
                          )}
                        />
                      </span>

                      {hasOptions && (
                        <span className="inline-flex items-center gap-0.5 rounded-xs bg-secondary px-1 py-0.2 text-[9px] font-medium text-muted-foreground group-hover:text-foreground">
                          <SlidersHorizontal className="h-2 w-2" />
                          <span>Options</span>
                        </span>
                      )}
                    </div>

                    {/* Dish Name */}
                    <div className="my-1">
                      <span className="line-clamp-2 text-xs font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
                        {item.name}
                      </span>
                    </div>

                    {/* Bottom Row: Price & Add Action */}
                    <div className="flex w-full items-baseline justify-between pt-1 border-t border-border/40">
                      <div>
                        <span className="text-xs font-bold tabular-nums text-foreground">
                          {formatCurrency(item.price)}
                        </span>
                        {item.halfPrice != null && (
                          <span className="block text-[10px] text-muted-foreground tabular-nums">
                            ½ {formatCurrency(item.halfPrice)}
                          </span>
                        )}
                      </div>

                      <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-secondary text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <Plus className="h-3 w-3" />
                      </div>
                    </div>
                  </button>
                );
              })}

              {filtered?.length === 0 && !isLoading && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center mb-1.5">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs font-medium text-foreground">
                    No items found
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {search ? `No items match "${search}"` : "This category is empty"}
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
