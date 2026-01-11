// ============================================
// 📚 Bulk Upload Dialog - Importar até 20 PDFs
// ============================================

import { memo, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileUp, 
  X, 
  CheckCircle, 
  Loader2, 
  AlertCircle,
  Files
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// ============================================
// CONSTANTES
// ============================================

const MAX_FILES = 20;

const CATEGORIES = [
  { value: 'quimica_geral', label: '⚗️ Química Geral' },
  { value: 'quimica_organica', label: '🧪 Química Orgânica' },
  { value: 'fisico_quimica', label: '📊 Físico-Química' },
  { value: 'revisao_ciclica', label: '🔄 Revisão Cíclica' },
  { value: 'previsao_final', label: '🎯 Previsão Final' },
  { value: 'exercicios', label: '✏️ Exercícios' },
  { value: 'simulados', label: '📝 Simulados' },
  { value: 'resumos', label: '📋 Resumos' },
  { value: 'mapas_mentais', label: '🧠 Mapas Mentais' },
  { value: 'outros', label: '📚 Outros' },
];

// ============================================
// TIPOS
// ============================================

interface FileWithStatus {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  title: string;
  position: number;
}

interface BulkUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const BulkUploadDialog = memo(function BulkUploadDialog({ 
  open, 
  onClose, 
  onSuccess 
}: BulkUploadDialogProps) {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [category, setCategory] = useState('quimica_geral');
  const [isUploading, setIsUploading] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  // Dropzone para múltiplos arquivos
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: MAX_FILES,
    onDrop: (acceptedFiles) => {
      setFiles(prev => {
        const startPosition = prev.length;
        const newFiles: FileWithStatus[] = acceptedFiles.slice(0, MAX_FILES - prev.length).map((file, index) => ({
          file,
          id: crypto.randomUUID(),
          status: 'pending' as const,
          progress: 0,
          title: file.name.replace('.pdf', '').replace(/_/g, ' ').replace(/-/g, ' '),
          position: startPosition + index + 1,
        }));
        
        const combined = [...prev, ...newFiles];
        if (combined.length > MAX_FILES) {
          toast.warning(`Limite de ${MAX_FILES} arquivos atingido`);
          return combined.slice(0, MAX_FILES);
        }
        return combined;
      });
    }
  });

  // Remover arquivo da lista
  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  // Atualizar título de um arquivo
  const updateTitle = useCallback((id: string, title: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, title } : f));
  }, []);

  // Atualizar posição de um arquivo
  const updatePosition = useCallback((id: string, position: number) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, position: Math.max(0, position) } : f));
  }, []);

  // Upload de um único arquivo
  const uploadSingleFile = async (
    fileData: FileWithStatus,
    authHeaders: Record<string, string>,
    supabaseUrl: string
  ): Promise<boolean> => {
    try {
      // Atualizar status para uploading
      setFiles(prev => prev.map(f => 
        f.id === fileData.id ? { ...f, status: 'uploading' as const, progress: 10 } : f
      ));

      // FASE 1: INIT
      const initPayload = {
        phase: 'init',
        title: fileData.title.trim() || fileData.file.name.replace('.pdf', ''),
        category,
        isPublished: true,
        position: fileData.position,
        fileName: fileData.file.name,
        fileSize: fileData.file.size,
        mimeType: fileData.file.type || 'application/pdf',
      };

      const initResponse = await fetch(`${supabaseUrl}/functions/v1/genesis-book-upload`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(initPayload),
      });

      const initResult = await initResponse.json();

      if (!initResponse.ok || !initResult.success) {
        throw new Error(initResult.error || 'Erro ao iniciar upload');
      }

      const { bookId, uploadUrl } = initResult;

      setFiles(prev => prev.map(f => 
        f.id === fileData.id ? { ...f, progress: 30 } : f
      ));

      // FASE 2: UPLOAD DIRETO
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': fileData.file.type || 'application/pdf',
        },
        body: fileData.file,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Falha no upload: ${uploadResponse.status}`);
      }

      setFiles(prev => prev.map(f => 
        f.id === fileData.id ? { ...f, progress: 70 } : f
      ));

      // FASE 3: COMPLETE
      const completePayload = {
        phase: 'complete',
        bookId,
      };

      const completeResponse = await fetch(`${supabaseUrl}/functions/v1/genesis-book-upload`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(completePayload),
      });

      const completeResult = await completeResponse.json();

      if (!completeResponse.ok || !completeResult.success) {
        throw new Error(completeResult.error || 'Erro ao finalizar upload');
      }

      // Sucesso
      setFiles(prev => prev.map(f => 
        f.id === fileData.id ? { ...f, status: 'success' as const, progress: 100 } : f
      ));

      return true;
    } catch (err) {
      console.error(`[BulkUpload] Erro no arquivo ${fileData.file.name}:`, err);
      setFiles(prev => prev.map(f => 
        f.id === fileData.id ? { 
          ...f, 
          status: 'error' as const, 
          progress: 0,
          error: err instanceof Error ? err.message : 'Erro desconhecido'
        } : f
      ));
      return false;
    }
  };

  // Upload em lote
  const handleBulkUpload = async () => {
    if (files.length === 0) {
      toast.error('Selecione pelo menos um arquivo');
      return;
    }

    setIsUploading(true);
    setCompletedCount(0);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session?.access_token) {
        throw new Error('Não autenticado');
      }

      const authHeaders = {
        'Authorization': `Bearer ${sessionData.session.access_token}`,
        'Content-Type': 'application/json',
      };

      // Upload sequencial para evitar sobrecarga
      let successCount = 0;
      for (const fileData of files) {
        if (fileData.status === 'success') {
          successCount++;
          continue;
        }
        
        const success = await uploadSingleFile(fileData, authHeaders, supabaseUrl);
        if (success) {
          successCount++;
        }
        setCompletedCount(prev => prev + 1);
      }

      if (successCount === files.length) {
        toast.success(`${successCount} livros enviados para processamento!`);
        onSuccess();
        handleClose();
      } else {
        toast.warning(`${successCount} de ${files.length} livros enviados. Verifique os erros.`);
      }

    } catch (err) {
      console.error('[BulkUpload] Erro:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar livros');
    } finally {
      setIsUploading(false);
    }
  };

  // Fechar e limpar
  const handleClose = () => {
    if (!isUploading) {
      setFiles([]);
      setCategory('quimica_geral');
      setCompletedCount(0);
      onClose();
    }
  };

  // Progresso geral
  const overallProgress = files.length > 0 
    ? Math.round((completedCount / files.length) * 100) 
    : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Files className="w-5 h-5 text-primary" />
            Importar PDFs em Lote (até {MAX_FILES})
          </DialogTitle>
          <DialogDescription>
            Selecione múltiplos PDFs para converter em livros interativos
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-hidden">
          {/* Categoria Global */}
          <div>
            <Label>Categoria (aplicada a todos)</Label>
            <Select value={category} onValueChange={setCategory} disabled={isUploading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
              isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
              files.length > 0 && "py-4",
              isUploading && "pointer-events-none opacity-60"
            )}
          >
            <input {...getInputProps()} disabled={isUploading} />
            <FileUp className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isDragActive 
                ? 'Solte os arquivos aqui' 
                : `Arraste PDFs ou clique para selecionar (${files.length}/${MAX_FILES})`
              }
            </p>
          </div>

          {/* Lista de Arquivos */}
          {files.length > 0 && (
            <ScrollArea className="h-[300px] rounded-md border">
              <div className="p-3 space-y-2">
                {/* Cabeçalho */}
                <div className="flex items-center gap-3 px-3 py-1 text-xs text-muted-foreground font-medium border-b pb-2 mb-2">
                  <span className="w-14 text-center">Posição</span>
                  <span className="flex-1">Título do Livro</span>
                  <span className="w-20 text-center">Status</span>
                </div>
                <AnimatePresence mode="popLayout">
                  {files.map((fileData, index) => (
                    <motion.div
                      key={fileData.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border bg-card",
                        fileData.status === 'success' && "border-green-500/50 bg-green-500/5",
                        fileData.status === 'error' && "border-destructive/50 bg-destructive/5",
                        fileData.status === 'uploading' && "border-primary/50 bg-primary/5"
                      )}
                    >
                      {/* Posição */}
                      <div className="flex-shrink-0 w-14">
                        <input
                          type="number"
                          value={fileData.position}
                          onChange={(e) => updatePosition(fileData.id, parseInt(e.target.value) || 0)}
                          disabled={isUploading || fileData.status === 'success'}
                          className="w-full bg-muted/50 border border-border rounded px-2 py-1 text-center text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                          min={0}
                          title="Posição na categoria"
                        />
                      </div>

                      {/* Título Editável */}
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={fileData.title}
                          onChange={(e) => updateTitle(fileData.id, e.target.value)}
                          disabled={isUploading || fileData.status === 'success'}
                          className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 text-sm font-medium truncate"
                          placeholder="Título do livro"
                        />
                        <p className="text-xs text-muted-foreground truncate">
                          {fileData.file.name} ({(fileData.file.size / 1024 / 1024).toFixed(1)} MB)
                        </p>
                        {fileData.error && (
                          <p className="text-xs text-destructive mt-1">{fileData.error}</p>
                        )}
                      </div>

                      {/* Status/Progresso */}
                      <div className="flex-shrink-0 w-20">
                        {fileData.status === 'uploading' && (
                          <div className="space-y-1">
                            <Progress value={fileData.progress} className="h-1.5" />
                            <p className="text-[10px] text-muted-foreground text-center">
                              {fileData.progress}%
                            </p>
                          </div>
                        )}
                        {fileData.status === 'success' && (
                          <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                        )}
                        {fileData.status === 'error' && (
                          <AlertCircle className="w-5 h-5 text-destructive mx-auto" />
                        )}
                        {fileData.status === 'pending' && !isUploading && (
                          <span className="text-xs text-muted-foreground">Aguardando</span>
                        )}
                      </div>

                      {/* Remover */}
                      {!isUploading && fileData.status !== 'success' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 flex-shrink-0"
                          onClick={() => removeFile(fileData.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          )}

          {/* Progresso Geral */}
          {isUploading && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progresso geral</span>
                <span>{completedCount} de {files.length} arquivos</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            {isUploading ? 'Enviando...' : 'Cancelar'}
          </Button>
          <Button 
            onClick={handleBulkUpload} 
            disabled={isUploading || files.length === 0}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando {completedCount}/{files.length}...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Importar {files.length > 0 ? `${files.length} arquivo${files.length > 1 ? 's' : ''}` : 'PDFs'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
