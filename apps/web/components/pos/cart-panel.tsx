"use client";

import { Bike, Minus, Plus, Printer, ShoppingBag, ShoppingCart, Trash2, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CartLine } from "@/components/pos/cart-line";
import { SavedAddressPicker } from "@/components/pos/saved-address-picker";
import type { RestaurantTable } from "@/hooks/use-tables";
import { formatCurrency } from "@/lib/format";
import { subtotalOf } from "@/lib/pricing-preview";

export type PosOrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";
export interface DeliveryDetails {
  address: string;
  pincode: string;
  phone: string;
}

export function CartPanel({
  lines,
  orderType,
  onOrderTypeChange,
  tables,
  tableId,
  onTableChange,
  onIncrement,
  onDecrement,
  onRemove,
  onSubmit,
  isSubmitting,
  existingOrderNumber,
  onViewExistingOrder,
  openBills,
  selectedBillId,
  onSelectBill,
  checkingTable = false,
  delivery,
  onDeliveryChange,
  scheduledFor,
  onScheduledForChange,
  branchId = null,
  customerName = "",
  onCustomerNameChange,
  customerPhone = "",
  onCustomerPhoneChange,
  onPrintBill,
}: {
  customerName?: string;
  onCustomerNameChange?: (name: string) => void;
  customerPhone?: string;
  onCustomerPhoneChange?: (phone: string) => void;
  onPrintBill?: () => void;
  lines: CartLine[];
  orderType: PosOrderType;
  onOrderTypeChange: (type: PosOrderType) => void;
  tables: RestaurantTable[];
  tableId: string;
  onTableChange: (id: string) => void;
  onIncrement: (key: string) => void;
  onDecrement: (key: string) => void;
  onRemove: (key: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  existingOrderNumber?: string;
  onViewExistingOrder?: () => void;
  /** All unpaid bills on the selected table (more than one is possible). */
  openBills?: { id: string; orderNumber: string }[];
  selectedBillId?: string | null;
  onSelectBill?: (id: string) => void;
  /** The table's open bills are still loading - sending now could start a duplicate bill. */
  checkingTable?: boolean;
  delivery: DeliveryDetails;
  onDeliveryChange: (d: DeliveryDetails) => void;
  scheduledFor: string;
  onScheduledForChange: (v: string) => void;
  /** Used to look up a returning customer's saved addresses by phone. */
  branchId?: string | null;
}) {
  const subtotal = subtotalOf(lines.map((l) => l.unitPrice * l.quantity));
  const totalItemCount = lines.reduce((acc, l) => acc + l.quantity, 0);

  const deliveryReady =
    orderType !== "DELIVERY" ||
    (delivery.address.trim().length >= 5 &&
      delivery.pincode.trim().length >= 3 &&
      delivery.phone.trim().length >= 6);

  const canSubmit =
    lines.length > 0 &&
    (orderType !== "DINE_IN" || !!tableId) &&
    deliveryReady &&
    !isSubmitting &&
    !checkingTable;

  return (
    <div className="flex h-full flex-col gap-3.5">
      {/* Order Type Tabs */}
      <Tabs
        value={orderType}
        onValueChange={(v) => onOrderTypeChange(v as PosOrderType)}
      >
        <TabsList className="grid w-full grid-cols-3 h-10 p-1 bg-secondary/80">
          <TabsTrigger
            value="DINE_IN"
            className="flex items-center justify-center gap-1.5 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:shadow-xs"
          >
            <Utensils className="h-3.5 w-3.5" />
            <span>Dine-in</span>
          </TabsTrigger>
          <TabsTrigger
            value="TAKEAWAY"
            className="flex items-center justify-center gap-1.5 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:shadow-xs"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Takeaway</span>
          </TabsTrigger>
          <TabsTrigger
            value="DELIVERY"
            className="flex items-center justify-center gap-1.5 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:shadow-xs"
          >
            <Bike className="h-3.5 w-3.5" />
            <span>Delivery</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table Selector for Dine-in */}
      {orderType === "DINE_IN" && (
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
            Table Assignment
          </label>
          <Select value={tableId} onValueChange={(v) => onTableChange(v ?? "")}>
            <SelectTrigger className="w-full h-10 text-xs font-medium bg-background/80">
              <SelectValue placeholder="Select Table…">
                {(value: string | null) => {
                  const t = tables.find((table) => table.id === value);
                  if (!t) return "Select Table…";
                  return `${t.name ?? `Table ${t.number}`}${
                    t.status === "OCCUPIED" ? " • Occupied" : " • Available"
                  }`;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {tables.map((t) => (
                <SelectItem key={t.id} value={t.id} className="text-xs">
                  <span className="font-semibold">{t.name ?? `Table ${t.number}`}</span>
                  <span className="ml-1 text-muted-foreground">
                    ({t.capacity} seats · {t.status.toLowerCase()})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {/* Customer Name and Phone (Optional) */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
          Customer Info (Optional)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Guest name (opt)"
            value={customerName}
            onChange={(e) => onCustomerNameChange?.(e.target.value)}
            className="h-9 text-xs"
          />
          <Input
            placeholder="Phone number (opt)"
            inputMode="tel"
            value={customerPhone}
            onChange={(e) => onCustomerPhoneChange?.(e.target.value)}
            className="h-9 text-xs"
          />
        </div>
      </div>


      {/* Delivery Form */}
      {orderType === "DELIVERY" && (
        <div className="flex flex-col gap-2 rounded-md border border-border/70 bg-secondary/30 p-3">
          <Input
            placeholder="Street address / landmark"
            value={delivery.address}
            onChange={(e) =>
              onDeliveryChange({ ...delivery, address: e.target.value })
            }
            className="h-9 text-xs"
          />
          <SavedAddressPicker
            branchId={branchId}
            phone={delivery.phone}
            onPick={(address, pincode) =>
              onDeliveryChange({ ...delivery, address, pincode })
            }
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Pincode"
              inputMode="numeric"
              value={delivery.pincode}
              onChange={(e) =>
                onDeliveryChange({ ...delivery, pincode: e.target.value })
              }
              className="h-9 text-xs"
            />
            <Input
              placeholder="Customer Phone"
              inputMode="tel"
              value={delivery.phone}
              onChange={(e) =>
                onDeliveryChange({ ...delivery, phone: e.target.value })
              }
              className="h-9 text-xs"
            />
          </div>
        </div>
      )}

      {/* Schedule Option for Non-Dine-in */}
      {orderType !== "DINE_IN" && (
        <label className="flex flex-col gap-1 text-[11px] font-semibold text-muted-foreground">
          Schedule for later (optional)
          <Input
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => onScheduledForChange(e.target.value)}
            className="h-9 text-xs"
          />
        </label>
      )}

      {checkingTable && (
        <p
          role="status"
          className="rounded-md bg-secondary/60 px-3 py-2 text-xs text-muted-foreground animate-pulse"
        >
          Checking active bills on this table…
        </p>
      )}

      {openBills && openBills.length > 1 && (
        <div
          className="flex flex-wrap items-center gap-1.5 rounded-md bg-secondary/40 p-2 text-xs text-muted-foreground"
          role="group"
          aria-label="Open bills on this table"
        >
          <span className="font-semibold text-foreground">Add to bill:</span>
          {openBills.map((b) => (
            <Button
              key={b.id}
              type="button"
              size="sm"
              variant={b.id === selectedBillId ? "default" : "outline"}
              className="h-7 px-2.5 text-xs font-mono font-medium"
              aria-pressed={b.id === selectedBillId}
              onClick={() => onSelectBill?.(b.id)}
            >
              #{b.orderNumber}
            </Button>
          ))}
        </div>
      )}

      {existingOrderNumber && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
          <span className="text-muted-foreground">
            Active bill:{" "}
            <span className="font-semibold text-foreground">
              #{existingOrderNumber}
            </span>
          </span>
          {onViewExistingOrder && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 shrink-0 text-xs font-semibold px-2.5"
              onClick={onViewExistingOrder}
            >
              View & Pay
            </Button>
          )}
        </div>
      )}

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto rounded-md border border-border/60 bg-background/50 p-2">
        {lines.length === 0 ? (
          <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <div className="h-10 w-10 rounded-md bg-secondary/80 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 opacity-40" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">Cart is empty</p>
              <p className="text-[11px] text-muted-foreground">
                Tap items on the left to add to order
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border/60">
            {lines.map((line) => (
              <div
                key={line.key}
                className="group flex items-start justify-between gap-2.5 py-2.5 px-1.5 transition-colors hover:bg-secondary/30 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {line.name}
                  </p>
                  {line.modifierLabel && (
                    <span className="inline-block mt-0.5 rounded bg-secondary px-1.5 py-0.2 text-[10px] text-muted-foreground truncate max-w-full">
                      {line.modifierLabel}
                    </span>
                  )}
                  <p className="mt-1 text-xs font-bold tabular-nums text-foreground">
                    {formatCurrency(line.unitPrice * line.quantity)}
                    {line.quantity > 1 && (
                      <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                        ({formatCurrency(line.unitPrice)} each)
                      </span>
                    )}
                  </p>
                </div>

                {/* Quantity Controls Stepper */}
                <div className="flex items-center gap-1 shrink-0">
                  <div className="flex items-center rounded-lg border border-border bg-card p-0.5 shadow-xs">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => onDecrement(line.key)}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold tabular-nums text-foreground">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => onIncrement(line.key)}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    type="button"
                    aria-label="Remove item"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={() => onRemove(line.key)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bill Footer Summary */}
      <div className="flex flex-col gap-2.5 rounded-md border border-border/80 bg-secondary/30 p-3.5 shadow-xs">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Items in ticket</span>
          <span className="font-semibold tabular-nums text-foreground">
            {totalItemCount} {totalItemCount === 1 ? "item" : "items"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">
            Total (incl. tax)
          </span>
          <span className="text-base font-bold tabular-nums text-foreground tracking-tight">
            {formatCurrency(subtotal)}
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1 text-xs font-semibold gap-1.5"
            disabled={!existingOrderNumber && lines.length === 0}
            onClick={onPrintBill}
            title="Print bill / receipt"
          >
            <Printer className="h-4 w-4" />
            <span>Print Bill</span>
          </Button>

          <Button
            className="h-11 flex-[2] text-xs font-bold uppercase tracking-wide shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30 active:scale-[0.99]"
            disabled={!canSubmit}
            onClick={onSubmit}
          >
            {isSubmitting
              ? "Sending…"
              : existingOrderNumber
                ? `Add to #${existingOrderNumber} & Send`
                : "Send to Kitchen"}
          </Button>
        </div>

        {existingOrderNumber && onViewExistingOrder && (
          <Button
            type="button"
            variant="secondary"
            className="h-9 w-full text-xs font-semibold"
            onClick={onViewExistingOrder}
          >
            Pay & Settle #{existingOrderNumber}
          </Button>
        )}
      </div>
    </div>
  );
}
