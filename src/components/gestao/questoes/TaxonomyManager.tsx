// ============================================
// GESTOR DE TAXONOMIA DE QUESTÕES
// OWNER pode adicionar, editar e remover
// MACRO → MICRO → TEMA → SUBTEMA
// ============================================

import { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  Save,
  X,
  GripVertical,
  Loader2,
  FolderTree,
  Layers,
  Tag,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  useQuestionTaxonomy,
  useCreateTaxonomy,
  useUpdateTaxonomy,
  useDeleteTaxonomy,
  TaxonomyItem,
} from "@/hooks/useQuestionTaxonomy";

const LEVEL_CONFIG = {
  macro: { icon: FolderTree, color: "text-red-500", bg: "bg-red-500/10", label: "MACRO" },
  micro: { icon: Layers, color: "text-blue-500", bg: "bg-blue-500/10", label: "MICRO" },
  tema: { icon: Tag, color: "text-green-500", bg: "bg-green-500/10", label: "TEMA" },
  subtema: { icon: FileText, color: "text-purple-500", bg: "bg-purple-500/10", label: "SUBTEMA" },
};

const NEXT_LEVEL: Record<string, "micro" | "tema" | "subtema" | null> = {
  macro: "micro",
  micro: "tema",
  tema: "subtema",
  subtema: null,
};

interface TaxonomyNodeProps {
  item: TaxonomyItem;
  children: TaxonomyItem[];
  allItems: TaxonomyItem[];
  depth: number;
  onEdit: (item: TaxonomyItem) => void;
  onDelete: (item: TaxonomyItem) => void;
  onAdd: (parentId: string, level: "micro" | "tema" | "subtema") => void;
}

const TaxonomyNode = memo(function TaxonomyNode({
  item,
  children,
  allItems,
  depth,
  onEdit,
  onDelete,
  onAdd,
}: TaxonomyNodeProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const config = LEVEL_CONFIG[item.level];
  const Icon = config.icon;
  const nextLevel = NEXT_LEVEL[item.level];
  const hasChildren = children.length > 0;

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-2 py-2 px-3 rounded-lg transition-colors",
          "hover:bg-muted/50 group cursor-pointer",
          depth === 0 && "bg-muted/30"
        )}
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
      >
        {/* Expand/Collapse */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "w-5 h-5 flex items-center justify-center rounded transition-colors",
            hasChildren ? "hover:bg-muted" : "opacity-0 pointer-events-none"
          )}
        >
          {hasChildren &&
            (isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            ))}
        </button>

        {/* Icon */}
        <div className={cn("p-1.5 rounded", config.bg)}>
          <Icon className={cn("w-4 h-4", config.color)} />
        </div>

        {/* Label */}
        <span className="flex-1 font-medium text-sm">
          {item.icon && <span className="mr-1">{item.icon}</span>}
          {item.label}
        </span>

        {/* Level Badge */}
        <Badge variant="outline" className={cn("text-xs", config.color)}>
          {config.label}
        </Badge>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {nextLevel && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onAdd(item.id, nextLevel);
              }}
              title={`Adicionar ${LEVEL_CONFIG[nextLevel].label}`}
            >
              <Plus className="w-4 h-4 text-green-500" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            title="Editar"
          >
            <Edit2 className="w-4 h-4 text-blue-500" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item);
            }}
            title="Remover"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </div>

      {/* Children */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children.map((child) => (
              <TaxonomyNode
                key={child.id}
                item={child}
                children={allItems.filter((i) => i.parent_id === child.id)}
                allItems={allItems}
                depth={depth + 1}
                onEdit={onEdit}
                onDelete={onDelete}
                onAdd={onAdd}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

interface TaxonomyManagerProps {
  open: boolean;
  onClose: () => void;
}

export const TaxonomyManager = memo(function TaxonomyManager({
  open,
  onClose,
}: TaxonomyManagerProps) {
  const { data, isLoading } = useQuestionTaxonomy();
  const createMutation = useCreateTaxonomy();
  const updateMutation = useUpdateTaxonomy();
  const deleteMutation = useDeleteTaxonomy();

  const [editingItem, setEditingItem] = useState<TaxonomyItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<TaxonomyItem | null>(null);
  const [addingTo, setAddingTo] = useState<{
    parentId: string | null;
    level: "macro" | "micro" | "tema" | "subtema";
  } | null>(null);

  const [formLabel, setFormLabel] = useState("");
  const [formIcon, setFormIcon] = useState("");

  const items = data?.items || [];
  const macros = items.filter((i) => i.level === "macro");

  const handleEdit = useCallback((item: TaxonomyItem) => {
    setEditingItem(item);
    setFormLabel(item.label);
    setFormIcon(item.icon || "");
  }, []);

  const handleDelete = useCallback((item: TaxonomyItem) => {
    setDeletingItem(item);
  }, []);

  const handleAdd = useCallback(
    (parentId: string | null, level: "macro" | "micro" | "tema" | "subtema") => {
      setAddingTo({ parentId, level });
      setFormLabel("");
      setFormIcon("");
    },
    []
  );

  const handleSaveEdit = async () => {
    if (!editingItem || !formLabel.trim()) return;

    await updateMutation.mutateAsync({
      id: editingItem.id,
      label: formLabel.trim(),
      icon: formIcon.trim() || undefined,
    });

    setEditingItem(null);
  };

  const handleSaveNew = async () => {
    if (!addingTo || !formLabel.trim()) return;

    await createMutation.mutateAsync({
      parent_id: addingTo.parentId,
      level: addingTo.level,
      label: formLabel.trim(),
      icon: formIcon.trim() || undefined,
      position: items.filter((i) => i.parent_id === addingTo.parentId).length,
    });

    setAddingTo(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    await deleteMutation.mutateAsync(deletingItem.id);
    setDeletingItem(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-primary" />
              Gerenciar Taxonomia de Questões
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between py-2 border-b">
            <p className="text-sm text-muted-foreground">
              Gerencie a hierarquia: MACRO → MICRO → TEMA → SUBTEMA
            </p>
            <Button
              size="sm"
              onClick={() => handleAdd(null, "macro")}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo MACRO
            </Button>
          </div>

          <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : macros.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FolderTree className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma taxonomia cadastrada
                </p>
                <Button
                  size="sm"
                  className="mt-4"
                  onClick={() => handleAdd(null, "macro")}
                >
                  Criar primeiro MACRO
                </Button>
              </div>
            ) : (
              <div className="py-2 space-y-1">
                {macros.map((macro) => (
                  <TaxonomyNode
                    key={macro.id}
                    item={macro}
                    children={items.filter((i) => i.parent_id === macro.id)}
                    allItems={items}
                    depth={0}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAdd={handleAdd}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog
        open={!!editingItem}
        onOpenChange={() => setEditingItem(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar {editingItem?.level.toUpperCase()}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="Ex: Química Geral"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Ícone (emoji)</label>
              <Input
                value={formIcon}
                onChange={(e) => setFormIcon(e.target.value)}
                placeholder="Ex: ⚗️"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!formLabel.trim() || updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Adicionar */}
      <Dialog open={!!addingTo} onOpenChange={() => setAddingTo(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Adicionar {addingTo?.level.toUpperCase()}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="Ex: Química Geral"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium">Ícone (emoji)</label>
              <Input
                value={formIcon}
                onChange={(e) => setFormIcon(e.target.value)}
                placeholder="Ex: ⚗️"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddingTo(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveNew}
              disabled={!formLabel.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Exclusão */}
      <AlertDialog
        open={!!deletingItem}
        onOpenChange={() => setDeletingItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{deletingItem?.label}"?
              {deletingItem?.level !== "subtema" && (
                <span className="block mt-2 text-red-500 font-medium">
                  ⚠️ Todos os itens filhos também serão removidos!
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

export default TaxonomyManager;
