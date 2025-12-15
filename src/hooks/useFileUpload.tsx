import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UploadOptions {
  bucket?: string;
  folder?: string;
  maxSize?: number; // in MB
  allowedTypes?: string[];
}

interface UploadedFile {
  name: string;
  url: string;
  path: string;
  size: number;
  type: string;
}

export function useFileUpload(options: UploadOptions = {}) {
  const {
    bucket = 'documentos',
    folder = '',
    maxSize = 10,
    allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  } = options;

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File): Promise<UploadedFile | null> => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo: ${maxSize}MB`);
      return null;
    }

    // Validate file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido');
      return null;
    }

    setUploading(true);
    setProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      setProgress(100);

      return {
        name: file.name,
        url: urlData.publicUrl,
        path: data.path,
        size: file.size,
        type: file.type
      };
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Erro ao fazer upload: ' + error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const uploadMultiple = async (files: FileList | File[]): Promise<UploadedFile[]> => {
    const results: UploadedFile[] = [];
    const fileArray = Array.from(files);

    for (let i = 0; i < fileArray.length; i++) {
      setProgress(Math.round((i / fileArray.length) * 100));
      const result = await uploadFile(fileArray[i]);
      if (result) results.push(result);
    }

    setProgress(100);
    return results;
  };

  const deleteFile = async (path: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Erro ao deletar arquivo');
      return false;
    }
  };

  return {
    uploadFile,
    uploadMultiple,
    deleteFile,
    uploading,
    progress
  };
}
