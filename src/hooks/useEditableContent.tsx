// ============================================
// MOISÉS MEDEIROS v7.0 - EDITABLE CONTENT HOOK
// Sistema de Edição Inline tipo Elementor
// ============================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { toast } from "sonner";

interface EditableContent {
  id: string;
  page_key: string;
  content_key: string;
  content_type: string;
  content_value: string | null;
  metadata: unknown;
}

interface UseEditableContentReturn {
  content: Record<string, EditableContent>;
  isLoading: boolean;
  isEditMode: boolean;
  canEdit: boolean;
  toggleEditMode: () => void;
  getValue: (key: string, fallback?: string) => string;
  updateValue: (key: string, value: string, type?: string) => Promise<void>;
  uploadImage: (key: string, file: File) => Promise<string | null>;
}

export function useEditableContent(pageKey: string): UseEditableContentReturn {
  const [content, setContent] = useState<Record<string, EditableContent>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const { canEdit, isOwner } = useAdminCheck();

  // Fetch content from database
  useEffect(() => {
    async function fetchContent() {
      try {
        const { data, error } = await supabase
          .from("editable_content")
          .select("*")
          .eq("page_key", pageKey);

        if (error) throw error;

        const contentMap: Record<string, EditableContent> = {};
        data?.forEach((item) => {
          contentMap[item.content_key] = item;
        });
        setContent(contentMap);
      } catch (err) {
        console.error("Erro ao carregar conteúdo editável:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchContent();
  }, [pageKey]);

  const toggleEditMode = useCallback(() => {
    if (canEdit) {
      setIsEditMode((prev) => !prev);
      if (!isEditMode) {
        toast.info("Modo de edição ativado", {
          description: "Clique em qualquer texto ou imagem para editar",
        });
      } else {
        toast.success("Modo de edição desativado");
      }
    }
  }, [canEdit, isEditMode]);

  const getValue = useCallback(
    (key: string, fallback: string = ""): string => {
      return content[key]?.content_value || fallback;
    },
    [content]
  );

  const updateValue = useCallback(
    async (key: string, value: string, type: string = "text") => {
      if (!canEdit) return;

      try {
        const { data: existingData } = await supabase
          .from("editable_content")
          .select("id")
          .eq("page_key", pageKey)
          .eq("content_key", key)
          .single();

        if (existingData) {
          // Update existing
          const { error } = await supabase
            .from("editable_content")
            .update({
              content_value: value,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingData.id);

          if (error) throw error;
        } else {
          // Insert new
          const { error } = await supabase.from("editable_content").insert({
            page_key: pageKey,
            content_key: key,
            content_type: type,
            content_value: value,
          });

          if (error) throw error;
        }

        // Update local state
        setContent((prev) => ({
          ...prev,
          [key]: {
            ...prev[key],
            id: prev[key]?.id || "",
            page_key: pageKey,
            content_key: key,
            content_type: type,
            content_value: value,
            metadata: prev[key]?.metadata || {},
          },
        }));

        toast.success("Conteúdo atualizado!");
      } catch (err) {
        console.error("Erro ao atualizar conteúdo:", err);
        toast.error("Erro ao salvar alteração");
      }
    },
    [canEdit, pageKey]
  );

  const uploadImage = useCallback(
    async (key: string, file: File): Promise<string | null> => {
      if (!canEdit) return null;

      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${pageKey}/${key}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        const publicUrl = urlData.publicUrl;

        await updateValue(key, publicUrl, "image");

        return publicUrl;
      } catch (err) {
        console.error("Erro ao fazer upload:", err);
        toast.error("Erro ao fazer upload da imagem");
        return null;
      }
    },
    [canEdit, pageKey, updateValue]
  );

  return {
    content,
    isLoading,
    isEditMode,
    canEdit: canEdit && isOwner,
    toggleEditMode,
    getValue,
    updateValue,
    uploadImage,
  };
}
