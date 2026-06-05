"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LeadFormDialog } from "./lead-form-dialog";

type BtnProps = React.ComponentProps<typeof Button>;

export function AddLeadButton({
  label = "Add Lead",
  variant,
  size,
  className,
  iconOnly = false,
}: {
  label?: string;
  variant?: BtnProps["variant"];
  size?: BtnProps["size"];
  className?: string;
  iconOnly?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant={variant}
        size={iconOnly ? "icon" : size}
        className={className}
      >
        <Plus className="size-4" />
        {!iconOnly && label}
      </Button>
      <LeadFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
