// ============================================
// 📷 MODULE IMAGE UPLOADER
// Upload direto de imagem para módulos
// Dimensões: 752×940px (proporção 3:4)
// ============================================

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ModuleImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
  showPreview?: boolean;
  previewSize?: 'sm' | 'lg';
}

export function ModuleImageUploader({
  value,
  onChange,
  className,
  showPreview = true,
  previewSize = 'sm'
}: ModuleImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (file: File) => {
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Selecione apenas arquivos de imagem.',
        variant: 'destructive'
      });
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo é 5MB.',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);

    try {
      // Gerar nome único
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `module_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const filePath = `modules/${fileName}`;

      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('materiais')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // 🛡️ P0 FIX: Salvar apenas o PATH no banco (não URL pública)
      // O frontend irá gerar URL assinada quando precisar exibir
      onChange(filePath);
      toast({
        title: '✅ Imagem enviada',
        description: 'A imagem foi carregada com sucesso.',
      });
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        title: 'Erro no upload',
        description: error.message || 'Não foi possível enviar a imagem.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleRemove = () => {
    onChange('');
  };

  const previewClasses = previewSize === 'lg' 
    ? 'w-full max-w-[280px] aspect-[752/940]'
    : 'w-20 h-24';

  return (
    <div className={cn('space-y-3', className)}>
      <Label className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-green-400" />
        Imagem de Capa
        <Badge variant="outline" className="text-xs">752 × 940 px</Badge>
      </Label>

      {/* Área de Upload */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-4 cursor-pointer',
          'flex items-center justify-center gap-3',
          'bg-background/50',
          dragActive && 'border-green-500 bg-green-500/10',
          !dragActive && 'border-border/50 hover:border-green-500/50 hover:bg-muted/30',
          isUploading && 'pointer-events-none opacity-70'
        )}
      >
        {isUploading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-5 w-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Enviando...</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Upload className="h-5 w-5" />
            <span className="text-sm">Clique ou arraste uma imagem</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
          className="hidden"
        />
      </div>

      {/* OU usar URL */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="flex-1 h-px bg-border" />
        <span>ou cole uma URL</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="/images/modules/meu-modulo.jpg"
        className="bg-background/50 text-sm"
      />

      {/* Preview */}
      {showPreview && value && (
        <div className="relative group">
          <div className={cn(
            previewClasses,
            'rounded-lg overflow-hidden border border-green-500/30 bg-muted'
          )}>
            <img 
              src={value} 
              alt="Preview" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
              }}
            />
            {previewSize === 'lg' && (
              <Badge className="absolute bottom-2 right-2 bg-green-600 shadow-lg">
                <Check className="h-3 w-3 mr-1" />
                752×940 px
              </Badge>
            )}
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Placeholder quando não tem imagem */}
      {showPreview && !value && previewSize === 'lg' && (
        <div className={cn(
          previewClasses,
          'rounded-xl border-2 border-dashed border-destructive/50 bg-destructive/5',
          'flex flex-col items-center justify-center gap-3 p-4'
        )}>
          <AlertTriangle className="h-12 w-12 text-destructive/60" />
          <p className="text-sm text-destructive text-center font-medium">
            Imagem Obrigatória
          </p>
          <p className="text-xs text-muted-foreground text-center">
            Dimensões: 752 × 940 px
          </p>
        </div>
      )}
    </div>
  );
}
