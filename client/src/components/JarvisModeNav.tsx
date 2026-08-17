import { type LucideIcon, Blocks, BrainCircuit, FolderKanban, Link2, MessageSquareText, Settings2, WandSparkles } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

export type JarvisWorkspaceMode = "chats" | "memory" | "projects" | "builder" | "integrations" | "settings";

const modes: { id: JarvisWorkspaceMode; label: string; shortcut: string; icon: LucideIcon }[] = [
  { id: "chats", label: "Chats", shortcut: "1", icon: MessageSquareText },
  { id: "memory", label: "Memory", shortcut: "2", icon: BrainCircuit },
  { id: "projects", label: "Projects", shortcut: "3", icon: FolderKanban },
  { id: "builder", label: "Builder", shortcut: "4", icon: WandSparkles },
  { id: "integrations", label: "Integrations", shortcut: "5", icon: Link2 },
  { id: "settings", label: "Settings", shortcut: "6", icon: Settings2 },
];

export function JarvisModeNav({ activeMode, onModeChange, pendingApprovals = 0, variant = "strip" }: { activeMode: JarvisWorkspaceMode; onModeChange: (mode: JarvisWorkspaceMode) => void; pendingApprovals?: number; variant?: "strip" | "rail" }) {
  return (
    <nav aria-label="Jarvis workspace modes" className={cn("jarvis-mode-nav", variant === "rail" && "jarvis-mode-nav--rail")}>
      {modes.map((mode) => {
        const Icon = mode.icon;
        const selected = mode.id === activeMode;
        return (
          <button
            aria-current={selected ? "page" : undefined}
            className={cn("jarvis-mode-nav__button", selected && "jarvis-mode-nav__button--active")}
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            title={`${mode.label} (Alt+${mode.shortcut})`}
            type="button"
          >
            <Icon className="size-3.5" />
            <span>{mode.label}</span>
            {mode.id === "integrations" && pendingApprovals > 0 && <span aria-label={`${pendingApprovals} approvals waiting`} className="jarvis-mode-nav__count">{pendingApprovals}</span>}
            <kbd>{mode.shortcut}</kbd>
          </button>
        );
      })}
    </nav>
  );
}
