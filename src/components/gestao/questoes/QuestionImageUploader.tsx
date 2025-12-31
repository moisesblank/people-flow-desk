// ============================================
// 📷 QUESTION IMAGE UPLOADER - Sistema Completo
// Upload de imagens para questões com preview,
// compressão, drag & drop e fallback elegante
// ============================================

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ImagePlus, 
  X, 
  Loader2, 
  ZoomIn, 
  Trash2, 
  Upload,
  ImageOff,
  GripVertical,
  Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { compressImage } from '@/lib/imageCompression';

// ============================================
// TIPOS
// ============================================

export interface QuestionImage {
  id: string;
  url: string;
  path: string;
  name: string;
  size: number;
  position: number;
}

interface QuestionImageUploaderProps {
  images: QuestionImage[];
  onChange: (images: QuestionImage[]) => void;
  maxImages?: number;
  label?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
  bucket?: string;
  folder?: string;
}

interface SingleImageUploaderProps {
  image: QuestionImage | null;
  onChange: (image: QuestionImage | null) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
  compact?: boolean;
  bucket?: string;
  folder?: string;
}

// ============================================
// CONSTANTES
// ============================================

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const BUCKET = 'materiais';
const FOLDER = 'questoes';

// ============================================
// COMPONENTE: PREVIEW DE IMAGEM COM FALLBACK
// ============================================

interface ImagePreviewProps {
  src: string;
  alt: string;
  className?: string;
  onError?: () => void;
  onClick?: () => void;
}

const ImagePreview = ({ src, alt, className, onError, onClick }: ImagePreviewProps) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (hasError) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted/50 rounded-lg border border-dashed border-muted-foreground/30",
          className
        )}
      >
        <div className="text-center p-4">
          <ImageOff className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <span className="text-xs text-muted-foreground">Imagem indisponível</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        onError={handleError}
        onLoad={handleLoad}
        onClick={onClick}
        className={cn(
          "w-full h-full object-cover rounded-lg transition-opacity",
          isLoading ? "opacity-0" : "opacity-100",
          onClick && "cursor-zoom-in hover:brightness-110"
        )}
      />
    </div>
  );
};

// ============================================
// COMPONENTE: LIGHTBOX PARA VISUALIZAÇÃO
// ============================================

interface LightboxProps {
  open: boolean;
  onClose: () => void;
  image: QuestionImage | null;
}

const Lightbox = ({ open, onClose, image }: LightboxProps) => {
  if (!image) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 bg-black/95">
        <DialogTitle className="sr-only">Visualizar imagem</DialogTitle>
        <DialogDescription className="sr-only">
          {image.name}
        </DialogDescription>
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={image.url}
            alt={image.name}
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-4 py-2 rounded-full">
            <span className="text-sm text-white">{image.name}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ============================================
// COMPONENTE: UPLOAD MÚLTIPLAS IMAGENS (ENUNCIADO)
// ============================================

export function QuestionImageUploader({
  images,
  onChange,
  maxImages = 5,
  label = "Imagens do Enunciado",
  description = "Arraste ou clique para adicionar imagens à questão",
  className,
  disabled = false,
  bucket = BUCKET,
  folder = FOLDER,
}: QuestionImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<QuestionImage | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Validar quantidade
    if (images.length + fileArray.length > maxImages) {
      toast.error(`Máximo de ${maxImages} imagens permitidas`);
      return;
    }

    // Validar arquivos
    const validFiles = fileArray.filter(file => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: Tipo não permitido`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: Arquivo muito grande (máx 10MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    const newImages: QuestionImage[] = [];

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        setUploadProgress(Math.round((i / validFiles.length) * 100));

        // Comprimir imagem
        let fileToUpload = file;
        try {
          fileToUpload = await compressImage(file, {
            quality: 0.85,
            maxWidth: 1920,
            maxHeight: 1080,
            format: 'webp'
          });
        } catch (err) {
          console.warn('Compressão falhou, usando original:', err);
        }

        // Gerar nome único
        const ext = fileToUpload.name.split('.').pop() || 'webp';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const filePath = `${folder}/${fileName}`;

        // Upload
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, fileToUpload, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        // Gerar URL assinada
        const { data: urlData } = await supabase.storage
          .from(bucket)
          .createSignedUrl(data.path, 3600 * 24 * 7); // 7 dias

        if (!urlData?.signedUrl) throw new Error('Falha ao gerar URL');

        newImages.push({
          id: crypto.randomUUID(),
          url: urlData.signedUrl,
          path: data.path,
          name: file.name,
          size: fileToUpload.size,
          position: images.length + newImages.length
        });
      }

      onChange([...images, ...newImages]);
      toast.success(`${newImages.length} imagem(ns) adicionada(s)`);
    } catch (err) {
      console.error('Erro no upload:', err);
      toast.error('Erro ao fazer upload das imagens');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [images, maxImages, onChange, bucket, folder]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isUploading) return;
    handleFileSelect(e.dataTransfer.files);
  }, [disabled, isUploading, handleFileSelect]);

  const handleRemove = useCallback(async (imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (!image) return;

    try {
      // Deletar do storage
      const { error } = await supabase.storage
        .from(bucket)
        .remove([image.path]);

      if (error) console.warn('Erro ao deletar do storage:', error);

      // Remover do estado
      const updated = images.filter(img => img.id !== imageId);
      onChange(updated.map((img, idx) => ({ ...img, position: idx })));
      toast.success('Imagem removida');
    } catch (err) {
      console.error('Erro ao remover:', err);
      toast.error('Erro ao remover imagem');
    }
  }, [images, onChange, bucket]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-muted-foreground ml-2">
            ({images.length}/{maxImages})
          </span>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && !isUploading && inputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer",
          "flex flex-col items-center justify-center gap-2",
          isDragOver 
            ? "border-primary bg-primary/10" 
            : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50",
          (disabled || isUploading) && "opacity-50 cursor-not-allowed",
          images.length >= maxImages && "hidden"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          multiple
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              Enviando... {uploadProgress}%
            </span>
          </>
        ) : (
          <>
            <div className="p-3 rounded-full bg-primary/10">
              <ImagePlus className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center">
              <span className="text-sm font-medium">
                Clique ou arraste imagens
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WebP, GIF • Máx 10MB cada
              </p>
            </div>
          </>
        )}
      </div>

      {/* Grid de Imagens */}
      <AnimatePresence mode="popLayout">
        {images.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
          >
            {images.map((image, idx) => (
              <motion.div
                key={image.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-muted/30"
              >
                <ImagePreview
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full"
                  onClick={() => setLightboxImage(image)}
                />

                {/* Overlay com ações */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 bg-white/20 hover:bg-white/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxImage(image);
                    }}
                  >
                    <Maximize2 className="h-4 w-4 text-white" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 bg-red-500/80 hover:bg-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(image.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-white" />
                  </Button>
                </div>

                {/* Badge de posição */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-white text-xs font-medium">
                  {idx + 1}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <Lightbox
        open={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
        image={lightboxImage}
      />
    </div>
  );
}

// ============================================
// COMPONENTE: UPLOAD IMAGEM ÚNICA (ALTERNATIVA)
// ============================================

export function SingleImageUploader({
  image,
  onChange,
  label,
  className,
  disabled = false,
  compact = false,
  bucket = BUCKET,
  folder = FOLDER,
}: SingleImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    // Validar
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Arquivo muito grande (máx 10MB)');
      return;
    }

    setIsUploading(true);

    try {
      // Comprimir
      let fileToUpload = file;
      try {
        fileToUpload = await compressImage(file, {
          quality: 0.85,
          maxWidth: 800,
          maxHeight: 600,
          format: 'webp'
        });
      } catch (err) {
        console.warn('Compressão falhou:', err);
      }

      // Gerar nome único
      const ext = fileToUpload.name.split('.').pop() || 'webp';
      const fileName = `alt-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const filePath = `${folder}/${fileName}`;

      // Upload
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // URL assinada
      const { data: urlData } = await supabase.storage
        .from(bucket)
        .createSignedUrl(data.path, 3600 * 24 * 7);

      if (!urlData?.signedUrl) throw new Error('Falha ao gerar URL');

      onChange({
        id: crypto.randomUUID(),
        url: urlData.signedUrl,
        path: data.path,
        name: file.name,
        size: fileToUpload.size,
        position: 0
      });

      toast.success('Imagem adicionada');
    } catch (err) {
      console.error('Erro no upload:', err);
      toast.error('Erro ao fazer upload');
    } finally {
      setIsUploading(false);
    }
  }, [onChange, bucket, folder]);

  const handleRemove = useCallback(async () => {
    if (!image) return;

    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([image.path]);

      if (error) console.warn('Erro ao deletar:', error);

      onChange(null);
      toast.success('Imagem removida');
    } catch (err) {
      console.error('Erro ao remover:', err);
    }
  }, [image, onChange, bucket]);

  // Versão compacta (inline com alternativa)
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {image ? (
          <div className="relative group">
            <div 
              className="w-10 h-10 rounded-lg overflow-hidden border border-border cursor-pointer"
              onClick={() => setLightboxOpen(true)}
            >
              <ImagePreview
                src={image.url}
                alt="Imagem da alternativa"
                className="w-full h-full"
              />
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-1 -right-1 p-0.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 border border-dashed border-muted-foreground/30 hover:border-primary/50"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        )}

        {/* Lightbox para visualizar */}
        {image && (
          <Lightbox
            open={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
            image={image}
          />
        )}
      </div>
    );
  }

  // Versão normal
  return (
    <div className={cn("space-y-2", className)}>
      {label && <span className="text-sm font-medium">{label}</span>}
      
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {image ? (
        <div className="relative group">
          <div 
            className="w-full aspect-video rounded-xl overflow-hidden border border-border cursor-pointer"
            onClick={() => setLightboxOpen(true)}
          >
            <ImagePreview
              src={image.url}
              alt="Imagem"
              className="w-full h-full"
            />
          </div>
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 bg-black/50 hover:bg-black/70"
              onClick={() => setLightboxOpen(true)}
            >
              <ZoomIn className="h-4 w-4 text-white" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 bg-red-500/80 hover:bg-red-500"
              onClick={handleRemove}
            >
              <Trash2 className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !disabled && !isUploading && inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer",
            "flex flex-col items-center justify-center gap-2",
            "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50",
            (disabled || isUploading) && "opacity-50 cursor-not-allowed"
          )}
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <>
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Clique para adicionar imagem
              </span>
            </>
          )}
        </div>
      )}

      {image && (
        <Lightbox
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          image={image}
        />
      )}
    </div>
  );
}

export default QuestionImageUploader;
