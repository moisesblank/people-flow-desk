// ============================================
// 📚 CATEGORY IMAGE MANAGER
// Gestão de imagens das macro-categorias
// Permite upload de banner + capa para cada categoria
// ============================================

import React, { memo, useState, useCallback } from 'react';
import { Upload, Image, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { useBookCategories, type CategoryWithFallback } from '@/hooks/useBookCategories';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const CategoryImageManager = memo(function CategoryImageManager() {
  const { categories, isLoading, updateCategoryImages, refetch } = useBookCategories();
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Imagens das Categorias</h2>
          <p className="text-sm text-muted-foreground">
            Configure banner (horizontal ~300x180) e capa (vertical ~512x736) para cada categoria
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {categories.map((category) => (
          <CategoryImageCard
            key={category.id}
            category={category}
            isUploading={uploadingId === category.id}
            onUploadStart={() => setUploadingId(category.id)}
            onUploadEnd={() => setUploadingId(null)}
            updateCategoryImages={updateCategoryImages}
          />
        ))}
      </div>

      <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
        <strong>Dimensões recomendadas:</strong>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li><strong>Banner:</strong> 300 x 180 pixels (formato paisagem, para filtros horizontais)</li>
          <li><strong>Capa:</strong> 512 x 736 pixels (formato retrato, para cards de livros)</li>
        </ul>
      </div>
    </div>
  );
});

CategoryImageManager.displayName = 'CategoryImageManager';

// ============================================
// CARD DE CATEGORIA
// ============================================

interface CategoryImageCardProps {
  category: CategoryWithFallback;
  isUploading: boolean;
  onUploadStart: () => void;
  onUploadEnd: () => void;
  updateCategoryImages: ReturnType<typeof useBookCategories>['updateCategoryImages'];
}

const CategoryImageCard = memo(function CategoryImageCard({
  category,
  isUploading,
  onUploadStart,
  onUploadEnd,
  updateCategoryImages,
}: CategoryImageCardProps) {
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Upload de arquivo para storage
  const uploadToStorage = useCallback(async (file: File, type: 'banner' | 'cover'): Promise<string | null> => {
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const filename = `categories/${category.id}/${type}-${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage
        .from('ena-assets-raw')
        .upload(filename, file, {
          cacheControl: '31536000',
          upsert: true,
        });

      if (error) throw error;

      // Gerar URL pública
      const { data: urlData } = supabase.storage
        .from('ena-assets-raw')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error(`Erro no upload ${type}:`, error);
      toast.error(`Erro ao enviar ${type === 'banner' ? 'banner' : 'capa'}`);
      return null;
    }
  }, [category.id]);

  // Handler para salvar imagem
  const handleSaveImage = useCallback(async (file: File, type: 'banner' | 'cover') => {
    onUploadStart();
    
    try {
      const url = await uploadToStorage(file, type);
      
      if (url) {
        await updateCategoryImages.mutateAsync({
          categoryId: category.id,
          ...(type === 'banner' ? { bannerUrl: url } : { coverUrl: url }),
        });

        // Limpar preview
        if (type === 'banner') setBannerPreview(null);
        else setCoverPreview(null);
      }
    } finally {
      onUploadEnd();
    }
  }, [category.id, uploadToStorage, updateCategoryImages, onUploadStart, onUploadEnd]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full" 
            style={{ background: category.gradient }}
          />
          <CardTitle className="text-base">{category.name}</CardTitle>
        </div>
        <CardDescription className="text-xs">
          ID: {category.id}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Banner (Horizontal) */}
        <ImageUploadZone
          label="Banner (Horizontal)"
          currentUrl={category.banner_url}
          fallbackUrl={category.effectiveBanner}
          previewUrl={bannerPreview}
          isUploading={isUploading}
          aspectRatio="landscape"
          onFileSelect={(file) => {
            // Mostrar preview
            const reader = new FileReader();
            reader.onload = (e) => setBannerPreview(e.target?.result as string);
            reader.readAsDataURL(file);
          }}
          onConfirm={(file) => handleSaveImage(file, 'banner')}
          onCancel={() => setBannerPreview(null)}
        />

        {/* Capa (Vertical) */}
        <ImageUploadZone
          label="Capa (Vertical)"
          currentUrl={category.cover_url}
          fallbackUrl={category.effectiveCover}
          previewUrl={coverPreview}
          isUploading={isUploading}
          aspectRatio="portrait"
          onFileSelect={(file) => {
            const reader = new FileReader();
            reader.onload = (e) => setCoverPreview(e.target?.result as string);
            reader.readAsDataURL(file);
          }}
          onConfirm={(file) => handleSaveImage(file, 'cover')}
          onCancel={() => setCoverPreview(null)}
        />
      </CardContent>
    </Card>
  );
});

// ============================================
// ZONA DE UPLOAD
// ============================================

interface ImageUploadZoneProps {
  label: string;
  currentUrl: string | null;
  fallbackUrl: string;
  previewUrl: string | null;
  isUploading: boolean;
  aspectRatio: 'landscape' | 'portrait';
  onFileSelect: (file: File) => void;
  onConfirm: (file: File) => void;
  onCancel: () => void;
}

const ImageUploadZone = memo(function ImageUploadZone({
  label,
  currentUrl,
  fallbackUrl,
  previewUrl,
  isUploading,
  aspectRatio,
  onFileSelect,
  onConfirm,
  onCancel,
}: ImageUploadZoneProps) {
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    disabled: isUploading,
    onDrop: (files) => {
      if (files[0]) {
        setPendingFile(files[0]);
        onFileSelect(files[0]);
      }
    },
  });

  const displayUrl = previewUrl || currentUrl || fallbackUrl;
  const hasCustomImage = !!currentUrl;
  const hasPendingUpload = !!previewUrl && !!pendingFile;

  const aspectClasses = aspectRatio === 'landscape' 
    ? 'aspect-video max-h-24' 
    : 'aspect-[2/3] max-h-32';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {hasCustomImage && !hasPendingUpload && (
          <Badge variant="outline" className="text-xs gap-1">
            <Check className="w-3 h-3" />
            Customizado
          </Badge>
        )}
      </div>

      <div
        {...getRootProps()}
        className={cn(
          "relative rounded-lg overflow-hidden border-2 border-dashed transition-colors cursor-pointer",
          aspectClasses,
          isDragActive && "border-primary bg-primary/5",
          hasPendingUpload && "border-yellow-500",
          !isDragActive && !hasPendingUpload && "border-border hover:border-primary/50"
        )}
      >
        <input {...getInputProps()} />
        
        <img
          src={displayUrl}
          alt={label}
          className="w-full h-full object-cover"
        />

        {/* Overlay */}
        <div className={cn(
          "absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity",
          isDragActive && "opacity-100"
        )}>
          {isUploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-white">
              <Upload className="w-5 h-5" />
              <span className="text-xs">Clique ou arraste</span>
            </div>
          )}
        </div>
      </div>

      {/* Ações de confirmação */}
      {hasPendingUpload && (
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              if (pendingFile) {
                onConfirm(pendingFile);
                setPendingFile(null);
              }
            }}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
            Salvar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              setPendingFile(null);
              onCancel();
            }}
            disabled={isUploading}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
});

export default CategoryImageManager;
