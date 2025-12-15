// ============================================
// MOISÉS MEDEIROS v8.0 - EDITABLE SECTION
// Seção editável com toggle de visibilidade
// Sistema Elementor Avançado
// ============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Eye, 
  EyeOff, 
  GripVertical, 
  Settings, 
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Copy,
  Move
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface EditableSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
  isEditMode: boolean;
  canEdit: boolean;
  isVisible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function EditableSection({
  id,
  title,
  children,
  isEditMode,
  canEdit,
  isVisible = true,
  onVisibilityChange,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  className = "",
  collapsible = false,
  defaultCollapsed = false
}: EditableSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [showSettings, setShowSettings] = useState(false);

  // Se não está em modo de edição e a seção está oculta, não renderiza
  if (!isEditMode && !isVisible) {
    return null;
  }

  const showEditControls = isEditMode && canEdit;

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "relative group/section",
        !isVisible && isEditMode && "opacity-50",
        showEditControls && "border-2 border-dashed border-transparent hover:border-primary/30 rounded-xl",
        className
      )}
    >
      {/* Edit Mode Overlay */}
      {showEditControls && (
        <div className="absolute -top-3 left-4 z-20 flex items-center gap-2">
          {/* Section Title Badge */}
          <Badge 
            variant="outline" 
            className={cn(
              "bg-background/95 backdrop-blur-sm shadow-sm transition-all",
              !isVisible && "bg-muted"
            )}
          >
            {!isVisible && <EyeOff className="h-3 w-3 mr-1" />}
            {title}
          </Badge>

          {/* Quick Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity">
            {/* Visibility Toggle */}
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 bg-background/95 backdrop-blur-sm"
              onClick={() => onVisibilityChange?.(!isVisible)}
              title={isVisible ? "Ocultar seção" : "Mostrar seção"}
            >
              {isVisible ? (
                <Eye className="h-3 w-3 text-green-600" />
              ) : (
                <EyeOff className="h-3 w-3 text-muted-foreground" />
              )}
            </Button>

            {/* Collapse Toggle (if collapsible) */}
            {collapsible && (
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 bg-background/95 backdrop-blur-sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? "Expandir" : "Recolher"}
              >
                {isCollapsed ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronUp className="h-3 w-3" />
                )}
              </Button>
            )}

            {/* Settings Popover */}
            <Popover open={showSettings} onOpenChange={setShowSettings}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 bg-background/95 backdrop-blur-sm"
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="start">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Configurações da Seção</h4>
                  
                  {/* Visibility Switch */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-muted-foreground">Visível</label>
                    <Switch
                      checked={isVisible}
                      onCheckedChange={(checked) => onVisibilityChange?.(checked)}
                    />
                  </div>

                  <div className="border-t pt-3 space-y-1">
                    {/* Move Actions */}
                    {onMoveUp && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={onMoveUp}
                      >
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Mover para cima
                      </Button>
                    )}
                    {onMoveDown && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={onMoveDown}
                      >
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Mover para baixo
                      </Button>
                    )}
                    
                    {/* Duplicate */}
                    {onDuplicate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={onDuplicate}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicar seção
                      </Button>
                    )}

                    {/* Delete */}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-destructive hover:text-destructive"
                        onClick={onDelete}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover seção
                      </Button>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {/* Drag Handle (for future drag-and-drop) */}
      {showEditControls && (
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/section:opacity-100 transition-opacity cursor-move">
          <div className="p-1 rounded bg-muted/80 backdrop-blur-sm">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed State */}
      {isCollapsed && showEditControls && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 text-center text-muted-foreground bg-muted/30 rounded-lg"
        >
          <p className="text-sm">Seção recolhida - clique em expandir para ver o conteúdo</p>
        </motion.div>
      )}
    </motion.div>
  );
}

// Componente auxiliar para adicionar novas seções
interface AddSectionButtonProps {
  onAdd: (type: string) => void;
  isEditMode: boolean;
  canEdit: boolean;
}

export function AddSectionButton({ onAdd, isEditMode, canEdit }: AddSectionButtonProps) {
  const [showOptions, setShowOptions] = useState(false);

  if (!isEditMode || !canEdit) return null;

  const sectionTypes = [
    { type: "text", label: "Texto", icon: "📝" },
    { type: "image", label: "Imagem", icon: "🖼️" },
    { type: "video", label: "Vídeo", icon: "🎬" },
    { type: "cards", label: "Cards", icon: "📦" },
    { type: "stats", label: "Estatísticas", icon: "📊" },
    { type: "cta", label: "Botão CTA", icon: "🔘" },
    { type: "flashcards", label: "Flashcards", icon: "🃏" },
    { type: "quiz", label: "Quiz", icon: "❓" },
    { type: "timeline", label: "Cronograma", icon: "📅" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex justify-center py-4"
    >
      <Popover open={showOptions} onOpenChange={setShowOptions}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="border-dashed border-2 hover:border-primary hover:bg-primary/5"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Seção
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="grid grid-cols-2 gap-2">
            {sectionTypes.map((section) => (
              <Button
                key={section.type}
                variant="ghost"
                className="justify-start h-auto py-3"
                onClick={() => {
                  onAdd(section.type);
                  setShowOptions(false);
                }}
              >
                <span className="text-lg mr-2">{section.icon}</span>
                <span className="text-sm">{section.label}</span>
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </motion.div>
  );
}
