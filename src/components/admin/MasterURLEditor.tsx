// ============================================
// MOISÉS MEDEIROS v16.0 - MASTER URL EDITOR
// Editor de URLs/Destinos para qualquer elemento
// Clique em qualquer link/botão/menu e edite o destino
// Owner exclusivo: moisesblank@gmail.com
// ============================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, X, Link2, ExternalLink, Globe, 
  Navigation, Sparkles, Copy, RotateCcw,
  MousePointer, Hash, Mail, Phone, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useGodMode } from '@/contexts/GodModeContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface URLEditorElement {
  element: HTMLElement;
  originalHref: string;
  elementType: 'a' | 'button' | 'div' | 'span' | 'other';
  rect: DOMRect;
  contentKey?: string;
}

interface SavedURL {
  id: string;
  element_key: string;
  original_url: string;
  new_url: string;
  target: string;
  created_at: string;
}

// Tipos de URLs disponíveis
const URL_TYPES = [
  { value: 'internal', label: 'Link Interno', icon: Navigation, prefix: '/' },
  { value: 'external', label: 'Link Externo', icon: Globe, prefix: 'https://' },
  { value: 'anchor', label: 'Âncora', icon: Hash, prefix: '#' },
  { value: 'email', label: 'Email', icon: Mail, prefix: 'mailto:' },
  { value: 'phone', label: 'Telefone', icon: Phone, prefix: 'tel:' },
  { value: 'file', label: 'Arquivo', icon: FileText, prefix: '' },
];

// Rotas internas comuns
const INTERNAL_ROUTES = [
  { path: '/', label: 'Home' },
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/alunos', label: 'Alunos' },
  { path: '/funcionarios', label: 'Funcionários' },
  { path: '/afiliados', label: 'Afiliados' },
  { path: '/financas-empresa', label: 'Finanças Empresa' },
  { path: '/financas-pessoais', label: 'Finanças Pessoais' },
  { path: '/marketing', label: 'Marketing' },
  { path: '/cursos', label: 'Cursos' },
  { path: '/tarefas', label: 'Tarefas' },
  { path: '/calendario', label: 'Calendário' },
  { path: '/configuracoes', label: 'Configurações' },
  { path: '/contabilidade', label: 'Contabilidade' },
  { path: '/ia-central', label: 'IA Central' },
  { path: '/webhooks', label: 'Webhooks' },
  { path: '/monitoramento', label: 'Monitoramento' },
  { path: '/dev', label: 'Dev Area' },
];

export function MasterURLEditor() {
  const { isOwner, isActive } = useGodMode();
  const [editingElement, setEditingElement] = useState<URLEditorElement | null>(null);
  const [urlValue, setUrlValue] = useState('');
  const [urlType, setUrlType] = useState('internal');
  const [targetBlank, setTargetBlank] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Detectar clique em elementos navegáveis com Ctrl pressionado
  useEffect(() => {
    if (!isOwner || !isActive) return;

    const handleClick = (e: MouseEvent) => {
      // Ctrl+Click = editar URL
      if (!e.ctrlKey) return;

      const target = e.target as HTMLElement;
      
      // Ignorar UI do sistema
      if (target.closest('[data-godmode-panel]') || 
          target.closest('[data-master-menu]') ||
          target.closest('[data-master-url-editor]')) {
        return;
      }

      // Procurar elemento navegável
      const link = target.closest('a') as HTMLAnchorElement;
      const button = target.closest('button, [role="button"]') as HTMLElement;
      const clickable = target.closest('[onclick], [data-href], [data-url]') as HTMLElement;

      let elementToEdit: HTMLElement | null = null;
      let originalHref = '';
      let elementType: URLEditorElement['elementType'] = 'other';

      if (link) {
        elementToEdit = link;
        originalHref = link.href || link.getAttribute('href') || '';
        elementType = 'a';
      } else if (button) {
        elementToEdit = button;
        // Tentar extrair URL de atributos data
        originalHref = button.dataset.href || button.dataset.url || '';
        elementType = 'button';
      } else if (clickable) {
        elementToEdit = clickable;
        originalHref = clickable.dataset.href || clickable.dataset.url || '';
        elementType = 'div';
      }

      if (elementToEdit) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const rect = elementToEdit.getBoundingClientRect();
        
        // Gerar key única para o elemento
        const elementId = elementToEdit.id || '';
        const elementText = elementToEdit.innerText?.slice(0, 30)?.replace(/[^a-zA-Z0-9]/g, '_') || '';
        const contentKey = `url_${elementType}_${elementId || elementText}_${Date.now()}`;

        setEditingElement({
          element: elementToEdit,
          originalHref,
          elementType,
          rect,
          contentKey,
        });

        // Detectar tipo de URL
        if (originalHref.startsWith('/')) {
          setUrlType('internal');
          setUrlValue(originalHref);
        } else if (originalHref.startsWith('mailto:')) {
          setUrlType('email');
          setUrlValue(originalHref.replace('mailto:', ''));
        } else if (originalHref.startsWith('tel:')) {
          setUrlType('phone');
          setUrlValue(originalHref.replace('tel:', ''));
        } else if (originalHref.startsWith('#')) {
          setUrlType('anchor');
          setUrlValue(originalHref);
        } else {
          setUrlType('external');
          setUrlValue(originalHref);
        }

        setTargetBlank(elementToEdit.getAttribute('target') === '_blank');

        elementToEdit.style.outline = '3px solid hsl(280 80% 50%)';
        elementToEdit.style.outlineOffset = '3px';

        console.log('🔗 Elemento de URL selecionado:', {
          type: elementType,
          href: originalHref,
          element: elementToEdit.tagName,
        });
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [isOwner, isActive]);

  // Focar input ao abrir
  useEffect(() => {
    if (editingElement) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [editingElement]);

  // Construir URL final
  const buildFinalURL = useCallback(() => {
    const typeConfig = URL_TYPES.find(t => t.value === urlType);
    if (!typeConfig) return urlValue;

    // Se já tem o prefixo, não adicionar novamente
    if (urlValue.startsWith(typeConfig.prefix)) {
      return urlValue;
    }

    return typeConfig.prefix + urlValue;
  }, [urlValue, urlType]);

  // Salvar URL
  const handleSave = useCallback(async () => {
    if (!editingElement) return;

    setIsSaving(true);
    try {
      const finalURL = buildFinalURL();

      // Aplicar no elemento
      if (editingElement.elementType === 'a') {
        (editingElement.element as HTMLAnchorElement).href = finalURL;
      } else {
        editingElement.element.dataset.href = finalURL;
        editingElement.element.dataset.url = finalURL;
      }

      // Configurar target
      if (targetBlank) {
        editingElement.element.setAttribute('target', '_blank');
        editingElement.element.setAttribute('rel', 'noopener noreferrer');
      } else {
        editingElement.element.removeAttribute('target');
        editingElement.element.removeAttribute('rel');
      }

      // Adicionar handler de navegação para buttons/divs
      if (editingElement.elementType !== 'a' && finalURL) {
        editingElement.element.style.cursor = 'pointer';
        editingElement.element.onclick = (e) => {
          e.preventDefault();
          if (finalURL.startsWith('/')) {
            window.location.href = finalURL;
          } else if (targetBlank) {
            window.open(finalURL, '_blank');
          } else {
            window.location.href = finalURL;
          }
        };
      }

      // Salvar no banco
      const { error } = await supabase
        .from('editable_content')
        .upsert({
          content_key: editingElement.contentKey || `url_${Date.now()}`,
          content_value: JSON.stringify({
            original_url: editingElement.originalHref,
            new_url: finalURL,
            target: targetBlank ? '_blank' : '_self',
            element_type: editingElement.elementType,
          }),
          content_type: 'url',
          page_key: window.location.pathname.replace(/\//g, '_') || 'global',
        }, { onConflict: 'content_key' });

      if (error) throw error;

      toast.success('🔗 URL atualizada!', {
        description: `Novo destino: ${finalURL}`,
      });

      handleClose();
    } catch (error) {
      console.error('Erro ao salvar URL:', error);
      toast.error('Erro ao salvar URL');
    } finally {
      setIsSaving(false);
    }
  }, [editingElement, buildFinalURL, targetBlank]);

  // Cancelar/Fechar
  const handleClose = useCallback(() => {
    if (editingElement) {
      editingElement.element.style.outline = '';
      editingElement.element.style.outlineOffset = '';
    }
    setEditingElement(null);
    setUrlValue('');
    setUrlType('internal');
    setTargetBlank(false);
  }, [editingElement]);

  // Restaurar URL original
  const handleRestore = useCallback(() => {
    if (editingElement?.originalHref) {
      setUrlValue(editingElement.originalHref);
    }
  }, [editingElement]);

  // Copiar URL
  const handleCopy = useCallback(() => {
    const finalURL = buildFinalURL();
    navigator.clipboard.writeText(finalURL);
    toast.success('URL copiada!');
  }, [buildFinalURL]);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editingElement) return;

      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingElement, handleSave, handleClose]);

  if (!isOwner || !isActive || !editingElement) return null;

  const typeConfig = URL_TYPES.find(t => t.value === urlType);
  const TypeIcon = typeConfig?.icon || Link2;

  return (
    <AnimatePresence>
      <motion.div
        data-master-url-editor
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed z-[10002] bg-card/95 backdrop-blur-xl border-2 border-primary/50 rounded-2xl shadow-2xl p-5"
        style={{
          top: Math.min(editingElement.rect.bottom + 15, window.innerHeight - 400),
          left: Math.min(editingElement.rect.left, window.innerWidth - 420),
          width: 400,
          boxShadow: '0 0 60px rgba(168, 85, 247, 0.4)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20">
              <Link2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Editar Destino/URL</h3>
              <p className="text-xs text-muted-foreground">Ctrl+Click em qualquer link</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tipo de URL */}
        <div className="space-y-3 mb-4">
          <Label className="text-xs text-muted-foreground">Tipo de Link</Label>
          <Select value={urlType} onValueChange={setUrlType}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {URL_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className="h-4 w-4" />
                    <span>{type.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Input de URL */}
        <div className="space-y-3 mb-4">
          <Label className="text-xs text-muted-foreground">
            {urlType === 'internal' ? 'Rota Interna' : 'URL'}
          </Label>
          
          {urlType === 'internal' ? (
            <div className="space-y-2">
              <Select value={urlValue} onValueChange={setUrlValue}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma rota..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {INTERNAL_ROUTES.map((route) => (
                    <SelectItem key={route.path} value={route.path}>
                      <div className="flex items-center gap-2">
                        <Navigation className="h-3 w-3" />
                        <span>{route.label}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{route.path}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                ref={inputRef}
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="/rota-personalizada"
                className="text-sm"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-2 bg-muted rounded-l-lg border-r text-muted-foreground text-sm">
                <TypeIcon className="h-4 w-4" />
                <span>{typeConfig?.prefix}</span>
              </div>
              <Input
                ref={inputRef}
                value={urlValue.replace(typeConfig?.prefix || '', '')}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder={urlType === 'email' ? 'email@exemplo.com' : urlType === 'phone' ? '+5511999999999' : 'exemplo.com'}
                className="text-sm flex-1 rounded-l-none"
              />
            </div>
          )}
        </div>

        {/* Target blank */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-4">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm cursor-pointer">Abrir em nova aba</Label>
          </div>
          <Switch checked={targetBlank} onCheckedChange={setTargetBlank} />
        </div>

        {/* Preview */}
        <div className="p-3 bg-muted/30 rounded-lg mb-4 border border-border/50">
          <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
          <div className="flex items-center gap-2 text-sm font-mono text-primary break-all">
            <MousePointer className="h-4 w-4 flex-shrink-0" />
            <span>{buildFinalURL() || '-'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={handleRestore} className="text-muted-foreground">
              <RotateCcw className="h-3 w-3 mr-1" />
              Original
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              <Copy className="h-3 w-3 mr-1" />
              Copiar
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={isSaving || !urlValue}
              className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400"
            >
              {isSaving ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Hint */}
        <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-2 text-[10px] text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          <span>Ctrl+Click em qualquer link/botão/menu para editar o destino</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
