"use client";

import { Check, ChevronsUpDown, Store } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBranch } from "@/hooks/use-branch";

export function BranchSwitcher() {
  const { branchId, branches, setBranchId } = useBranch();
  const current = branches.find((b) => b.id === branchId) ?? branches[0];

  if (!current) return null;

  // Single branch operation: clean status badge without dropdown clutter
  if (branches.length <= 1) {
    return (
      <div className="flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-sidebar px-3 py-2 text-left text-xs text-sidebar-foreground shadow-2xs">
        <Store className="h-4 w-4 shrink-0 text-primary" />
        <span className="flex-1 truncate font-semibold text-foreground">
          {current.name}
        </span>
        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Active Branch" />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-sidebar px-3 py-2 text-left text-xs hover:bg-sidebar-accent/50 shadow-2xs">
        <Store className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate font-semibold text-sidebar-foreground">
          {current.name}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {branches.map((branch) => (
          <DropdownMenuItem key={branch.id} onClick={() => setBranchId(branch.id)}>
            <span className="flex-1 text-xs">{branch.name}</span>
            {branch.id === branchId && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
