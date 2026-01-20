// ============================================
// BULK IMPORT WITH CPF VALIDATION MODAL
// CONSTITUIÇÃO SYNAPSE Ω v10.x
// ============================================
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, 
  Shield, Loader2, Download, Eye 
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface StudentRow {
  cpf: string;
  email: string;
  nome: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
}

interface ImportResult {
  row: number;
  cpf: string;
  email: string;
  nome: string;
  status: 'success' | 'error';
  error?: string;
}

interface BulkImportCPFModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BulkImportCPFModal({ open, onOpenChange, onSuccess }: BulkImportCPFModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'results'>('upload');
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');

  const resetState = useCallback(() => {
    setStep('upload');
    setStudents([]);
    setResults([]);
    setProgress(0);
    setFileName('');
    setIsProcessing(false);
  }, []);

  const handleClose = useCallback(() => {
    if (!isProcessing) {
      resetState();
      onOpenChange(false);
    }
  }, [isProcessing, resetState, onOpenChange]);

  const parseExcel = useCallback(async (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      // Map columns (flexible naming)
      const mapped: StudentRow[] = rawData.map((row: any) => ({
        cpf: String(row.cpf || row.CPF || row['CPF'] || '').trim(),
        email: String(row.email || row.Email || row.EMAIL || row['E-mail'] || '').trim().toLowerCase(),
        nome: String(row.nome || row.Nome || row.NOME || row['Nome Completo'] || '').trim(),
        telefone: String(row.telefone || row.Telefone || row.TELEFONE || row.celular || row.Celular || '').trim() || undefined,
        cidade: String(row.cidade || row.Cidade || row.CIDADE || '').trim() || undefined,
        estado: String(row.estado || row.Estado || row.ESTADO || row.uf || row.UF || '').trim() || undefined,
      }));

      // Filter valid rows (must have CPF, email, nome)
      const valid = mapped.filter(s => s.cpf && s.email && s.nome);
      
      if (valid.length === 0) {
        toast.error('Nenhum aluno válido encontrado', {
          description: 'Verifique se a planilha contém colunas: CPF, Email, Nome'
        });
        setIsProcessing(false);
        return;
      }

      setStudents(valid);
      setStep('preview');
      toast.success(`${valid.length} alunos encontrados`, {
        description: `Arquivo: ${file.name}`
      });
    } catch (err) {
      console.error('Parse error:', err);
      toast.error('Erro ao ler planilha', {
        description: 'Verifique se o arquivo é um Excel válido (.xlsx)'
      });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseExcel(file);
    }
  }, [parseExcel]);

  const executeImport = useCallback(async () => {
    if (students.length === 0) return;

    setStep('importing');
    setIsProcessing(true);
    setProgress(0);

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 2, 90));
      }, 500);

      const { data, error } = await supabase.functions.invoke('bulk-import-students-cpf', {
        body: { students, defaultPassword: 'eneM2026@#' }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro desconhecido');
      }

      setResults(data.results || []);
      setStep('results');

      const successCount = data.successCount || 0;
      const errorCount = data.errorCount || 0;

      if (successCount > 0) {
        toast.success(`${successCount} alunos criados com sucesso!`, {
          description: errorCount > 0 ? `${errorCount} rejeitados por CPF inválido` : 'Todos com CPF validado na Receita Federal'
        });
        onSuccess?.();
      } else {
        toast.error('Nenhum aluno foi importado', {
          description: 'Verifique os erros no relatório'
        });
      }
    } catch (err) {
      console.error('Import error:', err);
      toast.error('Erro na importação', {
        description: err instanceof Error ? err.message : 'Erro desconhecido'
      });
      setStep('preview');
    } finally {
      setIsProcessing(false);
    }
  }, [students, onSuccess]);

  const successResults = results.filter(r => r.status === 'success');
  const errorResults = results.filter(r => r.status === 'error');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden bg-background/95 backdrop-blur-xl border-emerald-500/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-400">
            <Shield className="h-5 w-5" />
            Importação em Massa com Validação CPF
          </DialogTitle>
          <DialogDescription>
            Todos os CPFs serão validados na Receita Federal antes da criação
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="border-2 border-dashed border-emerald-500/30 rounded-lg p-8 text-center hover:border-emerald-500/50 transition-colors">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-emerald-400 mb-4" />
                <p className="text-muted-foreground mb-4">
                  Arraste uma planilha Excel ou clique para selecionar
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="bulk-import-file"
                  disabled={isProcessing}
                />
                <label htmlFor="bulk-import-file">
                  <Button variant="outline" className="border-emerald-500/50" asChild disabled={isProcessing}>
                    <span>
                      {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                      Selecionar Arquivo
                    </span>
                  </Button>
                </label>
              </div>

              <div className="bg-muted/30 rounded-lg p-4 text-sm">
                <p className="font-medium mb-2">Colunas obrigatórias:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li><strong>CPF</strong> - Será validado na Receita Federal</li>
                  <li><strong>Email</strong> - Email único do aluno</li>
                  <li><strong>Nome</strong> - Nome completo</li>
                </ul>
                <p className="mt-2 text-muted-foreground">Opcionais: Telefone, Cidade, Estado</p>
              </div>
            </motion.div>
          )}

          {/* STEP 2: PREVIEW */}
          {step === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-emerald-400" />
                  <span className="font-medium">Prévia: {students.length} alunos</span>
                </div>
                <Badge variant="outline" className="border-amber-500/50 text-amber-400">
                  {fileName}
                </Badge>
              </div>

              <ScrollArea className="h-[300px] border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="p-2 text-left">#</th>
                      <th className="p-2 text-left">Nome</th>
                      <th className="p-2 text-left">Email</th>
                      <th className="p-2 text-left">CPF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.slice(0, 50).map((s, i) => (
                      <tr key={i} className="border-t border-border/50">
                        <td className="p-2 text-muted-foreground">{i + 1}</td>
                        <td className="p-2">{s.nome}</td>
                        <td className="p-2 text-muted-foreground">{s.email}</td>
                        <td className="p-2 font-mono text-xs">{s.cpf.substring(0, 3)}***</td>
                      </tr>
                    ))}
                    {students.length > 50 && (
                      <tr className="border-t">
                        <td colSpan={4} className="p-2 text-center text-muted-foreground">
                          ... e mais {students.length - 50} alunos
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </ScrollArea>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-400">Atenção</p>
                  <p className="text-muted-foreground">
                    Cada CPF será validado na Receita Federal. Alunos com CPF inválido serão rejeitados.
                    Senha padrão: <code className="bg-muted px-1 rounded">eneM2026@#</code>
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetState}>Cancelar</Button>
                <Button 
                  onClick={executeImport} 
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={isProcessing}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Importar com Validação CPF
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: IMPORTING */}
          {step === 'importing' && (
            <motion.div
              key="importing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 py-8"
            >
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-emerald-400 mb-4" />
                <p className="font-medium">Validando CPFs na Receita Federal...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Processando {students.length} alunos
                </p>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-center text-sm text-muted-foreground">
                {progress}% concluído
              </p>
            </motion.div>
          )}

          {/* STEP 4: RESULTS */}
          {step === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center">
                  <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-emerald-400">{successResults.length}</p>
                  <p className="text-sm text-muted-foreground">Criados com sucesso</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
                  <XCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-400">{errorResults.length}</p>
                  <p className="text-sm text-muted-foreground">Rejeitados</p>
                </div>
              </div>

              {errorResults.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium text-red-400">Erros encontrados:</p>
                  <ScrollArea className="h-[200px] border border-red-500/20 rounded-lg">
                    {errorResults.map((r, i) => (
                      <div key={i} className="p-2 border-b border-border/50 text-sm">
                        <span className="text-muted-foreground">Linha {r.row}:</span>{' '}
                        <span className="font-medium">{r.nome}</span> - {r.error}
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>Fechar</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
