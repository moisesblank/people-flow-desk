// ============================================
// FORMULÁRIO DE ITEM DE MENU
// Criar/Editar itens do menu
// ============================================

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { MenuItem, MenuGroup, CreateItemInput, UpdateItemInput } from "@/hooks/useMenuConfig";

interface MenuItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MenuItem | null;
  groups: MenuGroup[];
  defaultGroupId?: string;
  onSubmit: (data: CreateItemInput | UpdateItemInput) => Promise<void>;
  isLoading?: boolean;
}

const ROLE_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "coordenacao", label: "Coordenação" },
  { value: "contabilidade", label: "Contabilidade" },
  { value: "suporte", label: "Suporte" },
  { value: "monitoria", label: "Monitoria" },
  { value: "marketing", label: "Marketing" },
  { value: "afiliado", label: "Afiliado" },
];

const BADGE_VARIANTS = [
  { value: "", label: "Nenhum" },
  { value: "default", label: "Padrão" },
  { value: "secondary", label: "Secundário" },
  { value: "destructive", label: "Destaque" },
  { value: "outline", label: "Outline" },
];

export function MenuItemForm({ 
  open, 
  onOpenChange, 
  item, 
  groups,
  defaultGroupId,
  onSubmit,
  isLoading = false 
}: MenuItemFormProps) {
  const isEditing = !!item;
  
  const [formData, setFormData] = useState({
    group_id: defaultGroupId || "",
    item_key: "",
    item_label: "",
    item_url: "",
    item_icon: "FileText",
    item_area: "",
    item_badge: "",
    item_badge_variant: "",
    allowed_roles: ["owner", "admin"] as string[],
    opens_in_new_tab: false,
  });

  // Reset form quando abre/fecha ou muda o item
  useEffect(() => {
    if (open && item) {
      setFormData({
        group_id: item.group_id,
        item_key: item.item_key,
        item_label: item.item_label,
        item_url: item.item_url,
        item_icon: item.item_icon,
        item_area: item.item_area || "",
        item_badge: item.item_badge || "",
        item_badge_variant: item.item_badge_variant || "",
        allowed_roles: item.allowed_roles || ["owner", "admin"],
        opens_in_new_tab: item.opens_in_new_tab,
      });
    } else if (open && !item) {
      setFormData({
        group_id: defaultGroupId || groups[0]?.id || "",
        item_key: "",
        item_label: "",
        item_url: "/gestaofc/",
        item_icon: "FileText",
        item_area: "",
        item_badge: "",
        item_badge_variant: "",
        allowed_roles: ["owner", "admin"],
        opens_in_new_tab: false,
      });
    }
  }, [open, item, defaultGroupId, groups]);

  const handleRoleToggle = (role: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      allowed_roles: checked 
        ? [...prev.allowed_roles, role]
        : prev.allowed_roles.filter(r => r !== role)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.item_label.trim() || !formData.item_url.trim() || !formData.item_icon) {
      return;
    }

    const data = isEditing
      ? {
          group_id: formData.group_id,
          item_label: formData.item_label,
          item_url: formData.item_url,
          item_icon: formData.item_icon,
          item_area: formData.item_area || undefined,
          item_badge: formData.item_badge || null,
          item_badge_variant: formData.item_badge_variant || null,
          allowed_roles: formData.allowed_roles,
          opens_in_new_tab: formData.opens_in_new_tab,
        }
      : {
          group_id: formData.group_id,
          item_key: formData.item_key || formData.item_label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
          item_label: formData.item_label,
          item_url: formData.item_url,
          item_icon: formData.item_icon,
          item_area: formData.item_area || undefined,
          item_badge: formData.item_badge || undefined,
          item_badge_variant: formData.item_badge_variant || undefined,
          allowed_roles: formData.allowed_roles,
          opens_in_new_tab: formData.opens_in_new_tab,
        };

    await onSubmit(data as CreateItemInput | UpdateItemInput);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Item" : "Novo Item"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Edite as informações do item de menu."
              : "Adicione um novo item ao menu."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Grupo */}
          <div className="space-y-2">
            <Label>Grupo *</Label>
            <Select
              value={formData.group_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, group_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um grupo" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.group_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="item_label">Título *</Label>
            <Input
              id="item_label"
              value={formData.item_label}
              onChange={(e) => setFormData(prev => ({ ...prev, item_label: e.target.value }))}
              placeholder="Ex: Dashboard, Finanças..."
              required
            />
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="item_url">URL *</Label>
            <Input
              id="item_url"
              value={formData.item_url}
              onChange={(e) => setFormData(prev => ({ ...prev, item_url: e.target.value }))}
              placeholder="/gestaofc/minha-pagina"
              required
            />
          </div>

          {/* Ícone */}
          <div className="space-y-2">
            <Label>Ícone *</Label>
            <IconPicker
              value={formData.item_icon}
              onChange={(value) => setFormData(prev => ({ ...prev, item_icon: value }))}
              placeholder="Escolha um ícone"
            />
          </div>

          {/* Área RBAC */}
          <div className="space-y-2">
            <Label htmlFor="item_area">Área (RBAC)</Label>
            <Input
              id="item_area"
              value={formData.item_area}
              onChange={(e) => setFormData(prev => ({ ...prev, item_area: e.target.value }))}
              placeholder="Ex: dashboard, financas..."
            />
            <p className="text-xs text-muted-foreground">
              Usado para controle de acesso por área do sistema.
            </p>
          </div>

          {/* Badge */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item_badge">Badge (texto)</Label>
              <Input
                id="item_badge"
                value={formData.item_badge}
                onChange={(e) => setFormData(prev => ({ ...prev, item_badge: e.target.value }))}
                placeholder="Ex: NOVO, LIVE..."
              />
            </div>
            <div className="space-y-2">
              <Label>Estilo do Badge</Label>
              <Select
                value={formData.item_badge_variant}
                onValueChange={(value) => setFormData(prev => ({ ...prev, item_badge_variant: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Estilo" />
                </SelectTrigger>
                <SelectContent>
                  {BADGE_VARIANTS.map((variant) => (
                    <SelectItem key={variant.value} value={variant.value}>
                      {variant.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Roles Permitidas */}
          <div className="space-y-2">
            <Label>Roles com Acesso</Label>
            <div className="grid grid-cols-2 gap-2 p-3 border rounded-md bg-muted/30">
              {ROLE_OPTIONS.map((role) => (
                <div key={role.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`role-${role.value}`}
                    checked={formData.allowed_roles.includes(role.value)}
                    onCheckedChange={(checked) => handleRoleToggle(role.value, !!checked)}
                  />
                  <label
                    htmlFor={`role-${role.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {role.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Nova aba */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="opens_in_new_tab"
              checked={formData.opens_in_new_tab}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, opens_in_new_tab: !!checked }))}
            />
            <label htmlFor="opens_in_new_tab" className="text-sm cursor-pointer">
              Abrir em nova aba
            </label>
          </div>

          {/* Key (apenas na criação) */}
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="item_key">Chave (opcional)</Label>
              <Input
                id="item_key"
                value={formData.item_key}
                onChange={(e) => setFormData(prev => ({ ...prev, item_key: e.target.value }))}
                placeholder="Gerado automaticamente se vazio"
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.item_label.trim() || !formData.item_url.trim()}
            >
              {isLoading ? "Salvando..." : isEditing ? "Salvar" : "Criar Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
