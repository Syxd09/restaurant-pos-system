import { CalendarPlus, ChefHat, LayoutGrid, ShoppingCart, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACTIONS = [
  { href: "/pos", label: "New Order (Till)", icon: ShoppingCart },
  { href: "/tables", label: "Floor Layout", icon: LayoutGrid },
  { href: "/reservations", label: "Reservations", icon: CalendarPlus },
  { href: "/kds", label: "Kitchen Display", icon: ChefHat },
  { href: "/menu", label: "Menu Catalog", icon: UtensilsCrossed },
];

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "rounded-md text-xs font-semibold gap-1.5 h-8 px-3 border-border/80 bg-card/60 hover:bg-secondary transition-all active:scale-95 shadow-2xs",
          )}
        >
          <action.icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{action.label}</span>
        </Link>
      ))}
    </div>
  );
}
