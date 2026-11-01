"use client";

import { ApiError } from "@/lib/api";
import {
  Bike,
  Check,
  CheckCircle2,
  ChefHat,
  Flame,
  Globe,
  Info,
  Loader2,
  Printer,
  ShoppingBag,
  Star,
  Timer,
  Utensils,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { StatusNote, useNoteToast } from "@/components/ui/status-note";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ContactDetailsDialog } from "@/components/contact-details-dialog";
import { ReasonDialog } from "@/components/orders/reason-dialog";
import { hasPermission, useCurrentUser } from "@/hooks/use-auth";
import {
  NEXT_STATUS,
  useRejectKot,
  useReprintKot,
  useSetKotPriority,
  useUpdateKotStatus,
  type KotTicket,
} from "@/hooks/use-kds";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  NEW: "Accept Ticket",
  ACCEPTED: "Start Cooking",
  PREPARING: "Mark Ready",
  READY: "Mark Served (Bump)",
};

const STATUS_BADGE: Record<string, { label: string; class: string }> = {
  NEW: { label: "NEW", class: "bg-primary/10 text-primary border-primary/20" },
  ACCEPTED: { label: "ACCEPTED", class: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  PREPARING: { label: "PREPARING", class: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  READY: { label: "READY", class: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
};

const REJECT_REASONS = [
  "Out of stock",
  "Item unavailable",
  "Kitchen too busy",
  "Equipment problem",
  "Demo / stale order cleanup",
];

const FRESH_MINUTES = 2;

function useElapsedMinutes(createdAt: string) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const compute = () =>
      setElapsed(Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000)));
    compute();
    const id = setInterval(compute, 30_000);
    return () => clearInterval(id);
  }, [createdAt]);
  return elapsed;
}

function customerDisplayName(order: KotTicket["order"]) {
  return order.customer?.name || order.guestName || null;
}

function customerPhone(order: KotTicket["order"]) {
  return order.customer?.phone || null;
}

function getStationBadge(name: string | null | undefined) {
  if (!name) return { label: "General", style: "bg-secondary text-muted-foreground border-border/70" };
  const lower = name.toLowerCase();
  if (lower.includes("bar") || lower.includes("drink")) {
    return { label: name, style: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30" };
  }
  if (lower.includes("grill") || lower.includes("oven") || lower.includes("hot")) {
    return { label: name, style: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30" };
  }
  if (lower.includes("dessert") || lower.includes("pastry") || lower.includes("cold")) {
    return { label: name, style: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30" };
  }
  return { label: name, style: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" };
}

export function TicketCard({
  ticket,
  branchId,
  showStatusBadge = false,
}: {
  ticket: KotTicket;
  branchId: string | null;
  showStatusBadge?: boolean;
}) {
  const elapsed = useElapsedMinutes(ticket.createdAt);
  const updateStatus = useUpdateKotStatus(branchId);
  const setPriority = useSetKotPriority(branchId);
  const reprint = useReprintKot(branchId);
  const { note, clear: clearNote, toast } = useNoteToast();
  const nextStatus = NEXT_STATUS[ticket.status];
  const isLate = elapsed >= 15;
  const isWarning = elapsed >= 8 && elapsed < 15;
  const isFresh = ticket.status === "NEW" && elapsed < FRESH_MINUTES;

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleItemDone = (itemId: string) => {
    setCheckedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const reject = useRejectKot(branchId);
  const { data: me } = useCurrentUser();
  const started = ticket.status === "PREPARING";
  const canReject =
    (ticket.status === "NEW" || ticket.status === "ACCEPTED" || started) &&
    (!started || hasPermission(me?.user, "orders.cancel"));

  const stationInfo = getStationBadge(ticket.station?.name);

  // Fulfillment badge
  const isDineIn = ticket.order.type === "DINE_IN";
  const isTakeaway = ticket.order.type === "TAKEAWAY";
  const isDelivery = ticket.order.type === "DELIVERY";

  return (
    <Card
      className={cn(
        "group flex shrink-0 flex-col gap-3 p-3.5 transition-all duration-150 rounded-md border",
        isLate
          ? "border-rose-500/60 ring-1 ring-rose-500/30 bg-card shadow-sm"
          : isWarning || ticket.isPriority
            ? "border-amber-500/60 ring-1 ring-amber-500/30 bg-card shadow-sm"
            : "border-border/80 bg-card shadow-2xs hover:border-border",
        isFresh && "border-primary ring-2 ring-primary/40 motion-safe:animate-pulse",
      )}
    >
      <StatusNote note={note} onClear={clearNote} />

      <ReasonDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title={`Reject ticket for order #${ticket.order.orderNumber}?`}
        description={
          ticket.order.table
            ? `Table ${ticket.order.table.number} will be notified that the kitchen cannot fulfill this ticket.`
            : "The customer will be notified that the kitchen cannot fulfill this ticket."
        }
        warning={
          started
            ? "This ticket is already being prepared. Rejecting it marks items as void/wasted."
            : undefined
        }
        reasons={REJECT_REASONS}
        confirmLabel="Reject Ticket"
        keepLabel="Keep Ticket"
        onSubmit={(reason) =>
          reject.mutateAsync({ id: ticket.id, reason, confirmStarted: started ? true : undefined })
        }
      />

      <ContactDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        title={`Order #${ticket.order.orderNumber}`}
        name={customerDisplayName(ticket.order)}
        subtitle={ticket.order.table ? `Table ${ticket.order.table.number}` : ticket.order.type}
        phone={customerPhone(ticket.order)}
        waMessage={`Hi ${customerDisplayName(ticket.order) ?? ""}, this is regarding your order #${ticket.order.orderNumber}.`}
      />

      {/* Ticket Header */}
      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-border/60">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-base font-bold tracking-tight text-foreground">
              #{ticket.order.orderNumber}
            </span>

            {ticket.isPriority && (
              <span className="inline-flex items-center gap-0.5 rounded-xs bg-warning/15 px-1.5 py-0.2 text-[10px] font-bold text-warning border border-warning/30">
                <Star className="h-3 w-3 fill-warning text-warning" />
                RUSH
              </span>
            )}

            {showStatusBadge && STATUS_BADGE[ticket.status] && (
              <span
                className={cn(
                  "rounded-xs border px-1.5 py-0.2 text-[10px] font-bold tracking-wide",
                  STATUS_BADGE[ticket.status].class,
                )}
              >
                {STATUS_BADGE[ticket.status].label}
              </span>
            )}
          </div>

          {/* Subtitle with Table & Station */}
          <div className="mt-1 flex items-center gap-1.5 flex-wrap text-xs">
            {/* Fulfillment Type */}
            <span className="inline-flex items-center gap-1 font-semibold text-foreground">
              {isDineIn && (
                <>
                  <Utensils className="h-3.5 w-3.5 text-primary" />
                  <span>
                    Table {ticket.order.table?.name ?? ticket.order.table?.number ?? "—"}
                  </span>
                </>
              )}
              {isTakeaway && (
                <>
                  <ShoppingBag className="h-3.5 w-3.5 text-amber-500" />
                  <span>Takeaway</span>
                </>
              )}
              {isDelivery && (
                <>
                  <Bike className="h-3.5 w-3.5 text-blue-500" />
                  <span>Delivery</span>
                </>
              )}
              {!isDineIn && !isTakeaway && !isDelivery && (
                <span>{ticket.order.type.replace("_", " ")}</span>
              )}
            </span>

            <span className="text-muted-foreground/40">•</span>

            {/* Station Tag */}
            <span
              className={cn(
                "rounded-xs border px-1.5 py-0.2 text-[10px] font-medium tracking-tight",
                stationInfo.style,
              )}
            >
              {stationInfo.label}
            </span>

            {customerDisplayName(ticket.order) && (
              <>
                <span className="text-muted-foreground/40">•</span>
                <span className="truncate max-w-[120px] text-muted-foreground">
                  {customerDisplayName(ticket.order)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Elapsed Timer Pill */}
        <div
          className={cn(
            "flex items-center gap-1 shrink-0 rounded-xs border px-2 py-0.5 text-xs font-mono font-bold tabular-nums",
            isLate
              ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40"
              : isWarning
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                : "bg-secondary text-foreground border-border/80",
          )}
          title={`Order age: ${elapsed} minutes`}
        >
          <Timer className={cn("h-3 w-3", isLate ? "text-rose-500 animate-spin" : "text-muted-foreground")} />
          <span>{elapsed}m</span>
          {isLate && <span className="text-[10px] text-rose-500">LATE</span>}
        </div>
      </div>

      {/* Special Notes & Allergies */}
      {ticket.order.notes && (
        <div className="flex items-start gap-1.5 rounded-sm border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
          <Flame className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="leading-snug">{ticket.order.notes}</span>
        </div>
      )}

      {/* Interactive Items List with Check-off */}
      <div className="flex flex-col gap-1 min-h-[50px]">
        {ticket.items.map((item) => {
          const isDone = !!checkedItems[item.id];
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleItemDone(item.id)}
              className={cn(
                "group flex w-full items-start gap-2 rounded-xs p-1.5 text-left transition-colors hover:bg-secondary/60 cursor-pointer select-none",
                isDone && "bg-secondary/30 opacity-60",
              )}
              title={isDone ? "Tap to uncheck" : "Tap to mark plated / prepared"}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-xs border transition-colors",
                  isDone
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-border/80 group-hover:border-primary/60",
                )}
              >
                {isDone && <Check className="h-3 w-3 stroke-[3]" />}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-1">
                  <p
                    className={cn(
                      "text-xs font-semibold leading-tight text-foreground transition-all",
                      isDone && "line-through text-muted-foreground",
                    )}
                  >
                    <span className="font-bold text-primary font-mono mr-1.5">
                      {item.orderItem.quantity}×
                    </span>
                    {item.orderItem.nameSnapshot}
                  </p>
                </div>

                {item.orderItem.modifiers.length > 0 && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {item.orderItem.modifiers.map((m) => m.nameSnapshot).join(", ")}
                  </p>
                )}

                {item.orderItem.kitchenNote && (
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-warning">
                    <Flame className="h-3 w-3 shrink-0" /> {item.orderItem.kitchenNote}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Action Area: Never overflows */}
      <div className="flex flex-col gap-2 pt-2 border-t border-border/60 mt-auto">
        {nextStatus && (
          <Button
            className={cn(
              "h-10 w-full text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.99] shadow-sm",
              ticket.status === "NEW" && "bg-primary hover:bg-primary/90 text-primary-foreground",
              ticket.status === "ACCEPTED" && "bg-amber-600 hover:bg-amber-700 text-white",
              ticket.status === "PREPARING" && "bg-emerald-600 hover:bg-emerald-700 text-white",
              ticket.status === "READY" && "bg-blue-600 hover:bg-blue-700 text-white",
            )}
            disabled={updateStatus.isPending}
            onClick={() =>
              updateStatus.mutate(
                { id: ticket.id, status: nextStatus },
                {
                  onError: (err) =>
                    toast.error(
                      err instanceof ApiError
                        ? err.message
                        : "Could not update the ticket. Check the connection.",
                    ),
                },
              )
            }
          >
            {updateStatus.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                {STATUS_LABEL[ticket.status]}
              </span>
            )}
          </Button>
        )}

        {/* Secondary Utility Controls */}
        <div className="flex items-center justify-between gap-1">
          {canReject && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[11px] font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setRejectOpen(true)}
              aria-label={`Reject ticket for order ${ticket.order.orderNumber}`}
            >
              <X className="h-3.5 w-3.5 mr-1" aria-hidden />
              Reject
            </Button>
          )}

          <div className="flex items-center gap-1 ml-auto">
            <Button
              variant={ticket.isPriority ? "secondary" : "ghost"}
              size="icon-xs"
              className={cn("h-7 w-7", ticket.isPriority && "text-warning bg-warning/10")}
              title={ticket.isPriority ? "Unmark priority" : "Mark rush / priority"}
              disabled={setPriority.isPending}
              onClick={() => setPriority.mutate({ id: ticket.id, isPriority: !ticket.isPriority })}
            >
              <Star className={cn("h-3.5 w-3.5", ticket.isPriority && "fill-warning text-warning")} />
            </Button>

            <Button
              variant="ghost"
              size="icon-xs"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title={ticket.printedCount > 0 ? "Reprint ticket" : "Print ticket"}
              disabled={reprint.isPending}
              onClick={() =>
                reprint.mutate(
                  { id: ticket.id, reprint: ticket.printedCount > 0 },
                  {
                    onSuccess: () =>
                      toast.success(
                        ticket.printedCount > 0 ? "Reprint sent to printer" : "Ticket sent to printer",
                      ),
                    onError: (err) =>
                      toast.error(err instanceof ApiError ? err.message : "Could not print"),
                  },
                )
              }
            >
              <Printer className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="icon-xs"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Customer details"
              onClick={() => setDetailsOpen(true)}
            >
              <Info className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
