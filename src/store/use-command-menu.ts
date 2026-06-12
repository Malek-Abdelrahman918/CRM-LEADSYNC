"use client";

import { create } from "zustand";

/** Global open-state for the ⌘K command palette. */
export const useCommandMenu = create<{
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
}));
