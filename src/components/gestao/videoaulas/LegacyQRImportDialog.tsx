// ============================================
// 📥 LEGACY QR IMPORT DIALOG
// Import CSV/JSON files with legacy QR mappings
// ============================================

import { useState, useCallback, forwardRef } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Upload, FileJson, FileSpreadsheet, AlertCircle, 
  CheckCircle2, XCircle, Loader2, QrCode, Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatError } from "@/lib/utils/formatError";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ImportRecord {
  legacy_qr_id: number;
  title: string;
  provider: string;
  youtube_id?: string;
  panda_id?: string;
  youtube_url?: string;
  thumbnail_url?: string;
  description?: string;
  module_id?: string;
}

interface ImportResult {
  success: boolean;
  legacy_qr_id: number;
  title: string;
  error?: string;
}

interface LegacyQRImportDialogProps {
  open: boolean;
  onClose: () => void;
  modules: { id: string; title: string }[];
}

export const LegacyQRImportDialog = forwardRef<HTMLDivElement, LegacyQRImportDialogProps>(
  function LegacyQRImportDialog({ open, onClose, modules }, _ref) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ImportRecord[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');

  const parseCSV = (text: string): ImportRecord[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error("CSV deve ter cabeçalho e pelo menos uma linha de dados");

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const records: ImportRecord[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      const record: any = {};

      headers.forEach((header, idx) => {
        record[header] = values[idx] || '';
      });

      // Validate required fields
      const legacyQrId = parseInt(record.legacy_qr_id || record.v || record.qr_id);
      if (isNaN(legacyQrId)) {
        errors.push(`Linha ${i + 1}: legacy_qr_id inválido ou ausente`);
        continue;
      }

      if (!record.title) {
        errors.push(`Linha ${i + 1}: título ausente`);
        continue;
      }

      const provider = (record.provider || 'youtube').toLowerCase();
      const youtubeId = record.youtube_id || record.youtube_video_id || '';
      const pandaId = record.panda_id || record.panda_video_id || '';

      if (provider === 'youtube' && !youtubeId) {
        errors.push(`Linha ${i + 1}: youtube_id ausente para provider youtube`);
        continue;
      }

      if (provider === 'panda' && !pandaId) {
        errors.push(`Linha ${i + 1}: panda_id ausente para provider panda`);
        continue;
      }

      records.push({
        legacy_qr_id: legacyQrId,
        title: record.title,
        provider,
        youtube_id: youtubeId,
        panda_id: pandaId,
        youtube_url: record.youtube_url || '',
        thumbnail_url: record.thumbnail_url || '',
        description: record.description || '',
        module_id: record.module_id || ''
      });
    }

    setParseErrors(errors);
    return records;
  };

  const parseJSON = (text: string): ImportRecord[] => {
    const data = JSON.parse(text);
    const records: ImportRecord[] = [];
    const errors: string[] = [];
    const items = Array.isArray(data) ? data : data.videos || data.lessons || data.items || [];

    items.forEach((item: any, idx: number) => {
      const legacyQrId = parseInt(item.legacy_qr_id || item.v || item.qr_id);
      if (isNaN(legacyQrId)) {
        errors.push(`Item ${idx + 1}: legacy_qr_id inválido ou ausente`);
        return;
      }

      if (!item.title) {
        errors.push(`Item ${idx + 1}: título ausente`);
        return;
      }

      const provider = (item.provider || 'youtube').toLowerCase();
      const youtubeId = item.youtube_id || item.youtube_video_id || '';
      const pandaId = item.panda_id || item.panda_video_id || '';

      if (provider === 'youtube' && !youtubeId) {
        errors.push(`Item ${idx + 1}: youtube_id ausente para provider youtube`);
        return;
      }

      if (provider === 'panda' && !pandaId) {
        errors.push(`Item ${idx + 1}: panda_id ausente para provider panda`);
        return;
      }

      records.push({
        legacy_qr_id: legacyQrId,
        title: item.title,
        provider,
        youtube_id: youtubeId,
        panda_id: pandaId,
        youtube_url: item.youtube_url || '',
        thumbnail_url: item.thumbnail_url || '',
        description: item.description || '',
        module_id: item.module_id || ''
      });
    });

    setParseErrors(errors);
    return records;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFile(file);
    setParseErrors([]);
    setParsedData([]);

    try {
      const text = await file.text();
      let records: ImportRecord[];

      if (file.name.endsWith('.json')) {
        records = parseJSON(text);
      } else if (file.name.endsWith('.csv')) {
        records = parseCSV(text);
      } else {
        throw new Error("Formato não suportado. Use CSV ou JSON.");
      }

      setParsedData(records);
      setStep('preview');
    } catch (error: any) {
      toast.error(`Erro ao processar arquivo: ${formatError(error)}`);
      setParseErrors([formatError(error)]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json']
    },
    maxFiles: 1
  });

  const importRecords = async () => {
    if (parsedData.length === 0) return;

    setIsImporting(true);
    setStep('importing');
    setImportResults([]);
    setImportProgress(0);

    const results: ImportResult[] = [];
    // CRITICAL: NULL is now allowed for module_id (QR Legacy import strategy)
    // Lessons can be organized later via management UI
    const defaultModuleId = modules[0]?.id || null;

    for (let i = 0; i < parsedData.length; i++) {
      const record = parsedData[i];

      try {
        // Check if legacy_qr_id already exists
        const { data: existing } = await supabase
          .from('lessons')
          .select('id, legacy_qr_id')
          .eq('legacy_qr_id', record.legacy_qr_id)
          .single();

        if (existing) {
          results.push({
            success: false,
            legacy_qr_id: record.legacy_qr_id,
            title: record.title,
            error: `legacy_qr_id ${record.legacy_qr_id} já existe`
          });
          continue;
        }

        // Insert new lesson
        const { error } = await supabase
          .from('lessons')
          .insert({
            legacy_qr_id: record.legacy_qr_id,
            title: record.title,
            description: record.description || null,
            video_provider: record.provider,
            youtube_video_id: record.youtube_id || null,
            panda_video_id: record.panda_id || null,
            video_url: record.youtube_url || null,
            thumbnail_url: record.thumbnail_url || null,
            module_id: record.module_id || defaultModuleId,
            is_published: true,
            is_free: false,
            position: i + 1
          });

        if (error) throw error;

        results.push({
          success: true,
          legacy_qr_id: record.legacy_qr_id,
          title: record.title
        });
      } catch (error: any) {
        results.push({
          success: false,
          legacy_qr_id: record.legacy_qr_id,
          title: record.title,
          error: error.message
        });
      }

      setImportProgress(Math.round(((i + 1) / parsedData.length) * 100));
    }

    setImportResults(results);
    setIsImporting(false);
    setStep('complete');
    queryClient.invalidateQueries({ queryKey: ['gestao-videoaulas'] });

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    if (failCount === 0) {
      toast.success(`${successCount} vídeos importados com sucesso!`);
    } else {
      toast.warning(`${successCount} importados, ${failCount} falharam`);
    }
  };

  const reset = () => {
    setFile(null);
    setParsedData([]);
    setParseErrors([]);
    setImportResults([]);
    setImportProgress(0);
    setStep('upload');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const downloadTemplate = (format: 'csv' | 'json') => {
    const sampleData = [
      {
        legacy_qr_id: 10001,
        title: "Aula Exemplo 1",
        provider: "youtube",
        youtube_id: "dQw4w9WgXcQ",
        description: "Descrição opcional"
      },
      {
        legacy_qr_id: 10002,
        title: "Aula Exemplo 2",
        provider: "panda",
        panda_id: "a7ce1bfd-0af1-4b03-b33b-7ed7226c5fb0"
      }
    ];

    let content: string;
    let filename: string;
    let type: string;

    if (format === 'csv') {
      const headers = ['legacy_qr_id', 'title', 'provider', 'youtube_id', 'panda_id', 'description'];
      const rows = sampleData.map(d => 
        [d.legacy_qr_id, d.title, d.provider, d.youtube_id || '', (d as any).panda_id || '', d.description || ''].join(',')
      );
      content = [headers.join(','), ...rows].join('\n');
      filename = 'template_qr_legacy.csv';
      type = 'text/csv';
    } else {
      content = JSON.stringify(sampleData, null, 2);
      filename = 'template_qr_legacy.json';
      type = 'application/json';
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-500" />
            Importar Mapeamento QR Legado
          </DialogTitle>
          <DialogDescription>
            Importe o arquivo CSV ou JSON gerado pelo Manus com os mapeamentos legacy_qr_id → vídeo
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Campos obrigatórios</AlertTitle>
              <AlertDescription>
                <code className="text-xs">legacy_qr_id</code>, <code className="text-xs">title</code>, <code className="text-xs">provider</code>, e <code className="text-xs">youtube_id</code> ou <code className="text-xs">panda_id</code>
              </AlertDescription>
            </Alert>

            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50'}
              `}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">
                {isDragActive ? 'Solte o arquivo aqui' : 'Arraste o arquivo ou clique para selecionar'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Formatos aceitos: CSV, JSON
              </p>
            </div>

            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadTemplate('csv')}>
                <Download className="w-4 h-4 mr-2" />
                Template CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadTemplate('json')}>
                <Download className="w-4 h-4 mr-2" />
                Template JSON
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {file?.name.endsWith('.json') ? (
                  <FileJson className="w-5 h-5 text-amber-500" />
                ) : (
                  <FileSpreadsheet className="w-5 h-5 text-green-500" />
                )}
                <span className="font-medium">{file?.name}</span>
              </div>
              <Badge variant="secondary">{parsedData.length} registros</Badge>
            </div>

            {parseErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erros de validação ({parseErrors.length})</AlertTitle>
                <AlertDescription>
                  <ScrollArea className="h-24 mt-2">
                    <ul className="text-xs space-y-1">
                      {parseErrors.map((err, i) => (
                        <li key={i}>• {formatError(err)}</li>
                      ))}
                    </ul>
                  </ScrollArea>
                </AlertDescription>
              </Alert>
            )}

            <div className="border rounded-lg">
              <div className="p-2 bg-muted text-xs font-medium grid grid-cols-4 gap-2">
                <span>QR ID</span>
                <span>Título</span>
                <span>Provider</span>
                <span>Video ID</span>
              </div>
              <ScrollArea className="h-48">
                {parsedData.slice(0, 50).map((record, i) => (
                  <div key={i} className="p-2 text-xs grid grid-cols-4 gap-2 border-t">
                    <span className="font-mono text-amber-600">{record.legacy_qr_id}</span>
                    <span className="truncate">{record.title}</span>
                    <Badge variant="outline" className="w-fit text-xs">
                      {record.provider}
                    </Badge>
                    <span className="font-mono truncate text-muted-foreground">
                      {record.youtube_id || record.panda_id}
                    </span>
                  </div>
                ))}
                {parsedData.length > 50 && (
                  <div className="p-2 text-xs text-center text-muted-foreground border-t">
                    ... e mais {parsedData.length - 50} registros
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="space-y-4 py-8">
            <div className="text-center">
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
              <p className="mt-4 text-lg font-medium">Importando...</p>
              <p className="text-sm text-muted-foreground">
                {Math.round(importProgress)}% concluído
              </p>
            </div>
            <Progress value={importProgress} className="h-2" />
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
              <p className="mt-2 text-lg font-medium">Importação concluída!</p>
            </div>

            <div className="flex justify-center gap-4">
              <Badge variant="default" className="text-sm">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                {importResults.filter(r => r.success).length} sucesso
              </Badge>
              {importResults.filter(r => !r.success).length > 0 && (
                <Badge variant="destructive" className="text-sm">
                  <XCircle className="w-4 h-4 mr-1" />
                  {importResults.filter(r => !r.success).length} falhas
                </Badge>
              )}
            </div>

            {importResults.filter(r => !r.success).length > 0 && (
              <ScrollArea className="h-32 border rounded-lg p-2">
                <div className="space-y-1">
                  {importResults.filter(r => !r.success).map((result, i) => (
                    <div key={i} className="text-xs flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                      <span>
                        <span className="font-mono text-amber-600">#{result.legacy_qr_id}</span>
                        {' '}{result.title}: {result.error}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={reset}>Voltar</Button>
              <Button 
                onClick={importRecords} 
                disabled={parsedData.length === 0}
              >
                Importar {parsedData.length} registros
              </Button>
            </>
          )}
          {step === 'complete' && (
            <>
              <Button variant="outline" onClick={reset}>Nova Importação</Button>
              <Button onClick={handleClose}>Concluir</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

LegacyQRImportDialog.displayName = "LegacyQRImportDialog";
