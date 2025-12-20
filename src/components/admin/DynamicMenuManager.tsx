import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Edit2, Save, X, GripVertical,
  FileText, Home, Users, Settings, BarChart3, Folder,
  BookOpen, Calendar, MessageSquare, Zap, Globe, Shield,
  Brain, Rocket, Target, Award, Bell, Database, Code
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDynamicMenuItems, CreateMenuItemInput, DynamicMenuItem } from '@/hooks/useDynamicMenuItems';

// Ícones disponíveis
const AVAILABLE_ICONS = [
  { name: 'FileText', icon: FileText },
  { name: 'Home', icon: Home },
  { name: 'Users', icon: Users },
  { name: 'Settings', icon: Settings },
  { name: 'BarChart3', icon: BarChart3 },
  { name: 'Folder', icon: Folder },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Calendar', icon: Calendar },
  { name: 'MessageSquare', icon: MessageSquare },
  { name: 'Zap', icon: Zap },
  { name: 'Globe', icon: Globe },
  { name: 'Shield', icon: Shield },
  { name: 'Brain', icon: Brain },
  { name: 'Rocket', icon: Rocket },
  { name: 'Target', icon: Target },
  { name: 'Award', icon: Award },
  { name: 'Bell', icon: Bell },
  { name: 'Database', icon: Database },
  { name: 'Code', icon: Code },
];

// Grupos disponíveis
const MENU_GROUPS = [
  { id: 'principal', label: 'Principal' },
  { id: 'empresas', label: 'Empresas' },
  { id: 'marketing', label: 'Marketing & Lançamento' },
  { id: 'aulas', label: 'Aulas & Turmas' },
  { id: 'financas', label: 'Finanças' },
  { id: 'negocios', label: 'Negócios' },
  { id: 'site', label: 'Site' },
  { id: 'pessoal', label: 'Vida Pessoal' },
  { id: 'master', label: 'Modo Master' },
  { id: 'portal-aluno', label: 'Portal do Aluno' },
];

function getIconComponent(iconName: string) {
  const found = AVAILABLE_ICONS.find(i => i.name === iconName);
  return found ? found.icon : FileText;
}

export function DynamicMenuManager() {
  const { items, isLoading, createItem, updateItem, deleteItem, toggleActive } = useDynamicMenuItems();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DynamicMenuItem | null>(null);
  const [formData, setFormData] = useState<CreateMenuItemInput>({
    group_id: 'principal',
    title: '',
    url: '',
    icon: 'FileText',
    area: '',
    badge: ''
  });

  const resetForm = () => {
    setFormData({
      group_id: 'principal',
      title: '',
      url: '',
      icon: 'FileText',
      area: '',
      badge: ''
    });
    setEditingItem(null);
  };

  const handleOpenDialog = (item?: DynamicMenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        group_id: item.group_id,
        title: item.title,
        url: item.url,
        icon: item.icon,
        area: item.area,
        badge: item.badge || ''
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.url || !formData.area) {
      return;
    }

    let success: boolean;
    if (editingItem) {
      success = await updateItem(editingItem.id, formData);
    } else {
      success = await createItem(formData);
    }

    if (success) {
      setIsDialogOpen(false);
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este item de menu?')) {
      await deleteItem(id);
    }
  };

  const groupedItems = MENU_GROUPS.map(group => ({
    ...group,
    items: items.filter(item => item.group_id === group.id)
  })).filter(g => g.items.length > 0);

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-card/80 to-card/40 border-primary/30 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="w-5 h-5 text-primary" />
            Gerenciador de Menus Dinâmicos
          </CardTitle>
          <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum item de menu criado ainda.</p>
              <p className="text-sm">Clique em "Novo Item" para começar.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedItems.map(group => (
                <div key={group.id} className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    {group.label}
                  </h4>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {group.items.map(item => {
                        const IconComponent = getIconComponent(item.icon);
                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${
                              item.is_active 
                                ? 'bg-background/60 border-border' 
                                : 'bg-muted/30 border-muted opacity-60'
                            }`}
                          >
                            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                            <IconComponent className="w-5 h-5 text-primary" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{item.title}</span>
                                {item.badge && (
                                  <Badge variant="secondary" className="text-xs">
                                    {item.badge}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">{item.url}</span>
                            </div>
                            <Switch
                              checked={item.is_active}
                              onCheckedChange={(checked) => toggleActive(item.id, checked)}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(item)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(item.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para criar/editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Item de Menu' : 'Novo Item de Menu'}
            </DialogTitle>
            <DialogDescription>
              Configure os detalhes do item de menu.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Minha Página"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="Ex: /minha-pagina"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="area">Área (para permissões) *</Label>
              <Input
                id="area"
                value={formData.area}
                onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                placeholder="Ex: minha-pagina"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Grupo</Label>
                <Select
                  value={formData.group_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, group_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MENU_GROUPS.map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Ícone</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ICONS.map(({ name, icon: Icon }) => (
                      <SelectItem key={name} value={name}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="badge">Badge (opcional)</Label>
              <Input
                id="badge"
                value={formData.badge || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, badge: e.target.value }))}
                placeholder="Ex: NEW, BETA, LIVE"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              <Save className="w-4 h-4 mr-2" />
              {editingItem ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
