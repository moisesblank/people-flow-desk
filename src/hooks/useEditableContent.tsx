// ============================================
// MOISÉS MEDEIROS v9.0 - EDITABLE CONTENT HOOK
// Sistema de Edição MODO DEUS (Ctrl+Shift+E)
// Exclusivo para Owner: moisesblank@gmail.com
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

interface ContentHistoryItem {
  id: string;
  content_key: string;
  old_value: string;
  new_value: string;
  changed_at: string;
  version: number;
}

interface UseEditableContentReturn {
  content: Record<string, EditableContent>;
  isLoading: boolean;
  isEditMode: boolean;
  canEdit: boolean;
  isGodMode: boolean;
  toggleEditMode: () => void;
  getValue: (key: string, fallback?: string) => string;
  updateValue: (key: string, value: string, type?: string) => Promise<void>;
  uploadImage: (key: string, file: File) => Promise<string | null>;
  getHistory: (key: string) => Promise<ContentHistoryItem[]>;
  revertToVersion: (key: string, version: number) => Promise<void>;
}

export function useEditableContent(pageKey: string): UseEditableContentReturn {
  const [content, setContent] = useState<Record<string, EditableContent>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const { canEdit, isOwner, userEmail } = useAdminCheck();
  
  // Verificar se é realmente o owner (verificação dupla)
  const isGodMode = isOwner && canEdit;

  // Atalho secreto Ctrl+Shift+E para ativar MODO DEUS
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === "E" && isGodMode) {
        e.preventDefault();
        toggleEditMode();
      }
    }
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isGodMode]);

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
    if (isGodMode) {
      setIsEditMode((prev) => {
        const newMode = !prev;
        if (newMode) {
          toast.info("🎮 MODO DEUS ATIVADO", {
            description: "Clique em qualquer texto/imagem para editar. Ctrl+Shift+E para sair.",
            duration: 5000,
          });
        } else {
          toast.success("MODO DEUS desativado", {
            description: "Alterações salvas automaticamente",
          });
        }
        return newMode;
      });
    } else {
      toast.error("Acesso negado", {
        description: "MODO DEUS é exclusivo para o Owner",
      });
    }
  }, [isGodMode]);

  const getValue = useCallback(
    (key: string, fallback: string = ""): string => {
      return content[key]?.content_value || fallback;
    },
    [content]
  );

  const updateValue = useCallback(
    async (key: string, value: string, type: string = "text") => {
      if (!isGodMode) return;

      try {
        const { data: existingData } = await supabase
          .from("editable_content")
          .select("id")
          .eq("page_key", pageKey)
          .eq("content_key", key)
          .maybeSingle();

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

        toast.success("✨ Conteúdo atualizado!", { duration: 2000 });
      } catch (err) {
        console.error("Erro ao atualizar conteúdo:", err);
        toast.error("Erro ao salvar alteração");
      }
    },
    [isGodMode, pageKey]
  );

  const uploadImage = useCallback(
    async (key: string, file: File): Promise<string | null> => {
      if (!isGodMode) return null;

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
    [isGodMode, pageKey, updateValue]
  );

  // Buscar histórico de alterações
  const getHistory = useCallback(
    async (key: string): Promise<ContentHistoryItem[]> => {
      if (!isGodMode) return [];
      
      try {
        const { data, error } = await supabase
          .from("content_history")
          .select("*")
          .eq("content_key", key)
          .order("version", { ascending: false })
          .limit(10);

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error("Erro ao buscar histórico:", err);
        return [];
      }
    },
    [isGodMode]
  );

  // Reverter para uma versão anterior
  const revertToVersion = useCallback(
    async (key: string, version: number): Promise<void> => {
      if (!isGodMode) return;
      
      try {
        const { data: historyItem, error: fetchError } = await supabase
          .from("content_history")
          .select("old_value")
          .eq("content_key", key)
          .eq("version", version)
          .maybeSingle();

        if (fetchError || !historyItem) throw new Error("Versão não encontrada");

        await updateValue(key, historyItem.old_value || "");
        toast.success(`Revertido para versão ${version}`);
      } catch (err) {
        console.error("Erro ao reverter:", err);
        toast.error("Erro ao reverter versão");
      }
    },
    [isGodMode, updateValue]
  );

  return {
    content,
    isLoading,
    isEditMode,
    canEdit: isGodMode,
    isGodMode,
    toggleEditMode,
    getValue,
    updateValue,
    uploadImage,
    getHistory,
    revertToVersion,
  };
}
