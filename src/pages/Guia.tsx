import { motion } from "framer-motion";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
import { 
  BookOpen, 
  Sparkles, 
  CheckCircle2,
  ArrowRight,
  LayoutDashboard,
  Users,
  Wallet,
  Building2,
  TrendingUp,
  Handshake,
  GraduationCap,
  FileText,
  Settings,
  UserCog,
  Shield,
  HelpCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Guia() {
  const navigate = useNavigate();

  const modules = [
    {
      icon: LayoutDashboard,
      title: "Dashboard",
      path: "/",
      description: "Visão geral de todos os indicadores da empresa",
      features: [
        "Gráfico de evolução mensal (receitas vs despesas)",
        "Metas financeiras com barra de progresso",
        "Alertas automáticos de orçamento",
        "Transações recentes",
        "Ações rápidas para navegação"
      ],
      color: "text-[hsl(var(--stats-blue))]",
      bg: "bg-[hsl(var(--stats-blue))]/10",
    },
    {
      icon: Users,
      title: "Funcionários",
      path: "/funcionarios",
      description: "Cadastro e gestão da equipe",
      features: [
        "Adicionar, editar e remover funcionários",
        "Filtrar por status (ativo, férias, afastado)",
        "Busca por nome",
        "Visualizar salário e função",
        "Status com cores visuais"
      ],
      color: "text-[hsl(var(--stats-red))]",
      bg: "bg-[hsl(var(--stats-red))]/10",
    },
    {
      icon: UserCog,
      title: "Gestão de Equipe",
      path: "/gestao-equipe",
      description: "Controle de ponto e documentos",
      features: [
        "Registro de ponto digital (entrada/saída)",
        "Controle de pausa para almoço",
        "Histórico de férias e afastamentos",
        "Área de documentos por funcionário",
        "Visão geral de status da equipe"
      ],
      color: "text-[hsl(var(--stats-purple))]",
      bg: "bg-[hsl(var(--stats-purple))]/10",
    },
    {
      icon: Wallet,
      title: "Finanças Pessoais",
      path: "/financas-pessoais",
      description: "Controle de gastos pessoais",
      features: [
        "Gastos fixos mensais (aluguel, contas)",
        "Gastos extras do dia a dia",
        "Categorias: Feira, Casa, Bruna, Moisés, Cachorro, Carro, Gasolina, Lanches",
        "Total mensal automático",
        "Edição e exclusão de registros"
      ],
      color: "text-[hsl(var(--stats-gold))]",
      bg: "bg-[hsl(var(--stats-gold))]/10",
    },
    {
      icon: Building2,
      title: "Finanças Empresa",
      path: "/financas-empresa",
      description: "Gastos da empresa",
      features: [
        "Gastos fixos (salários, serviços)",
        "Gastos extras da empresa",
        "Categorização por tipo",
        "Cálculo automático de totais",
        "Histórico de despesas"
      ],
      color: "text-[hsl(var(--stats-blue))]",
      bg: "bg-[hsl(var(--stats-blue))]/10",
    },
    {
      icon: TrendingUp,
      title: "Entradas",
      path: "/entradas",
      description: "Receitas e impostos",
      features: [
        "Registro de receitas por fonte (PJ44, PJ53, MEI, Hotmart)",
        "Banco de recebimento (Bradesco, Stone, Nubank)",
        "Controle de impostos",
        "Cálculo de receita líquida",
        "Edição e exclusão"
      ],
      color: "text-[hsl(var(--stats-green))]",
      bg: "bg-[hsl(var(--stats-green))]/10",
    },
    {
      icon: Handshake,
      title: "Afiliados",
      path: "/afiliados",
      description: "Gestão de parceiros de vendas",
      features: [
        "Cadastro de afiliados",
        "Total de vendas por afiliado",
        "Comissões acumuladas",
        "ID Hotmart integrado",
        "Edição de dados"
      ],
      color: "text-[hsl(var(--stats-green))]",
      bg: "bg-[hsl(var(--stats-green))]/10",
    },
    {
      icon: GraduationCap,
      title: "Alunos",
      path: "/gestaofc/alunos",
      description: "Base de alunos dos cursos",
      features: [
        "Lista de alunos cadastrados",
        "Curso matriculado",
        "Status do aluno",
        "Email de contato",
        "ID WordPress"
      ],
      color: "text-[hsl(var(--stats-red))]",
      bg: "bg-[hsl(var(--stats-red))]/10",
    },
    {
      icon: FileText,
      title: "Relatórios",
      path: "/relatorios",
      description: "Exportação de dados e análises",
      features: [
        "Seletor de mês para análise",
        "Gráfico de gastos por categoria",
        "Exportação para CSV (abre no Excel)",
        "Resumo financeiro visual",
        "Comparativo de períodos"
      ],
      color: "text-[hsl(var(--stats-purple))]",
      bg: "bg-[hsl(var(--stats-purple))]/10",
    },
    {
      icon: Settings,
      title: "Configurações",
      path: "/configuracoes",
      description: "Personalização do sistema",
      features: [
        "Dados da empresa",
        "Preferências de notificação",
        "Backup de dados (exportar JSON)",
        "Opções de aparência",
        "Informações do usuário"
      ],
      color: "text-muted-foreground",
      bg: "bg-secondary",
    },
  ];

  const faqs = [
    {
      question: "Como adicionar um novo funcionário?",
      answer: "Acesse 'Funcionários' no menu lateral, clique no botão '+ Novo Funcionário', preencha os dados (nome, função, setor, salário) e clique em 'Salvar'."
    },
    {
      question: "Como registrar um gasto pessoal?",
      answer: "Vá em 'Finanças Pessoais', clique em 'Adicionar' na seção de gastos extras, selecione a categoria (ex: Feira, Gasolina), digite o valor e descrição, depois salve."
    },
    {
      question: "Como exportar um relatório?",
      answer: "Acesse 'Relatórios', selecione o mês desejado, e clique em 'Exportar CSV' no relatório que deseja. O arquivo será baixado e pode ser aberto no Excel."
    },
    {
      question: "Como funciona o controle de ponto?",
      answer: "Em 'Gestão de Equipe', selecione o funcionário, e clique nos botões: 'Entrada' ao começar, 'Saída Almoço' e 'Volta Almoço' no intervalo, e 'Saída' ao terminar."
    },
    {
      question: "Como fazer backup dos dados?",
      answer: "Acesse 'Configurações', vá na aba 'Backup', e clique em 'Exportar Backup'. Um arquivo JSON com todos os dados será baixado para seu computador."
    },
    {
      question: "Quem pode ver e editar os dados?",
      answer: "O Owner (proprietário) tem acesso total. Admins podem ver e editar a maioria dos dados. Funcionários comuns só veem seus próprios dados pessoais."
    },
  ];

  const { gpuAnimationProps, shouldAnimate } = useQuantumReactivity();

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="mx-auto max-w-5xl">
        {/* Header - GPU optimized */}
        <motion.header 
          {...gpuAnimationProps.fadeUp}
          className="mb-10 will-change-transform transform-gpu"
        >
          <div className="space-y-2">
            <motion.div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium tracking-wide uppercase">Documentação</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              Guia do Sistema
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Aprenda a usar cada funcionalidade do sistema de gestão.
            </p>
          </div>
        </motion.header>

        {/* Roles Info - GPU optimized */}
        <motion.section
          {...gpuAnimationProps.fadeUp}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6 mb-8 will-change-transform transform-gpu"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Níveis de Acesso</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-xl bg-secondary/30">
              <h3 className="font-semibold text-foreground mb-2">👑 Owner (Proprietário)</h3>
              <p className="text-sm text-muted-foreground">
                Acesso total a todos os módulos. Pode criar, editar e excluir qualquer dado. Gerencia outros usuários.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/30">
              <h3 className="font-semibold text-foreground mb-2">⚙️ Admin</h3>
              <p className="text-sm text-muted-foreground">
                Acesso amplo ao sistema. Pode gerenciar funcionários, finanças da empresa e relatórios.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/30">
              <h3 className="font-semibold text-foreground mb-2">👤 Funcionário</h3>
              <p className="text-sm text-muted-foreground">
                Acesso limitado. Pode ver seus próprios dados e registrar ponto. Não acessa finanças da empresa.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Modules - GPU optimized */}
        <motion.section
          {...gpuAnimationProps.fadeUp}
          transition={{ delay: 0.2 }}
          className="mb-8 will-change-transform transform-gpu"
        >
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Módulos do Sistema
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            {modules.map((module, index) => (
              <motion.div
                key={module.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="glass-card rounded-2xl p-5 hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${module.bg} shrink-0`}>
                    <module.icon className={`h-5 w-5 ${module.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-foreground">{module.title}</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => navigate(module.path)}
                      >
                        Acessar <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{module.description}</p>
                    <ul className="space-y-1">
                      {module.features.slice(0, 3).map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3 text-[hsl(var(--stats-green))]" />
                          {feature}
                        </li>
                      ))}
                      {module.features.length > 3 && (
                        <li className="text-xs text-primary">
                          +{module.features.length - 3} funcionalidades...
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* FAQ - GPU optimized */}
        <motion.section
          {...gpuAnimationProps.fadeUp}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-6 will-change-transform transform-gpu"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Perguntas Frequentes</h2>
          </div>

          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border/50 rounded-xl px-4 data-[state=open]:bg-secondary/30"
              >
                <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.section>
      </div>
    </div>
  );
}
