/** Human-readable size for UI (KB / MB). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function bytesFromAmount(amount: number, unit: "KB" | "MB"): number {
  const n = Math.floor(amount);
  if (unit === "KB") return n * 1024;
  return n * 1024 * 1024;
}
