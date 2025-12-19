// ============================================
// MOISÉS MEDEIROS v10.0 - MASTER DUPLICATION PANEL
// Painel Completo de Duplicação para God Mode
// ============================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Copy, 
  Search, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  BookOpen,
  FileText,
  Users,
  DollarSign,
  Calendar,
  Megaphone,
  Settings,
  FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useMasterDuplication, DuplicableEntityType } from '@/hooks/useMasterDuplication';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { cn } from '@/lib/utils';

interface EntityItem {
  id: string;
  name: string;
  type: DuplicableEntityType;
  createdAt?: string;
  extra?: Record<string, any>;
}

const ENTITY_CATEGORIES = [
  {
    id: 'lms',
    label: 'LMS',
    icon: BookOpen,
    types: ['course', 'module', 'lesson', 'quiz'] as DuplicableEntityType[],
    color: 'bg-blue-500/10 text-blue-500'
  },
  {
    id: 'tasks',
    label: 'Tarefas',
    icon: Calendar,
    types: ['task', 'calendar_task'] as DuplicableEntityType[],
    color: 'bg-green-500/10 text-green-500'
  },
  {
    id: 'finance',
    label: 'Financeiro',
    icon: DollarSign,
    types: ['transaction', 'expense', 'income', 'category'] as DuplicableEntityType[],
    color: 'bg-yellow-500/10 text-yellow-500'
  },
  {
    id: 'people',
    label: 'Pessoas',
    icon: Users,
    types: ['employee', 'affiliate', 'student'] as DuplicableEntityType[],
    color: 'bg-purple-500/10 text-purple-500'
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: Megaphone,
    types: ['campaign'] as DuplicableEntityType[],
    color: 'bg-pink-500/10 text-pink-500'
  },
  {
    id: 'system',
    label: 'Sistema',
    icon: Settings,
    types: ['automation', 'document'] as DuplicableEntityType[],
    color: 'bg-gray-500/10 text-gray-500'
  }
];

export function MasterDuplicationPanel() {
  const { isGodMode } = useAdminCheck();
  const { duplicateEntity, duplicateMultiple, isDuplicating, canDuplicate } = useMasterDuplication();
  
  const [activeCategory, setActiveCategory] = useState('lms');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<EntityItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [includeAttachments, setIncludeAttachments] = useState(true);
  const [includeRelated, setIncludeRelated] = useState(true);
  const [duplicatedIds, setDuplicatedIds] = useState<Set<string>>(new Set());

  const currentCategory = ENTITY_CATEGORIES.find(c => c.id === activeCategory);

  // Buscar itens da categoria ativa
  useEffect(() => {
    if (!currentCategory || !canDuplicate) return;

    const fetchItems = async () => {
      setIsLoading(true);
      const allItems: EntityItem[] = [];

      for (const entityType of currentCategory.types) {
        const tableConfig: Record<DuplicableEntityType, { table: string; nameField: string }> = {
          course: { table: 'courses', nameField: 'title' },
          lesson: { table: 'lessons', nameField: 'title' },
          module: { table: 'modules', nameField: 'title' },
          quiz: { table: 'quizzes', nameField: 'title' },
          task: { table: 'tasks', nameField: 'title' },
          calendar_task: { table: 'calendar_tasks', nameField: 'title' },
          transaction: { table: 'transactions', nameField: 'description' },
          campaign: { table: 'marketing_campaigns', nameField: 'name' },
          automation: { table: 'owner_automations', nameField: 'nome' },
          employee: { table: 'employees', nameField: 'nome' },
          affiliate: { table: 'affiliates', nameField: 'nome' },
          student: { table: 'alunos', nameField: 'nome' },
          document: { table: 'general_documents', nameField: 'nome' },
          category: { table: 'financial_categories', nameField: 'name' },
          expense: { table: 'contas_pagar', nameField: 'descricao' },
          income: { table: 'contas_receber', nameField: 'descricao' },
        };

        const config = tableConfig[entityType];
        if (!config) continue;

        try {
          const { data } = await supabase
            .from(config.table as any)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

          if (data) {
            allItems.push(...data.map((item: any) => ({
              id: item.id?.toString() || '',
              name: item[config.nameField] || 'Sem nome',
              type: entityType,
              createdAt: item.created_at,
              extra: item
            })));
          }
        } catch (error) {
          console.error(`Erro ao buscar ${entityType}:`, error);
        }
      }

      setItems(allItems);
      setIsLoading(false);
    };

    fetchItems();
  }, [activeCategory, canDuplicate]);

  // Filtrar por busca
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleItemSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const handleDuplicateSingle = async (item: EntityItem) => {
    const result = await duplicateEntity(item.type, item.id, {
      includeAttachments,
      includeRelatedItems: includeRelated,
    });

    if (result.success && result.newId) {
      setDuplicatedIds(prev => new Set(prev).add(item.id));
    }
  };

  const handleDuplicateSelected = async () => {
    const itemsToDuplicate = items
      .filter(item => selectedItems.has(item.id))
      .map(item => ({ entityType: item.type, entityId: item.id }));

    await duplicateMultiple(itemsToDuplicate, {
      includeAttachments,
      includeRelatedItems: includeRelated,
    });

    setDuplicatedIds(prev => {
      const newSet = new Set(prev);
      selectedItems.forEach(id => newSet.add(id));
      return newSet;
    });
    setSelectedItems(new Set());
  };

  if (!isGodMode) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Acesso restrito ao Master (Owner)
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5 text-primary" />
              Central de Duplicação Master
            </CardTitle>
            <CardDescription>
              Duplique qualquer item da plataforma com todos os dados relacionados
            </CardDescription>
          </div>
          
          {selectedItems.size > 0 && (
            <Button
              onClick={handleDuplicateSelected}
              disabled={isDuplicating}
              className="gap-2"
            >
              {isDuplicating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              Duplicar {selectedItems.size} selecionado(s)
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Opções globais */}
        <div className="flex items-center gap-6 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Switch
              id="attachments"
              checked={includeAttachments}
              onCheckedChange={setIncludeAttachments}
            />
            <Label htmlFor="attachments" className="text-sm">Incluir anexos</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="related"
              checked={includeRelated}
              onCheckedChange={setIncludeRelated}
            />
            <Label htmlFor="related" className="text-sm">Incluir itens relacionados</Label>
          </div>
        </div>

        {/* Categorias */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="grid grid-cols-6 w-full">
            {ENTITY_CATEGORIES.map(cat => (
              <TabsTrigger 
                key={cat.id} 
                value={cat.id}
                className="gap-1.5 text-xs"
              >
                <cat.icon className="h-3.5 w-3.5" />
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Busca */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar itens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de itens */}
          <ScrollArea className="h-[400px] mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <FolderOpen className="h-12 w-12 mb-2 opacity-50" />
                <p>Nenhum item encontrado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <motion.div
                    key={`${item.type}-${item.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-colors",
                      selectedItems.has(item.id) 
                        ? "bg-primary/5 border-primary/30" 
                        : "bg-card hover:bg-muted/50",
                      duplicatedIds.has(item.id) && "border-green-500/30 bg-green-500/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        className="h-4 w-4 rounded border-input"
                      />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                          {item.createdAt && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {duplicatedIds.has(item.id) ? (
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Duplicado
                        </Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateSingle(item)}
                          disabled={isDuplicating}
                        >
                          {isDuplicating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}
