import { useEffect, useRef, useState } from "react";
import { FileText, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { apiFetchBlob, ApiRequestError } from "../../services/api";
import { formatBytes } from "../../utils/formatBytes";

export type AttachmentMeta = {
  id: number;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
};

type Props = {
  submissionId: number;
  attachment: AttachmentMeta;
};

function previewKind(mime: string): "image" | "video" | "pdf" | "other" {
  const m = mime.toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  if (m === "application/pdf") return "pdf";
  return "other";
}

/** Fetch blob only when the preview is expanded. */
export function AttachmentInlinePreview({ submissionId, attachment }: Props) {
  const [open, setOpen] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const revoked = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (revoked.current) {
        URL.revokeObjectURL(revoked.current);
        revoked.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!open || blobUrl) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const path = `/api/files/submissions/${submissionId}/attachments/${attachment.id}`;
    apiFetchBlob(path)
      .then((blob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        if (revoked.current) URL.revokeObjectURL(revoked.current);
        revoked.current = url;
        setBlobUrl(url);
      })
      .catch((e) => {
        if (cancelled) return;
        const msg = e instanceof ApiRequestError ? e.message : "Could not load file";
        setError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, blobUrl, submissionId, attachment.id]);

  const kind = previewKind(attachment.mime_type);

  return (
    <div className="rounded-lg border border-border bg-muted/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted/80 transition-colors"
      >
        <span className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-foreground" title={attachment.original_filename}>
            {attachment.original_filename}
          </span>
          <span className="text-muted-foreground shrink-0">{formatBytes(attachment.size_bytes)}</span>
        </span>
        {open ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
      </button>
      {open && (
        <div className="border-t border-border px-3 py-3 bg-background/50">
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading preview…
            </div>
          )}
          {error && <p className="text-sm text-error">{error}</p>}
          {!loading && !error && blobUrl && kind === "image" && (
            <img
              src={blobUrl}
              alt={attachment.original_filename}
              className="max-h-[min(70vh,520px)] w-auto max-w-full rounded-md mx-auto"
              loading="lazy"
            />
          )}
          {!loading && !error && blobUrl && kind === "video" && (
            <video
              src={blobUrl}
              controls
              preload="none"
              className="max-h-[min(70vh,520px)] w-full rounded-md bg-black"
            />
          )}
          {!loading && !error && blobUrl && kind === "pdf" && (
            <iframe
              title={attachment.original_filename}
              src={blobUrl}
              className="w-full h-[min(70vh,560px)] rounded-md border border-border bg-muted/30"
            />
          )}
          {!loading && !error && blobUrl && kind === "other" && (
            <p className="text-sm text-muted-foreground">
              Preview is not available for this file type. The file was uploaded successfully (
              {attachment.mime_type}).
            </p>
          )}
        </div>
      )}
    </div>
  );
}
