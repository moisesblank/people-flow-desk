// ============================================
// MOISÉS MEDEIROS v15.0 - MASTER QUICK ADD MENU
// Menu flutuante de criação rápida Ctrl+Shift+Q
// TODAS AS ENTIDADES DO SISTEMA
// Owner exclusivo: moisesblank@gmail.com
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
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
  Zap,
  GraduationCap,
  FlaskConical,
  Trophy,
  Award,
  Lightbulb,
  FileSpreadsheet,
  Building2,
  Wallet,
  Receipt,
  PiggyBank,
  TrendingUp,
  BadgeCheck,
  HeartHandshake,
  School,
  Monitor,
  Users2,
  Database,
  Globe,
  Link,
  Image,
  Mic,
  Play,
  Edit3,
  CheckSquare,
  Clock,
  AlertCircle,
  Mail,
  Send,
  Package,
  ShoppingCart,
  Store,
  Percent,
  Tag,
  Hash,
  Star,
  Flame,
  Crown
} from 'lucide-react';

interface QuickAddCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  entityType: string;
  subItems?: { id: string; label: string; entityType: string; icon?: React.ReactNode }[];
}

// TODAS AS CATEGORIAS DISPONÍVEIS NA PLATAFORMA
const QUICK_ADD_CATEGORIES: QuickAddCategory[] = [
  // ==================== FINANÇAS ====================
  {
    id: 'financas',
    label: 'Finanças',
    icon: <DollarSign className="w-4 h-4" />,
    color: 'text-green-500',
    entityType: 'transaction',
    subItems: [
      { id: 'entrada', label: 'Nova Entrada (Receita)', entityType: 'entrada', icon: <TrendingUp className="w-3 h-3" /> },
      { id: 'conta_pagar', label: 'Conta a Pagar', entityType: 'conta_pagar', icon: <Receipt className="w-3 h-3" /> },
      { id: 'conta_receber', label: 'Conta a Receber', entityType: 'conta_receber', icon: <Wallet className="w-3 h-3" /> },
      { id: 'gasto_fixo_empresa', label: 'Gasto Fixo (Empresa)', entityType: 'company_fixed_expense', icon: <Building2 className="w-3 h-3" /> },
      { id: 'gasto_extra_empresa', label: 'Gasto Extra (Empresa)', entityType: 'company_extra_expense', icon: <Receipt className="w-3 h-3" /> },
      { id: 'gasto_fixo_pessoal', label: 'Gasto Fixo (Pessoal)', entityType: 'personal_fixed_expense', icon: <PiggyBank className="w-3 h-3" /> },
      { id: 'gasto_extra_pessoal', label: 'Gasto Extra (Pessoal)', entityType: 'personal_extra_expense', icon: <Wallet className="w-3 h-3" /> },
      { id: 'meta_financeira', label: 'Meta Financeira', entityType: 'financial_goal', icon: <Target className="w-3 h-3" /> },
      { id: 'conta_bancaria', label: 'Conta Bancária', entityType: 'bank_account', icon: <CreditCard className="w-3 h-3" /> },
    ]
  },
  // ==================== CURSOS / LMS ====================
  {
    id: 'cursos',
    label: 'Cursos / LMS',
    icon: <GraduationCap className="w-4 h-4" />,
    color: 'text-blue-500',
    entityType: 'course',
    subItems: [
      { id: 'course', label: 'Novo Curso', entityType: 'course', icon: <BookOpen className="w-3 h-3" /> },
      { id: 'module', label: 'Novo Módulo', entityType: 'module', icon: <Folder className="w-3 h-3" /> },
      { id: 'lesson', label: 'Nova Aula', entityType: 'lesson', icon: <Play className="w-3 h-3" /> },
      { id: 'quiz', label: 'Novo Quiz', entityType: 'quiz', icon: <CheckSquare className="w-3 h-3" /> },
      { id: 'quiz_question', label: 'Questão de Quiz', entityType: 'quiz_question', icon: <Hash className="w-3 h-3" /> },
      { id: 'flashcard', label: 'Novo Flashcard', entityType: 'flashcard', icon: <Lightbulb className="w-3 h-3" /> },
      { id: 'category', label: 'Categoria', entityType: 'category', icon: <Tag className="w-3 h-3" /> },
    ]
  },
  // ==================== ALUNOS ====================
  {
    id: 'alunos',
    label: 'Alunos',
    icon: <Users className="w-4 h-4" />,
    color: 'text-purple-500',
    entityType: 'aluno',
    subItems: [
      { id: 'aluno', label: 'Novo Aluno', entityType: 'aluno', icon: <Users className="w-3 h-3" /> },
      { id: 'enrollment', label: 'Matrícula', entityType: 'enrollment', icon: <BadgeCheck className="w-3 h-3" /> },
      { id: 'certificate', label: 'Certificado', entityType: 'certificate', icon: <Award className="w-3 h-3" /> },
    ]
  },
  // ==================== EQUIPE / RH ====================
  {
    id: 'equipe',
    label: 'Equipe / RH',
    icon: <UserCheck className="w-4 h-4" />,
    color: 'text-orange-500',
    entityType: 'employee',
    subItems: [
      { id: 'employee', label: 'Novo Funcionário', entityType: 'employee', icon: <UserCheck className="w-3 h-3" /> },
      { id: 'employee_document', label: 'Documento de RH', entityType: 'employee_document', icon: <FileText className="w-3 h-3" /> },
      { id: 'dev_task', label: 'Tarefa de Dev', entityType: 'dev_task', icon: <Monitor className="w-3 h-3" /> },
      { id: 'time_clock', label: 'Registro de Ponto', entityType: 'time_clock_entry', icon: <Clock className="w-3 h-3" /> },
    ]
  },
  // ==================== TAREFAS ====================
  {
    id: 'tarefas',
    label: 'Tarefas',
    icon: <ClipboardList className="w-4 h-4" />,
    color: 'text-yellow-500',
    entityType: 'task',
    subItems: [
      { id: 'task', label: 'Nova Tarefa', entityType: 'task', icon: <ClipboardList className="w-3 h-3" /> },
      { id: 'calendar_task', label: 'Tarefa no Calendário', entityType: 'calendar_task', icon: <Calendar className="w-3 h-3" /> },
      { id: 'checklist', label: 'Checklist', entityType: 'checklist', icon: <CheckSquare className="w-3 h-3" /> },
    ]
  },
  // ==================== CALENDÁRIO ====================
  {
    id: 'calendario',
    label: 'Calendário',
    icon: <Calendar className="w-4 h-4" />,
    color: 'text-cyan-500',
    entityType: 'calendar_task',
  },
  // ==================== MARKETING ====================
  {
    id: 'marketing',
    label: 'Marketing',
    icon: <Megaphone className="w-4 h-4" />,
    color: 'text-pink-500',
    entityType: 'campaign',
    subItems: [
      { id: 'campaign', label: 'Nova Campanha', entityType: 'campaign', icon: <Megaphone className="w-3 h-3" /> },
      { id: 'affiliate', label: 'Novo Afiliado', entityType: 'affiliate', icon: <HeartHandshake className="w-3 h-3" /> },
      { id: 'lead', label: 'Novo Lead', entityType: 'lead', icon: <Users2 className="w-3 h-3" /> },
      { id: 'email_template', label: 'Template de Email', entityType: 'email_template', icon: <Mail className="w-3 h-3" /> },
    ]
  },
  // ==================== AFILIADOS ====================
  {
    id: 'afiliados',
    label: 'Afiliados',
    icon: <HeartHandshake className="w-4 h-4" />,
    color: 'text-emerald-500',
    entityType: 'affiliate',
    subItems: [
      { id: 'affiliate', label: 'Novo Afiliado', entityType: 'affiliate', icon: <HeartHandshake className="w-3 h-3" /> },
      { id: 'comissao', label: 'Nova Comissão', entityType: 'comissao', icon: <Percent className="w-3 h-3" /> },
    ]
  },
  // ==================== LANÇAMENTO ====================
  {
    id: 'lancamento',
    label: 'Lançamentos',
    icon: <Target className="w-4 h-4" />,
    color: 'text-red-500',
    entityType: 'launch',
    subItems: [
      { id: 'launch', label: 'Novo Lançamento', entityType: 'launch', icon: <Target className="w-3 h-3" /> },
      { id: 'launch_event', label: 'Evento de Lançamento', entityType: 'launch_event', icon: <Flame className="w-3 h-3" /> },
    ]
  },
  // ==================== DOCUMENTOS ====================
  {
    id: 'documentos',
    label: 'Documentos',
    icon: <FileText className="w-4 h-4" />,
    color: 'text-amber-500',
    entityType: 'document',
    subItems: [
      { id: 'document', label: 'Novo Documento', entityType: 'document', icon: <FileText className="w-3 h-3" /> },
      { id: 'arquivo', label: 'Novo Arquivo', entityType: 'arquivo', icon: <Folder className="w-3 h-3" /> },
      { id: 'attachment', label: 'Anexo Universal', entityType: 'attachment', icon: <Link className="w-3 h-3" /> },
    ]
  },
  // ==================== TURMAS ====================
  {
    id: 'turmas',
    label: 'Turmas',
    icon: <School className="w-4 h-4" />,
    color: 'text-violet-500',
    entityType: 'turma',
    subItems: [
      { id: 'turma_online', label: 'Turma Online', entityType: 'turma_online', icon: <Monitor className="w-3 h-3" /> },
      { id: 'turma_presencial', label: 'Turma Presencial', entityType: 'turma_presencial', icon: <School className="w-3 h-3" /> },
      { id: 'experimento', label: 'Experimento', entityType: 'experimento', icon: <FlaskConical className="w-3 h-3" /> },
    ]
  },
  // ==================== AULAS AO VIVO ====================
  {
    id: 'aulas_vivo',
    label: 'Aulas ao Vivo',
    icon: <Video className="w-4 h-4" />,
    color: 'text-rose-500',
    entityType: 'live_class',
    subItems: [
      { id: 'live_class', label: 'Nova Aula ao Vivo', entityType: 'live_class', icon: <Video className="w-3 h-3" /> },
      { id: 'recording', label: 'Gravação', entityType: 'recording', icon: <Mic className="w-3 h-3" /> },
    ]
  },
  // ==================== WHATSAPP ====================
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: <MessageSquare className="w-4 h-4" />,
    color: 'text-green-600',
    entityType: 'whatsapp_lead',
    subItems: [
      { id: 'whatsapp_lead', label: 'Novo Lead', entityType: 'whatsapp_lead', icon: <MessageSquare className="w-3 h-3" /> },
      { id: 'whatsapp_message', label: 'Nova Mensagem', entityType: 'whatsapp_message', icon: <Send className="w-3 h-3" /> },
      { id: 'whatsapp_conversation', label: 'Nova Conversa', entityType: 'whatsapp_conversation', icon: <MessageSquare className="w-3 h-3" /> },
    ]
  },
  // ==================== GAMIFICAÇÃO ====================
  {
    id: 'gamificacao',
    label: 'Gamificação',
    icon: <Trophy className="w-4 h-4" />,
    color: 'text-amber-400',
    entityType: 'badge',
    subItems: [
      { id: 'badge', label: 'Novo Badge', entityType: 'badge', icon: <Award className="w-3 h-3" /> },
      { id: 'achievement', label: 'Nova Conquista', entityType: 'achievement', icon: <Trophy className="w-3 h-3" /> },
      { id: 'xp_reward', label: 'Recompensa XP', entityType: 'xp_reward', icon: <Star className="w-3 h-3" /> },
    ]
  },
  // ==================== ALERTAS ====================
  {
    id: 'alertas',
    label: 'Alertas',
    icon: <Bell className="w-4 h-4" />,
    color: 'text-red-400',
    entityType: 'alerta',
    subItems: [
      { id: 'alerta', label: 'Novo Alerta', entityType: 'alerta', icon: <AlertCircle className="w-3 h-3" /> },
      { id: 'notification', label: 'Nova Notificação', entityType: 'notification', icon: <Bell className="w-3 h-3" /> },
    ]
  },
  // ==================== RELATÓRIOS ====================
  {
    id: 'relatorios',
    label: 'Relatórios',
    icon: <BarChart3 className="w-4 h-4" />,
    color: 'text-indigo-500',
    entityType: 'report',
    subItems: [
      { id: 'report', label: 'Novo Relatório', entityType: 'report', icon: <BarChart3 className="w-3 h-3" /> },
      { id: 'automated_report', label: 'Relatório Automático', entityType: 'automated_report', icon: <FileSpreadsheet className="w-3 h-3" /> },
    ]
  },
  // ==================== INTEGRAÇÕES ====================
  {
    id: 'integracoes',
    label: 'Integrações',
    icon: <Link className="w-4 h-4" />,
    color: 'text-blue-400',
    entityType: 'integration',
    subItems: [
      { id: 'webhook', label: 'Novo Webhook', entityType: 'webhook', icon: <Link className="w-3 h-3" /> },
      { id: 'automation_rule', label: 'Regra de Automação', entityType: 'custom_rule', icon: <Zap className="w-3 h-3" /> },
    ]
  },
  // ==================== CONTABILIDADE ====================
  {
    id: 'contabilidade',
    label: 'Contabilidade',
    icon: <FileSpreadsheet className="w-4 h-4" />,
    color: 'text-teal-500',
    entityType: 'contabilidade',
    subItems: [
      { id: 'contabilidade', label: 'Lançamento Contábil', entityType: 'contabilidade', icon: <FileSpreadsheet className="w-3 h-3" /> },
      { id: 'imposto', label: 'Imposto', entityType: 'imposto', icon: <Receipt className="w-3 h-3" /> },
    ]
  },
  // ==================== SITE / PROGRAMADOR ====================
  {
    id: 'site',
    label: 'Site / Dev',
    icon: <Globe className="w-4 h-4" />,
    color: 'text-slate-400',
    entityType: 'website_pendencia',
    subItems: [
      { id: 'pendencia', label: 'Pendência do Site', entityType: 'website_pendencia', icon: <Globe className="w-3 h-3" /> },
      { id: 'editable_content', label: 'Conteúdo Editável', entityType: 'editable_content', icon: <Edit3 className="w-3 h-3" /> },
    ]
  },
  // ==================== CONFIGURAÇÕES ====================
  {
    id: 'configuracoes',
    label: 'Configurações',
    icon: <Settings className="w-4 h-4" />,
    color: 'text-gray-400',
    entityType: 'setting',
    subItems: [
      { id: 'branding', label: 'Branding', entityType: 'branding', icon: <Image className="w-3 h-3" /> },
      { id: 'user_role', label: 'Role de Usuário', entityType: 'user_role', icon: <Crown className="w-3 h-3" /> },
    ]
  },
];

export function MasterQuickAddMenu() {
  const { isOwner, isActive } = useGodMode();
  const { pendingAction, confirmAction, cancelAction, isProcessing } = useMasterActions();
  const location = useLocation();
  
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
            toast.success('⚡ Quick Add TOTAL ativado!', {
              description: `${QUICK_ADD_CATEGORIES.length} categorias • Página: ${location.pathname}`,
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
  }, [isOwner, isOpen, location.pathname]);

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
    toast.success('✅ Item criado com sucesso!', {
      description: 'Use Ctrl+Z para desfazer'
    });
    setSelectedEntity(null);
  }, []);

  if (!isOwner) return null;

  // Calcular total de entidades
  const totalEntities = QUICK_ADD_CATEGORIES.reduce((acc, cat) => 
    acc + (cat.subItems ? cat.subItems.length : 1), 0
  );

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
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">{totalEntities}</span>
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
            className="fixed top-20 right-4 z-[99999] bg-background/95 backdrop-blur-xl border border-primary/30 rounded-2xl shadow-2xl overflow-hidden min-w-[320px] max-h-[85vh]"
            style={{ boxShadow: '0 0 60px hsl(280 80% 50% / 0.3)' }}
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 border-b border-primary/20 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                <span className="font-bold text-foreground">Quick Add TOTAL</span>
                <span className="text-[10px] bg-primary/30 text-primary px-1.5 py-0.5 rounded">
                  {totalEntities} tipos
                </span>
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
            <div className="overflow-y-auto max-h-[calc(85vh-100px)] p-2">
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
                          <span className="text-[10px] text-muted-foreground">{category.subItems.length}</span>
                          <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </button>

                        {/* Submenu */}
                        <AnimatePresence>
                          {activeSubmenu === category.id && (
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              className="absolute left-full top-0 ml-1 bg-background/95 backdrop-blur-xl border border-primary/30 rounded-xl shadow-xl min-w-[220px] max-h-[400px] overflow-y-auto z-[100000]"
                              style={{ boxShadow: '0 0 40px hsl(280 80% 50% / 0.2)' }}
                            >
                              <div className="p-2">
                                <div className="px-2 py-1 text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                                  {category.label}
                                </div>
                                {category.subItems.map((subItem) => (
                                  <button
                                    key={subItem.id}
                                    onClick={() => handleSelectCategory(subItem.entityType)}
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-primary/10 rounded-lg transition-all text-sm"
                                  >
                                    {subItem.icon ? (
                                      <span className={category.color}>{subItem.icon}</span>
                                    ) : (
                                      <Plus className="w-3 h-3 text-green-500" />
                                    )}
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
            <div className="px-4 py-2 bg-muted/50 border-t border-border text-[10px] text-muted-foreground space-y-1 sticky bottom-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Keyboard className="w-3 h-3" />
                  <span>Ctrl+Shift+Q</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Ctrl+Z = Desfazer</span>
                </div>
              </div>
              <div className="text-primary/70">
                🔮 MODO DEUS ATIVO • Página: {location.pathname}
              </div>
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
