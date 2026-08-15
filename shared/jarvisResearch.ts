export function parseJarvisSourceLedger(sourceLedger: string): string[] {
  try {
    const parsed = JSON.parse(sourceLedger) as unknown;
    if (!Array.isArray(parsed)) return [];
    const valid = parsed.filter((source): source is string => {
      if (typeof source !== "string") return false;
      try {
        return new URL(source).protocol === "https:";
      } catch {
        return false;
      }
    });
    return Array.from(new Set(valid));
  } catch {
    return [];
  }
}
