// ============================================
// MOISÉS MEDEIROS v15.0 - MASTER QUICK ADD MENU
// Menu flutuante de criação rápida Ctrl+Shift+Q
// Estilo Windows Explorer "Novo >"
// Owner exclusivo: moisesblank@gmail.com
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { useGodMode } from '@/contexts/GodModeContext';
import { useMasterActions } from '@/hooks/useMasterActions';
import { MasterActionConfirmDialog } from './MasterActionConfirmDialog';
import { MasterAddModal } from './MasterAddModal';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Plus,
  X,
  DollarSign,
  BookOpen,
  Users,
  FileText,
  Calendar,
  Target,
  Bell,
  BarChart3,
  Briefcase,
  Video,
  MessageSquare,
  Settings,
  Folder,
  Megaphone,
  ClipboardList,
  UserCheck,
  CreditCard,
  ChevronRight,
  Sparkles,
  Keyboard,
  Zap
} from 'lucide-react';

interface QuickAddCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  entityType: string;
  subItems?: { id: string; label: string; entityType: string }[];
}

// Todas as categorias disponíveis na plataforma
const QUICK_ADD_CATEGORIES: QuickAddCategory[] = [
  {
    id: 'financas',
    label: 'Finanças',
    icon: <DollarSign className="w-4 h-4" />,
    color: 'text-green-500',
    entityType: 'transaction',
    subItems: [
      { id: 'receita', label: 'Nova Receita', entityType: 'transaction' },
      { id: 'despesa', label: 'Nova Despesa', entityType: 'transaction' },
      { id: 'conta_pagar', label: 'Conta a Pagar', entityType: 'conta_pagar' },
      { id: 'conta_receber', label: 'Conta a Receber', entityType: 'conta_receber' },
    ]
  },
  {
    id: 'cursos',
    label: 'Cursos / LMS',
    icon: <BookOpen className="w-4 h-4" />,
    color: 'text-blue-500',
    entityType: 'course',
    subItems: [
      { id: 'course', label: 'Novo Curso', entityType: 'course' },
      { id: 'module', label: 'Novo Módulo', entityType: 'module' },
      { id: 'lesson', label: 'Nova Aula', entityType: 'lesson' },
      { id: 'quiz', label: 'Novo Quiz', entityType: 'quiz' },
    ]
  },
  {
    id: 'alunos',
    label: 'Alunos',
    icon: <Users className="w-4 h-4" />,
    color: 'text-purple-500',
    entityType: 'aluno',
  },
  {
    id: 'equipe',
    label: 'Equipe / RH',
    icon: <UserCheck className="w-4 h-4" />,
    color: 'text-orange-500',
    entityType: 'employee',
    subItems: [
      { id: 'employee', label: 'Novo Funcionário', entityType: 'employee' },
      { id: 'dev_task', label: 'Tarefa de Dev', entityType: 'dev_task' },
    ]
  },
  {
    id: 'tarefas',
    label: 'Tarefas',
    icon: <ClipboardList className="w-4 h-4" />,
    color: 'text-yellow-500',
    entityType: 'task',
    subItems: [
      { id: 'task', label: 'Nova Tarefa', entityType: 'task' },
      { id: 'calendar_task', label: 'Tarefa no Calendário', entityType: 'calendar_task' },
    ]
  },
  {
    id: 'calendario',
    label: 'Calendário',
    icon: <Calendar className="w-4 h-4" />,
    color: 'text-cyan-500',
    entityType: 'calendar_task',
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: <Megaphone className="w-4 h-4" />,
    color: 'text-pink-500',
    entityType: 'campaign',
    subItems: [
      { id: 'campaign', label: 'Nova Campanha', entityType: 'campaign' },
      { id: 'affiliate', label: 'Novo Afiliado', entityType: 'affiliate' },
    ]
  },
  {
    id: 'lancamento',
    label: 'Lançamentos',
    icon: <Target className="w-4 h-4" />,
    color: 'text-red-500',
    entityType: 'launch',
  },
  {
    id: 'documentos',
    label: 'Documentos',
    icon: <FileText className="w-4 h-4" />,
    color: 'text-amber-500',
    entityType: 'document',
    subItems: [
      { id: 'document', label: 'Novo Documento', entityType: 'document' },
      { id: 'arquivo', label: 'Novo Arquivo', entityType: 'arquivo' },
    ]
  },
  {
    id: 'alertas',
    label: 'Alertas',
    icon: <Bell className="w-4 h-4" />,
    color: 'text-rose-500',
    entityType: 'alerta',
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    icon: <BarChart3 className="w-4 h-4" />,
    color: 'text-indigo-500',
    entityType: 'report',
  },
  {
    id: 'aulas',
    label: 'Aulas ao Vivo',
    icon: <Video className="w-4 h-4" />,
    color: 'text-emerald-500',
    entityType: 'live_class',
  },
  {
    id: 'turmas',
    label: 'Turmas',
    icon: <Briefcase className="w-4 h-4" />,
    color: 'text-violet-500',
    entityType: 'turma',
    subItems: [
      { id: 'turma_online', label: 'Turma Online', entityType: 'turma_online' },
      { id: 'turma_presencial', label: 'Turma Presencial', entityType: 'turma_presencial' },
    ]
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: <MessageSquare className="w-4 h-4" />,
    color: 'text-green-600',
    entityType: 'whatsapp_lead',
  },
  {
    id: 'pagamentos',
    label: 'Pagamentos',
    icon: <CreditCard className="w-4 h-4" />,
    color: 'text-sky-500',
    entityType: 'payment',
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    icon: <Settings className="w-4 h-4" />,
    color: 'text-slate-500',
    entityType: 'setting',
  },
];

export function MasterQuickAddMenu() {
  const { isOwner, isActive } = useGodMode();
  const { pendingAction, confirmAction, cancelAction, isProcessing } = useMasterActions();
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Atalho Ctrl+Shift+Q para abrir/fechar
  useEffect(() => {
    if (!isOwner) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        setIsOpen(prev => {
          if (!prev) {
            toast.success('⚡ Quick Add ativado!', {
              description: 'Selecione uma categoria para criar',
              duration: 2000
            });
          }
          return !prev;
        });
      }
      
      // ESC para fechar
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setActiveSubmenu(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOwner, isOpen]);

  // Fechar ao clicar fora
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-quick-add-menu]')) {
        setIsOpen(false);
        setActiveSubmenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  // Handler para selecionar categoria
  const handleSelectCategory = useCallback((entityType: string) => {
    setSelectedEntity(entityType);
    setIsOpen(false);
    setActiveSubmenu(null);
  }, []);

  // Handler para confirmar criação
  const handleConfirmAction = useCallback(async () => {
    const result = await confirmAction();
    if (result.success) {
      setShowConfirmDialog(false);
    }
  }, [confirmAction]);

  // Handler para cancelar
  const handleCancelAction = useCallback(() => {
    cancelAction();
    setShowConfirmDialog(false);
  }, [cancelAction]);

  // Handler de sucesso ao criar item
  const handleItemCreated = useCallback((data: Record<string, unknown>) => {
    toast.success('✅ Item criado com sucesso!');
    setSelectedEntity(null);
  }, []);

  if (!isOwner) return null;

  return (
    <>
      {/* Botão flutuante quando Master Mode está ativo */}
      <AnimatePresence>
        {isActive && !isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
            data-quick-add-menu
            className="fixed top-20 right-4 z-[9999] flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-purple-600 text-primary-foreground rounded-full shadow-xl hover:shadow-2xl transition-all group"
            style={{ boxShadow: '0 0 30px hsl(280 80% 50% / 0.4)' }}
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Novo</span>
            <kbd className="hidden group-hover:inline-flex text-[10px] bg-white/20 px-1.5 py-0.5 rounded ml-1">
              Ctrl+Shift+Q
            </kbd>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Menu expandido */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            data-quick-add-menu
            className="fixed top-20 right-4 z-[99999] bg-background/95 backdrop-blur-xl border border-primary/30 rounded-2xl shadow-2xl overflow-hidden min-w-[280px] max-h-[80vh]"
            style={{ boxShadow: '0 0 60px hsl(280 80% 50% / 0.3)' }}
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 border-b border-primary/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-bold text-foreground">Quick Add</span>
                <kbd className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                  Ctrl+Shift+Q
                </kbd>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setActiveSubmenu(null);
                }}
                className="p-1.5 hover:bg-primary/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Categorias */}
            <div className="overflow-y-auto max-h-[calc(80vh-60px)] p-2">
              <div className="grid gap-1">
                {QUICK_ADD_CATEGORIES.map((category) => (
                  <div key={category.id} className="relative">
                    {category.subItems ? (
                      // Com submenu
                      <div
                        className="relative"
                        onMouseEnter={() => setActiveSubmenu(category.id)}
                        onMouseLeave={() => setActiveSubmenu(null)}
                      >
                        <button
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary/10 rounded-lg transition-all group"
                        >
                          <span className={category.color}>{category.icon}</span>
                          <span className="flex-1 text-left text-sm font-medium">{category.label}</span>
                          <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </button>

                        {/* Submenu */}
                        <AnimatePresence>
                          {activeSubmenu === category.id && (
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              className="absolute left-full top-0 ml-1 bg-background/95 backdrop-blur-xl border border-primary/30 rounded-xl shadow-xl min-w-[200px] z-[100000]"
                              style={{ boxShadow: '0 0 40px hsl(280 80% 50% / 0.2)' }}
                            >
                              <div className="p-2">
                                {category.subItems.map((subItem) => (
                                  <button
                                    key={subItem.id}
                                    onClick={() => handleSelectCategory(subItem.entityType)}
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-primary/10 rounded-lg transition-all text-sm"
                                  >
                                    <Plus className="w-3 h-3 text-green-500" />
                                    {subItem.label}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      // Sem submenu - clique direto
                      <button
                        onClick={() => handleSelectCategory(category.entityType)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary/10 rounded-lg transition-all"
                      >
                        <span className={category.color}>{category.icon}</span>
                        <span className="text-sm font-medium">{category.label}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer com dicas */}
            <div className="px-4 py-2 bg-muted/50 border-t border-border text-[11px] text-muted-foreground flex items-center gap-2">
              <Keyboard className="w-3 h-3" />
              <span>Clique direito em qualquer lugar para mais ações</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de criação */}
      {selectedEntity && (
        <MasterAddModal
          isOpen={!!selectedEntity}
          onClose={() => setSelectedEntity(null)}
          entityType={selectedEntity}
          onSuccess={handleItemCreated}
        />
      )}

      {/* Diálogo de confirmação */}
      {showConfirmDialog && pendingAction && (
        <MasterActionConfirmDialog
          isOpen={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          action={pendingAction}
          onConfirm={handleConfirmAction}
          onCancel={handleCancelAction}
        />
      )}
    </>
  );
}
