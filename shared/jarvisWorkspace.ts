export const JARVIS_WORKSPACE_OPERATIONS = ["folder", "file", "code"] as const;
export type JarvisWorkspaceOperation = (typeof JARVIS_WORKSPACE_OPERATIONS)[number];

export function normalizeJarvisWorkspacePath(rawPath: string) {
  const path = rawPath.trim().replace(/\\/g, "/").replace(/\/+/g, "/");
  if (!path || path.length > 700 || path.startsWith("/") || path.endsWith("/")) {
    throw new Error("Use a workspace-relative path up to 700 characters.");
  }
  const segments = path.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === ".." || !/^[a-zA-Z0-9._ -]+$/.test(segment))) {
    throw new Error("Workspace paths may contain letters, numbers, spaces, dots, dashes, underscores, and forward slashes only.");
  }
  return segments.join("/");
}

export function buildJarvisWorkspaceProposal(operation: JarvisWorkspaceOperation, rawPath: string, rawContent = "") {
  const path = normalizeJarvisWorkspacePath(rawPath);
  const content = rawContent.replace(/\r\n/g, "\n");
  if (operation !== "folder" && content.length > 100_000) {
    throw new Error("Workspace text is limited to 100,000 characters per write.");
  }
  if (operation === "folder" && content.trim()) {
    throw new Error("Folders cannot contain file text.");
  }
  const name = path.split("/").at(-1) ?? path;
  const contentType = operation === "code"
    ? "text/plain; charset=utf-8"
    : "text/plain; charset=utf-8";
  return { operation, path, name, content, contentType };
}

export function jarvisWorkspaceStoragePath(userId: number, path: string) {
  return `jarvis-workspace/${userId}/${path}`;
}
