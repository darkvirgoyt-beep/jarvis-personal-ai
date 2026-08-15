export type JarvisGitHubHandoff = {
  label: "GitHub connection" | "GitHub repository handoff";
  destination: string;
  url: string;
  riskLevel: "medium";
};

const githubPart = /^[A-Za-z0-9_.-]+$/;

function required(value: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Enter a GitHub repository URL or choose GitHub sign in.");
  return trimmed;
}

/**
 * Validates an external GitHub handoff without accepting OAuth callback URLs,
 * tokens, query strings, or arbitrary third-party destinations.
 */
export function buildJarvisGitHubHandoff(rawDestination: string): JarvisGitHubHandoff {
  const destination = required(rawDestination);
  if (/^(sign in|connect|connect github|new repository|create repository)$/i.test(destination)) {
    return {
      label: "GitHub connection",
      destination: "GitHub sign in and new repository page",
      url: "https://github.com/login?return_to=%2Fnew",
      riskLevel: "medium",
    };
  }

  const normalized = destination.startsWith("github.com/") ? `https://${destination}` : destination;
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error("Enter a GitHub repository URL such as https://github.com/owner/repository.");
  }
  if (parsed.protocol !== "https:" || parsed.hostname !== "github.com" || parsed.search || parsed.hash) {
    throw new Error("Use a plain HTTPS github.com repository URL without a query string or fragment.");
  }
  const [owner, repo, ...rest] = parsed.pathname.split("/").filter(Boolean);
  const repository = repo?.replace(/\.git$/i, "");
  if (!owner || !repository || rest.length || !githubPart.test(owner) || !githubPart.test(repository)) {
    throw new Error("Enter a GitHub repository URL such as https://github.com/owner/repository.");
  }
  return {
    label: "GitHub repository handoff",
    destination: `${owner}/${repository}`,
    url: `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`,
    riskLevel: "medium",
  };
}
