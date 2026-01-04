// ============================================
// 🎥 VIDEO LINK IMPORT (PATCH-ONLY)
// Formato aceito: CSV com legacy_qr_id, provider, youtube_id, panda_id
// - Dry-run obrigatório (RPC dry_run_lesson_video_links)
// - Apply transacional (RPC apply_lesson_video_links)
// - Auto-detecta provider baseado no formato do panda_id
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
import { Youtube, Video, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

// Row format from user's CSV
export type VideoLinkRow = {
  legacy_qr_id: number;
  title?: string;
  provider?: string;
  youtube_id?: string;
  panda_id?: string;
  course_name?: string;
  module_name?: string;
  module_order?: number;
  lesson_order?: number;
  old_url?: string;
};

type DryRunResult = {
  total_rows: number;
  matched: number;
  unmatched: number;
  ambiguous: number;
  sample_updates: Array<{
    lesson_id: string;
    lesson_title: string;
    legacy_qr_id: number;
    provider: string;
    youtube_id: string | null;
    panda_id: string | null;
  }>;
  unmatched_rows: Array<{
    legacy_qr_id: number;
    title: string;
    reason: string;
  }>;
};

type ApplyResult = {
  total_rows: number;
  updated: number;
  skipped: number;
};

function normalizeHeader(h: string) {
  return String(h || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function parseWorksheetRows(rows: Record<string, any>[]): VideoLinkRow[] {
  return rows
    .map((raw) => {
      const legacy_qr_id = parseInt(String(raw.legacy_qr_id ?? "0"), 10);
      if (!legacy_qr_id || isNaN(legacy_qr_id)) return null;

      return {
        legacy_qr_id,
        title: String(raw.title ?? "").trim() || undefined,
        provider: String(raw.provider ?? "").trim().toLowerCase() || undefined,
        youtube_id: String(raw.youtube_id ?? "").trim() || undefined,
        panda_id: String(raw.panda_id ?? "").trim() || undefined,
        course_name: String(raw.course_name ?? "").trim() || undefined,
        module_name: String(raw.module_name ?? "").trim() || undefined,
        module_order: raw.module_order ? parseInt(String(raw.module_order), 10) : undefined,
        lesson_order: raw.lesson_order ? parseInt(String(raw.lesson_order), 10) : undefined,
        old_url: String(raw.old_url ?? "").trim() || undefined,
      } satisfies VideoLinkRow;
    })
    .filter(Boolean) as VideoLinkRow[];
}

export function VideoLinkImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<VideoLinkRow[]>([]);
  const [dryRun, setDryRun] = useState<DryRunResult | null>(null);
  const [applyResult, setApplyResult] = useState<ApplyResult | null>(null);
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');

  const hasRows = rows.length > 0;
  const canApply = useMemo(() => {
    if (!dryRun) return false;
    return dryRun.matched > 0;
  }, [dryRun]);

  const requiredColumnsHint = "Colunas: legacy_qr_id (obrigatório), youtube_id, panda_id, provider";

  async function handleFile(file: File) {
    setDryRun(null);
    setApplyResult(null);
    setRows([]);
    setStep('upload');

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

      toast.success("Arquivo carregado", { description: `${parsed.length} linhas válidas.` });

      if (parsed.length === 0) {
        toast.error("Nenhuma linha válida", { description: "Verifique a coluna legacy_qr_id" });
        return;
      }

      // Auto dry-run
      setIsDryRunning(true);
      const { data, error } = await supabase.rpc("dry_run_lesson_video_links", {
        p_rows: parsed as any,
      });

      if (error) throw error;
      setDryRun(data as DryRunResult);
      setStep('preview');
      toast.success("Prévia pronta");

    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao processar arquivo", { description: e?.message || "Erro desconhecido" });
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

      const res = data as ApplyResult;
      setApplyResult(res);
      setStep('done');
      toast.success("Importação concluída!", { description: `${res.updated} aulas atualizadas.` });

    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao aplicar (rollback automático)", { description: e?.message || "Erro desconhecido" });
    } finally {
      setIsApplying(false);
    }
  }

  function reset() {
    setRows([]);
    setDryRun(null);
    setApplyResult(null);
    setFileName(null);
    setStep('upload');
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Importar Links de Vídeo
          </DialogTitle>
          <DialogDescription>
            Atualiza <code>video_url</code>, <code>youtube_video_id</code> e <code>panda_video_id</code> via legacy_qr_id.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Step: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleFile(f);
                  }}
                  disabled={isDryRunning}
                />
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{fileName ? fileName : "Nenhum arquivo"}</Badge>
                  <span>{requiredColumnsHint}</span>
                </div>
              </div>

              {isDryRunning && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analisando arquivo...
                </div>
              )}

              <div className="p-4 bg-muted rounded-lg text-sm">
                <p className="font-medium mb-2">Formato do seu CSV:</p>
                <code className="text-xs block bg-background p-2 rounded overflow-x-auto">
                  legacy_qr_id,title,provider,youtube_id,panda_id,course_name,...
                </code>
                <ul className="mt-3 space-y-1 text-muted-foreground text-xs">
                  <li>• <strong>legacy_qr_id</strong>: ID numérico do QR (obrigatório para match)</li>
                  <li>• <strong>youtube_id</strong>: ID do YouTube (ex: InKrHyQjcPc)</li>
                  <li>• <strong>panda_id</strong>: UUID do Panda (auto-detectado)</li>
                  <li>• Provider é detectado automaticamente pelo formato do ID</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && dryRun && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-md border bg-card text-center">
                  <div className="text-xs text-muted-foreground">Total CSV</div>
                  <div className="text-2xl font-bold">{dryRun.total_rows}</div>
                </div>
                <div className="p-3 rounded-md border bg-green-500/10 text-center">
                  <div className="text-xs text-muted-foreground">Encontradas</div>
                  <div className="text-2xl font-bold text-green-600">{dryRun.matched}</div>
                </div>
                <div className="p-3 rounded-md border bg-red-500/10 text-center">
                  <div className="text-xs text-muted-foreground">Não encontradas</div>
                  <div className="text-2xl font-bold text-red-600">{dryRun.unmatched}</div>
                </div>
                <div className="p-3 rounded-md border bg-yellow-500/10 text-center">
                  <div className="text-xs text-muted-foreground">Ambíguas</div>
                  <div className="text-2xl font-bold text-yellow-600">{dryRun.ambiguous}</div>
                </div>
              </div>

              {dryRun.sample_updates && dryRun.sample_updates.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Prévia (primeiras 10):</div>
                  <ScrollArea className="h-48 rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">QR ID</TableHead>
                          <TableHead>Título</TableHead>
                          <TableHead className="w-24">Provider</TableHead>
                          <TableHead>Video ID</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dryRun.sample_updates.map((r, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-xs">#{r.legacy_qr_id}</TableCell>
                            <TableCell className="text-xs truncate max-w-[200px]">{r.lesson_title}</TableCell>
                            <TableCell>
                              <Badge variant={r.provider === 'youtube' ? 'destructive' : 'secondary'} className="flex items-center gap-1 w-fit">
                                {r.provider === 'youtube' ? <Youtube className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                                {r.provider}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {r.provider === 'youtube' ? r.youtube_id : r.panda_id?.slice(0, 12)}...
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}

              {dryRun.unmatched_rows && dryRun.unmatched_rows.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-red-600 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Não encontradas ({dryRun.unmatched_rows.length}):
                  </div>
                  <ScrollArea className="h-24 rounded-md border border-red-200">
                    <div className="p-2 space-y-1">
                      {dryRun.unmatched_rows.slice(0, 20).map((item, idx) => (
                        <div key={idx} className="text-xs text-red-600">
                          #{item.legacy_qr_id}: {item.title} — {item.reason}
                        </div>
                      ))}
                      {dryRun.unmatched_rows.length > 20 && (
                        <div className="text-xs text-muted-foreground">
                          ... e mais {dryRun.unmatched_rows.length - 20}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}

          {/* Step: Done */}
          {step === 'done' && applyResult && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-8">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-xl font-bold text-green-600">Importação Concluída!</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted p-4 rounded text-center">
                  <div className="text-2xl font-bold">{applyResult.total_rows}</div>
                  <div className="text-sm text-muted-foreground">Total processado</div>
                </div>
                <div className="bg-green-500/10 p-4 rounded text-center">
                  <div className="text-2xl font-bold text-green-600">{applyResult.updated}</div>
                  <div className="text-sm text-muted-foreground">Atualizadas</div>
                </div>
                <div className="bg-yellow-500/10 p-4 rounded text-center">
                  <div className="text-2xl font-bold text-yellow-600">{applyResult.skipped}</div>
                  <div className="text-sm text-muted-foreground">Puladas</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          )}
          
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={reset}>Voltar</Button>
              <Button 
                onClick={applyUpdates} 
                disabled={!canApply || isApplying}
                className="bg-green-600 hover:bg-green-700"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Aplicando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aplicar {dryRun?.matched} atualizações
                  </>
                )}
              </Button>
            </>
          )}
          
          {step === 'done' && (
            <Button onClick={() => onOpenChange(false)}>Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
