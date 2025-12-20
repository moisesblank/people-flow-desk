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

// Security: Default signed URL expiration (1 hour in seconds)
const DEFAULT_URL_EXPIRATION = 3600;

// Limite de 2GB em bytes
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 * 1024;

export function useFileUpload(options: UploadOptions = {}) {
  const {
    bucket = 'arquivos',
    folder = '',
    maxSize = 2048, // 2GB em MB por padrão
    allowedTypes = [] // Vazio = aceita QUALQUER tipo de arquivo
  } = options;

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Security: Generate signed URL instead of public URL
  const getSignedUrl = async (path: string, expiresIn: number = DEFAULT_URL_EXPIRATION): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) throw error;
      return data.signedUrl;
    } catch (error: any) {
      console.error('Error generating signed URL:', error);
      return null;
    }
  };

  const uploadFile = async (file: File): Promise<UploadedFile | null> => {
    // Validar tamanho - máximo 2GB
    const maxSizeBytes = Math.min(maxSize * 1024 * 1024, MAX_FILE_SIZE_BYTES);
    if (file.size > maxSizeBytes) {
      toast.error(`Arquivo muito grande. Máximo: 2GB`);
      return null;
    }

    // Aceita QUALQUER tipo de arquivo se allowedTypes estiver vazio
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

      // Security: Use signed URL instead of public URL
      const signedUrl = await getSignedUrl(data.path);
      
      if (!signedUrl) {
        throw new Error('Failed to generate signed URL');
      }

      setProgress(100);

      return {
        name: file.name,
        url: signedUrl,
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

  // Security: Refresh signed URL when needed
  const refreshUrl = async (path: string, expiresIn?: number): Promise<string | null> => {
    return getSignedUrl(path, expiresIn);
  };

  return {
    uploadFile,
    uploadMultiple,
    deleteFile,
    refreshUrl,
    getSignedUrl,
    uploading,
    progress
  };
}
