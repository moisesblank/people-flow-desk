// ============================================
// MASTER MENU EDITOR - Editor Visual de Menu
// Drag-and-drop com @dnd-kit + CRUD completo
// ============================================

import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useMenuConfig, type MenuGroup, type MenuItem, type CreateGroupInput, type CreateItemInput, type UpdateGroupInput, type UpdateItemInput } from "@/hooks/useMenuConfig";
import { MenuGroupForm } from "./MenuGroupForm";
import { MenuItemForm } from "./MenuItemForm";
import { getIconComponent } from "@/lib/iconMap";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Pencil, Trash2, ChevronDown, ChevronRight, Lock, Save, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MasterMenuEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Componente Sortable para Itens
function SortableItem({ item, onEdit, onDelete }: { item: MenuItem; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const Icon = getIconComponent(item.item_icon);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 rounded-md bg-background border group",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      <span className="flex-1 text-sm truncate">{item.item_label}</span>
      {item.item_badge && <Badge variant="secondary" className="text-xs">{item.item_badge}</Badge>}
      {item.is_system && <Lock className="h-3 w-3 text-muted-foreground" />}
      <div className="opacity-0 group-hover:opacity-100 flex gap-1">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEdit}><Pencil className="h-3 w-3" /></Button>
        {!item.is_system && <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={onDelete}><Trash2 className="h-3 w-3" /></Button>}
      </div>
    </div>
  );
}

// Componente para Grupo
function GroupSection({ group, items, onEditGroup, onDeleteGroup, onAddItem, onEditItem, onDeleteItem, onReorderItems }: {
  group: MenuGroup;
  items: MenuItem[];
  onEditGroup: () => void;
  onDeleteGroup: () => void;
  onAddItem: () => void;
  onEditItem: (item: MenuItem) => void;
  onDeleteItem: (item: MenuItem) => void;
  onReorderItems: (items: MenuItem[]) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      onReorderItems(arrayMove(items, oldIndex, newIndex));
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className={cn("flex items-center gap-2 p-3 bg-gradient-to-r", group.group_color || "from-primary/20", "to-transparent")}>
        <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-white/20 rounded">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <span className="font-semibold flex-1">{group.group_label}</span>
        <Badge variant="outline" className="text-xs">{items.length} itens</Badge>
        {group.is_system && <Lock className="h-4 w-4 text-muted-foreground" />}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAddItem}><Plus className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEditGroup}><Pencil className="h-4 w-4" /></Button>
        {!group.is_system && <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDeleteGroup}><Trash2 className="h-4 w-4" /></Button>}
      </div>
      {expanded && (
        <div className="p-2 space-y-1 bg-muted/30">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
              {items.map(item => (
                <SortableItem key={item.id} item={item} onEdit={() => onEditItem(item)} onDelete={() => onDeleteItem(item)} />
              ))}
            </SortableContext>
          </DndContext>
          {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum item neste grupo</p>}
        </div>
      )}
    </div>
  );
}

export function MasterMenuEditor({ open, onOpenChange }: MasterMenuEditorProps) {
  const { groups, items, groupsWithItems, isLoading, isMutating, createGroup, updateGroup, deleteGroup, createItem, updateItem, deleteItem, bulkUpdateOrder, refetchAll } = useMenuConfig();
  
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<MenuGroup | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "group" | "item"; id: string; label: string } | null>(null);
  const [defaultGroupId, setDefaultGroupId] = useState<string>("");
  const [pendingChanges, setPendingChanges] = useState<Map<string, MenuItem[]>>(new Map());

  const hasUnsavedChanges = pendingChanges.size > 0;

  const handleSaveChanges = async () => {
    const updates: { type: "item"; id: string; sort_order: number; group_id?: string }[] = [];
    pendingChanges.forEach((items, groupId) => {
      items.forEach((item, index) => {
        updates.push({ type: "item", id: item.id, sort_order: index, group_id: groupId });
      });
    });
    if (updates.length > 0) {
      await bulkUpdateOrder(updates);
      setPendingChanges(new Map());
    }
  };

  const handleReorderItems = (groupId: string, newItems: MenuItem[]) => {
    setPendingChanges(prev => new Map(prev).set(groupId, newItems));
  };

  const getItemsForGroup = (groupId: string) => {
    return pendingChanges.get(groupId) || items.filter(i => i.group_id === groupId).sort((a, b) => a.sort_order - b.sort_order);
  };

  const handleGroupSubmit = async (data: CreateGroupInput | UpdateGroupInput) => {
    if (editingGroup) await updateGroup(editingGroup.id, data as UpdateGroupInput);
    else await createGroup(data as CreateGroupInput);
    setEditingGroup(null);
  };

  const handleItemSubmit = async (data: CreateItemInput | UpdateItemInput) => {
    if (editingItem) await updateItem(editingItem.id, data as UpdateItemInput);
    else await createItem(data as CreateItemInput);
    setEditingItem(null);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "group") await deleteGroup(deleteConfirm.id);
    else await deleteItem(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">Editor de Menu {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}</SheetTitle>
            <SheetDescription>Organize grupos e itens do menu lateral.</SheetDescription>
          </SheetHeader>

          <div className="flex gap-2 my-4">
            <Button onClick={() => { setEditingGroup(null); setGroupFormOpen(true); }} size="sm"><Plus className="h-4 w-4 mr-1" />Grupo</Button>
            <div className="flex-1" />
            {hasUnsavedChanges && <Badge variant="destructive">Não salvo</Badge>}
            <Button variant="outline" size="sm" onClick={() => { setPendingChanges(new Map()); refetchAll(); }} disabled={isMutating}><RotateCcw className="h-4 w-4 mr-1" />Resetar</Button>
            <Button size="sm" onClick={handleSaveChanges} disabled={!hasUnsavedChanges || isMutating}><Save className="h-4 w-4 mr-1" />Salvar</Button>
          </div>

          <Separator />

          <ScrollArea className="h-[calc(100vh-200px)] mt-4">
            <div className="space-y-3 pr-4">
              {groups.sort((a, b) => a.sort_order - b.sort_order).map(group => (
                <GroupSection
                  key={group.id}
                  group={group}
                  items={getItemsForGroup(group.id)}
                  onEditGroup={() => { setEditingGroup(group); setGroupFormOpen(true); }}
                  onDeleteGroup={() => setDeleteConfirm({ type: "group", id: group.id, label: group.group_label })}
                  onAddItem={() => { setDefaultGroupId(group.id); setEditingItem(null); setItemFormOpen(true); }}
                  onEditItem={(item) => { setEditingItem(item); setItemFormOpen(true); }}
                  onDeleteItem={(item) => setDeleteConfirm({ type: "item", id: item.id, label: item.item_label })}
                  onReorderItems={(items) => handleReorderItems(group.id, items)}
                />
              ))}
              {groups.length === 0 && !isLoading && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Nenhum grupo configurado.</p>
                  <p className="text-sm">Clique em "+ Grupo" para começar.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <MenuGroupForm open={groupFormOpen} onOpenChange={setGroupFormOpen} group={editingGroup} onSubmit={handleGroupSubmit} isLoading={isMutating} />
      <MenuItemForm open={itemFormOpen} onOpenChange={setItemFormOpen} item={editingItem} groups={groups} defaultGroupId={defaultGroupId} onSubmit={handleItemSubmit} isLoading={isMutating} />

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir "{deleteConfirm?.label}"? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
