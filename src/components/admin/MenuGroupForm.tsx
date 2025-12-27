// ============================================
// FORMULÁRIO DE GRUPO DE MENU
// Criar/Editar grupos do menu
// ============================================

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconPicker } from "./IconPicker";
import type { MenuGroup, CreateGroupInput, UpdateGroupInput } from "@/hooks/useMenuConfig";

interface MenuGroupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: MenuGroup | null;
  onSubmit: (data: CreateGroupInput | UpdateGroupInput) => Promise<void>;
  isLoading?: boolean;
}

const COLOR_OPTIONS = [
  { value: "from-primary/80", label: "Primária" },
  { value: "from-blue-600/80", label: "Azul" },
  { value: "from-green-600/80", label: "Verde" },
  { value: "from-purple-600/80", label: "Roxo" },
  { value: "from-orange-600/80", label: "Laranja" },
  { value: "from-pink-600/80", label: "Rosa" },
  { value: "from-cyan-600/80", label: "Ciano" },
  { value: "from-red-600/80", label: "Vermelho" },
  { value: "from-amber-600/80", label: "Âmbar" },
  { value: "from-slate-600/80", label: "Cinza" },
  { value: "from-purple-600/80 via-pink-600/80", label: "Gradiente Master" },
];

export function MenuGroupForm({ 
  open, 
  onOpenChange, 
  group, 
  onSubmit,
  isLoading = false 
}: MenuGroupFormProps) {
  const isEditing = !!group;
  
  const [formData, setFormData] = useState({
    group_key: "",
    group_label: "",
    group_icon: "",
    group_color: "from-primary/80",
  });

  // Reset form quando abre/fecha ou muda o grupo
  useEffect(() => {
    if (open && group) {
      setFormData({
        group_key: group.group_key,
        group_label: group.group_label,
        group_icon: group.group_icon || "",
        group_color: group.group_color || "from-primary/80",
      });
    } else if (open && !group) {
      setFormData({
        group_key: "",
        group_label: "",
        group_icon: "",
        group_color: "from-primary/80",
      });
    }
  }, [open, group]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.group_label.trim()) {
      return;
    }

    const data = isEditing
      ? {
          group_label: formData.group_label,
          group_icon: formData.group_icon || undefined,
          group_color: formData.group_color,
        }
      : {
          group_key: formData.group_key || formData.group_label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
          group_label: formData.group_label,
          group_icon: formData.group_icon || undefined,
          group_color: formData.group_color,
        };

    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Grupo" : "Novo Grupo"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Edite as informações do grupo de menu."
              : "Crie um novo grupo para organizar itens do menu."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group_label">Nome do Grupo *</Label>
            <Input
              id="group_label"
              value={formData.group_label}
              onChange={(e) => setFormData(prev => ({ ...prev, group_label: e.target.value }))}
              placeholder="Ex: Finanças, Marketing..."
              required
            />
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="group_key">Chave (opcional)</Label>
              <Input
                id="group_key"
                value={formData.group_key}
                onChange={(e) => setFormData(prev => ({ ...prev, group_key: e.target.value }))}
                placeholder="Gerado automaticamente se vazio"
              />
              <p className="text-xs text-muted-foreground">
                Identificador único. Se vazio, será gerado a partir do nome.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Ícone</Label>
            <IconPicker
              value={formData.group_icon}
              onChange={(value) => setFormData(prev => ({ ...prev, group_icon: value }))}
              placeholder="Escolha um ícone (opcional)"
            />
          </div>

          <div className="space-y-2">
            <Label>Cor do Grupo</Label>
            <Select
              value={formData.group_color}
              onValueChange={(value) => setFormData(prev => ({ ...prev, group_color: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLOR_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div 
                        className={`w-4 h-4 rounded bg-gradient-to-r ${option.value} to-transparent`} 
                      />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.group_label.trim()}>
              {isLoading ? "Salvando..." : isEditing ? "Salvar" : "Criar Grupo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
