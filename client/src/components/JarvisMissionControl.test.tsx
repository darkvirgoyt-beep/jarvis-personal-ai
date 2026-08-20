import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { JarvisMissionControl } from "./JarvisMissionControl";

describe("JarvisMissionControl", () => {
  it("renders visible work summaries, reviewed artifacts, and the proposal-only computer boundary", () => {
    const markup = renderToStaticMarkup(
      <JarvisMissionControl
        intents={[{ id: "answer", label: "Answer", description: "Write" }, { id: "builder", label: "App / web", description: "Plan a build" }]}
        activeIntent="builder"
        activity={["Jarvis core initialized", "Privacy shield active"]}
        isWorking
        pendingApprovals={2}
        stagedAttachmentCount={1}
        onIntentChange={vi.fn()}
        onOpenBuilder={vi.fn()}
        onOpenWorkspace={vi.fn()}
        onOpenIntegrations={vi.fn()}
      />,
    );

    expect(markup).toContain("JARVIS MISSION CONTROL");
    expect(markup).toContain("VISIBLE, NOT HIDDEN REASONING");
    expect(markup).toContain("ARTIFACT SURFACE");
    expect(markup).toContain("Proposal-only local runner");
    expect(markup).toContain("No paired remote computer is connected");
    expect(markup).toContain("2 REVIEW");
  });
});
