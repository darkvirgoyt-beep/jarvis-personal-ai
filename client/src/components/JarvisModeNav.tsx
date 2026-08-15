import { Command, FolderCode, MessageSquareText, SlidersHorizontal } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

export type JarvisWorkspaceMode = "command" | "conversations" | "workspace" | "settings";

const modes: { id: JarvisWorkspaceMode; label: string; shortcut: string; icon: typeof Command }[] = [
  { id: "command", label: "Command Center", shortcut: "1", icon: Command },
  { id: "conversations", label: "Conversations", shortcut: "2", icon: MessageSquareText },
  { id: "workspace", label: "Private Workspace", shortcut: "3", icon: FolderCode },
  { id: "settings", label: "Settings", shortcut: "4", icon: SlidersHorizontal },
];

export function JarvisModeNav({ activeMode, onModeChange, pendingApprovals = 0 }: { activeMode: JarvisWorkspaceMode; onModeChange: (mode: JarvisWorkspaceMode) => void; pendingApprovals?: number }) {
  return (
    <nav aria-label="Jarvis workspace modes" className="jarvis-mode-nav">
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
            {mode.id === "workspace" && pendingApprovals > 0 && <span aria-label={`${pendingApprovals} approvals waiting`} className="jarvis-mode-nav__count">{pendingApprovals}</span>}
            <kbd>{mode.shortcut}</kbd>
          </button>
        );
      })}
    </nav>
  );
}
