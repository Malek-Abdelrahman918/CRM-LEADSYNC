"use client";

import * as React from "react";

import { useCrmStore } from "@/store/use-crm-store";

const HEX_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const VARS = ["--primary", "--sidebar-primary", "--ring", "--sidebar-ring", "--chart-1"];

/**
 * Applies the agency's brand colour (Settings → Brand color) to the design
 * system at runtime by overriding the primary CSS variables. Invalid or empty
 * values fall back to the built-in theme.
 */
export function BrandStyle() {
  const brandColor = useCrmStore((s) => s.settings.brandColor);

  React.useEffect(() => {
    const root = document.documentElement;
    if (brandColor && HEX_RE.test(brandColor.trim())) {
      const value = brandColor.trim();
      VARS.forEach((v) => root.style.setProperty(v, value));
    } else {
      VARS.forEach((v) => root.style.removeProperty(v));
    }
    return () => {
      VARS.forEach((v) => root.style.removeProperty(v));
    };
  }, [brandColor]);

  return null;
}
