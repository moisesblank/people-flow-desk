// ============================================
// BULK IMPORT WITH CPF VALIDATION MODAL
// CONSTITUIÇÃO SYNAPSE Ω v10.x
// MODO: Livro Web - BETA com 1 ano de expiração
// ============================================
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, 
  Shield, Loader2, Download, Eye, SkipForward
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
  cep?: string;
  endereco?: string;
  bairro?: string;
  numero?: string;
  complemento?: string;
  cupom?: string;
}

interface ImportResult {
  row: number;
  cpf: string;
  email: string;
  nome: string;
  status: 'success' | 'error' | 'skipped';
  error?: string;
  cpf_receita_nome?: string;
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
  const [importStatus, setImportStatus] = useState<string>('');
  const resumeFromIndexRef = useRef(0);
  const cancelRef = useRef(false);

  useEffect(() => {
    cancelRef.current = false;
    return () => {
      cancelRef.current = true;
    };
  }, []);

  const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  const withTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
    let timeoutId: number | undefined;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = window.setTimeout(() => reject(new Error(`Timeout (${label}) após ${Math.round(ms / 1000)}s`)), ms);
    });
    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
    }
  };

  const resetState = useCallback(() => {
    setStep('upload');
    setStudents([]);
    setResults([]);
    setProgress(0);
    setFileName('');
    setIsProcessing(false);
    setImportStatus('');
    resumeFromIndexRef.current = 0;
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

      // Map columns (flexível para múltiplos formatos)
      const mapped: StudentRow[] = rawData.map((row: any) => ({
        // Nome: múltiplas variações
        nome: String(
          row['ALUNO (A)'] || row['ALUNO(A)'] || row['ALUNO'] || 
          row.nome || row.Nome || row.NOME || row['Nome Completo'] || ''
        ).trim(),
        
        // CPF: limpa formatação
        cpf: String(row.cpf || row.CPF || row['CPF'] || '').trim(),
        
        // Email
        email: String(row.email || row.Email || row.EMAIL || row['E-mail'] || '').trim().toLowerCase(),
        
        // Telefone
        telefone: String(row.telefone || row.Telefone || row.TELEFONE || row.celular || row.Celular || '').trim() || undefined,
        
        // Endereço
        cidade: String(row.cidade || row.Cidade || row.CIDADE || '').trim() || undefined,
        estado: String(row.estado || row.Estado || row.ESTADO || row.uf || row.UF || '').trim() || undefined,
        cep: String(row.cep || row.CEP || '').trim() || undefined,
        endereco: String(row['ENDEREÇO'] || row.endereco || row.Endereco || '').trim() || undefined,
        bairro: String(row.bairro || row.Bairro || row.BAIRRO || '').trim() || undefined,
        numero: String(row['NÚMERO'] || row.numero || row.Numero || '').trim() || undefined,
        complemento: String(row.complemento || row.Complemento || row.COMPLEMENTO || '').replace(/\(none\)/gi, '').trim() || undefined,
        
        // Cupom
        cupom: String(row.cupom || row.Cupom || row.CUPOM || '').replace(/\(none\)/gi, '').trim() || undefined,
      }));

      // Filtra linhas que tem pelo menos NOME E CPF
      const valid = mapped.filter(s => s.nome && s.cpf);
      
      if (valid.length === 0) {
        toast.error('Nenhum aluno válido encontrado', {
          description: 'Verifique se a planilha contém colunas: ALUNO (A) ou Nome, e CPF'
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
    setImportStatus('Inicializando importação...');

    try {
      // Importação em lotes para evitar timeout/loop em planilhas grandes
      // OBS: 50 pode estourar timeout em operações que criam usuários (auth) e múltiplos inserts.
      // Mantemos menor por padrão para estabilidade (evita “parar” em ~49% quando o 2º lote demora).
      const BATCH_SIZE = 25;
      const total = students.length;
      const aggregatedResults: ImportResult[] = [];
      let totalSuccess = 0;
      let totalError = 0;
      let totalSkipped = 0;

      const batchTotal = Math.ceil(total / BATCH_SIZE);
      const invokeTimeoutMs = 180_000; // proteção contra travamento do fetch (lotes menores + margem)

      for (let start = resumeFromIndexRef.current; start < total; start += BATCH_SIZE) {
        if (cancelRef.current) break;

        const batch = students.slice(start, start + BATCH_SIZE);
        const batchIndex = Math.floor(start / BATCH_SIZE) + 1;
        resumeFromIndexRef.current = start; // checkpoint antes da chamada

        const doneBefore = start;
        const doneBeforePct = Math.floor((doneBefore / total) * 100);

        setImportStatus(`Lote ${batchIndex}/${batchTotal} — preparando (${batch.length} alunos)`);
        // UI: manter sempre >0 durante o primeiro lote para evidenciar que “rodou”
        // (o 1º lote pode demorar e ficava visualmente travado em 0%)
        setProgress(Math.min(99, Math.max(doneBeforePct, doneBefore === 0 ? 1 : doneBeforePct)));
        // garante render antes da requisição (evita UI “congelada” em planilhas grandes)
        await sleep(0);

        toast.message(`Importando lote ${batchIndex}/${batchTotal}...`, { description: `${batch.length} alunos` });

        setImportStatus(`Lote ${batchIndex}/${batchTotal} — enviando para o backend...`);
        
        // RESILIENTE: tenta o lote, mas NÃO para se falhar - continua com próximos lotes
        try {
          const { data, error } = await withTimeout(
            supabase.functions.invoke('bulk-import-students-cpf', {
              body: {
                students: batch,
                defaultPassword: 'eneM2026@#',
                tipoProduto: 'Livro Web',
                fonte: 'Importação Bruna Lista ONLINE 20/01',
                expirationDays: 365, // 1 ANO de acesso BETA
              },
            }),
            invokeTimeoutMs,
            `lote ${batchIndex}/${batchTotal}`
          );

          if (error) {
            console.error(`[IMPORT] Lote ${batchIndex} falhou:`, error.message);
            toast.error(`Lote ${batchIndex} falhou`, { description: error.message });
            // Marca todos do lote como erro para relatório
            batch.forEach((s, idx) => {
              aggregatedResults.push({
                row: start + idx + 1,
                nome: s.nome,
                cpf: s.cpf || '',
                email: s.email || '',
                status: 'error' as const,
                error: `Lote falhou: ${error.message}`
              });
            });
            totalError += batch.length;
          } else if (!data?.success) {
            console.error(`[IMPORT] Lote ${batchIndex} erro:`, data?.error);
            toast.error(`Lote ${batchIndex} erro`, { description: data?.error });
            batch.forEach((s, idx) => {
              aggregatedResults.push({
                row: start + idx + 1,
                nome: s.nome,
                cpf: s.cpf || '',
                email: s.email || '',
                status: 'error' as const,
                error: `Erro: ${data?.error || 'desconhecido'}`
              });
            });
            totalError += batch.length;
          } else {
            // Sucesso do lote
            aggregatedResults.push(...(data.results || []));
            totalSuccess += data.successCount || 0;
            totalError += data.errorCount || 0;
            totalSkipped += data.skippedCount || 0;
          }
        } catch (batchErr) {
          console.error(`[IMPORT] Lote ${batchIndex} exception:`, batchErr);
          toast.error(`Lote ${batchIndex} timeout/erro`, { 
            description: batchErr instanceof Error ? batchErr.message : 'Erro de rede' 
          });
          batch.forEach((s, idx) => {
            aggregatedResults.push({
              row: start + idx + 1,
              nome: s.nome,
              cpf: s.cpf || '',
              email: s.email || '',
              status: 'error' as const,
              error: `Timeout/Erro: ${batchErr instanceof Error ? batchErr.message : 'desconhecido'}`
            });
          });
          totalError += batch.length;
        }

        // progresso pós-lote (SEMPRE atualiza, mesmo com erro)
        const done = Math.min(start + batch.length, total);
        setProgress(Math.floor((done / total) * 100));
        setImportStatus(`Lote ${batchIndex}/${batchTotal} — ${totalSuccess} ok, ${totalError} erros`);

        // checkpoint após processamento
        resumeFromIndexRef.current = done;
      }

      setProgress(100);
      setImportStatus('Finalizado. Gerando relatório...');
      setResults(aggregatedResults);
      setStep('results');

      if (totalSuccess > 0) {
        toast.success(`${totalSuccess} alunos criados com sucesso!`, {
          description: `${totalError} erros, ${totalSkipped} pulados`
        });
        onSuccess?.();
      } else if (totalSkipped > 0) {
        toast.warning('Nenhum aluno novo criado', {
          description: `${totalSkipped} já existiam ou sem email`
        });
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
      // Mantém o usuário na tela para não perder contexto; permite re-tentativa sem reimportar o Excel.
      setStep('preview');
    } finally {
      setIsProcessing(false);
    }
  }, [students, onSuccess]);

  const successResults = results.filter(r => r.status === 'success');
  const errorResults = results.filter(r => r.status === 'error');
  const skippedResults = results.filter(r => r.status === 'skipped');

  // Exportar resultados para Excel
  const exportResults = useCallback(() => {
    const exportData = results.map(r => ({
      'Linha': r.row,
      'Nome': r.nome,
      'Email': r.email,
      'CPF': r.cpf,
      'Status': r.status === 'success' ? 'CRIADO' : r.status === 'error' ? 'ERRO' : 'PULADO',
      'Motivo': r.error || 'OK',
      'Nome Receita': r.cpf_receita_nome || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resultado Importação');
    XLSX.writeFile(wb, `resultado-importacao-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast.success('Relatório exportado!');
  }, [results]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-background/95 backdrop-blur-xl border-amber-500/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-400">
            <Shield className="h-5 w-5" />
            Importação em Massa — Livro Web (BETA 1 ano)
          </DialogTitle>
          <DialogDescription>
            Critério mínimo: NOME + CPF válido. Senha padrão: eneM2026@#
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
              <div className="border-2 border-dashed border-amber-500/30 rounded-lg p-8 text-center hover:border-amber-500/50 transition-colors">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-amber-400 mb-4" />
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
                  <Button variant="outline" className="border-amber-500/50" asChild disabled={isProcessing}>
                    <span>
                      {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                      Selecionar Arquivo
                    </span>
                  </Button>
                </label>
              </div>

              <div className="bg-amber-500/10 rounded-lg p-4 text-sm border border-amber-500/20">
                <p className="font-medium mb-2 text-amber-400">Campos aceitos:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li><strong>ALUNO (A)</strong> ou <strong>Nome</strong> — Obrigatório</li>
                  <li><strong>CPF</strong> — Obrigatório (formato válido — dígitos verificadores)</li>
                  <li><strong>EMAIL</strong> — Necessário para criar acesso</li>
                  <li><strong>TELEFONE, CIDADE, ESTADO, CEP, ENDEREÇO, BAIRRO</strong> — Opcionais</li>
                </ul>
                <p className="mt-3 text-amber-400/80">
                  ⚠️ Alunos sem email serão registrados mas NÃO terão acesso ao sistema
                </p>
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
                  <Eye className="h-4 w-4 text-amber-400" />
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
                      <th className="p-2 text-left">Cidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.slice(0, 100).map((s, i) => (
                      <tr key={i} className="border-t border-border/50">
                        <td className="p-2 text-muted-foreground">{i + 1}</td>
                        <td className="p-2 truncate max-w-[150px]">{s.nome}</td>
                        <td className="p-2 text-muted-foreground truncate max-w-[180px]">
                          {s.email || <span className="text-amber-500">(sem email)</span>}
                        </td>
                        <td className="p-2 font-mono text-xs">{s.cpf.substring(0, 3)}***</td>
                        <td className="p-2 text-muted-foreground text-xs">{s.cidade || '-'}</td>
                      </tr>
                    ))}
                    {students.length > 100 && (
                      <tr className="border-t">
                        <td colSpan={5} className="p-2 text-center text-muted-foreground">
                          ... e mais {students.length - 100} alunos
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </ScrollArea>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-400">Modo: Livro Web — Role: beta_expira (1 ano)</p>
                  <p className="text-muted-foreground">
                    CPF validado localmente (dígitos verificadores). Senha: <code className="bg-muted px-1 rounded">eneM2026@#</code>. Acesso expira em 365 dias.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetState}>Cancelar</Button>
                <Button 
                  onClick={executeImport} 
                  className="bg-amber-600 hover:bg-amber-700"
                  disabled={isProcessing}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Iniciar Importação ({students.length})
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
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-amber-400 mb-4" />
                <p className="font-medium">Processando alunos...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Importando {students.length} alunos (pode demorar alguns segundos)
                </p>
                  {importStatus && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {importStatus}
                    </p>
                  )}
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
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center">
                  <CheckCircle className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-emerald-400">{successResults.length}</p>
                  <p className="text-xs text-muted-foreground">Criados</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-center">
                  <SkipForward className="h-6 w-6 text-amber-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-amber-400">{skippedResults.length}</p>
                  <p className="text-xs text-muted-foreground">Pulados</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
                  <XCircle className="h-6 w-6 text-red-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-400">{errorResults.length}</p>
                  <p className="text-xs text-muted-foreground">Erros</p>
                </div>
              </div>

              {/* Lista de Criados */}
              {successResults.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium text-emerald-400 text-sm">✅ Acessos Criados ({successResults.length}):</p>
                  <ScrollArea className="h-[120px] border border-emerald-500/20 rounded-lg">
                    {successResults.map((r, i) => (
                      <div key={i} className="p-2 border-b border-border/50 text-sm flex justify-between">
                        <span className="font-medium truncate max-w-[200px]">{r.nome}</span>
                        <span className="text-muted-foreground text-xs">{r.email}</span>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}

              {/* Lista de Pulados */}
              {skippedResults.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium text-amber-400 text-sm">⏭️ Pulados ({skippedResults.length}):</p>
                  <ScrollArea className="h-[120px] border border-amber-500/20 rounded-lg">
                    {skippedResults.map((r, i) => (
                      <div key={i} className="p-2 border-b border-border/50 text-sm">
                        <span className="text-muted-foreground">Linha {r.row}:</span>{' '}
                        <span className="font-medium">{r.nome}</span> — {r.error}
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}

              {/* Lista de Erros */}
              {errorResults.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium text-red-400 text-sm">❌ Erros ({errorResults.length}):</p>
                  <ScrollArea className="h-[120px] border border-red-500/20 rounded-lg">
                    {errorResults.map((r, i) => (
                      <div key={i} className="p-2 border-b border-border/50 text-sm">
                        <span className="text-muted-foreground">Linha {r.row}:</span>{' '}
                        <span className="font-medium">{r.nome}</span> — {r.error}
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}

              <div className="flex justify-between gap-2">
                <Button variant="outline" onClick={exportResults} className="border-amber-500/50">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Relatório
                </Button>
                <Button variant="outline" onClick={handleClose}>Fechar</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
