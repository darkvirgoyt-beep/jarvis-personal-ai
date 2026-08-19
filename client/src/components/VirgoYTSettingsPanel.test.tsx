// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VirgoYTSettingsPanel } from "./VirgoYTSettingsPanel";

function renderPanel(vaultConfigured: boolean) {
  const props = {
    providerLabel: "OpenRouter",
    providerEndpoint: "https://openrouter.ai/api/v1",
    providerApiKey: "sk-example-provider-key-which-is-long-enough",
    vaultConfigured,
    providerProfiles: [],
    runnerName: "",
    runnerType: "local_cli" as const,
    runners: [],
    createPending: false,
    runnerPending: false,
    onProviderLabelChange: vi.fn(),
    onProviderEndpointChange: vi.fn(),
    onProviderApiKeyChange: vi.fn(),
    onCreateProvider: vi.fn(),
    onRunnerNameChange: vi.fn(),
    onRunnerTypeChange: vi.fn(),
    onRegisterRunner: vi.fn(),
  };
  render(<VirgoYTSettingsPanel {...props} />);
  return props;
}

describe("VirgoYTSettingsPanel", () => {
  afterEach(() => cleanup());

  it("uses a non-autocompleting password field and blocks key submission when the vault is absent", () => {
    renderPanel(false);
    const input = screen.getByLabelText("Provider API key");
    expect(input.getAttribute("type")).toBe("password");
    expect(input.getAttribute("autocomplete")).toBe("off");
    expect(screen.getByRole("button", { name: "Save encrypted profile" }).hasAttribute("disabled")).toBe(true);
  });

  it("permits the reviewed encrypted-profile submission only after the server vault is ready", () => {
    const props = renderPanel(true);
    fireEvent.click(screen.getByRole("button", { name: "Save encrypted profile" }));
    expect(props.onCreateProvider).toHaveBeenCalledOnce();
  });
});
