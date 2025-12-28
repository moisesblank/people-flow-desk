// ============================================
// MOISÉS MEDEIROS v17.0 - MASTER SECTION ORGANIZER
// Painel de reorganização de seções da landing page
// Drag & Drop para reordenar seções
// Owner exclusivo: moisesblank@gmail.com
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  GripVertical, Eye, EyeOff, Check, X, 
  LayoutGrid, ChevronUp, ChevronDown, 
  RotateCcw, Sparkles, Save, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGodMode } from '@/stores/godModeStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Definição das seções disponíveis
export interface LandingSection {
  id: string;
  name: string;
  icon: string;
  component: string;
  visible: boolean;
  order: number;
}

// Seções padrão da landing page
const DEFAULT_SECTIONS: LandingSection[] = [
  { id: 'hero', name: 'Hero Principal', icon: '🚀', component: 'HeroSection', visible: true, order: 0 },
  { id: 'stats', name: 'Estatísticas em Tempo Real', icon: '📊', component: 'RealtimeStats', visible: true, order: 1 },
  { id: 'approved-art', name: 'Arte dos Aprovados', icon: '🎨', component: 'MainApprovedArt', visible: true, order: 2 },
  { id: 'video', name: 'Vídeo do Professor', icon: '🎬', component: 'VideoSection', visible: true, order: 3 },
  { id: 'professor', name: 'Seção do Professor', icon: '👨‍🏫', component: 'ProfessorSection', visible: true, order: 4 },
  { id: 'app', name: 'App Exclusivo', icon: '📱', component: 'AppExclusivoSection', visible: true, order: 5 },
  { id: 'champions', name: 'Campeões - 1º Lugar', icon: '🏆', component: 'FirstPlaceShowcase', visible: true, order: 6 },
  { id: 'carousel', name: 'Carrossel de Aprovados', icon: '🎠', component: 'ApprovedCarousel', visible: true, order: 7 },
  { id: 'video-feedback', name: 'Feedbacks em Vídeo', icon: '📹', component: 'VideoFeedbackCarousel', visible: true, order: 8 },
  { id: 'testimonials', name: 'Depoimentos', icon: '💬', component: 'TestimonialsSection', visible: true, order: 9 },
  { id: 'features', name: 'Plataforma', icon: '⚡', component: 'FeaturesSection', visible: true, order: 10 },
  { id: 'materials', name: 'Materiais', icon: '📚', component: 'MaterialSection', visible: true, order: 11 },
  { id: 'ai', name: 'Automações IA', icon: '🤖', component: 'AIAutomationsSection', visible: true, order: 12 },
  { id: 'courses', name: 'Cursos', icon: '🎓', component: 'CoursesSection', visible: true, order: 13 },
  { id: 'faq', name: 'FAQ', icon: '❓', component: 'FAQSection', visible: true, order: 14 },
  { id: 'cta', name: 'CTA Final', icon: '🔥', component: 'EpicCTASection', visible: true, order: 15 },
];

const STORAGE_KEY = 'landing_sections_order';

interface MasterSectionOrganizerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderChange?: (sections: LandingSection[]) => void;
}

export function MasterSectionOrganizer({ isOpen, onClose, onOrderChange }: MasterSectionOrganizerProps) {
  const { isOwner, isActive } = useGodMode();
  const [sections, setSections] = useState<LandingSection[]>(DEFAULT_SECTIONS);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Carregar ordem salva
  useEffect(() => {
    loadSavedOrder();
  }, []);

  const loadSavedOrder = async () => {
    try {
      // Tentar carregar do Supabase primeiro
      const { data, error } = await supabase
        .from('editable_content')
        .select('content_value')
        .eq('content_key', STORAGE_KEY)
        .single();

      if (data && !error) {
        const savedSections = JSON.parse(data.content_value);
        setSections(savedSections);
        return;
      }

      // Fallback para localStorage
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        setSections(JSON.parse(localData));
      }
    } catch (error) {
      console.error('Erro ao carregar ordem das seções:', error);
    }
  };

  // Salvar ordem
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Atualizar ordens
      const updatedSections = sections.map((s, index) => ({ ...s, order: index }));
      
      // Salvar no Supabase
      const { error } = await supabase
        .from('editable_content')
        .upsert({
          content_key: STORAGE_KEY,
          content_value: JSON.stringify(updatedSections),
          content_type: 'config',
          page_key: 'home',
        }, { onConflict: 'content_key' });

      if (error) throw error;

      // Backup no localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSections));

      setSections(updatedSections);
      setHasChanges(false);
      onOrderChange?.(updatedSections);

      // Disparar evento global para atualizar a Home
      window.dispatchEvent(new CustomEvent('landing-sections-updated', { detail: updatedSections }));

      toast.success('🎯 Ordem das seções salva!', {
        description: 'Recarregue a página para ver as mudanças',
      });
    } catch (error) {
      console.error('Erro ao salvar ordem:', error);
      toast.error('Erro ao salvar ordem das seções');
    } finally {
      setIsSaving(false);
    }
  };

  // Resetar para padrão
  const handleReset = () => {
    setSections(DEFAULT_SECTIONS);
    setHasChanges(true);
    toast.info('Ordem resetada para padrão');
  };

  // Toggle visibilidade
  const toggleVisibility = (id: string) => {
    setSections(prev => prev.map(s => 
      s.id === id ? { ...s, visible: !s.visible } : s
    ));
    setHasChanges(true);
  };

  // Mover seção para cima
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    setSections(newSections);
    setHasChanges(true);
  };

  // Mover seção para baixo
  const moveDown = (index: number) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    setSections(newSections);
    setHasChanges(true);
  };

  // Handler de reordenação por drag
  const handleReorder = (newOrder: LandingSection[]) => {
    setSections(newOrder);
    setHasChanges(true);
  };

  if (!isOwner || !isActive || !isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10003] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="bg-card/95 backdrop-blur-xl border-2 border-primary/50 rounded-2xl shadow-2xl w-full max-w-lg"
          style={{ boxShadow: '0 0 80px rgba(168, 85, 247, 0.4)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Organizar Seções</h2>
                <p className="text-xs text-muted-foreground">Arraste para reorganizar a landing page</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Lista de seções */}
          <ScrollArea className="h-[400px] p-4">
            <Reorder.Group axis="y" values={sections} onReorder={handleReorder} className="space-y-2">
              {sections.map((section, index) => (
                <Reorder.Item
                  key={section.id}
                  value={section}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing",
                    section.visible 
                      ? "bg-background/80 border-border/50 hover:border-primary/50" 
                      : "bg-muted/30 border-border/20 opacity-60"
                  )}
                >
                  {/* Grip */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/50">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* Icon + Name */}
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-xl">{section.icon}</span>
                    <span className={cn("text-sm font-medium", !section.visible && "line-through")}>{section.name}</span>
                  </div>

                  {/* Order Controls */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveDown(index)}
                      disabled={index === sections.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Visibility Toggle */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toggleVisibility(section.id)}
                  >
                    {section.visible ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </ScrollArea>

          {/* Footer Actions */}
          <div className="flex items-center justify-between p-4 border-t border-border/50 bg-muted/30 rounded-b-2xl">
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground">
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetar
            </Button>

            <div className="flex items-center gap-2">
              {hasChanges && (
                <span className="text-xs text-yellow-500 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Alterações não salvas
                </span>
              )}
              <Button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400"
              >
                {isSaving ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Ordem
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook para usar as seções ordenadas
export function useLandingSections() {
  const [sections, setSections] = useState<LandingSection[]>(DEFAULT_SECTIONS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSections();

    const handleUpdate = (e: CustomEvent<LandingSection[]>) => {
      setSections(e.detail);
    };

    window.addEventListener('landing-sections-updated', handleUpdate as EventListener);
    return () => window.removeEventListener('landing-sections-updated', handleUpdate as EventListener);
  }, []);

  const loadSections = async () => {
    try {
      const { data, error } = await supabase
        .from('editable_content')
        .select('content_value')
        .eq('content_key', STORAGE_KEY)
        .single();

      if (data && !error) {
        setSections(JSON.parse(data.content_value));
      } else {
        // Fallback para localStorage
        const localData = localStorage.getItem(STORAGE_KEY);
        if (localData) {
          setSections(JSON.parse(localData));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar seções:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getVisibleSections = useCallback(() => {
    return sections.filter(s => s.visible).sort((a, b) => a.order - b.order);
  }, [sections]);

  return {
    sections,
    isLoading,
    getVisibleSections,
    reload: loadSections,
  };
}

export { DEFAULT_SECTIONS };
