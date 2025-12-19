// ============================================
// SISTEMA DE ANEXOS UNIVERSAL - COMPONENTE DE UPLOAD
// Drag & drop, preview, progresso, opção IA ler
// Owner: Professor Moisés Medeiros
// ============================================

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, X, FileIcon, Image, Video, Music, FileText, 
  Archive, Loader2, Brain, CheckCircle2, AlertCircle
} from 'lucide-react';
import { uploadFile, formatFileSize, getFileCategory, UPLOAD_CONFIG } from '@/lib/fileUpload';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

interface FileUploadProps {
  // Configuração do destino
  bucket?: string;
  folder?: string;
  categoria?: string;
  
  // Comportamento
  multiple?: boolean;
  maxFiles?: number;
  showIaOption?: boolean;
  showDescription?: boolean;
  showTags?: boolean;
  
  // Relacionamentos
  alunoId?: string;
  funcionarioId?: string;
  afiliadoId?: number;
  empresaId?: string;
  cursoId?: string;
  aulaId?: string;
  
  // Callbacks
  onUploadStart?: () => void;
  onUploadComplete?: (files: UploadedFile[]) => void;
  onUploadError?: (error: Error) => void;
  
  // Estilo
  className?: string;
  compact?: boolean;
}

interface UploadedFile {
  id: string;
  nome: string;
  url: string;
  path: string;
  tipo: string;
  tamanho: number;
  dataUpload: Date;
  iaLer: boolean;
}

interface FileWithPreview extends File {
  preview?: string;
  progress?: number;
  status?: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  result?: UploadedFile;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export function FileUpload({
  bucket = 'arquivos',
  folder = '',
  categoria = 'geral',
  multiple = true,
  maxFiles = 100,
  showIaOption = true,
  showDescription = false,
  showTags = false,
  alunoId,
  funcionarioId,
  afiliadoId,
  empresaId,
  cursoId,
  aulaId,
  onUploadStart,
  onUploadComplete,
  onUploadError,
  className,
  compact = false
}: FileUploadProps) {
  // Estados
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [globalProgress, setGlobalProgress] = useState(0);
  const [iaLer, setIaLer] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [tags, setTags] = useState('');
  
  const uploadedFilesRef = useRef<UploadedFile[]>([]);

  // ═══════════════════════════════════════════════════════════════
  // FUNÇÕES AUXILIARES
  // ═══════════════════════════════════════════════════════════════

  // Ícone por tipo de arquivo
  const getFileIcon = (tipo: string, iconClassName?: string) => {
    const category = getFileCategory(tipo);
    const iconClass = cn('w-6 h-6', iconClassName);
    
    switch (category) {
      case 'image': return <Image className={cn(iconClass, 'text-pink-500')} />;
      case 'video': return <Video className={cn(iconClass, 'text-purple-500')} />;
      case 'audio': return <Music className={cn(iconClass, 'text-blue-500')} />;
      case 'document': return <FileText className={cn(iconClass, 'text-green-500')} />;
      case 'archive': return <Archive className={cn(iconClass, 'text-yellow-500')} />;
      default: return <FileIcon className={cn(iconClass, 'text-muted-foreground')} />;
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // DROPZONE
  // ═══════════════════════════════════════════════════════════════

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles
      .filter(file => {
        // Verificar tamanho
        if (file.size > UPLOAD_CONFIG.maxFileSize) {
          toast.error(`${file.name} excede o limite de 2GB`);
          return false;
        }
        return true;
      })
      .map(file => {
        const fileWithPreview = file as FileWithPreview;
        fileWithPreview.status = 'pending';
        fileWithPreview.progress = 0;
        
        // Criar preview para imagens
        if (file.type.startsWith('image/')) {
          fileWithPreview.preview = URL.createObjectURL(file);
        }
        
        return fileWithPreview;
      });

    setFiles(prev => {
      const combined = [...prev, ...newFiles];
      return combined.slice(0, maxFiles);
    });
  }, [maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    maxSize: UPLOAD_CONFIG.maxFileSize,
    // Aceita TODOS os tipos de arquivo
    accept: undefined
  });

  // ═══════════════════════════════════════════════════════════════
  // GERENCIAMENTO DE ARQUIVOS
  // ═══════════════════════════════════════════════════════════════

  const removeFile = (index: number) => {
    setFiles(prev => {
      const file = prev[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearAll = () => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
    uploadedFilesRef.current = [];
  };

  // ═══════════════════════════════════════════════════════════════
  // UPLOAD
  // ═══════════════════════════════════════════════════════════════

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Selecione pelo menos um arquivo');
      return;
    }

    setUploading(true);
    setGlobalProgress(0);
    onUploadStart?.();
    uploadedFilesRef.current = [];

    const tagsArray = tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Atualizar status para uploading
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'uploading' as const } : f
        ));

        try {
          const result = await uploadFile({
            file,
            bucket,
            folder,
            categoria,
            iaLer,
            descricao: descricao || undefined,
            tags: tagsArray.length > 0 ? tagsArray : undefined,
            relacionamentos: {
              alunoId,
              funcionarioId,
              afiliadoId,
              empresaId,
              cursoId,
              aulaId
            },
            onProgress: (progress) => {
              setFiles(prev => prev.map((f, idx) => 
                idx === i ? { ...f, progress } : f
              ));
              
              // Calcular progresso global
              const baseProgress = (i / files.length) * 100;
              const fileProgress = (progress / 100) * (100 / files.length);
              setGlobalProgress(Math.round(baseProgress + fileProgress));
            }
          });

          // Atualizar status para success
          setFiles(prev => prev.map((f, idx) => 
            idx === i ? { ...f, status: 'success' as const, result } : f
          ));

          uploadedFilesRef.current.push(result);

        } catch (error: any) {
          console.error(`Erro no upload de ${file.name}:`, error);
          
          // Atualizar status para error
          setFiles(prev => prev.map((f, idx) => 
            idx === i ? { ...f, status: 'error' as const, error: error.message } : f
          ));
        }
      }

      // Finalizar
      setGlobalProgress(100);
      
      const successCount = uploadedFilesRef.current.length;
      const errorCount = files.length - successCount;

      if (successCount > 0) {
        toast.success(`${successCount} arquivo(s) enviado(s) com sucesso!`);
        onUploadComplete?.(uploadedFilesRef.current);
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} arquivo(s) falharam no upload`);
      }

      // Limpar arquivos com sucesso após 2 segundos
      setTimeout(() => {
        setFiles(prev => prev.filter(f => f.status !== 'success'));
      }, 2000);

    } catch (error: any) {
      console.error('Erro geral no upload:', error);
      toast.error(`Erro no upload: ${error.message}`);
      onUploadError?.(error);
    } finally {
      setUploading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className={cn('space-y-4', className)}>
      {/* Opção IA Ler */}
      {showIaOption && (
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-lg border border-pink-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-500/20 rounded-lg">
              <Brain className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <Label htmlFor="ia-ler" className="cursor-pointer font-medium">
                IA deve ler este arquivo?
              </Label>
              <p className="text-xs text-muted-foreground">
                O TRAMON v8 poderá processar e extrair informações
              </p>
            </div>
          </div>
          <Switch
            id="ia-ler"
            checked={iaLer}
            onCheckedChange={setIaLer}
          />
        </div>
      )}

      {/* Descrição */}
      {showDescription && (
        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição (opcional)</Label>
          <Textarea
            id="descricao"
            placeholder="Descreva o conteúdo do(s) arquivo(s)..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={2}
          />
        </div>
      )}

      {/* Tags */}
      {showTags && (
        <div className="space-y-2">
          <Label htmlFor="tags">Tags (opcional)</Label>
          <Input
            id="tags"
            placeholder="Separe as tags por vírgula: contrato, 2024, importante"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
      )}

      {/* Área de Drop */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer',
          'hover:border-pink-500/50 hover:bg-pink-500/5',
          isDragActive && 'border-pink-500 bg-pink-500/10 scale-[1.02]',
          compact ? 'p-4' : 'p-8',
          uploading && 'pointer-events-none opacity-50'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center text-center">
          <div className={cn(
            'rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 mb-4',
            compact ? 'p-3' : 'p-4'
          )}>
            <Upload className={cn(
              'text-pink-500',
              compact ? 'w-6 h-6' : 'w-10 h-10'
            )} />
          </div>
          
          {isDragActive ? (
            <p className="text-pink-500 font-semibold text-lg">
              Solte os arquivos aqui!
            </p>
          ) : (
            <>
              <p className={cn('font-semibold', compact ? 'text-sm' : 'text-lg')}>
                Arraste arquivos ou clique para selecionar
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Aceita <span className="text-pink-500 font-medium">QUALQUER</span> tipo de arquivo até <span className="text-pink-500 font-medium">2GB</span>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Lista de arquivos */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {files.length} arquivo(s) selecionado(s)
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              disabled={uploading}
            >
              Limpar tudo
            </Button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                  file.status === 'success' && 'bg-green-500/10 border-green-500/30',
                  file.status === 'error' && 'bg-red-500/10 border-red-500/30',
                  file.status === 'uploading' && 'bg-pink-500/10 border-pink-500/30',
                  (!file.status || file.status === 'pending') && 'bg-muted/50'
                )}
              >
                {/* Preview ou ícone */}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                  {file.preview ? (
                    <img 
                      src={file.preview} 
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getFileIcon(file.type, 'w-6 h-6')
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                  
                  {/* Barra de progresso individual */}
                  {file.status === 'uploading' && (
                    <Progress value={file.progress} className="h-1 mt-2" />
                  )}
                  
                  {/* Erro */}
                  {file.status === 'error' && file.error && (
                    <p className="text-xs text-red-500 mt-1">{file.error}</p>
                  )}
                </div>

                {/* Status/Ações */}
                <div className="flex items-center gap-2">
                  {file.status === 'success' && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  {file.status === 'uploading' && (
                    <Loader2 className="w-5 h-5 text-pink-500 animate-spin" />
                  )}
                  {(!file.status || file.status === 'pending') && (
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-destructive/20 rounded transition-colors"
                      disabled={uploading}
                    >
                      <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barra de progresso global */}
      {uploading && (
        <div className="space-y-2">
          <Progress value={globalProgress} className="h-2" />
          <p className="text-sm text-center text-muted-foreground">
            Enviando arquivos... {globalProgress}%
          </p>
        </div>
      )}

      {/* Botão de upload */}
      {files.length > 0 && files.some(f => f.status !== 'success') && (
        <Button
          onClick={handleUpload}
          disabled={uploading || files.every(f => f.status === 'success')}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
          size="lg"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-2" />
              Enviar {files.filter(f => f.status !== 'success').length} arquivo(s)
            </>
          )}
        </Button>
      )}
    </div>
  );
}

export default FileUpload;
