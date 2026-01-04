// ============================================
// 🎥 VIDEO LINK IMPORT (PATCH-ONLY)
// Atualiza SOMENTE: lessons.video_url + lessons.video_provider
// - Dry-run obrigatório (RPC dry_run_lesson_video_links)
// - Apply transacional (RPC apply_lesson_video_links)
// ============================================

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type VideoProvider = "panda" | "youtube" | "vimeo" | "upload";

export type VideoLinkRow = {
  lesson_id?: string; // UUID
  module_id?: string; // UUID (required if lesson_id not provided)
  lesson_title?: string; // required if lesson_id not provided
  video_url: string;
  video_provider: VideoProvider;
};

type DryRunResult = {
  success: boolean;
  error?: string;
  total_rows?: number;
  matched_lessons?: number;
  unmatched_rows?: number;
  ambiguous_rows?: number;
  sample_updates?: Array<{ lesson_id: string; video_provider: string; video_url: string }>;
  unmatched?: Array<{ row: any; reason: string }>;
  ambiguous?: Array<{ row: any; reason: string; count?: number }>;
};

function normalizeHeader(h: string) {
  return String(h || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function toProvider(v: unknown): VideoProvider | null {
  const s = String(v || "").trim().toLowerCase();
  if (s === "panda" || s === "youtube" || s === "vimeo" || s === "upload") return s as VideoProvider;
  return null;
}

function parseWorksheetRows(rows: Record<string, any>[]): VideoLinkRow[] {
  return rows
    .map((raw) => {
      const lesson_id = String(raw.lesson_id ?? "").trim() || undefined;
      const module_id = String(raw.module_id ?? "").trim() || undefined;
      const lesson_title = String(raw.lesson_title ?? raw.title ?? "").trim() || undefined;
      const video_url = String(raw.video_url ?? "").trim();
      const provider = toProvider(raw.video_provider ?? raw.provider);

      if (!provider) return null;
      if (!video_url) return null;

      return {
        lesson_id,
        module_id,
        lesson_title,
        video_url,
        video_provider: provider,
      } satisfies VideoLinkRow;
    })
    .filter(Boolean) as VideoLinkRow[];
}

export function VideoLinkImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<VideoLinkRow[]>([]);
  const [dryRun, setDryRun] = useState<DryRunResult | null>(null);
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const hasRows = rows.length > 0;
  const canApply = useMemo(() => {
    if (!dryRun?.success) return false;
    if ((dryRun.unmatched_rows || 0) > 0) return false;
    if ((dryRun.ambiguous_rows || 0) > 0) return false;
    return (dryRun.matched_lessons || 0) > 0;
  }, [dryRun]);

  const requiredColumnsHint = "Required columns: video_url, video_provider + (lesson_id OR (module_id + lesson_title))";

  async function handleFile(file: File) {
    setDryRun(null);
    setRows([]);

    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { defval: "" }) as Record<string, any>[];

      // Normalize headers
      const normalized = json.map((r) => {
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(r)) out[normalizeHeader(k)] = v;
        return out;
      });

      const parsed = parseWorksheetRows(normalized);
      setRows(parsed);
      setFileName(file.name);

      toast.success("File loaded", { description: `${parsed.length} row(s) parsed.` });

      if (parsed.length === 0) {
        toast.error("No valid rows found", { description: requiredColumnsHint });
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to read file", { description: e?.message || "Unknown error" });
    }
  }

  async function runDryRun() {
    if (!hasRows) return;

    setIsDryRunning(true);
    setDryRun(null);

    try {
      const { data, error } = await supabase.rpc("dry_run_lesson_video_links", {
        p_rows: rows as any,
      });

      if (error) throw error;
      setDryRun(data as DryRunResult);

      if ((data as DryRunResult).success) {
        toast.success("Dry-run complete");
      } else {
        toast.error("Dry-run failed", { description: (data as DryRunResult).error || "Unknown" });
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Dry-run error", { description: e?.message || "Unknown error" });
    } finally {
      setIsDryRunning(false);
    }
  }

  async function applyUpdates() {
    if (!canApply) return;

    setIsApplying(true);
    try {
      const { data, error } = await supabase.rpc("apply_lesson_video_links", {
        p_rows: rows as any,
      });

      if (error) throw error;

      const res = data as { success: boolean; updated?: number; error?: string };
      if (!res.success) {
        toast.error("Apply failed", { description: res.error || "Unknown" });
        return;
      }

      toast.success("Video links updated", { description: `${res.updated || 0} lesson(s) updated.` });
      onOpenChange(false);

    } catch (e: any) {
      console.error(e);
      toast.error("Apply error (rolled back)", { description: e?.message || "Unknown error" });
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import video links (safe mode)</DialogTitle>
          <DialogDescription>
            Updates ONLY <code>video_url</code> and <code>video_provider</code>. Dry-run is mandatory.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">{fileName ? fileName : "No file"}</Badge>
              <span>{requiredColumnsHint}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="default" onClick={runDryRun} disabled={!hasRows || isDryRunning}>
              {isDryRunning ? "Running dry-run..." : "Run dry-run"}
            </Button>
            <Button variant="outline" onClick={() => { setRows([]); setDryRun(null); setFileName(null); }} disabled={isDryRunning || isApplying}>
              Reset
            </Button>
          </div>

          {dryRun && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-md border bg-card">
                <div className="text-xs text-muted-foreground">Total rows</div>
                <div className="text-lg font-semibold">{dryRun.total_rows ?? 0}</div>
              </div>
              <div className="p-3 rounded-md border bg-card">
                <div className="text-xs text-muted-foreground">Matched lessons</div>
                <div className="text-lg font-semibold">{dryRun.matched_lessons ?? 0}</div>
              </div>
              <div className="p-3 rounded-md border bg-card">
                <div className="text-xs text-muted-foreground">Unmatched</div>
                <div className="text-lg font-semibold">{dryRun.unmatched_rows ?? 0}</div>
              </div>
              <div className="p-3 rounded-md border bg-card">
                <div className="text-xs text-muted-foreground">Ambiguous</div>
                <div className="text-lg font-semibold">{dryRun.ambiguous_rows ?? 0}</div>
              </div>
            </div>
          )}

          {dryRun?.sample_updates && dryRun.sample_updates.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Sample updates (max 25)</div>
              <ScrollArea className="h-56 rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>lesson_id</TableHead>
                      <TableHead>video_provider</TableHead>
                      <TableHead>video_url</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dryRun.sample_updates.map((r) => (
                      <TableRow key={`${r.lesson_id}-${r.video_provider}`}
                      >
                        <TableCell className="font-mono text-xs">{r.lesson_id}</TableCell>
                        <TableCell>{r.video_provider}</TableCell>
                        <TableCell className="font-mono text-xs">{r.video_url}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}

          {(dryRun?.unmatched_rows || 0) > 0 && (
            <div className="text-sm text-destructive">
              Dry-run has unmatched rows. Fix them (or provide lesson_id) and re-run.
            </div>
          )}
          {(dryRun?.ambiguous_rows || 0) > 0 && (
            <div className="text-sm text-destructive">
              Dry-run has ambiguous rows (duplicate titles in module). Provide lesson_id for those rows.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isApplying}>
            Close
          </Button>
          <Button onClick={applyUpdates} disabled={!canApply || isApplying}>
            {isApplying ? "Applying (atomic)..." : "Apply updates"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
