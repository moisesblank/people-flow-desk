import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useFileUpload } from '@/hooks/useFileUpload';
import { toast } from 'sonner';
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  X, 
  Check,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadedFile {
  name: string;
  url: string;
  path: string;
  size: number;
  type: string;
}

interface FileUploaderProps {
  folder?: string;
  maxSize?: number;
  allowedTypes?: string[];
  multiple?: boolean;
  onUpload?: (files: UploadedFile[]) => void;
  onRemove?: (path: string) => void;
  className?: string;
}

export function FileUploader({
  folder = '',
  maxSize = 2048, // 2GB em MB
  allowedTypes = [], // Vazio = aceita QUALQUER tipo
  multiple = true,
  onUpload,
  onRemove,
  className = ''
}: FileUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadFile, uploadMultiple, deleteFile, uploading, progress } = useFileUpload({
    folder,
    maxSize,
    allowedTypes
  });

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const results = multiple 
      ? await uploadMultiple(files)
      : [await uploadFile(files[0])].filter(Boolean) as UploadedFile[];

    if (results.length > 0) {
      setUploadedFiles(prev => [...prev, ...results]);
      onUpload?.(results);
      toast.success(`${results.length} arquivo(s) enviado(s) com sucesso!`);
    }
  };

  const handleRemoveFile = async (file: UploadedFile) => {
    const success = await deleteFile(file.path);
    if (success) {
      setUploadedFiles(prev => prev.filter(f => f.path !== file.path));
      onRemove?.(file.path);
      toast.success('Arquivo removido');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type === 'application/pdf') return <FileText className="h-4 w-4 text-red-500" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Exibe "TODOS" se allowedTypes estiver vazio
  const acceptedTypesDisplay = allowedTypes.length === 0 
    ? 'QUALQUER tipo de arquivo' 
    : allowedTypes.map(type => {
        if (type === 'application/pdf') return 'PDF';
        if (type.startsWith('image/')) return type.replace('image/', '').toUpperCase();
        return type;
      }).join(', ');

  return (
    <div className={className}>
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
          }
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={allowedTypes.length > 0 ? allowedTypes.join(',') : '*/*'}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        {uploading ? (
          <div className="space-y-3">
            <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Enviando arquivos...</p>
            <Progress value={progress} className="w-48 mx-auto" />
          </div>
        ) : (
          <>
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium">
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Formatos: <span className="text-primary font-medium">{acceptedTypesDisplay}</span> • Máximo: <span className="text-primary font-medium">2GB</span>
            </p>
          </>
        )}
      </div>

      {/* Uploaded Files List */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            <p className="text-sm font-medium text-muted-foreground">
              Arquivos enviados ({uploadedFiles.length})
            </p>
            
            {uploadedFiles.map((file, index) => (
              <motion.div
                key={file.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 bg-muted rounded-lg"
              >
              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                {file.type.startsWith('image/') ? (
                  <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                ) : (
                  getFileIcon(file.type)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(file);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
