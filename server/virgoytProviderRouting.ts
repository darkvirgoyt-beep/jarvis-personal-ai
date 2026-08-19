import type { VirgoYTProvider } from "./virgoytDb";

export type VirgoYTProviderProfileSummary = {
  provider: VirgoYTProvider;
  status: "unconfigured" | "ready" | "disabled" | "error";
  endpoint: string | null;
  defaultModel: string | null;
};

type ProviderRoute = {
  id: VirgoYTProvider;
  label: string;
  defaultEndpoint: string | null;
  environmentKey: string | null;
  executionBoundary: string;
};

export const VIRGOYT_PROVIDER_ROUTES: readonly ProviderRoute[] = [
  {
    id: "openrouter",
    label: "OpenRouter",
    defaultEndpoint: "https://openrouter.ai/api/v1",
    environmentKey: "OPENROUTER_API_KEY",
    executionBoundary: "Server-managed routing only. The browser never receives the key.",
  },
  {
    id: "nvidia_nim",
    label: "NVIDIA NIM",
    defaultEndpoint: "https://integrate.api.nvidia.com/v1",
    environmentKey: "NVIDIA_NIM_API_KEY",
    executionBoundary: "Server-managed routing only. The browser never receives the key.",
  },
  {
    id: "compatible",
    label: "OpenAI-compatible endpoint",
    defaultEndpoint: null,
    environmentKey: "VIRGOYT_COMPATIBLE_API_KEY",
    executionBoundary: "Endpoint metadata is reviewable; key material is reserved for a server vault or paired runner.",
  },
  {
    id: "local_bridge",
    label: "Local model bridge",
    defaultEndpoint: null,
    environmentKey: null,
    executionBoundary: "A cloud deployment cannot reach device localhost. A signed paired runner is required.",
  },
] as const;

function serverCredentialState(route: ProviderRoute) {
  if (!route.environmentKey) return "runner_required" as const;
  return process.env[route.environmentKey]?.trim() ? "server_configured" as const : "not_configured" as const;
}

export function getVirgoYTProviderRoutingSummary(profiles: VirgoYTProviderProfileSummary[]) {
  return VIRGOYT_PROVIDER_ROUTES.map((route) => {
    const profileCount = profiles.filter((profile) => profile.provider === route.id).length;
    const credentialState = serverCredentialState(route);
    return {
      id: route.id,
      label: route.label,
      defaultEndpoint: route.defaultEndpoint,
      profileCount,
      credentialState,
      executable: credentialState === "server_configured",
      executionBoundary: route.executionBoundary,
    };
  });
}

/** Rejects URL shapes that could smuggle a credential into an otherwise public profile. */
export function isCredentialFreeProviderEndpoint(value: string) {
  const parsed = new URL(value);
  return !parsed.username
    && !parsed.password
    && !/[?&](?:api[_-]?key|token|secret|password)=/i.test(parsed.search);
}
