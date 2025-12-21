// ============================================
// MOISÉS MEDEIROS v17.0 - MASTER URL EDITOR ULTRA
// Editor de URLs/Destinos SOBERANO para QUALQUER elemento
// OWNER tem controle TOTAL sobre TODOS os links do sistema
// Ctrl+Click OU Clique Simples (com modo ativo) = EDITAR
// Owner exclusivo: moisesblank@gmail.com
// ============================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, X, Link2, ExternalLink, Globe, 
  Navigation, Sparkles, Copy, RotateCcw,
  MousePointer, Hash, Mail, Phone, FileText,
  Zap, Settings, Target, Edit3
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
  elementType: 'a' | 'button' | 'div' | 'span' | 'nav' | 'menu' | 'other';
  rect: DOMRect;
  contentKey?: string;
  elementPath?: string;
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
  { value: 'action', label: 'Ação JavaScript', icon: Zap, prefix: 'javascript:' },
  { value: 'whatsapp', label: 'WhatsApp', icon: Phone, prefix: 'https://wa.me/' },
];

// Rotas internas comuns - EXPANDIDO
const INTERNAL_ROUTES = [
  { path: '/', label: 'Home (Landing Page)' },
  { path: '/dashboard', label: 'Dashboard Principal' },
  { path: '/alunos', label: 'Gestão de Alunos' },
  { path: '/funcionarios', label: 'Funcionários' },
  { path: '/afiliados', label: 'Programa de Afiliados' },
  { path: '/financas-empresa', label: 'Finanças Empresa' },
  { path: '/financas-pessoais', label: 'Finanças Pessoais' },
  { path: '/marketing', label: 'Marketing Digital' },
  { path: '/cursos', label: 'Cursos' },
  { path: '/tarefas', label: 'Gestão de Tarefas' },
  { path: '/calendario', label: 'Calendário' },
  { path: '/configuracoes', label: 'Configurações' },
  { path: '/contabilidade', label: 'Contabilidade' },
  { path: '/ia-central', label: 'IA Central / TRAMON' },
  { path: '/webhooks', label: 'Webhooks & Integrações' },
  { path: '/monitoramento', label: 'Monitoramento' },
  { path: '/dev', label: 'Área de Desenvolvimento' },
  { path: '/login', label: 'Login' },
  { path: '/register', label: 'Cadastro' },
  { path: '/arquivos', label: 'Gestão de Arquivos' },
  { path: '/relatorios', label: 'Relatórios' },
  { path: '/certificados', label: 'Certificados' },
  { path: '/gamificacao', label: 'Gamificação' },
  { path: '/comunicacao', label: 'Comunicação' },
  { path: '/vida-pessoal', label: 'Vida Pessoal (Owner)' },
];

// Links externos frequentes
const EXTERNAL_LINKS = [
  { url: 'https://www.moisesmedeiros.com.br', label: 'Site Principal' },
  { url: 'https://hotmart.com', label: 'Hotmart' },
  { url: 'https://instagram.com/profmoisesmedeiros', label: 'Instagram' },
  { url: 'https://youtube.com/@moisesmedeiros', label: 'YouTube' },
  { url: 'https://api.whatsapp.com/send?phone=5511999999999', label: 'WhatsApp' },
];

export function MasterURLEditor() {
  const { isOwner, isActive } = useGodMode();
  const [editingElement, setEditingElement] = useState<URLEditorElement | null>(null);
  const [urlValue, setUrlValue] = useState('');
  const [urlType, setUrlType] = useState('internal');
  const [targetBlank, setTargetBlank] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [urlEditMode, setUrlEditMode] = useState<'ctrl-click' | 'all-clicks'>('ctrl-click');
  const inputRef = useRef<HTMLInputElement>(null);

  // Gerar caminho único do elemento para identificação
  const generateElementPath = useCallback((element: HTMLElement): string => {
    const path: string[] = [];
    let current: HTMLElement | null = element;
    
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.id) {
        selector += `#${current.id}`;
      } else if (current.className && typeof current.className === 'string') {
        const classes = current.className.split(' ').filter(c => c && !c.startsWith('hover:')).slice(0, 2);
        if (classes.length) selector += `.${classes.join('.')}`;
      }
      path.unshift(selector);
      current = current.parentElement;
    }
    
    return path.join(' > ').slice(0, 200);
  }, []);

  // Detectar clique em QUALQUER elemento clicável
  useEffect(() => {
    if (!isOwner || !isActive) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Ignorar UI do sistema MASTER
      if (target.closest('[data-godmode-panel]') || 
          target.closest('[data-master-menu]') ||
          target.closest('[data-master-url-editor]') ||
          target.closest('[data-radix-popper-content-wrapper]') ||
          target.closest('.sonner-toast')) {
        return;
      }

      // MODO: Ctrl+Click OU Alt+Click = sempre edita
      const shouldEdit = e.ctrlKey || e.altKey;
      if (!shouldEdit) return;

      // Encontrar elemento clicável mais próximo
      const link = target.closest('a') as HTMLAnchorElement;
      const button = target.closest('button, [role="button"]') as HTMLElement;
      const navItem = target.closest('nav a, nav button, [data-nav-item]') as HTMLElement;
      const menuItem = target.closest('[role="menuitem"], [data-menu-item], .menu-item') as HTMLElement;
      const clickable = target.closest('[onclick], [data-href], [data-url], [data-action]') as HTMLElement;
      const anyClickable = target.closest('[class*="cursor-pointer"], [class*="hover:"]') as HTMLElement;

      let elementToEdit: HTMLElement | null = null;
      let originalHref = '';
      let elementType: URLEditorElement['elementType'] = 'other';

      // Prioridade: link > navItem > menuItem > button > clickable > any
      if (link) {
        elementToEdit = link;
        originalHref = link.href || link.getAttribute('href') || '';
        elementType = 'a';
      } else if (navItem) {
        elementToEdit = navItem;
        originalHref = navItem.getAttribute('href') || navItem.dataset.href || '';
        elementType = 'nav';
      } else if (menuItem) {
        elementToEdit = menuItem;
        originalHref = menuItem.dataset.href || menuItem.dataset.url || '';
        elementType = 'menu';
      } else if (button) {
        elementToEdit = button;
        originalHref = button.dataset.href || button.dataset.url || button.getAttribute('formaction') || '';
        elementType = 'button';
      } else if (clickable) {
        elementToEdit = clickable;
        originalHref = clickable.dataset.href || clickable.dataset.url || '';
        elementType = 'div';
      } else if (anyClickable && (anyClickable.onclick || anyClickable.getAttribute('onclick'))) {
        elementToEdit = anyClickable;
        originalHref = '';
        elementType = 'span';
      }

      // Se encontrou elemento, abrir editor
      if (elementToEdit) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const rect = elementToEdit.getBoundingClientRect();
        const elementPath = generateElementPath(elementToEdit);
        
        // Gerar key persistente baseada no caminho
        const elementId = elementToEdit.id || '';
        const elementText = elementToEdit.innerText?.slice(0, 20)?.replace(/[^a-zA-Z0-9]/g, '_') || '';
        const pathHash = elementPath.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0).toString(36);
        const contentKey = `url_${elementType}_${elementId || elementText}_${pathHash}`;

        setEditingElement({
          element: elementToEdit,
          originalHref,
          elementType,
          rect,
          contentKey,
          elementPath,
        });

        // Detectar tipo de URL existente
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
        } else if (originalHref.includes('wa.me') || originalHref.includes('whatsapp')) {
          setUrlType('whatsapp');
          setUrlValue(originalHref.replace(/https?:\/\/wa\.me\//, '').replace(/https?:\/\/api\.whatsapp\.com\/send\?phone=/, ''));
        } else if (originalHref.startsWith('javascript:')) {
          setUrlType('action');
          setUrlValue(originalHref.replace('javascript:', ''));
        } else if (originalHref) {
          setUrlType('external');
          setUrlValue(originalHref);
        } else {
          // Sem URL - padrão interno
          setUrlType('internal');
          setUrlValue('');
        }

        setTargetBlank(elementToEdit.getAttribute('target') === '_blank');

        // Highlight visual
        elementToEdit.style.outline = '3px solid hsl(280 80% 50%)';
        elementToEdit.style.outlineOffset = '4px';
        elementToEdit.style.transition = 'outline 0.2s ease';

        console.log('🔗 MASTER URL Editor - Elemento capturado:', {
          type: elementType,
          href: originalHref,
          element: elementToEdit.tagName,
          path: elementPath,
          key: contentKey,
        });

        toast.info('🔗 Elemento selecionado para edição de URL', { duration: 1500 });
      }
    };

    // Capturar no fase de captura para máxima prioridade
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [isOwner, isActive, generateElementPath]);

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

  // Cancelar/Fechar - DEFINIDO ANTES de handleSave
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

  // Salvar URL - CORRIGIDO PARA FUNCIONAR 100%
  const handleSave = useCallback(async () => {
    if (!editingElement) return;

    setIsSaving(true);
    const finalURL = buildFinalURL();
    const contentKey = editingElement.contentKey || `url_${editingElement.elementType}_${Date.now()}`;

    console.log('🔗 [MasterURLEditor] Iniciando salvamento:', {
      contentKey,
      finalURL,
      targetBlank,
      elementType: editingElement.elementType
    });

    try {
      // 1. Aplicar no elemento IMEDIATAMENTE
      if (editingElement.elementType === 'a') {
        (editingElement.element as HTMLAnchorElement).href = finalURL;
      } else {
        editingElement.element.dataset.href = finalURL;
        editingElement.element.dataset.url = finalURL;
      }

      // 2. Configurar target
      if (targetBlank) {
        editingElement.element.setAttribute('target', '_blank');
        editingElement.element.setAttribute('rel', 'noopener noreferrer');
      } else {
        editingElement.element.removeAttribute('target');
        editingElement.element.removeAttribute('rel');
      }

      // 3. Adicionar handler de navegação para buttons/divs
      if (editingElement.elementType !== 'a' && finalURL) {
        editingElement.element.style.cursor = 'pointer';
        const url = finalURL; // Capturar em closure
        const openBlank = targetBlank;
        editingElement.element.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (url.startsWith('/')) {
            window.location.href = url;
          } else if (openBlank) {
            window.open(url, '_blank', 'noopener,noreferrer');
          } else {
            window.location.href = url;
          }
        };
      }

      // 4. SALVAR NO BANCO - Usar INSERT/UPDATE separado para debug
      const contentData = {
        content_key: contentKey,
        content_value: JSON.stringify({
          original_url: editingElement.originalHref,
          new_url: finalURL,
          target: targetBlank ? '_blank' : '_self',
          element_type: editingElement.elementType,
          element_path: editingElement.elementPath,
          saved_at: new Date().toISOString(),
        }),
        content_type: 'url',
        page_key: window.location.pathname.replace(/\//g, '_') || 'global',
        updated_at: new Date().toISOString(),
      };

      console.log('📝 [MasterURLEditor] Dados para salvar:', contentData);

      // Verificar se já existe
      const { data: existing, error: selectError } = await supabase
        .from('editable_content')
        .select('id')
        .eq('content_key', contentKey)
        .maybeSingle();

      if (selectError) {
        console.error('❌ [MasterURLEditor] Erro ao verificar:', selectError);
      }

      let saveError;
      
      if (existing) {
        // UPDATE
        console.log('📝 [MasterURLEditor] Atualizando registro existente:', existing.id);
        const { error } = await supabase
          .from('editable_content')
          .update({
            content_value: contentData.content_value,
            updated_at: contentData.updated_at,
          })
          .eq('content_key', contentKey);
        saveError = error;
      } else {
        // INSERT
        console.log('📝 [MasterURLEditor] Inserindo novo registro...');
        const { error } = await supabase
          .from('editable_content')
          .insert(contentData);
        saveError = error;
      }

      if (saveError) {
        console.error('❌ [MasterURLEditor] Erro ao salvar:', saveError);
        throw saveError;
      }

      console.log('✅ [MasterURLEditor] Salvo com sucesso!');

      toast.success('🔗 URL salva com sucesso!', {
        description: `Destino: ${finalURL}`,
        duration: 4000,
      });

      // Emitir evento para sincronização global
      window.dispatchEvent(new CustomEvent('global-sync'));
      window.dispatchEvent(new CustomEvent('url-updated', { 
        detail: { key: contentKey, url: finalURL } 
      }));

      handleClose();
    } catch (error: any) {
      console.error('❌ [MasterURLEditor] Erro crítico:', error);
      toast.error('Erro ao salvar URL', {
        description: error?.message || 'Verifique o console para detalhes',
      });
    } finally {
      setIsSaving(false);
    }
  }, [editingElement, buildFinalURL, targetBlank, handleClose]);

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
