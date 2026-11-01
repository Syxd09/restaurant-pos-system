"use client";

import type { KotStatusDto } from "@nodedr-restaurant/types";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bike,
  CheckCheck,
  ChefHat,
  Filter,
  Grid,
  Kanban,
  LayoutGrid,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  ShoppingBag,
  Timer,
  Utensils,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import { BranchNotice } from "@/components/layout/branch-notice";
import { PerformanceWidget } from "@/components/kds/performance-widget";
import { IncomingOrderCard } from "@/components/kds/incoming-order-card";
import { LiveStatus } from "@/components/kds/live-status";
import { PrepSummaryBar } from "@/components/kds/prep-summary-bar";
import { TicketCard } from "@/components/kds/ticket-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QueryError } from "@/components/ui/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { hasPermission, useCurrentUser } from "@/hooks/use-auth";
import { useBranch } from "@/hooks/use-branch";
import { useKdsSound } from "@/hooks/use-kds-sound";
import {
  useKdsIncoming,
  useKdsStations,
  useKdsTickets,
  useUpdateKotStatus,
  type KotTicket,
} from "@/hooks/use-kds";
import { useKdsStationPreference } from "@/hooks/use-kds-station";
import { useNotificationMute } from "@/hooks/use-notification-mute";
import { installAudioUnlock } from "@/lib/audio-unlock";
import { resolveStation } from "@/lib/kds-station";
import { cn } from "@/lib/utils";

const COLUMNS: { status: KotStatusDto; label: string; dot: string }[] = [
  { status: "NEW", label: "New", dot: "bg-primary" },
  { status: "ACCEPTED", label: "Accepted", dot: "bg-blue-500" },
  { status: "PREPARING", label: "Preparing", dot: "bg-amber-500" },
  { status: "READY", label: "Ready to Serve", dot: "bg-emerald-500" },
];

export default function KdsPage() {
  const { branchId } = useBranch();
  const { data: me } = useCurrentUser();
  const canAnswer = hasPermission(me?.user, "orders.accept");
  const { data: stations, isError: stationsFailed } = useKdsStations(branchId);
  const pref = useKdsStationPreference(branchId);
  const { active: activeStation, stale, ready } = resolveStation(pref.saved, stations, stationsFailed);
  const canFetch = pref.ready && ready;
  const tickets = useKdsTickets(branchId, activeStation, canFetch);
  const incoming = useKdsIncoming(branchId, canAnswer);
  const updateStatus = useUpdateKotStatus(branchId);
  const [muted, toggleMute] = useNotificationMute();

  useKdsSound(branchId);
  useEffect(() => installAudioUnlock(), []);

  // UI View States
  const [viewMode, setViewMode] = useState<"grid" | "kanban">("grid");
  const [statusFilter, setStatusFilter] = useState<"ALL" | KotStatusDto>("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "DINE_IN" | "TAKEAWAY" | "DELIVERY">("ALL");
  const [search, setSearch] = useState("");
  const [selectedDishFilter, setSelectedDishFilter] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const allTickets = tickets.data ?? [];

  // Filtered tickets based on search, dish filter, status, and order type
  const filteredTickets = useMemo(() => {
    return allTickets.filter((ticket) => {
      // Dish filter from prep summary bar
      if (selectedDishFilter) {
        const hasDish = ticket.items.some(
          (it) => it.orderItem.nameSnapshot === selectedDishFilter,
        );
        if (!hasDish) return false;
      }

      // Status filter (when in Grid view or when explicitly set)
      if (statusFilter !== "ALL" && ticket.status !== statusFilter) {
        return false;
      }

      // Order type filter
      if (typeFilter !== "ALL" && ticket.order.type !== typeFilter) {
        return false;
      }

      // Text search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchOrder = ticket.order.orderNumber.toLowerCase().includes(q);
        const matchGuest = ticket.order.guestName?.toLowerCase().includes(q);
        const matchTable =
          ticket.order.table?.name?.toLowerCase().includes(q) ||
          ticket.order.table?.number?.toLowerCase().includes(q);
        const matchItem = ticket.items.some((it) =>
          it.orderItem.nameSnapshot.toLowerCase().includes(q),
        );
        if (!matchOrder && !matchGuest && !matchTable && !matchItem) {
          return false;
        }
      }

      return true;
    });
  }, [allTickets, selectedDishFilter, statusFilter, typeFilter, search]);

  const byStatus = (status: KotStatusDto): KotTicket[] =>
    filteredTickets.filter((t) => t.status === status);

  const pendingOrders = incoming.data ?? [];

  // Metrics
  const readyTickets = useMemo(() => allTickets.filter((t) => t.status === "READY"), [allTickets]);
  const preparingTickets = useMemo(() => allTickets.filter((t) => t.status === "PREPARING"), [allTickets]);
  const overdueTickets = useMemo(() => {
    const now = Date.now();
    return allTickets.filter(
      (t) => (now - new Date(t.createdAt).getTime()) / 60_000 >= 15 && t.status !== "READY",
    );
  }, [allTickets]);

  // Batch actions
  const handleBumpAllReady = () => {
    if (readyTickets.length === 0) return;
    readyTickets.forEach((t) => {
      updateStatus.mutate({ id: t.id, status: "SERVED" });
    });
  };

  const handleMarkAllPreparingReady = () => {
    if (preparingTickets.length === 0) return;
    preparingTickets.forEach((t) => {
      updateStatus.mutate({ id: t.id, status: "READY" });
    });
  };

  return (
    <div className="flex min-h-[calc(100dvh-7rem)] flex-col gap-3.5 pb-6">
      {/* Top Header & Operational Controls */}
      <div className="flex flex-col gap-3 pb-3 border-b border-border/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Kitchen Display System
                </h1>
                <span className="inline-flex items-center gap-1 rounded-sm bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary font-mono border border-primary/20">
                  {allTickets.length} Active
                </span>
                {overdueTickets.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-sm bg-rose-500/15 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
                    <AlertTriangle className="h-3 w-3" />
                    {overdueTickets.length} Late
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Live ticket pipeline, station dispatch, and dish aggregator
              </p>
            </div>
          </div>

          {/* Quick Batch Actions & Display Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {readyTickets.length > 0 && (
              <Button
                size="sm"
                className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
                onClick={handleBumpAllReady}
                title="Mark all ready tickets as served"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Bump All Ready ({readyTickets.length})
              </Button>
            )}

            {preparingTickets.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-semibold"
                onClick={handleMarkAllPreparingReady}
                title="Mark all preparing tickets as ready"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                Mark All Preparing Ready ({preparingTickets.length})
              </Button>
            )}

            {/* Sound Toggle */}
            <Button
              variant="outline"
              size="sm"
              className={cn("h-8 text-xs font-medium gap-1.5", muted && "text-muted-foreground")}
              onClick={toggleMute}
              title={muted ? "Sound is muted. Click to enable kitchen chime" : "Sound alert active"}
            >
              {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-primary" />}
              <span className="hidden sm:inline">{muted ? "Muted" : "Chime On"}</span>
            </Button>

            {/* Fullscreen Toggle */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-medium gap-1.5"
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isFullscreen ? "Exit Full" : "Fullscreen"}</span>
            </Button>

            {/* View Mode Switcher */}
            <div className="flex items-center rounded-sm border border-border/80 bg-secondary/50 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex items-center gap-1 rounded-xs px-2.5 py-1 text-xs font-semibold transition-all",
                  viewMode === "grid"
                    ? "bg-card text-foreground shadow-2xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground",
                )}
                title="Expediter Grid Mode — fills screen with responsive ticket cards"
              >
                <Grid className="h-3.5 w-3.5" />
                <span>Expediter</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                className={cn(
                  "flex items-center gap-1 rounded-xs px-2.5 py-1 text-xs font-semibold transition-all",
                  viewMode === "kanban"
                    ? "bg-card text-foreground shadow-2xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground",
                )}
                title="Station Columns Mode — New, Accepted, Preparing, Ready"
              >
                <Kanban className="h-3.5 w-3.5" />
                <span>Kanban</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Strip: Stations + Status + Search */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          {/* Station Selection */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 mr-1">
              Station:
            </span>
            {[{ id: "", name: "All Stations" }, ...(stations ?? [])].map((s) => {
              const active = s.id === activeStation;
              const count = s.id
                ? allTickets.filter((t) => t.stationId === s.id).length
                : allTickets.length;
              return (
                <button
                  key={s.id || "all"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => pref.choose(s.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs font-semibold transition-all shadow-2xs",
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-xs"
                      : "border-border/80 bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <span>{s.name}</span>
                  <span
                    className={cn(
                      "rounded-xs px-1 text-[10px] font-mono",
                      active ? "bg-primary-foreground/20 text-white" : "bg-secondary text-foreground",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Search & Fulfillment Filters */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
            {/* Fulfillment Filter */}
            <div className="flex items-center rounded-sm border border-border/70 bg-card p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setTypeFilter("ALL")}
                className={cn(
                  "rounded-xs px-2 py-0.5 font-medium transition-colors",
                  typeFilter === "ALL" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground hover:text-foreground",
                )}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("DINE_IN")}
                className={cn(
                  "rounded-xs px-2 py-0.5 font-medium transition-colors flex items-center gap-1",
                  typeFilter === "DINE_IN" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground hover:text-foreground",
                )}
                title="Dine-in orders only"
              >
                <Utensils className="h-3 w-3" /> Dine-in
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("TAKEAWAY")}
                className={cn(
                  "rounded-xs px-2 py-0.5 font-medium transition-colors flex items-center gap-1",
                  typeFilter === "TAKEAWAY" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground hover:text-foreground",
                )}
                title="Takeaway orders only"
              >
                <ShoppingBag className="h-3 w-3" /> Takeaway
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("DELIVERY")}
                className={cn(
                  "rounded-xs px-2 py-0.5 font-medium transition-colors flex items-center gap-1",
                  typeFilter === "DELIVERY" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground hover:text-foreground",
                )}
                title="Delivery orders only"
              >
                <Bike className="h-3 w-3" /> Delivery
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-44 sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search order, table, dish…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs rounded-sm bg-card"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Filter Tabs (For Expediter Grid view) */}
        {viewMode === "grid" && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border/40">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 mr-1">
              Stage:
            </span>
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={cn(
                "rounded-sm border px-2.5 py-1 text-xs font-semibold transition-all shadow-2xs",
                statusFilter === "ALL"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/80 bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              All Active ({allTickets.length})
            </button>
            {COLUMNS.map((col) => {
              const count = allTickets.filter((t) => t.status === col.status).length;
              const active = statusFilter === col.status;
              return (
                <button
                  key={col.status}
                  type="button"
                  onClick={() => setStatusFilter(col.status)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs font-semibold transition-all shadow-2xs",
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-xs"
                      : "border-border/80 bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", col.dot)} />
                  <span>{col.label}</span>
                  <span
                    className={cn(
                      "rounded-xs px-1 text-[10px] font-mono",
                      active ? "bg-primary-foreground/20 text-white" : "bg-secondary text-foreground",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <BranchNotice />

      {/* Live Active Prep Summary Bar (Item Aggregator) */}
      <PrepSummaryBar
        tickets={allTickets}
        selectedItemFilter={selectedDishFilter}
        onSelectItemFilter={setSelectedDishFilter}
      />

      {/* Incoming Orders Strip (Needs Decision) */}
      {pendingOrders.length > 0 && (
        <section aria-label="Incoming orders" className="flex flex-col gap-2 rounded-md border border-primary/40 bg-primary/5 p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Incoming Orders Waiting For Acceptance ({pendingOrders.length})
            </h2>
            <span className="text-[11px] text-muted-foreground">Action required before ticket creation</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {pendingOrders.map((order) => (
              <IncomingOrderCard key={order.id} order={order} branchId={branchId} />
            ))}
          </div>
        </section>
      )}

      {/* Average Prep Time Metric Strip */}
      <PerformanceWidget branchId={branchId} />

      {/* Main Ticket Surface */}
      {tickets.isError ? (
        <QueryError
          error={tickets.error}
          what="the kitchen tickets"
          onRetry={() => void tickets.refetch()}
          retrying={tickets.isFetching}
        />
      ) : tickets.isLoading || !canFetch ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-md" />
          ))}
        </div>
      ) : viewMode === "grid" ? (
        /* Expediter Grid View (Fills 100% of Screen Evenly) */
        <div className="flex flex-col gap-3">
          {filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border/80 bg-card py-16 text-center">
              <ChefHat className="h-10 w-10 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-semibold text-foreground">
                {selectedDishFilter || search || statusFilter !== "ALL" || typeFilter !== "ALL"
                  ? "No tickets match your active filters"
                  : "Kitchen board is all clear"}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                {selectedDishFilter || search || statusFilter !== "ALL" || typeFilter !== "ALL"
                  ? "Try resetting your search, stage, or dish filter to view all active orders."
                  : "New orders placed via POS till, QR tables, or online channels appear here instantly."}
              </p>
              {(selectedDishFilter || search || statusFilter !== "ALL" || typeFilter !== "ALL") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 h-8 text-xs"
                  onClick={() => {
                    setSelectedDishFilter(null);
                    setSearch("");
                    setStatusFilter("ALL");
                    setTypeFilter("ALL");
                  }}
                >
                  Reset All Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
              {filteredTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  branchId={branchId}
                  showStatusBadge={true}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Kanban Columns View (Structured 4 Columns) */
        <div className="flex min-h-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto sm:grid sm:snap-none sm:grid-cols-2 sm:gap-4 sm:overflow-hidden xl:grid-cols-4">
          {COLUMNS.map((col) => {
            const colTickets = byStatus(col.status);
            return (
              <div
                key={col.status}
                className="flex w-[85%] shrink-0 snap-center flex-col gap-2.5 overflow-hidden rounded-md border border-border/70 bg-secondary/20 p-3 sm:w-auto sm:shrink"
              >
                <div className="flex items-center justify-between px-1 pb-1 border-b border-border/40">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("h-2 w-2 rounded-full", col.dot)} />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      {col.label}
                    </h2>
                  </div>
                  <span className="rounded-xs bg-secondary px-1.5 py-0.2 text-[10px] font-mono font-bold text-foreground border border-border/60">
                    {colTickets.length}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-3 overflow-y-auto pb-2 min-h-[200px]">
                  {colTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      branchId={branchId}
                      showStatusBadge={false}
                    />
                  ))}
                  {colTickets.length === 0 && (
                    <div className="flex flex-1 flex-col items-center justify-center py-10 text-center text-muted-foreground/60">
                      <p className="text-xs">No {col.label.toLowerCase()} tickets</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
