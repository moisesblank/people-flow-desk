// ============================================
// SYNAPSE v14.0 - VISUAL EDIT MODE
// Sistema de edição visual inline estilo Elementor
// COM UPLOAD DE IMAGENS
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGodMode } from '@/contexts/GodModeContext';
import { X, Check, Type, Image, Link, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface EditableElement {
  element: HTMLElement;
  type: 'text' | 'image' | 'link';
  originalValue: string;
  key: string;
}

export function VisualEditMode() {
  const { isActive, isOwner, updateContent } = useGodMode();
  const [selectedElement, setSelectedElement] = useState<EditableElement | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detectar elementos editáveis
  const detectEditableElements = useCallback(() => {
    if (!isActive || !isOwner) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Ignorar cliques no painel de edição
      if (target.closest('.visual-edit-panel') || target.closest('.god-mode-panel')) {
        return;
      }

      // Não interceptar navegação/ações (a não ser que o clique seja explicitamente editável)
      const explicitEditable = target.closest('[data-editable="true"], [data-editable-key]');
      const interactiveAncestor = target.closest('a, button, [role="button"], [data-sidebar="menu-button"]');
      if (interactiveAncestor && !explicitEditable) {
        return;
      }

      // Verificar se é um elemento editável
      const editableAttr = target.getAttribute('data-editable');
      const editableKey = target.getAttribute('data-editable-key');

      if (editableAttr === 'true' || editableKey) {
        e.preventDefault();
        e.stopPropagation();

        let type: 'text' | 'image' | 'link' = 'text';
        let value = '';

        if (target.tagName === 'IMG') {
          type = 'image';
          value = (target as HTMLImageElement).src;
        } else if (target.tagName === 'A') {
          type = 'link';
          value = (target as HTMLAnchorElement).href;
        } else {
          type = 'text';
          value = target.innerText || target.textContent || '';
        }

        setSelectedElement({
          element: target,
          type,
          originalValue: value,
          key: editableKey || `inline_${Date.now()}`,
        });
        setEditValue(value);
        setPreviewImage(type === 'image' ? value : null);
        setIsEditing(true);
      } else {
        // Só permitir edição dinâmica fora de elementos interativos
        if (
          !interactiveAncestor &&
          ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'IMG'].includes(target.tagName)
        ) {
          const value =
            target.tagName === 'IMG'
              ? (target as HTMLImageElement).src
              : target.innerText || '';

          if (value || target.tagName === 'IMG') {
            e.preventDefault();
            e.stopPropagation();

            const elementType = target.tagName === 'IMG' ? 'image' : 'text';

            setSelectedElement({
              element: target,
              type: elementType,
              originalValue: value,
              key: `dynamic_${target.tagName.toLowerCase()}_${Date.now()}`,
            });
            setEditValue(value);
            setPreviewImage(elementType === 'image' ? value : null);
            setIsEditing(true);
          }
        }
        // Links e botões continuam a funcionar normalmente
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.visual-edit-panel') || target.closest('.god-mode-panel')) {
        return;
      }
      
      // NÃO destacar links e botões como editáveis para não confundir o usuário
      if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'IMG'].includes(target.tagName)) {
        setHoveredElement(target);
        target.style.outline = '2px dashed hsl(280, 80%, 50%)';
        target.style.outlineOffset = '2px';
        target.style.cursor = 'pointer';
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (hoveredElement === target) {
        target.style.outline = '';
        target.style.outlineOffset = '';
        target.style.cursor = '';
        setHoveredElement(null);
      }
    };

    document.addEventListener('click', handleClick, true);
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('mouseover', handleMouseOver, true);
      document.removeEventListener('mouseout', handleMouseOut, true);
    };
  }, [isActive, isOwner, hoveredElement]);

  useEffect(() => {
    const cleanup = detectEditableElements();
    return cleanup;
  }, [detectEditableElements]);

  // Limpar hover quando desativar
  useEffect(() => {
    if (!isActive && hoveredElement) {
      hoveredElement.style.outline = '';
      hoveredElement.style.outlineOffset = '';
      hoveredElement.style.cursor = '';
      setHoveredElement(null);
    }
  }, [isActive, hoveredElement]);

  // Upload de imagem para Supabase
  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Arquivo inválido', { description: 'Selecione uma imagem' });
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande', { description: 'Máximo 5MB' });
      return;
    }

    setIsUploading(true);

    try {
      // Criar preview local
      const localPreview = URL.createObjectURL(file);
      setPreviewImage(localPreview);

      // Gerar nome único
      const timestamp = Date.now();
      const ext = file.name.split('.').pop();
      const fileName = `godmode/${timestamp}_${Math.random().toString(36).substring(7)}.${ext}`;

      // Upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from('arquivos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        // Se bucket não existe, tentar criar
        if (error.message?.includes('not found')) {
          toast.error('Bucket não configurado', {
            description: 'Configure o storage no Supabase'
          });
        } else {
          throw error;
        }
        return;
      }

      // Pegar URL pública
      const { data: urlData } = supabase.storage
        .from('arquivos')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      setEditValue(publicUrl);
      setPreviewImage(publicUrl);

      toast.success('Imagem carregada!');
    } catch (error: any) {
      console.error('Erro upload:', error);
      toast.error('Erro ao carregar imagem', {
        description: error.message || 'Tente novamente'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleSave = async () => {
    if (!selectedElement) return;

    try {
      // Aplicar mudança visual imediata
      if (selectedElement.type === 'text') {
        selectedElement.element.innerText = editValue;
      } else if (selectedElement.type === 'image') {
        (selectedElement.element as HTMLImageElement).src = previewImage || editValue;
      } else if (selectedElement.type === 'link') {
        (selectedElement.element as HTMLAnchorElement).href = editValue;
      }

      // Salvar no banco se tiver key persistente
      if (selectedElement.key.startsWith('inline_') || selectedElement.key.startsWith('dynamic_')) {
        toast.success('Alteração aplicada!', {
          description: 'Edição visual aplicada com sucesso'
        });
      } else {
        await updateContent(selectedElement.key, previewImage || editValue, selectedElement.type);
      }

      setIsEditing(false);
      setSelectedElement(null);
      setPreviewImage(null);
    } catch (error) {
      toast.error('Erro ao salvar');
    }
  };

  const handleCancel = () => {
    if (selectedElement) {
      // Reverter mudança
      if (selectedElement.type === 'text') {
        selectedElement.element.innerText = selectedElement.originalValue;
      } else if (selectedElement.type === 'image') {
        (selectedElement.element as HTMLImageElement).src = selectedElement.originalValue;
      } else if (selectedElement.type === 'link') {
        (selectedElement.element as HTMLAnchorElement).href = selectedElement.originalValue;
      }
    }
    setIsEditing(false);
    setSelectedElement(null);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isActive || !isOwner) return null;

  return (
    <AnimatePresence>
      {isEditing && selectedElement && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] visual-edit-panel"
        >
          <div 
            className="bg-background/95 backdrop-blur-xl border border-primary/30 rounded-2xl shadow-2xl p-4 min-w-[450px] max-w-[600px]"
            style={{
              boxShadow: '0 0 40px rgba(147, 51, 234, 0.3)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                {selectedElement.type === 'text' && <Type className="w-5 h-5 text-primary" />}
                {selectedElement.type === 'image' && <Image className="w-5 h-5 text-primary" />}
                {selectedElement.type === 'link' && <Link className="w-5 h-5 text-primary" />}
                <span className="font-semibold text-foreground">
                  Editar {selectedElement.type === 'text' ? 'Texto' : selectedElement.type === 'image' ? 'Imagem' : 'Link'}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Editor */}
            <div className="space-y-4">
              {selectedElement.type === 'text' ? (
                <Textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Digite o novo texto..."
                  className="min-h-[100px] bg-muted/50 border-border focus:border-primary"
                  autoFocus
                />
              ) : selectedElement.type === 'image' ? (
                <div className="space-y-4">
                  <Tabs value={imageTab} onValueChange={(v) => setImageTab(v as 'upload' | 'url')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="upload" className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Upload
                      </TabsTrigger>
                      <TabsTrigger value="url" className="flex items-center gap-2">
                        <Link className="w-4 h-4" />
                        URL
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload" className="mt-4">
                      <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                          "hover:border-primary hover:bg-primary/5",
                          isUploading ? "border-primary bg-primary/5" : "border-border"
                        )}
                      >
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">Carregando...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="w-8 h-8 text-muted-foreground" />
                            <span className="text-sm font-medium">Arraste uma imagem ou clique aqui</span>
                            <span className="text-xs text-muted-foreground">PNG, JPG, GIF até 5MB</span>
                          </div>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="url" className="mt-4">
                      <Input
                        type="url"
                        value={editValue}
                        onChange={(e) => {
                          setEditValue(e.target.value);
                          setPreviewImage(e.target.value);
                        }}
                        placeholder="https://exemplo.com/imagem.jpg"
                        className="bg-muted/50 border-border focus:border-primary"
                      />
                    </TabsContent>
                  </Tabs>

                  {/* Preview da imagem */}
                  {previewImage && (
                    <div className="rounded-lg overflow-hidden bg-muted/30 p-2">
                      <img 
                        src={previewImage} 
                        alt="Preview" 
                        className="max-h-40 mx-auto rounded object-contain"
                        onError={() => setPreviewImage(null)}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <Input
                  type="url"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="URL do link..."
                  className="bg-muted/50 border-border focus:border-primary"
                  autoFocus
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border">
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isUploading}
                className="bg-primary hover:bg-primary/90"
              >
                <Check className="w-4 h-4 mr-2" />
                Aplicar
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default VisualEditMode;
