// ============================================
// MODAL DE IMPORTAÇÃO CANÔNICA DE ALUNOS
// LEI: Preview obrigatório + Confirmação explícita
// ============================================

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, 
  XCircle, Users, FileWarning, Loader2, ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useImportStudents } from '@/hooks/useImportStudents';
import { toast } from 'sonner';

interface ImportStudentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export function ImportStudentsModal({ 
  open, 
  onOpenChange, 
  onImportComplete 
}: ImportStudentsModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [step, setStep] = useState<'upload' | 'preview' | 'confirm'>('upload');
  
  const { 
    isPreviewing, 
    isImporting, 
    preview, 
    generatePreview, 
    executeImport, 
    resetImport 
  } = useImportStudents();

  const CONFIRMATION_TEXT = 'CONFIRMO_IMPORTACAO_CANONICA_SEM_SOBRESCRITA';

  // ============================================
  // HANDLERS
  // ============================================
  
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // Validate XLSX only
    if (!selectedFile.name.endsWith('.xlsx')) {
      toast.error('Formato inválido', {
        description: 'Apenas arquivos .xlsx são aceitos',
      });
      return;
    }
    
    setFile(selectedFile);
  }, []);

  const handleGeneratePreview = useCallback(async () => {
    if (!file) return;
    
    try {
      await generatePreview(file);
      setStep('preview');
    } catch (error) {
      toast.error('Erro ao processar arquivo', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }, [file, generatePreview]);

  const handleConfirmImport = useCallback(async () => {
    if (confirmText !== CONFIRMATION_TEXT) {
      toast.error('Texto de confirmação incorreto');
      return;
    }
    
    const result = await executeImport();
    
    if (result.success) {
      onImportComplete();
      handleClose();
    }
  }, [confirmText, executeImport, onImportComplete]);

  const handleClose = useCallback(() => {
    setFile(null);
    setConfirmText('');
    setStep('upload');
    resetImport();
    onOpenChange(false);
  }, [onOpenChange, resetImport]);

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden bg-background/95 backdrop-blur-xl border-red-500/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-400">
            <Upload className="h-5 w-5" />
            Importar Alunos (Excel)
          </DialogTitle>
          <DialogDescription>
            Importação canônica não-destrutiva. Células vazias mantêm valores existentes.
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
          <div className="space-y-6 py-4">
            {/* File Input */}
            <div 
              className={`
                relative border-2 border-dashed rounded-xl p-8 text-center
                transition-all duration-300
                ${file 
                  ? 'border-emerald-500/50 bg-emerald-500/5' 
                  : 'border-red-500/30 bg-red-500/5 hover:border-red-500/50 hover:bg-red-500/10'
                }
              `}
            >
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              {file ? (
                <div className="space-y-2">
                  <FileSpreadsheet className="h-12 w-12 mx-auto text-emerald-400" />
                  <p className="text-sm font-medium text-emerald-400">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 mx-auto text-red-400/60" />
                  <p className="text-sm text-muted-foreground">
                    Arraste o arquivo ou clique para selecionar
                  </p>
                  <p className="text-xs text-red-400/60">
                    Apenas arquivos .xlsx do export canônico
                  </p>
                </div>
              )}
            </div>

            {/* Rules reminder */}
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-medium">
                <AlertTriangle className="h-4 w-4" />
                Regras da Importação Canônica
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 ml-6">
                <li>• Arquivo deve ser o export canônico da gestão</li>
                <li>• Apenas alunos existentes serão atualizados</li>
                <li>• Células vazias NÃO sobrescrevem valores existentes</li>
                <li>• Nenhum dado será deletado</li>
              </ul>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleGeneratePreview}
                disabled={!file || isPreviewing}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isPreviewing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <FileWarning className="h-4 w-4 mr-2" />
                    Gerar Preview
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* STEP 2: PREVIEW */}
        {step === 'preview' && preview && (
          <div className="space-y-4 py-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{preview.totalRows}</div>
                <div className="text-xs text-muted-foreground">Linhas no arquivo</div>
              </div>
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-center">
                <div className="text-2xl font-bold text-emerald-400">{preview.studentsMatched}</div>
                <div className="text-xs text-muted-foreground">Alunos encontrados</div>
              </div>
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-center">
                <div className="text-2xl font-bold text-amber-400">{preview.studentsUnmatched}</div>
                <div className="text-xs text-muted-foreground">Não encontrados</div>
              </div>
            </div>

            {/* Fields summary */}
            <div className="rounded-lg bg-muted/30 p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Campos a escrever:</span>
                <span className="font-medium text-emerald-400">{preview.fieldsToWrite}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Campos ignorados (vazios):</span>
                <span className="font-medium text-muted-foreground">{preview.fieldsSkipped}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Conflitos detectados:</span>
                <span className="font-medium text-amber-400">{preview.conflictsDetected}</span>
              </div>
            </div>

            {/* Matched students */}
            {preview.studentsMatched > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Alunos a serem atualizados ({preview.studentsMatched})
                </div>
                <ScrollArea className="h-32 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                  <div className="p-2 space-y-1">
                    {preview.matchedStudents.slice(0, 50).map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-xs px-2 py-1 rounded bg-background/50">
                        <span className="font-medium truncate max-w-[200px]">{s.nome || s.email}</span>
                        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                          {s.fieldsToUpdate.length} campos
                        </Badge>
                      </div>
                    ))}
                    {preview.studentsMatched > 50 && (
                      <div className="text-xs text-center text-muted-foreground py-1">
                        +{preview.studentsMatched - 50} alunos...
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Unmatched rows */}
            {preview.studentsUnmatched > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-400">
                  <AlertCircle className="h-4 w-4" />
                  Não encontrados no sistema ({preview.studentsUnmatched})
                </div>
                <ScrollArea className="h-24 rounded-lg border border-amber-500/20 bg-amber-500/5">
                  <div className="p-2 space-y-1">
                    {preview.unmatchedRows.slice(0, 20).map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-xs px-2 py-1 rounded bg-background/50">
                        <span className="text-muted-foreground">Linha {r.rowNumber}:</span>
                        <span className="truncate max-w-[200px]">{r.nome || r.email || r.student_id}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <p className="text-xs text-amber-400/80">
                  ⚠️ Estes alunos serão ignorados. Cadastre-os primeiro se necessário.
                </p>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setStep('upload')}>
                Voltar
              </Button>
              <Button
                onClick={() => setStep('confirm')}
                disabled={preview.studentsMatched === 0}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                Prosseguir para Confirmação
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* STEP 3: CONFIRM */}
        {step === 'confirm' && preview && (
          <div className="space-y-6 py-4">
            {/* Final summary */}
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 space-y-3">
              <div className="flex items-center gap-2 text-red-400 font-medium">
                <ShieldCheck className="h-5 w-5" />
                Confirmação de Importação Canônica
              </div>
              <div className="text-sm space-y-1">
                <p>Você está prestes a atualizar <strong className="text-red-400">{preview.studentsMatched}</strong> alunos.</p>
                <p className="text-muted-foreground">
                  Esta ação não pode ser desfeita automaticamente.
                </p>
              </div>
            </div>

            {/* Confirmation input */}
            <div className="space-y-3">
              <Label className="text-sm">
                Digite exatamente o texto abaixo para confirmar:
              </Label>
              <code className="block text-xs bg-muted/50 p-2 rounded font-mono text-red-400">
                {CONFIRMATION_TEXT}
              </code>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Digite o texto de confirmação"
                className="font-mono text-sm"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setStep('preview')}>
                Voltar
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={confirmText !== CONFIRMATION_TEXT || isImporting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Executar Importação
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
