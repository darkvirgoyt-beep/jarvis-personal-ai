import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function HudPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("hud-panel", className)}>{children}</section>;
}
