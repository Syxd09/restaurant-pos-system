"use client";

import { Check, Clock, Printer, Trash2, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useNoteToast } from "@/components/ui/status-note";
import { ScanOrderInput } from "@/components/orders/scan-order-input";
import { DeleteOrdersDialog } from "@/components/orders/delete-orders-dialog";
import { ChannelBadge, TypeBadge } from "@/components/orders/channel-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { hasPermission, useCurrentUser } from "@/hooks/use-auth";
import { useBranch } from "@/hooks/use-branch";
import {
  useAcceptOrder,
  useManagedOrders,
  type ManagedOrder,
  type OrderChannel,
  type OrderTab,
} from "@/hooks/use-orders";
import { formatCurrency } from "@/lib/format";
import { openEntity } from "@/lib/entity-events";
import { openReceiptPrint } from "@/lib/print";
import { cn } from "@/lib/utils";

const TABS: { key: OrderTab; label: string }[] = [
  { key: "pending", label: "New (to accept)" },
  { key: "active", label: "In progress" },
  { key: "history", label: "History" },
];

// One chip = one filter. Online/Offline filter by channel, the rest by how
// the order is fulfilled.
const FILTERS: { key: string; label: string; channel?: OrderChannel; type?: string }[] = [
  { key: "all", label: "All" },
  { key: "online", label: "Online", channel: "ONLINE" },
  { key: "offline", label: "Offline", channel: "STAFF" },
  { key: "takeaway", label: "Takeaway", type: "TAKEAWAY" },
  { key: "delivery", label: "Delivery", type: "DELIVERY" },
  { key: "dinein", label: "Dine-in", type: "DINE_IN" },
];

const chip = (on: boolean) =>
  cn(
    "rounded-md border px-3 py-1 text-xs font-medium transition-all shadow-2xs",
    on
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border text-muted-foreground hover:bg-secondary",
  );

function timeAgo(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}

function OrdersView() {
  const { branchId } = useBranch();
  // Deep links from the dashboard (?tab=history&filter=online) pick the
  // starting view; after that the chips and tabs drive it as before.
  const params = useSearchParams();
  const [tab, setTab] = useState<OrderTab>(() => {
    const t = params.get("tab");
    return TABS.some((x) => x.key === t) ? (t as OrderTab) : "pending";
  });
  const [filterKey, setFilterKey] = useState(() => {
    const f = params.get("filter");
    return FILTERS.some((x) => x.key === f) ? (f as string) : "all";
  });
  const filter = FILTERS.find((f) => f.key === filterKey) ?? FILTERS[0];
  const { data: orders, isLoading } = useManagedOrders(branchId, tab, filter.channel, filter.type);
  const { data: pendingOrders } = useManagedOrders(branchId, "pending");
  const pendingCount = pendingOrders?.length ?? 0;

  // Admin-only multi-select delete of finished transactions (History tab).
  const { data: me } = useCurrentUser();
  const canDelete =
    hasPermission(me?.user, "orders.delete") &&
    ["OWNER", "ADMINISTRATOR"].includes(me?.user.roleName ?? "");
  const selectable = canDelete && tab === "history";
  const finished = (orders ?? []).filter((o) => o.status === "PAID" || o.status === "CANCELLED");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const visibleSelected = finished.filter((o) => selected.has(o.id)).map((o) => o.id);
  const allSelected = finished.length > 0 && visibleSelected.length === finished.length;
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(finished.map((o) => o.id)));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[32px] font-semibold tracking-tight text-foreground">Orders</h1>
        <p className="text-sm text-muted-foreground">
          Accept new online orders and manage everything in progress
        </p>
      </div>

      <ScanOrderInput branchId={branchId} />

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => {
              setTab(t.key);
              setSelected(new Set());
            }} className={chip(tab === t.key)}>
            {t.label}
            {t.key === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 rounded-xs bg-destructive px-1.5 py-0.2 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilterKey(f.key)}
            className={cn(chip(filterKey === f.key), "py-1 text-xs")}
          >
            {f.label}
          </button>
        ))}
      </div>

      {selectable && finished.length > 0 && (
        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all transactions" />
          Select all {finished.length}
        </label>
      )}

      <Card className="flex flex-col divide-y divide-border p-2">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : orders && orders.length > 0 ? (
          orders.map((o) => (
            <OrderRow
              key={o.id}
              order={o}
              branchId={branchId}
              selectable={selectable && (o.status === "PAID" || o.status === "CANCELLED")}
              selected={selected.has(o.id)}
              onToggle={() => toggle(o.id)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center gap-1 py-16 text-center">
            <p className="text-sm font-medium text-foreground">
              {tab === "pending" ? "No orders waiting for you" : "No orders here"}
            </p>
            <p className="text-sm text-muted-foreground">
              New online orders appear here with a sound alert.
            </p>
          </div>
        )}
      </Card>

      {/* Floating bar: transform/opacity only, instant under reduced motion */}
      <div
        aria-hidden={visibleSelected.length === 0}
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4 transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
          visibleSelected.length > 0 ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3 rounded-md border border-border bg-card px-4 py-2.5 shadow-lg",
            visibleSelected.length > 0 && "pointer-events-auto",
          )}
        >
          <span className="text-sm font-medium tabular-nums text-foreground" aria-live="polite">
            {visibleSelected.length} selected
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            tabIndex={visibleSelected.length > 0 ? 0 : -1}
            onClick={() => setSelected(new Set())}
          >
            <X className="h-4 w-4" aria-hidden /> Clear
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            tabIndex={visibleSelected.length > 0 ? 0 : -1}
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="h-4 w-4" aria-hidden /> Delete
          </Button>
        </div>
      </div>

      <DeleteOrdersDialog
        branchId={branchId}
        orderIds={visibleSelected}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onDeleted={() => setSelected(new Set())}
      />
    </div>
  );
}

function OrderRow({
  order,
  branchId,
  selectable,
  selected,
  onToggle,
}: {
  order: ManagedOrder;
  branchId: string | null;
  selectable: boolean;
  selected: boolean;
  onToggle: () => void;
}) {
  const name = order.guestName ?? order.customer?.name ?? "Walk-in guest";
  const summary = order.items.map((i) => `${i.quantity}× ${i.nameSnapshot}`).join(", ");
  const rejected = order.acceptance === "REJECTED";
  const isPending = order.acceptance === "PENDING";
  const accept = useAcceptOrder(branchId);
  const { toast } = useNoteToast();

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3 transition-colors duration-150 hover:bg-secondary/40",
        selected && "bg-primary/5",
        isPending && "border-l-4 border-amber-500 bg-amber-500/5 dark:bg-amber-950/10",
      )}
    >
      {selectable && (
        <div className="flex shrink-0 items-center">
          <Checkbox
            checked={selected}
            onCheckedChange={onToggle}
            aria-label={`Select transaction #${order.orderNumber}`}
          />
        </div>
      )}
      <button
        type="button"
        onClick={() => openEntity("Order", order.id)}
        className="flex min-w-0 flex-1 items-start justify-between gap-4 text-left transition"
      >
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-foreground">#{order.orderNumber}</span>
            {order.table && (
              <span className="rounded bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
                Table {order.table.name ?? order.table.number}
              </span>
            )}
            <span className="text-sm font-semibold text-foreground">{name}</span>
            <ChannelBadge channel={order.channel} />
            <TypeBadge type={order.type} />
            {isPending && (
              <Badge className="font-bold bg-amber-500 text-white animate-pulse">
                Needs Acceptance
              </Badge>
            )}
            {rejected && <Badge variant="secondary" className="font-normal">Rejected</Badge>}
            {!rejected && order.status === "CANCELLED" && (
              <Badge variant="secondary" className="font-normal">Cancelled</Badge>
            )}
          </div>
          <p className="text-xs font-medium text-muted-foreground truncate">{summary}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-sm font-bold tabular-nums text-foreground">
            {formatCurrency(order.totalAmount)}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" /> {timeAgo(order.createdAt)}
          </span>
        </div>
      </button>

      {/* Quick Action Buttons */}
      <div className="flex shrink-0 items-center gap-2">
        {isPending ? (
          <>
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1.5 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-95"
              disabled={accept.isPending}
              onClick={(e) => {
                e.stopPropagation();
                accept.mutate(order.id, {
                  onSuccess: () => toast.success(`Order #${order.orderNumber} accepted — sent to kitchen!`),
                  onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Failed to accept order"),
                });
              }}
              title="Accept order and send to kitchen KDS"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{accept.isPending ? "Accepting…" : "Accept"}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 px-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                openEntity("Order", order.id);
              }}
              title="Review details or decline"
            >
              <X className="h-3.5 w-3.5" />
              <span>Decline</span>
            </Button>
          </>
        ) : (
          branchId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 gap-1.5 px-3 text-xs font-semibold hover:bg-secondary"
              onClick={() => openReceiptPrint(order.id, branchId)}
              title="Print receipt / bill"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Bill</span>
            </Button>
          )
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-md" />}>
      <OrdersView />
    </Suspense>
  );
}
