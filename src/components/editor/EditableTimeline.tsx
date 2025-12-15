// ============================================
// MOISÉS MEDEIROS v8.0 - EDITABLE TIMELINE
// Cronograma/Semanas editável
// ============================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Edit3, 
  Trash2, 
  Plus,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  date?: string;
  status: "completed" | "current" | "upcoming" | "locked";
  icon?: string;
  isVisible: boolean;
  items?: {
    id: string;
    text: string;
    completed: boolean;
  }[];
}

export interface TimelineWeek {
  id: string;
  weekNumber: number;
  title: string;
  dateRange?: string;
  isVisible: boolean;
  isExpanded: boolean;
  items: TimelineItem[];
}

interface EditableTimelineProps {
  weeks: TimelineWeek[];
  isEditMode: boolean;
  canEdit: boolean;
  onWeeksChange?: (weeks: TimelineWeek[]) => void;
  className?: string;
}

export function EditableTimeline({
  weeks,
  isEditMode,
  canEdit,
  onWeeksChange,
  className = ""
}: EditableTimelineProps) {
  const [editingWeek, setEditingWeek] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  const handleWeekToggle = (weekId: string) => {
    const updated = weeks.map(w => 
      w.id === weekId ? { ...w, isExpanded: !w.isExpanded } : w
    );
    onWeeksChange?.(updated);
  };

  const handleWeekVisibility = (weekId: string, visible: boolean) => {
    const updated = weeks.map(w => 
      w.id === weekId ? { ...w, isVisible: visible } : w
    );
    onWeeksChange?.(updated);
  };

  const handleItemVisibility = (weekId: string, itemId: string, visible: boolean) => {
    const updated = weeks.map(w => {
      if (w.id === weekId) {
        return {
          ...w,
          items: w.items.map(item => 
            item.id === itemId ? { ...item, isVisible: visible } : item
          )
        };
      }
      return w;
    });
    onWeeksChange?.(updated);
  };

  const handleAddWeek = () => {
    const newWeek: TimelineWeek = {
      id: Date.now().toString(),
      weekNumber: weeks.length + 1,
      title: `Semana ${weeks.length + 1}`,
      isVisible: true,
      isExpanded: true,
      items: []
    };
    onWeeksChange?.([...weeks, newWeek]);
  };

  const handleDeleteWeek = (weekId: string) => {
    const updated = weeks.filter(w => w.id !== weekId);
    onWeeksChange?.(updated);
  };

  const handleAddItem = (weekId: string) => {
    const newItem: TimelineItem = {
      id: Date.now().toString(),
      title: "Novo Item",
      status: "upcoming",
      isVisible: true
    };
    const updated = weeks.map(w => {
      if (w.id === weekId) {
        return { ...w, items: [...w.items, newItem] };
      }
      return w;
    });
    onWeeksChange?.(updated);
  };

  const handleDeleteItem = (weekId: string, itemId: string) => {
    const updated = weeks.map(w => {
      if (w.id === weekId) {
        return { ...w, items: w.items.filter(item => item.id !== itemId) };
      }
      return w;
    });
    onWeeksChange?.(updated);
  };

  const handleUpdateWeek = (weekId: string, field: keyof TimelineWeek, value: any) => {
    const updated = weeks.map(w => 
      w.id === weekId ? { ...w, [field]: value } : w
    );
    onWeeksChange?.(updated);
  };

  const handleUpdateItem = (weekId: string, itemId: string, field: keyof TimelineItem, value: any) => {
    const updated = weeks.map(w => {
      if (w.id === weekId) {
        return {
          ...w,
          items: w.items.map(item => 
            item.id === itemId ? { ...item, [field]: value } : item
          )
        };
      }
      return w;
    });
    onWeeksChange?.(updated);
  };

  const getStatusIcon = (status: TimelineItem["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "current":
        return <Circle className="h-5 w-5 text-primary fill-primary" />;
      case "upcoming":
        return <Circle className="h-5 w-5 text-muted-foreground" />;
      case "locked":
        return <Circle className="h-5 w-5 text-muted-foreground/30" />;
    }
  };

  const visibleWeeks = isEditMode ? weeks : weeks.filter(w => w.isVisible);

  return (
    <div className={cn("space-y-6", className)}>
      {visibleWeeks.map((week, weekIndex) => {
        const visibleItems = isEditMode ? week.items : week.items.filter(item => item.isVisible);
        
        // Se a semana não está visível e não estamos em modo de edição, pula
        if (!week.isVisible && !isEditMode) return null;

        return (
          <motion.div
            key={week.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: weekIndex * 0.1 }}
            className={cn(
              "relative",
              !week.isVisible && isEditMode && "opacity-50"
            )}
          >
            <Card className={cn(
              "overflow-hidden",
              isEditMode && canEdit && "border-dashed border-2 hover:border-primary/50"
            )}>
              {/* Week Header */}
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Drag Handle */}
                    {isEditMode && canEdit && (
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    )}
                    
                    {/* Week Number Badge */}
                    <Badge variant="outline" className="text-sm">
                      Semana {week.weekNumber}
                    </Badge>
                    
                    {/* Title */}
                    {editingWeek === week.id ? (
                      <Input
                        value={week.title}
                        onChange={(e) => handleUpdateWeek(week.id, 'title', e.target.value)}
                        className="max-w-[200px] h-8"
                        onBlur={() => setEditingWeek(null)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingWeek(null)}
                        autoFocus
                      />
                    ) : (
                      <CardTitle 
                        className={cn(
                          "text-lg",
                          isEditMode && canEdit && "cursor-pointer hover:text-primary"
                        )}
                        onClick={() => isEditMode && canEdit && setEditingWeek(week.id)}
                      >
                        {week.title}
                      </CardTitle>
                    )}
                    
                    {week.dateRange && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {week.dateRange}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Edit Mode Controls */}
                    {isEditMode && canEdit && (
                      <>
                        {/* Visibility Toggle */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleWeekVisibility(week.id, !week.isVisible)}
                        >
                          {week.isVisible ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        
                        {/* Delete Week */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteWeek(week.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}

                    {/* Expand/Collapse */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleWeekToggle(week.id)}
                    >
                      {week.isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Week Content */}
              <AnimatePresence>
                {week.isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <CardContent className="pt-0">
                      {/* Timeline Items */}
                      <div className="relative pl-6 border-l-2 border-muted space-y-4">
                        {visibleItems.map((item, itemIndex) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: itemIndex * 0.05 }}
                            className={cn(
                              "relative group",
                              !item.isVisible && isEditMode && "opacity-50"
                            )}
                          >
                            {/* Status Icon */}
                            <div className="absolute -left-[calc(0.75rem+1px)] top-1">
                              {getStatusIcon(item.status)}
                            </div>

                            {/* Item Content */}
                            <div className={cn(
                              "ml-4 p-3 rounded-lg transition-colors",
                              item.status === "current" && "bg-primary/10 border border-primary/20",
                              item.status === "completed" && "bg-green-500/10",
                              item.status === "locked" && "opacity-50"
                            )}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  {editingItem === item.id ? (
                                    <div className="space-y-2">
                                      <Input
                                        value={item.title}
                                        onChange={(e) => handleUpdateItem(week.id, item.id, 'title', e.target.value)}
                                        placeholder="Título"
                                      />
                                      <Textarea
                                        value={item.description || ""}
                                        onChange={(e) => handleUpdateItem(week.id, item.id, 'description', e.target.value)}
                                        placeholder="Descrição (opcional)"
                                        rows={2}
                                      />
                                      <div className="flex gap-2">
                                        <Button size="sm" onClick={() => setEditingItem(null)}>
                                          <Check className="h-3 w-3 mr-1" />
                                          Salvar
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)}>
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className={cn(
                                        "font-medium",
                                        isEditMode && canEdit && "cursor-pointer hover:text-primary"
                                      )}
                                        onClick={() => isEditMode && canEdit && setEditingItem(item.id)}
                                      >
                                        {item.title}
                                      </p>
                                      {item.description && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {item.description}
                                        </p>
                                      )}
                                    </>
                                  )}
                                </div>

                                {/* Item Controls */}
                                {isEditMode && canEdit && editingItem !== item.id && (
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => handleItemVisibility(week.id, item.id, !item.isVisible)}
                                    >
                                      {item.isVisible ? (
                                        <Eye className="h-3 w-3 text-green-600" />
                                      ) : (
                                        <EyeOff className="h-3 w-3" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => setEditingItem(item.id)}
                                    >
                                      <Edit3 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-destructive"
                                      onClick={() => handleDeleteItem(week.id, item.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}

                        {/* Add Item Button */}
                        {isEditMode && canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-4 border-dashed border"
                            onClick={() => handleAddItem(week.id)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Adicionar Item
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        );
      })}

      {/* Add Week Button */}
      {isEditMode && canEdit && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center"
        >
          <Button
            variant="outline"
            className="border-dashed border-2"
            onClick={handleAddWeek}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Semana
          </Button>
        </motion.div>
      )}
    </div>
  );
}
