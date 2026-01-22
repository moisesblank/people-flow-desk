// ============================================
// MOISÉS MEDEIROS v16.0 - MASTER CONTEXT MENU ULTIMATE
// Menu contextual com Adicionar, Duplicar, Remover
// + Detecção inteligente de entidades
// + Confirmação de exclusão permanente
// Owner exclusivo: moisesblank@gmail.com
// ============================================

import { useState, useEffect, useCallback, useRef, forwardRef } from 'react';
import { useGodMode } from '@/stores/godModeStore';
import { useMasterActions } from '@/hooks/useMasterActions';
import { MasterActionConfirmDialog } from './MasterActionConfirmDialog';
import { Plus, Copy, Trash2, ChevronRight, FileText, Users, DollarSign, Calendar, BookOpen, BarChart3, Bell, Target, X, Loader2, GraduationCap, Briefcase, Link2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ContextMenuPosition {
  x: number;
  y: number;
  targetElement: HTMLElement | null;
  entityType?: string;
  entityId?: string;
  tableName?: string;
}

interface CategoryItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  table: string;
  nameField: string;
  defaultData: Record<string, unknown>;
  subItems?: { id: string; label: string; table: string; data: Record<string, unknown> }[];
}

// Categorias disponíveis para adicionar - MAPEAMENTO COMPLETO
const CATEGORIES: CategoryItem[] = [
  {
    id: 'financas',
    label: 'Finanças',
    icon: <DollarSign className="w-4 h-4" />,
    table: 'entradas',
    nameField: 'descricao',
    defaultData: { descricao: 'Nova Entrada', valor: 0, fonte: 'manual' },
    subItems: [
      { id: 'receita', label: 'Nova Receita/Entrada', table: 'entradas', data: { descricao: 'Nova Receita', valor: 0, fonte: 'manual', data: new Date().toISOString().split('T')[0] } },
      { id: 'despesa', label: 'Nova Despesa Extra', table: 'company_extra_expenses', data: { nome: 'Nova Despesa', valor: 0, data: new Date().toISOString().split('T')[0] } },
      { id: 'gasto_fixo', label: 'Novo Gasto Fixo', table: 'company_fixed_expenses', data: { nome: 'Novo Gasto Fixo', valor: 0 } },
      { id: 'pagamento', label: 'Novo Pagamento', table: 'pagamentos_funcionarios', data: { descricao: 'Novo Pagamento', valor: 0, status: 'pendente' } },
    ]
  },
  {
    id: 'cursos',
    label: 'Cursos/LMS',
    icon: <BookOpen className="w-4 h-4" />,
    table: 'courses',
    nameField: 'title',
    defaultData: { title: 'Novo Curso', is_published: false },
    subItems: [
      { id: 'course', label: 'Novo Curso', table: 'courses', data: { title: 'Novo Curso', is_published: false } },
      { id: 'module', label: 'Novo Módulo', table: 'modules', data: { title: 'Novo Módulo' } },
      { id: 'lesson', label: 'Nova Aula', table: 'lessons', data: { title: 'Nova Aula' } },
      { id: 'quiz', label: 'Novo Quiz', table: 'quizzes', data: { title: 'Novo Quiz' } },
    ]
  },
  {
    id: 'equipe',
    label: 'Equipe/RH',
    icon: <Briefcase className="w-4 h-4" />,
    table: 'employees',
    nameField: 'nome',
    defaultData: { nome: 'Novo Funcionário', status: 'ativo' },
    subItems: [
      { id: 'employee', label: 'Novo Funcionário', table: 'employees', data: { nome: 'Novo Funcionário', status: 'ativo', cargo: 'A definir' } },
      { id: 'dev_task', label: 'Nova Tarefa Dev', table: 'dev_tasks', data: { title: 'Nova Tarefa', status: 'todo', member_name: 'Equipe', priority: 'medium' } },
    ]
  },
  {
    id: 'alunos',
    label: 'Alunos',
    icon: <GraduationCap className="w-4 h-4" />,
    table: 'alunos',
    nameField: 'nome',
    defaultData: { nome: 'Novo Aluno', email: `aluno_${Date.now()}@temp.com`, status: 'ativo' },
  },
  {
    id: 'afiliados',
    label: 'Afiliados',
    icon: <Users className="w-4 h-4" />,
    table: 'affiliates',
    nameField: 'nome',
    defaultData: { nome: 'Novo Afiliado', status: 'ativo' },
  },
  {
    id: 'tarefas',
    label: 'Tarefas',
    icon: <FileText className="w-4 h-4" />,
    table: 'tasks',
    nameField: 'title',
    defaultData: { title: 'Nova Tarefa', status: 'todo', priority: 'medium' },
    subItems: [
      { id: 'task', label: 'Nova Tarefa', table: 'tasks', data: { title: 'Nova Tarefa', status: 'todo' } },
      { id: 'calendar_task', label: 'Evento no Calendário', table: 'calendar_tasks', data: { title: 'Novo Evento', is_completed: false, task_date: new Date().toISOString().split('T')[0] } },
    ]
  },
  {
    id: 'calendario',
    label: 'Calendário',
    icon: <Calendar className="w-4 h-4" />,
    table: 'calendar_tasks',
    nameField: 'title',
    defaultData: { title: 'Novo Evento', task_date: new Date().toISOString().split('T')[0], is_completed: false },
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: <Target className="w-4 h-4" />,
    table: 'marketing_campaigns',
    nameField: 'name',
    defaultData: { name: 'Nova Campanha', status: 'draft' },
    subItems: [
      { id: 'campaign', label: 'Nova Campanha', table: 'marketing_campaigns', data: { name: 'Nova Campanha', status: 'draft' } },
    ]
  },
  {
    id: 'alertas',
    label: 'Alertas',
    icon: <Bell className="w-4 h-4" />,
    table: 'alertas_sistema',
    nameField: 'titulo',
    defaultData: { titulo: 'Novo Alerta', tipo: 'info', mensagem: 'Mensagem do alerta', origem: 'manual', destinatarios: ['owner'] },
  },
  {
    id: 'documentos',
    label: 'Documentos',
    icon: <FileText className="w-4 h-4" />,
    table: 'general_documents',
    nameField: 'nome',
    defaultData: { nome: 'Novo Documento', categoria: 'geral' },
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    icon: <BarChart3 className="w-4 h-4" />,
    table: 'automated_reports',
    nameField: 'report_type',
    defaultData: { report_type: 'custom', schedule: 'weekly', is_active: true },
  },
];

// Mapeamento de URL para tipo de entidade
const URL_ENTITY_MAP: Record<string, { type: string; table: string }> = {
  '/pagamentos': { type: 'pagamento', table: 'pagamentos_funcionarios' },
  '/financas-empresa': { type: 'gasto', table: 'company_extra_expenses' },
  '/financas-pessoais': { type: 'transaction', table: 'transactions' },
  '/funcionarios': { type: 'employee', table: 'employees' },
  '/alunos': { type: 'aluno', table: 'alunos' },
  '/afiliados': { type: 'affiliate', table: 'affiliates' },
  '/cursos': { type: 'course', table: 'courses' },
  '/tarefas': { type: 'task', table: 'tasks' },
  '/calendario': { type: 'calendar_task', table: 'calendar_tasks' },
  '/marketing': { type: 'campaign', table: 'marketing_campaigns' },
  '/entradas': { type: 'entrada', table: 'entradas' },
  '/contabilidade': { type: 'contabilidade', table: 'contabilidade' },
};

// Detectar tipo de entidade baseado no elemento clicado - MELHORADO
function detectEntityFromElement(element: HTMLElement): { type: string; id: string; table?: string } | null {
  // 1. Procurar data attributes diretos
  const entityType = element.dataset.entityType || element.closest('[data-entity-type]')?.getAttribute('data-entity-type');
  const entityId = element.dataset.entityId || element.closest('[data-entity-id]')?.getAttribute('data-entity-id');
  const tableName = element.dataset.table || element.closest('[data-table]')?.getAttribute('data-table');
  
  if (entityType && entityId) {
    return { type: entityType, id: entityId, table: tableName || undefined };
  }

  // 2. Procurar em linha de tabela (tr)
  const row = element.closest('tr[data-row-id], tr[data-id]');
  if (row) {
    const rowId = row.getAttribute('data-row-id') || row.getAttribute('data-id');
    const rowType = row.getAttribute('data-entity-type') || row.getAttribute('data-type');
    const rowTable = row.getAttribute('data-table');
    if (rowId) {
      // Tentar detectar tipo pela URL atual
      const urlInfo = URL_ENTITY_MAP[window.location.pathname];
      return { 
        type: rowType || urlInfo?.type || 'row', 
        id: rowId,
        table: rowTable || urlInfo?.table 
      };
    }
  }

  // 3. Procurar em card ou item genérico
  const item = element.closest('[data-item-id], [data-id]');
  if (item) {
    const itemId = item.getAttribute('data-item-id') || item.getAttribute('data-id');
    const itemType = item.getAttribute('data-entity-type') || item.getAttribute('data-type');
    const itemTable = item.getAttribute('data-table');
    if (itemId) {
      const urlInfo = URL_ENTITY_MAP[window.location.pathname];
      return { 
        type: itemType || urlInfo?.type || 'item', 
        id: itemId,
        table: itemTable || urlInfo?.table 
      };
    }
  }

  // 4. Detectar pelo contexto da página (URL)
  const urlInfo = URL_ENTITY_MAP[window.location.pathname];
  if (urlInfo) {
    // Procurar qualquer ID no elemento pai mais próximo
    const parent = element.closest('[id]');
    if (parent?.id && parent.id.length > 8) {
      return { type: urlInfo.type, id: parent.id, table: urlInfo.table };
    }
  }

  return null;
}

export const MasterContextMenu = forwardRef<HTMLDivElement, Record<string, never>>(function MasterContextMenu(_props, ref) {
  const { isOwner, isActive } = useGodMode();
  const { 
    pendingAction, 
    prepareAdd, 
    prepareDuplicate, 
    prepareRemove, 
    confirmAction, 
    cancelAction,
    isProcessing 
  } = useMasterActions();
  
  const [menuPosition, setMenuPosition] = useState<ContextMenuPosition | null>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Handler de clique direito
  useEffect(() => {
    if (!isOwner || !isActive) return;

    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Ignorar menu próprio
      if (target.closest('[data-master-menu]')) return;
      
      // Ignorar elementos do sistema
      if (target.closest('[data-godmode-panel]') || target.closest('[data-radix-popper-content-wrapper]')) return;

      e.preventDefault();
      e.stopPropagation();

      const entity = detectEntityFromElement(target);
      
      setMenuPosition({
        x: e.clientX,
        y: e.clientY,
        targetElement: target,
        entityType: entity?.type,
        entityId: entity?.id
      });
      setActiveSubmenu(null);
    };

    // Fechar ao clicar fora
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuPosition(null);
        setActiveSubmenu(null);
      }
    };

    // Fechar com ESC
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuPosition(null);
        setActiveSubmenu(null);
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOwner, isActive]);

  // Função ADICIONAR - prepara ação e abre diálogo
  const handleAdd = useCallback(async (category: CategoryItem, subItem?: { id: string; label: string; table: string; data: Record<string, unknown> }) => {
    const dataToInsert = subItem?.data || category.defaultData;
    const entityType = subItem?.table || category.table; // Usar tabela diretamente!
    
    console.log('[MasterContextMenu] handleAdd:', { entityType, dataToInsert });
    
    await prepareAdd(entityType, dataToInsert);
    setMenuPosition(null);
    setShowConfirmDialog(true);
  }, [prepareAdd]);

  // Função DUPLICAR - prepara ação e abre diálogo
  const handleDuplicate = useCallback(async () => {
    if (!menuPosition?.targetElement) return;
    
    const entity = detectEntityFromElement(menuPosition.targetElement);
    
    if (!entity || !entity.id) {
      // Se não detectou entidade, copiar conteúdo para clipboard
      const content = menuPosition.targetElement.innerText || menuPosition.targetElement.innerHTML;
      await navigator.clipboard.writeText(content);
      toast.success('📋 Conteúdo copiado para área de transferência!');
      setMenuPosition(null);
      return;
    }

    await prepareDuplicate(entity.type, entity.id, menuPosition.targetElement);
    setMenuPosition(null);
    setShowConfirmDialog(true);
  }, [menuPosition, prepareDuplicate]);

  // Função REMOVER - prepara ação e abre diálogo
  const handleRemove = useCallback(async () => {
    if (!menuPosition?.targetElement) return;
    
    const entity = detectEntityFromElement(menuPosition.targetElement);
    
    if (!entity || !entity.id) {
      toast.error('Não foi possível identificar o item para remover');
      setMenuPosition(null);
      return;
    }

    await prepareRemove(entity.type, entity.id, menuPosition.targetElement);
    setMenuPosition(null);
    setShowConfirmDialog(true);
  }, [menuPosition, prepareRemove]);

  // Handler para confirmar ação
  const handleConfirmAction = useCallback(async () => {
    await confirmAction();
    setShowConfirmDialog(false);
  }, [confirmAction]);

  // Handler para cancelar ação
  const handleCancelAction = useCallback(() => {
    cancelAction();
    setShowConfirmDialog(false);
  }, [cancelAction]);

  if (!isOwner || !isActive) return null;

  // Ajustar posição se sair da tela
  const adjustedX = menuPosition ? Math.min(menuPosition.x, window.innerWidth - 280) : 0;
  const adjustedY = menuPosition ? Math.min(menuPosition.y, window.innerHeight - 400) : 0;

  return (
    <div ref={ref} className="contents" data-master-context-root>
      {/* Menu Contextual */}
      <AnimatePresence>
        {menuPosition && (
          <motion.div
            ref={menuRef}
            data-master-menu
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[99999] bg-background/95 backdrop-blur-xl border border-primary/30 rounded-xl shadow-2xl overflow-hidden min-w-[220px]"
            style={{ 
              left: adjustedX, 
              top: adjustedY,
              boxShadow: '0 0 40px hsl(280 80% 50% / 0.3)'
            }}
          >
            {/* Header */}
            <div className="px-3 py-2 bg-gradient-to-r from-primary/20 to-purple-500/20 border-b border-primary/20 flex items-center justify-between">
              <span className="text-xs font-semibold text-primary">🔮 MODO MASTER</span>
              <button 
                onClick={() => setMenuPosition(null)}
                className="p-1 hover:bg-primary/20 rounded transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="p-1">
              {/* ADICIONAR */}
              <div 
                className="relative"
                onMouseEnter={() => setActiveSubmenu('add')}
                onMouseLeave={() => setActiveSubmenu(null)}
              >
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary/10 rounded-lg transition-all group"
                  disabled={isProcessing}
                >
                  <Plus className="w-4 h-4 text-green-500" />
                  <span className="flex-1 text-left text-sm font-medium">Adicionar</span>
                  <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </button>

                {/* Submenu Adicionar */}
                <AnimatePresence>
                  {activeSubmenu === 'add' && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="absolute left-full top-0 ml-1 bg-background/95 backdrop-blur-xl border border-primary/30 rounded-xl shadow-2xl min-w-[200px] max-h-[400px] overflow-y-auto"
                      style={{ boxShadow: '0 0 30px hsl(280 80% 50% / 0.2)' }}
                    >
                      <div className="p-1">
                        {CATEGORIES.map((category) => (
                          <div key={category.id} className="relative group/cat">
                            {category.subItems ? (
                              <div 
                                className="relative"
                                onMouseEnter={() => setActiveSubmenu(`add-${category.id}`)}
                              >
                                <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-primary/10 rounded-lg transition-all">
                                  {category.icon}
                                  <span className="flex-1 text-left text-sm">{category.label}</span>
                                  <ChevronRight className="w-3 h-3 opacity-50" />
                                </button>
                                
                                {activeSubmenu === `add-${category.id}` && (
                                  <motion.div
                                    initial={{ opacity: 0, x: -5 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="absolute left-full top-0 ml-1 bg-background/95 backdrop-blur-xl border border-primary/30 rounded-lg shadow-xl min-w-[180px]"
                                  >
                                    <div className="p-1">
                                      {category.subItems.map((subItem) => (
                                        <button
                                          key={subItem.id}
                                          onClick={() => handleAdd(category, subItem)}
                                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-primary/10 rounded-lg transition-all text-sm"
                                          disabled={isProcessing}
                                        >
                                          <Plus className="w-3 h-3 text-green-500" />
                                          {subItem.label}
                                        </button>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAdd(category)}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-primary/10 rounded-lg transition-all"
                                disabled={isProcessing}
                              >
                                {category.icon}
                                <span className="text-sm">{category.label}</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* EDITAR DESTINO/URL */}
              <button
                onClick={() => {
                  if (menuPosition?.targetElement) {
                    // Disparar evento para abrir o editor de URL
                    window.dispatchEvent(new CustomEvent('master-edit-url', {
                      detail: {
                        element: menuPosition.targetElement,
                        rect: menuPosition.targetElement.getBoundingClientRect()
                      }
                    }));
                    setMenuPosition(null);
                    toast.info('🔗 Ctrl+Click em qualquer link para editar destino', {
                      description: 'Ou use o editor que apareceu'
                    });
                  }
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-cyan-500/10 rounded-lg transition-all"
              >
                <Link2 className="w-4 h-4 text-cyan-500" />
                <span className="text-sm font-medium">Editar Destino</span>
                <kbd className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded">Ctrl+Click</kbd>
              </button>

              {/* DUPLICAR */}
              <button
                onClick={handleDuplicate}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary/10 rounded-lg transition-all"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                ) : (
                  <Copy className="w-4 h-4 text-blue-500" />
                )}
                <span className="text-sm font-medium">Duplicar</span>
                <kbd className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded">Ctrl+D</kbd>
              </button>

              {/* REMOVER */}
              <button
                onClick={handleRemove}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-destructive/10 rounded-lg transition-all text-destructive"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">Remover</span>
                <kbd className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded">Del</kbd>
              </button>
            </div>

            {/* Footer com info do elemento */}
            {menuPosition.entityType && (
              <div className="px-3 py-2 bg-muted/50 border-t border-border/50 text-[10px] text-muted-foreground">
                <span>Tipo: {menuPosition.entityType}</span>
                {menuPosition.entityId && <span className="ml-2">ID: {menuPosition.entityId.slice(0, 8)}...</span>}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Diálogo de Confirmação Salvar / Não Salvar */}
      <MasterActionConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        action={pendingAction}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />
    </div>
  );
});
MasterContextMenu.displayName = 'MasterContextMenu';

export default MasterContextMenu;
