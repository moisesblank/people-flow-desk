// ============================================
// HOOK UNIVERSAL DE ANEXOS
// Integração com todas as áreas do sistema + AI
// ============================================

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { formatError } from '@/lib/utils/formatError';

// Tipos de entidades suportadas
export type EntityType = 
  | 'task' 
  | 'calendar_task' 
  | 'expense' 
  | 'employee' 
  | 'student' 
  | 'course' 
  | 'campaign' 
  | 'transaction'
  | 'contabilidade'
  | 'equipment'
  | 'lesson'
  | 'module'
  | 'document'
  | 'payment'
  | 'company_expense_fixed'
  | 'company_expense_extra';

export interface Attachment {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  storage_path: string;
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  extracted_content?: string;
  extraction_status?: 'pending' | 'processing' | 'completed' | 'failed';
  extraction_date?: string;
  extraction_model?: string;
  ai_summary?: string;
  ai_insights?: Record<string, any>;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

interface UploadOptions {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  triggerAIExtraction?: boolean;
}

// ACEITAR QUALQUER TIPO DE ARQUIVO (sem restrições)
// A validação de tipo foi REMOVIDA para permitir qualquer arquivo
const ALLOWED_TYPES: string[] = []; // Vazio = aceita TUDO

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

export function useUniversalAttachments(entityType: EntityType, entityId: string) {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Buscar anexos da entidade
  const fetchAttachments = useCallback(async () => {
    if (!entityId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('universal_attachments')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAttachments((data || []).map(d => ({
        ...d,
        entity_type: d.entity_type as EntityType,
        extraction_status: d.extraction_status as Attachment['extraction_status'],
        ai_insights: (d.ai_insights || {}) as Record<string, any>
      })));
    } catch (error: any) {
      console.error('Error fetching attachments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId]);

  // Upload de arquivo
  const uploadFile = useCallback(async (
    file: File, 
    options: UploadOptions = {}
  ): Promise<Attachment | null> => {
    if (!user?.id || !entityId) {
      toast.error('Você precisa estar autenticado');
      return null;
    }

    // Validação de tamanho apenas (aceita qualquer tipo)
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Arquivo muito grande. Máximo: 2GB');
      return null;
    }

    // QUALQUER tipo de arquivo é aceito - sem validação de tipo
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Gerar nome único
      const fileExt = file.name.split('.').pop();
      const fileName = `${entityType}/${entityId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload para storage
      setUploadProgress(20);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('arquivos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;
      setUploadProgress(60);

      // Gerar URL assinada
      const { data: urlData } = await supabase.storage
        .from('arquivos')
        .createSignedUrl(uploadData.path, 3600 * 24 * 365); // 1 ano

      if (!urlData?.signedUrl) {
        throw new Error('Falha ao gerar URL do arquivo');
      }

      setUploadProgress(80);

      // Inserir registro no banco
      const { data: attachmentData, error: dbError } = await supabase
        .from('universal_attachments')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_url: urlData.signedUrl,
          storage_path: uploadData.path,
          title: options.title || file.name,
          description: options.description,
          category: options.category || 'general',
          tags: options.tags || [],
          uploaded_by: user.id,
          extraction_status: options.triggerAIExtraction ? 'pending' : 'pending'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setUploadProgress(100);
      const typedAttachment: Attachment = {
        ...attachmentData,
        entity_type: attachmentData.entity_type as EntityType,
        extraction_status: attachmentData.extraction_status as Attachment['extraction_status'],
        ai_insights: (attachmentData.ai_insights || {}) as Record<string, any>
      };
      setAttachments(prev => [typedAttachment, ...prev]);
      
      toast.success('Arquivo anexado com sucesso!');

      // Trigger AI extraction se solicitado
      if (options.triggerAIExtraction && typedAttachment) {
        triggerAIExtraction(typedAttachment.id);
      }

      return typedAttachment;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Erro ao fazer upload: ' + formatError(error));
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [user, entityType, entityId]);

  // Upload de múltiplos arquivos
  const uploadMultiple = useCallback(async (
    files: FileList | File[],
    options: UploadOptions = {}
  ): Promise<Attachment[]> => {
    const results: Attachment[] = [];
    const fileArray = Array.from(files);

    for (let i = 0; i < fileArray.length; i++) {
      setUploadProgress(Math.round((i / fileArray.length) * 100));
      const result = await uploadFile(fileArray[i], options);
      if (result) results.push(result);
    }

    if (results.length > 0) {
      toast.success(`${results.length} arquivo(s) anexado(s)!`);
    }

    return results;
  }, [uploadFile]);

  // Deletar anexo
  const deleteAttachment = useCallback(async (attachmentId: string): Promise<boolean> => {
    try {
      const attachment = attachments.find(a => a.id === attachmentId);
      if (!attachment) return false;

      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from('arquivos')
        .remove([attachment.storage_path]);

      if (storageError) {
        console.warn('Storage delete error:', storageError);
      }

      // Deletar do banco
      const { error: dbError } = await supabase
        .from('universal_attachments')
        .delete()
        .eq('id', attachmentId);

      if (dbError) throw dbError;

      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
      toast.success('Anexo removido');
      return true;
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Erro ao remover anexo');
      return false;
    }
  }, [attachments]);

  // Trigger AI extraction
  const triggerAIExtraction = useCallback(async (attachmentId: string) => {
    try {
      const attachment = attachments.find(a => a.id === attachmentId);
      if (!attachment) return;

      // Atualizar status para processing
      await supabase
        .from('universal_attachments')
        .update({ extraction_status: 'processing' })
        .eq('id', attachmentId);

      setAttachments(prev => prev.map(a => 
        a.id === attachmentId ? { ...a, extraction_status: 'processing' as const } : a
      ));

      // Chamar edge function de extração
      const { error } = await supabase.functions.invoke('extract-document', {
        body: {
          documentId: attachmentId,
          fileUrl: attachment.file_url,
          fileName: attachment.file_name,
          fileType: attachment.file_type,
          source: 'universal_attachments'
        }
      });

      if (error) throw error;

      // Atualizar local
      await fetchAttachments();
      toast.success('Extração AI iniciada!');
    } catch (error: any) {
      console.error('AI extraction error:', error);
      toast.error('Erro na extração AI');
      
      await supabase
        .from('universal_attachments')
        .update({ extraction_status: 'failed' })
        .eq('id', attachmentId);
    }
  }, [attachments, fetchAttachments]);

  // Atualizar metadados
  const updateAttachment = useCallback(async (
    attachmentId: string,
    updates: Partial<Pick<Attachment, 'title' | 'description' | 'category' | 'tags'>>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('universal_attachments')
        .update(updates)
        .eq('id', attachmentId);

      if (error) throw error;

      setAttachments(prev => prev.map(a => 
        a.id === attachmentId ? { ...a, ...updates } : a
      ));
      
      toast.success('Anexo atualizado');
      return true;
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error('Erro ao atualizar anexo');
      return false;
    }
  }, []);

  // Obter URL de download válida
  const getDownloadUrl = useCallback(async (attachment: Attachment): Promise<string | null> => {
    try {
      const { data } = await supabase.storage
        .from('arquivos')
        .createSignedUrl(attachment.storage_path, 3600); // 1 hora

      return data?.signedUrl || null;
    } catch (error) {
      console.error('Error getting download URL:', error);
      return null;
    }
  }, []);

  // Contar anexos
  const attachmentCount = attachments.length;

  return {
    attachments,
    isLoading,
    isUploading,
    uploadProgress,
    attachmentCount,
    fetchAttachments,
    uploadFile,
    uploadMultiple,
    deleteAttachment,
    updateAttachment,
    triggerAIExtraction,
    getDownloadUrl
  };
}

// Hook para contar anexos de uma entidade (sem carregar todos)
export function useAttachmentCount(entityType: EntityType, entityId: string) {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    if (!entityId) {
      setCount(0);
      setIsLoading(false);
      return;
    }

    try {
      const { count: total, error } = await supabase
        .from('universal_attachments')
        .select('*', { count: 'exact', head: true })
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

      if (error) throw error;
      setCount(total || 0);
    } catch (error) {
      console.error('Error fetching attachment count:', error);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId]);

  return { count, isLoading, refetch: fetchCount };
}
