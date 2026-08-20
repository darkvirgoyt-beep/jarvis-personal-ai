import { cn } from "@/lib/utils";
import React from "react";
import type { ReactNode } from "react";

export function HudPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("hud-panel", className)}>{children}</section>;
}
