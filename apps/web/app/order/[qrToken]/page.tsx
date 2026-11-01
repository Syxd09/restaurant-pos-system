"use client";

import {
  BellRing,
  CheckCircle2,
  Filter,
  Leaf,
  Minus,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { use, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ModifierPickerDialog } from "@/components/pos/modifier-picker-dialog";
import { PopBurst } from "@/components/order/pop-burst";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n/context";
import { api, ApiError } from "@/lib/api";
import { playSuccessChime, vibrateSuccess } from "@/lib/celebrate";
import { formatCurrency, setActiveCurrency } from "@/lib/format";

interface PublicMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: string;
  isVeg: boolean;
  modifierGroups: {
    modifierGroup: {
      id: string;
      name: string;
      minSelect: number;
      maxSelect: number;
      isRequired: boolean;
      modifiers: { id: string; name: string; priceAdjustment: string; isDefault: boolean }[];
    };
  }[];
}

interface CartLine {
  key: string;
  menuItemId: string;
  modifierIds: string[];
  label: string;
  unitPrice: number;
  quantity: number;
}

interface PublicStatus {
  order: {
    orderNumber: string;
    status: string;
    acceptance: string;
    items: { id: string; nameSnapshot: string; quantity: number; status: string }[];
  } | null;
  openRequests: ("WAITER" | "BILL")[];
}

const ITEM_STATUS_LABEL: Record<string, string> = {
  NEW: "Received",
  ACCEPTED: "Received",
  PREPARING: "Being prepared",
  READY: "Ready",
  SERVED: "Served",
  CANCELLED: "Cancelled",
};

interface PublicMenuCategory {
  id: string;
  name: string;
  items: PublicMenuItem[];
}

interface PublicMenuResponse {
  restaurantName?: string;
  logoUrl?: string | null;
  currency?: string;
  onlineMinOrderAmount?: number;
  branchName: string;
  tableName: string;
  categories: PublicMenuCategory[];
}

export default function PublicMenuPage({
  params,
}: {
  params: Promise<{ qrToken: string }>;
}) {
  const { qrToken } = use(params);
  const { t } = useI18n();
  const nameStorageKey = `qr-guest-name:${qrToken}`;
  const [cart, setCart] = useState<CartLine[]>([]);
  const [pickerItem, setPickerItem] = useState<PublicMenuItem | null>(null);
  const queryClient = useQueryClient();
  const [placed, setPlaced] = useState<{ orderNumber: string } | null>(null);
  const [guestName, setGuestName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [vegOnly, setVegOnly] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(nameStorageKey);
    if (saved) setGuestName(saved);
  }, [nameStorageKey]);

  useEffect(() => {
    if (placed) {
      vibrateSuccess();
      playSuccessChime();
    }
  }, [placed]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-menu", qrToken],
    queryFn: () => api.get<PublicMenuResponse>(`/public/menu/${qrToken}`),
    retry: false,
  });

  useEffect(() => {
    if (data?.currency) setActiveCurrency(data.currency);
  }, [data?.currency]);

  // Live status of the table's tab and any pending waiter/bill request.
  const { data: status } = useQuery({
    queryKey: ["public-status", qrToken],
    queryFn: () => api.get<PublicStatus>(`/public/menu/${qrToken}/status`),
    refetchInterval: 8000,
    enabled: !!data,
  });

  const requestService = useMutation({
    mutationFn: (type: "WAITER" | "BILL") => api.post(`/public/menu/${qrToken}/request`, { type }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["public-status", qrToken] }),
  });

  const placeOrder = useMutation({
    mutationFn: () => {
      const trimmed = guestName.trim();
      if (trimmed) {
        sessionStorage.setItem(nameStorageKey, trimmed);
      }
      return api.post<{ orderNumber: string }>(`/public/menu/${qrToken}/order`, {
        guestName: trimmed || (data?.tableName ? `Guest (${data.tableName})` : "Guest"),
        items: cart.map((l) => ({
          menuItemId: l.menuItemId,
          quantity: l.quantity,
          modifierIds: l.modifierIds,
        })),
      });
    },
    onSuccess: (order) => {
      setPlaced(order);
      setCart([]);
      setShowCartDrawer(false);
      queryClient.invalidateQueries({ queryKey: ["public-status", qrToken] });
    },
  });

  const cartCount = cart.reduce((sum, l) => sum + l.quantity, 0);
  const cartTotal = cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  const quantityOfItem = (itemId: string) =>
    cart.filter((l) => l.menuItemId === itemId).reduce((sum, l) => sum + l.quantity, 0);

  const addLine = (item: PublicMenuItem, modifierIds: string[], label: string, extra: number) => {
    const key = `${item.id}:${[...modifierIds].sort().join(",")}`;
    setCart((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) return prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + 1 } : l));
      return [
        ...prev,
        { key, menuItemId: item.id, modifierIds, label, unitPrice: Number(item.price) + extra, quantity: 1 },
      ];
    });
  };

  const handleAdd = (item: PublicMenuItem) => {
    if (item.modifierGroups.length > 0) setPickerItem(item);
    else addLine(item, [], "", 0);
  };

  const removeOne = (itemId: string) =>
    setCart((prev) => {
      const idx = [...prev].reverse().findIndex((l) => l.menuItemId === itemId);
      if (idx < 0) return prev;
      const at = prev.length - 1 - idx;
      return prev
        .map((l, i) => (i === at ? { ...l, quantity: l.quantity - 1 } : l))
        .filter((l) => l.quantity > 0);
    });

  const filteredCategories = useMemo(() => {
    if (!data?.categories) return [];
    return data.categories
      .map((cat) => {
        if (selectedCategory !== "ALL" && cat.id !== selectedCategory) {
          return null;
        }
        const filteredItems = cat.items.filter((item) => {
          if (vegOnly && !item.isVeg) return false;
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchName = item.name.toLowerCase().includes(q);
            const matchDesc = item.description?.toLowerCase().includes(q);
            return matchName || matchDesc;
          }
          return true;
        });
        if (filteredItems.length === 0) return null;
        return {
          ...cat,
          items: filteredItems,
        };
      })
      .filter((cat): cat is PublicMenuCategory => cat !== null);
  }, [data?.categories, selectedCategory, vegOnly, searchQuery]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <UtensilsCrossed className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold text-foreground">{t("order.qrNotRecognized")}</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          {error instanceof ApiError ? error.message : t("order.askStaffForHelp")}
        </p>
      </div>
    );
  }

  if (placed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <PopBurst />
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {t("order.thankYouName", { name: guestName || data?.tableName || "Guest" })}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("order.thanksMessage", { branch: data?.branchName ?? t("order.theKitchen") })}
          </p>
        </div>
        <div className="w-full max-w-xs rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Order Placed</p>
          <p className="mt-1 font-mono text-2xl font-bold text-foreground">#{placed.orderNumber}</p>
          <div className="mt-3 flex items-center justify-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
            <Badge variant="outline" className="font-medium">
              {data?.tableName}
            </Badge>
            <span>Kitchen has been notified</span>
          </div>
        </div>
        <Button variant="outline" className="mt-2" onClick={() => setPlaced(null)}>
          {t("order.orderMore")}
        </Button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background pb-32">
      {/* Top Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {data?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.logoUrl} alt="" className="h-9 w-9 rounded-md object-contain border border-border" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
            )}
            <div>
              <h1 className="text-sm font-semibold leading-tight text-foreground line-clamp-1">
                {data?.restaurantName || data?.branchName || "Restaurant"}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="secondary" className="px-1.5 py-0 text-[11px] font-medium">
                  {data?.tableName || "Dine-in"}
                </Badge>
                <span className="text-[11px] text-muted-foreground">{data?.branchName}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mx-auto max-w-lg px-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search food or drinks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-8 pr-8 text-xs rounded-md"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              type="button"
              variant={vegOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setVegOnly(!vegOnly)}
              className="h-9 gap-1.5 px-2.5 text-xs font-medium rounded-md"
            >
              <Leaf className={`h-3.5 w-3.5 ${vegOnly ? "text-white" : "text-emerald-500"}`} />
              <span>Veg</span>
            </Button>
          </div>

          {/* Category Tabs */}
          {data?.categories && data.categories.length > 1 && (
            <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => setSelectedCategory("ALL")}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                  selectedCategory === "ALL"
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                All Dishes
              </button>
              {data.categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                    selectedCategory === cat.id
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Menu Feed */}
      <main className="mx-auto max-w-lg px-4 py-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <UtensilsCrossed className="h-10 w-10 text-muted-foreground/60 mb-2" />
            <p className="text-sm font-medium text-foreground">No dishes found</p>
            <p className="text-xs text-muted-foreground mt-0.5">Try searching with a different term or filter</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {filteredCategories.map((category) => (
              <section key={category.id} className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {category.name}
                  </h2>
                  <span className="text-[11px] text-muted-foreground">{category.items.length} items</span>
                </div>

                <div className="flex flex-col gap-2">
                  {category.items.map((item) => {
                    const quantity = quantityOfItem(item.id);
                    return (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3 shadow-xs transition hover:border-border/80"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex h-3 w-3 items-center justify-center rounded-xs border ${
                                item.isVeg
                                  ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950"
                                  : "border-rose-600 bg-rose-50 dark:bg-rose-950"
                              }`}
                              title={item.isVeg ? "Vegetarian" : "Non-Vegetarian"}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  item.isVeg ? "bg-emerald-600" : "bg-rose-600"
                                }`}
                              />
                            </span>
                            <p className="text-sm font-semibold text-foreground leading-snug">{item.name}</p>
                          </div>

                          {item.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                              {item.description}
                            </p>
                          )}

                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-sm font-bold tabular-nums text-foreground">
                              {formatCurrency(item.price)}
                            </span>
                            {item.modifierGroups.length > 0 && (
                              <span className="text-[11px] font-medium text-muted-foreground">
                                • Customizable
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quantity Stepper or Add Button */}
                        <div className="shrink-0 self-center">
                          {quantity > 0 ? (
                            <div className="flex items-center gap-1 rounded-md border border-border bg-muted/40 p-0.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-sm text-foreground hover:bg-background"
                                onClick={() => removeOne(item.id)}
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </Button>
                              <span className="w-6 text-center text-xs font-bold tabular-nums text-foreground">
                                {quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-sm text-foreground hover:bg-background"
                                onClick={() => handleAdd(item)}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-xs font-semibold rounded-md border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition"
                              onClick={() => handleAdd(item)}
                            >
                              <Plus className="mr-1 h-3.5 w-3.5" />
                              {t("order.add")}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Active Table Order Status (if existing order on table) */}
      {status && (status.order || status.openRequests.length > 0) && (
        <section className="mx-auto max-w-lg px-4 pb-4">
          <div className="rounded-lg border border-border bg-card p-3.5 shadow-xs">
            {status.order && (
              <div>
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-foreground">
                      Active Order #{status.order.orderNumber}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-medium">
                    {status.order.acceptance === "PENDING" ? "Waiting confirmation" : "In Progress"}
                  </Badge>
                </div>
                <ul className="mt-2.5 flex flex-col gap-1 text-xs text-muted-foreground">
                  {status.order.items.map((i) => (
                    <li key={i.id} className="flex justify-between gap-3 py-0.5">
                      <span className="text-foreground">
                        {i.quantity} × {i.nameSnapshot}
                      </span>
                      <span className="font-medium text-muted-foreground">
                        {ITEM_STATUS_LABEL[i.status] ?? i.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-3 flex gap-2 border-t border-border pt-3">
              <Button
                variant="outline"
                size="sm"
                className="h-9 flex-1 text-xs"
                disabled={requestService.isPending || status.openRequests.includes("WAITER")}
                onClick={() => requestService.mutate("WAITER")}
              >
                <BellRing className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                {status.openRequests.includes("WAITER") ? "Waiter coming" : "Call Waiter"}
              </Button>
              {status.order && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 flex-1 text-xs"
                  disabled={requestService.isPending || status.openRequests.includes("BILL")}
                  onClick={() => requestService.mutate("BILL")}
                >
                  <Receipt className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                  {status.openRequests.includes("BILL") ? "Bill requested" : "Request Bill"}
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Modifier Picker Dialog */}
      <ModifierPickerDialog
        item={pickerItem}
        open={!!pickerItem}
        onOpenChange={(open) => !open && setPickerItem(null)}
        onConfirm={(ids, label) => {
          if (!pickerItem) return;
          const extra = ids.reduce((sum, id) => {
            const m = pickerItem.modifierGroups.flatMap((g) => g.modifierGroup.modifiers).find((x) => x.id === id);
            return sum + (m ? Number(m.priceAdjustment) : 0);
          }, 0);
          addLine(pickerItem, ids, label, extra);
        }}
      />

      <footer className="border-t border-border px-5 py-6 text-center text-xs text-muted-foreground">
        {t("order.pricesIncludeTax")}
      </footer>

      {/* Floating Bottom Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.12)]">
          <div className="mx-auto max-w-lg space-y-2">
            {/* Optional Guest Name / Table Note */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Your Name (optional)"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                maxLength={40}
                className="h-8 text-xs bg-muted/30 rounded-md"
              />
            </div>

            {/* Place Order CTA */}
            {data?.onlineMinOrderAmount && cartTotal < data.onlineMinOrderAmount ? (
              <div className="flex flex-col gap-1 w-full">
                <Button className="h-11 w-full font-semibold rounded-md" disabled>
                  {`Add ${formatCurrency(data.onlineMinOrderAmount - cartTotal)} more (Min: ${formatCurrency(
                    data.onlineMinOrderAmount
                  )})`}
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  Minimum order amount is {formatCurrency(data.onlineMinOrderAmount)}
                </p>
              </div>
            ) : (
              <Button
                className="h-11 w-full font-semibold rounded-md shadow-xs justify-between px-4"
                disabled={placeOrder.isPending}
                onClick={() => placeOrder.mutate()}
              >
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  <span>
                    {placeOrder.isPending ? t("order.placingOrder") : t("order.placeOrder")}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono tabular-nums">
                  <span className="text-xs opacity-80">
                    {cartCount} {cartCount > 1 ? t("order.items") : t("order.item")}
                  </span>
                  <span>·</span>
                  <span className="text-sm font-bold">{formatCurrency(cartTotal)}</span>
                </div>
              </Button>
            )}

            {placeOrder.isError && (
              <p className="text-center text-xs text-destructive">
                {placeOrder.error instanceof ApiError
                  ? placeOrder.error.message
                  : t("order.couldNotPlace")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
