"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Flame, UtensilsCrossed, X } from "lucide-react";
import type { KotTicket } from "@/hooks/use-kds";
import { cn } from "@/lib/utils";

interface PrepSummaryBarProps {
  tickets: KotTicket[];
  selectedItemFilter: string | null;
  onSelectItemFilter: (itemName: string | null) => void;
}

interface AggregatedItem {
  name: string;
  totalQuantity: number;
  stations: Set<string>;
  ticketIds: Set<string>;
}

export function PrepSummaryBar({
  tickets,
  selectedItemFilter,
  onSelectItemFilter,
}: PrepSummaryBarProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Aggregate items across all active tickets (NEW, ACCEPTED, PREPARING)
  const aggregated = useMemo(() => {
    const activeTickets = tickets.filter(
      (t) => t.status === "NEW" || t.status === "ACCEPTED" || t.status === "PREPARING",
    );

    const map = new Map<string, AggregatedItem>();

    for (const ticket of activeTickets) {
      const stationName = ticket.station?.name || "Kitchen";
      for (const item of ticket.items) {
        const dishName = item.orderItem.nameSnapshot;
        const existing = map.get(dishName);
        if (existing) {
          existing.totalQuantity += item.orderItem.quantity;
          existing.stations.add(stationName);
          existing.ticketIds.add(ticket.id);
        } else {
          map.set(dishName, {
            name: dishName,
            totalQuantity: item.orderItem.quantity,
            stations: new Set([stationName]),
            ticketIds: new Set([ticket.id]),
          });
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [tickets]);

  const totalDishesToCook = useMemo(
    () => aggregated.reduce((sum, item) => sum + item.totalQuantity, 0),
    [aggregated],
  );

  if (aggregated.length === 0) return null;

  return (
    <div className="rounded-md border border-border/80 bg-card shadow-2xs overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-secondary/40 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-xs bg-primary/10 text-primary">
            <Flame className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-xs font-semibold text-foreground">Active Prep Aggregator</span>
          <span className="rounded-xs bg-primary/15 px-1.5 py-0.2 text-[10px] font-bold text-primary font-mono">
            {totalDishesToCook} {totalDishesToCook === 1 ? "dish" : "dishes"}
          </span>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            across {new Set(tickets.map((t) => t.orderId)).size} orders
          </span>
        </div>

        <div className="flex items-center gap-2">
          {selectedItemFilter && (
            <button
              type="button"
              onClick={() => onSelectItemFilter(null)}
              className="inline-flex items-center gap-1 rounded-xs bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive hover:bg-destructive/20 transition-colors"
            >
              <X className="h-3 w-3" />
              <span>Filtering: {selectedItemFilter}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 rounded-xs px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title={isExpanded ? "Collapse prep bar" : "Expand prep bar"}
          >
            <span>{isExpanded ? "Hide" : "Show"}</span>
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Item chips */}
      {isExpanded && (
        <div className="flex flex-wrap items-center gap-2 p-2.5 max-h-32 overflow-y-auto">
          {aggregated.map((item) => {
            const isSelected = selectedItemFilter === item.name;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => onSelectItemFilter(isSelected ? null : item.name)}
                className={cn(
                  "group flex items-center gap-2 rounded-sm border px-2.5 py-1 text-xs font-medium transition-all shadow-2xs select-none",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border/80 bg-background text-foreground hover:border-primary/50 hover:bg-secondary/40",
                )}
                title={`Click to filter tickets requiring ${item.name}`}
              >
                <span
                  className={cn(
                    "flex h-5 min-w-5 px-1 items-center justify-center rounded-xs font-mono font-bold text-[11px]",
                    isSelected
                      ? "bg-primary-foreground text-primary"
                      : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors",
                  )}
                >
                  {item.totalQuantity}×
                </span>
                <span className="font-semibold">{item.name}</span>
                <span
                  className={cn(
                    "text-[10px] opacity-70",
                    isSelected ? "text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  ({Array.from(item.stations).join(", ")})
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

