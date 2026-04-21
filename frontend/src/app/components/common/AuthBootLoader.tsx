import { Loader2 } from "lucide-react";

/** Shown while session is restored from storage / validated with the API — avoids wrong redirects. */
export function AuthBootLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading session" />
    </div>
  );
}
