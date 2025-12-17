// ============================================
// 🔮 TRAMON v4.0 - SUPERINTELIGÊNCIA AUTÔNOMA
// EXECUTIVE AI ASSISTANT - ENTERPRISE GRADE
// Modelo: Gemini 2.5 Pro (Multimodal + Vision)
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ========================================
// 📱 ASSESSORES OFICIAIS
// ========================================
const ASSESSORES = {
  moises: {
    nome: "Moisés Medeiros",
    telefones: ["558398920105", "5583998920105"],
    email: "moisesblank@gmail.com",
    cargo: "Proprietário/CEO"
  },
  bruna: {
    nome: "Bruna",
    telefones: ["558396354090", "5583996354090"],
    email: "",
    cargo: "Co-gestora"
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context, userId, image } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // ========================================
    // 🔐 VERIFICAÇÃO DE ACESSO PREMIUM
    // ========================================
    let hasAccess = false;
    let userRole = "unknown";
    let userEmail = "";
    let userName = "";

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && userId) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      userEmail = userData?.user?.email || "";
      userRole = roleData?.role || "employee";
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nome')
        .eq('id', userId)
        .single();
      userName = profileData?.nome || userEmail.split('@')[0];
      
      const OWNER_EMAIL = "moisesblank@gmail.com";
      hasAccess = userEmail === OWNER_EMAIL || userRole === "owner" || userRole === "admin" || userRole === "coordenacao";
      
      console.log(`[TRAMON v4] User: ${userEmail}, Role: ${userRole}, Access: ${hasAccess}, HasImage: ${!!image}`);
    }

    if (!hasAccess) {
      return new Response(JSON.stringify({ 
        error: "🔒 Acesso negado. TRAMON é exclusiva para Owner e Administradores.",
        code: "UNAUTHORIZED"
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========================================
    // 📊 COLETA DE DADOS ULTRA COMPLETOS EM TEMPO REAL
    // ========================================
    let systemData: any = {
      financial: { 
        totalIncome: 0, totalExpenses: 0, profit: 0, monthlyGrowth: 0, 
        runway: 0, fixedExpenses: 0, extraExpenses: 0, cashFlow: 0, pendingPayments: 0,
        incomeBySource: {}, expensesByCategory: {}, recentTransactions: []
      },
      students: { 
        active: 0, total: 0, retention: 0, newThisMonth: 0, 
        churnRate: 0, avgProgress: 0, vips: 0, atRisk: 0,
        topStudents: [], recentEnrollments: [], progressDistribution: {}
      },
      employees: { 
        active: 0, total: 0, byRole: {}, bySector: {}, 
        recentHires: [], performance: {}
      },
      tasks: { 
        pending: 0, highPriority: 0, completed: 0, overdue: 0, 
        completionRate: 0, todayTasks: 0, weekTasks: 0,
        byPriority: {}, byUser: {}, recentCompleted: [], urgent: []
      },
      marketing: { 
        cac: 0, ltv: 0, roi: 0, ltvCacRatio: 0, campaigns: 0, activeCampaigns: 0, totalLeads: 0,
        conversionRate: 0, campaignDetails: [], channelPerformance: {}
      },
      courses: { 
        total: 0, published: 0, averageRating: 0, totalStudents: 0, topCourse: '',
        courseDetails: [], moduleCompletion: {}, lessonEngagement: {}
      },
      system: { 
        lastBackup: null, activeUsers: 0, errors: 0, uptime: 99.9, version: 'v15.0 SYNAPSE',
        recentActivity: [], integrations: {}, healthScore: 100
      },
      affiliates: { 
        total: 0, active: 0, totalCommission: 0,
        topAffiliates: [], pendingCommissions: 0
      },
      whatsapp: {
        totalConversations: 0, unread: 0, recentMessages: [], leads: 0
      },
      calendar: {
        todayEvents: [], weekEvents: [], upcomingDeadlines: []
      }
    };
    
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      try {
        const today = new Date();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
        const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const todayStr = today.toISOString().split('T')[0];
        
        // Buscar todos os dados em paralelo para máxima performance
        const [
          incomeResult, fixedExpResult, extraExpResult, studentsResult, 
          employeesResult, tasksResult, coursesResult, marketingResult,
          enrollmentsResult, campaignsResult, profilesResult, affiliatesResult, 
          paymentsResult, lessonsResult, modulesResult, whatsappResult,
          calendarResult, notificationsResult, auditResult, gastosResult,
          entradasResult, contabilidadeResult
        ] = await Promise.all([
          supabase.from('income').select('*').order('created_at', { ascending: false }).limit(100),
          supabase.from('company_fixed_expenses').select('*'),
          supabase.from('company_extra_expenses').select('*').order('data', { ascending: false }).limit(50),
          supabase.from('students').select('*'),
          supabase.from('employees').select('*'),
          supabase.from('calendar_tasks').select('*').order('task_date', { ascending: true }),
          supabase.from('courses').select('*'),
          supabase.from('metricas_marketing').select('*').order('mes_referencia', { ascending: false }).limit(6),
          supabase.from('enrollments').select('*'),
          supabase.from('marketing_campaigns').select('*'),
          supabase.from('profiles').select('*'),
          supabase.from('affiliates').select('*'),
          supabase.from('payments').select('*'),
          supabase.from('lessons').select('*'),
          supabase.from('modules').select('*'),
          supabase.from('whatsapp_conversations').select('*').order('last_message_at', { ascending: false }).limit(20),
          supabase.from('calendar_tasks').select('*').gte('task_date', todayStr).lte('task_date', sevenDaysFromNow),
          supabase.from('notifications').select('*').eq('read', false).limit(10),
          supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(20),
          supabase.from('gastos').select('*').order('data', { ascending: false }).limit(50),
          supabase.from('entradas').select('*').order('data', { ascending: false }).limit(50),
          supabase.from('contabilidade').select('*').order('data_referencia', { ascending: false }).limit(30),
        ]);

        // Processar dados financeiros detalhados
        const income = incomeResult.data || [];
        const gastos = gastosResult.data || [];
        const entradas = entradasResult.data || [];
        
        const currentMonthIncome = income.filter(i => new Date(i.created_at) >= new Date(thirtyDaysAgo)).reduce((sum, i) => sum + (i.valor || 0), 0);
        const lastMonthIncome = income.filter(i => new Date(i.created_at) >= new Date(sixtyDaysAgo) && new Date(i.created_at) < new Date(thirtyDaysAgo)).reduce((sum, i) => sum + (i.valor || 0), 0);
        
        const fixedExpenses = (fixedExpResult.data || []).reduce((sum, e) => sum + (e.valor || 0), 0);
        const extraExpenses = (extraExpResult.data || []).filter(e => new Date(e.data || '') >= new Date(thirtyDaysAgo)).reduce((sum, e) => sum + (e.valor || 0), 0);
        const totalExpenses = fixedExpenses + extraExpenses;
        const profit = currentMonthIncome - totalExpenses;
        
        // Agrupar receitas por fonte
        const incomeBySource: Record<string, number> = {};
        income.forEach(i => {
          const fonte = i.fonte || 'Outros';
          incomeBySource[fonte] = (incomeBySource[fonte] || 0) + (i.valor || 0);
        });
        
        // Agrupar despesas por categoria
        const expensesByCategory: Record<string, number> = {};
        (fixedExpResult.data || []).forEach(e => {
          const cat = e.categoria || 'Fixos';
          expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (e.valor || 0);
        });
        gastos.forEach(g => {
          const cat = g.categoria || 'Outros';
          expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (g.valor || 0);
        });
        
        const payments = paymentsResult.data || [];
        const pendingPayments = payments.filter(p => p.status === 'pendente' || p.status === 'atrasado').reduce((sum, p) => sum + (p.valor || 0), 0);
        
        // Transações recentes
        const recentTransactions = [
          ...entradas.slice(0, 5).map(e => ({ tipo: 'entrada', valor: e.valor, descricao: e.descricao, data: e.data })),
          ...gastos.slice(0, 5).map(g => ({ tipo: 'saida', valor: g.valor, descricao: g.descricao, data: g.data }))
        ].sort((a, b) => new Date(b.data || 0).getTime() - new Date(a.data || 0).getTime()).slice(0, 10);
        
        systemData.financial = {
          totalIncome: currentMonthIncome,
          totalExpenses,
          profit,
          monthlyGrowth: lastMonthIncome > 0 ? ((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0,
          runway: totalExpenses > 0 ? Math.round((profit > 0 ? profit * 12 : currentMonthIncome) / totalExpenses) : 0,
          fixedExpenses,
          extraExpenses,
          cashFlow: currentMonthIncome - totalExpenses,
          pendingPayments,
          incomeBySource,
          expensesByCategory,
          recentTransactions
        };

        // Processar alunos detalhados
        const students = studentsResult.data || [];
        const activeStudents = students.filter(s => s.status === 'ativo');
        const newStudents = students.filter(s => new Date(s.created_at) >= new Date(thirtyDaysAgo));
        const enrollments = enrollmentsResult.data || [];
        const avgProgress = enrollments.length > 0 ? enrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / enrollments.length : 0;
        
        // Top alunos por progresso
        const topStudents = students
          .filter(s => s.status === 'ativo')
          .sort((a, b) => (b.progresso || 0) - (a.progresso || 0))
          .slice(0, 5)
          .map(s => ({ nome: s.nome, progresso: s.progresso, email: s.email }));
        
        // Distribuição de progresso
        const progressDistribution = {
          '0-25%': students.filter(s => (s.progresso || 0) <= 25).length,
          '26-50%': students.filter(s => (s.progresso || 0) > 25 && (s.progresso || 0) <= 50).length,
          '51-75%': students.filter(s => (s.progresso || 0) > 50 && (s.progresso || 0) <= 75).length,
          '76-100%': students.filter(s => (s.progresso || 0) > 75).length
        };
        
        systemData.students = {
          active: activeStudents.length,
          total: students.length,
          retention: students.length > 0 ? (activeStudents.length / students.length) * 100 : 0,
          newThisMonth: newStudents.length,
          churnRate: students.length > 0 ? ((students.length - activeStudents.length) / students.length) * 100 : 0,
          avgProgress,
          vips: students.filter(s => (s.progresso || 0) > 70).length,
          atRisk: students.filter(s => s.status === 'ativo' && (s.progresso || 0) < 20).length,
          topStudents,
          progressDistribution,
          recentEnrollments: newStudents.slice(0, 5).map(s => ({ nome: s.nome, data: s.created_at }))
        };

        // Processar funcionários detalhados
        const employees = employeesResult.data || [];
        const byRole: Record<string, number> = {};
        const bySector: Record<string, number> = {};
        employees.forEach(e => {
          byRole[e.funcao || 'outros'] = (byRole[e.funcao || 'outros'] || 0) + 1;
          bySector[e.setor || 'outros'] = (bySector[e.setor || 'outros'] || 0) + 1;
        });
        
        systemData.employees = {
          active: employees.filter(e => e.status === 'ativo').length,
          total: employees.length,
          byRole,
          bySector,
          recentHires: employees.filter(e => new Date(e.created_at || '') >= new Date(thirtyDaysAgo)).slice(0, 5).map(e => ({ nome: e.nome, funcao: e.funcao }))
        };

        // Processar tarefas detalhadas
        const tasks = tasksResult.data || [];
        const completedTasks = tasks.filter(t => t.is_completed).length;
        
        // Tarefas urgentes (alta prioridade e não completadas)
        const urgentTasks = tasks
          .filter(t => !t.is_completed && (t.priority === 'alta' || t.task_date < todayStr))
          .slice(0, 10)
          .map(t => ({ titulo: t.title, data: t.task_date, prioridade: t.priority }));
        
        // Tarefas por prioridade
        const byPriority = {
          alta: tasks.filter(t => t.priority === 'alta').length,
          media: tasks.filter(t => t.priority === 'media').length,
          baixa: tasks.filter(t => t.priority === 'baixa').length
        };
        
        systemData.tasks = {
          pending: tasks.filter(t => !t.is_completed && t.task_date >= todayStr).length,
          highPriority: tasks.filter(t => !t.is_completed && t.priority === 'alta').length,
          completed: completedTasks,
          overdue: tasks.filter(t => !t.is_completed && t.task_date < todayStr).length,
          completionRate: tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0,
          todayTasks: tasks.filter(t => t.task_date === todayStr).length,
          weekTasks: tasks.filter(t => new Date(t.task_date) >= today && new Date(t.task_date) <= new Date(sevenDaysFromNow)).length,
          byPriority,
          urgent: urgentTasks,
          recentCompleted: tasks.filter(t => t.is_completed).slice(0, 5).map(t => ({ titulo: t.title, data: t.task_date }))
        };

        // Processar cursos detalhados
        const courses = coursesResult.data || [];
        const publishedCourses = courses.filter(c => c.is_published);
        const topCourse = courses.sort((a, b) => (b.total_students || 0) - (a.total_students || 0))[0];
        
        systemData.courses = {
          total: courses.length,
          published: publishedCourses.length,
          averageRating: publishedCourses.length > 0 ? publishedCourses.reduce((sum, c) => sum + (c.average_rating || 0), 0) / publishedCourses.length : 0,
          totalStudents: courses.reduce((sum, c) => sum + (c.total_students || 0), 0),
          topCourse: topCourse?.title || 'N/A',
          courseDetails: courses.slice(0, 5).map(c => ({ 
            titulo: c.title, 
            alunos: c.total_students, 
            rating: c.average_rating,
            publicado: c.is_published
          }))
        };

        // Processar marketing detalhado
        const marketing = marketingResult.data?.[0];
        const campaigns = campaignsResult.data || [];
        const activeCampaigns = campaigns.filter(c => c.status === 'ativa');
        const totalLeads = campaigns.reduce((sum, c) => sum + (c.leads || 0), 0);
        const totalConversions = campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0);
        
        systemData.marketing = {
          cac: marketing?.cac || 0,
          ltv: marketing?.ltv || 0,
          roi: marketing?.roi_percentual || 0,
          ltvCacRatio: marketing?.cac > 0 ? (marketing?.ltv || 0) / marketing.cac : 0,
          campaigns: campaigns.length,
          activeCampaigns: activeCampaigns.length,
          totalLeads,
          conversionRate: totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0,
          campaignDetails: activeCampaigns.slice(0, 5).map(c => ({
            nome: c.name,
            leads: c.leads,
            conversoes: c.conversions,
            budget: c.budget,
            spent: c.spent
          }))
        };

        // Processar afiliados
        const affiliates = affiliatesResult.data || [];
        const topAffiliates = affiliates
          .sort((a, b) => (b.comissao_total || 0) - (a.comissao_total || 0))
          .slice(0, 5)
          .map(a => ({ nome: a.nome, comissao: a.comissao_total, status: a.status }));
        
        systemData.affiliates = {
          total: affiliates.length,
          active: affiliates.filter(a => a.status === 'ativo').length,
          totalCommission: affiliates.reduce((sum, a) => sum + (a.comissao_total || 0), 0),
          topAffiliates,
          pendingCommissions: affiliates.filter(a => a.status === 'pendente').reduce((sum, a) => sum + (a.comissao_total || 0), 0)
        };

        // Processar WhatsApp
        const whatsappConvos = whatsappResult.data || [];
        systemData.whatsapp = {
          totalConversations: whatsappConvos.length,
          unread: whatsappConvos.filter(w => !w.is_read).length,
          leads: whatsappConvos.filter(w => w.lead_status === 'novo').length,
          recentMessages: whatsappConvos.slice(0, 5).map(w => ({
            contato: w.contact_name,
            ultimaMensagem: w.last_message_at,
            status: w.lead_status
          }))
        };

        // Processar calendário
        const calendarTasks = calendarResult.data || [];
        systemData.calendar = {
          todayEvents: calendarTasks.filter(t => t.task_date === todayStr).map(t => ({ titulo: t.title, hora: t.task_time })),
          weekEvents: calendarTasks.slice(0, 10).map(t => ({ titulo: t.title, data: t.task_date, prioridade: t.priority })),
          upcomingDeadlines: calendarTasks.filter(t => t.priority === 'alta').slice(0, 5).map(t => ({ titulo: t.title, data: t.task_date }))
        };

        // Processar sistema
        const profiles = profilesResult.data || [];
        const auditLogs = auditResult.data || [];
        systemData.system = {
          lastBackup: null,
          activeUsers: profiles.filter(p => p.last_activity_at && new Date(p.last_activity_at) > new Date(Date.now() - 15 * 60 * 1000)).length,
          totalUsers: profiles.length,
          errors: 0,
          uptime: 99.9,
          version: 'v15.0 SYNAPSE',
          recentActivity: auditLogs.slice(0, 5).map(a => ({ acao: a.action, tabela: a.table_name, data: a.created_at })),
          healthScore: 100
        };

      } catch (dbError) {
        console.log("[TRAMON v4] Erro ao buscar dados:", dbError);
      }
    }

    // ========================================
    // 🔮 MEGA PROMPT v4.0 - ENTERPRISE GRADE
    // ========================================
    const formatCurrency = (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const formatPercent = (value: number) => `${value.toFixed(1)}%`;
    const formatDate = (date: Date) => date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const dataContext = `
## 📊 DADOS EM TEMPO REAL - ${formatDate(new Date())}

### 💰 FINANCEIRO
- **Receita Mensal:** ${formatCurrency(systemData.financial.totalIncome)}
- **Despesas:** ${formatCurrency(systemData.financial.totalExpenses)} (Fixas: ${formatCurrency(systemData.financial.fixedExpenses)} | Variáveis: ${formatCurrency(systemData.financial.extraExpenses)})
- **Lucro Líquido:** ${formatCurrency(systemData.financial.profit)} ${systemData.financial.profit > 0 ? '✅' : '🔴'}
- **Crescimento MoM:** ${formatPercent(systemData.financial.monthlyGrowth)}
- **Runway:** ~${systemData.financial.runway} meses
- **Pagamentos Pendentes:** ${formatCurrency(systemData.financial.pendingPayments)}
- **Fontes de Receita:** ${Object.entries(systemData.financial.incomeBySource).map(([k, v]) => `${k}: ${formatCurrency(v as number)}`).join(' | ')}

### 👥 ALUNOS
- **Ativos:** ${systemData.students.active}/${systemData.students.total} | **Retenção:** ${formatPercent(systemData.students.retention)}
- **Novos (30 dias):** ${systemData.students.newThisMonth} | **Churn:** ${formatPercent(systemData.students.churnRate)}
- **Progresso Médio:** ${formatPercent(systemData.students.avgProgress)}
- **VIPs (>70%):** ${systemData.students.vips} | **Em Risco (<20%):** ${systemData.students.atRisk} ${systemData.students.atRisk > 0 ? '⚠️' : ''}
- **Distribuição:** 0-25%: ${systemData.students.progressDistribution?.['0-25%'] || 0} | 26-50%: ${systemData.students.progressDistribution?.['26-50%'] || 0} | 51-75%: ${systemData.students.progressDistribution?.['51-75%'] || 0} | 76-100%: ${systemData.students.progressDistribution?.['76-100%'] || 0}

### 👔 EQUIPE
- **Ativos:** ${systemData.employees.active}/${systemData.employees.total}
- **Por Função:** ${Object.entries(systemData.employees.byRole).map(([k, v]) => `${k}: ${v}`).join(' | ')}
- **Por Setor:** ${Object.entries(systemData.employees.bySector).map(([k, v]) => `${k}: ${v}`).join(' | ')}

### ✅ TAREFAS
- **Pendentes:** ${systemData.tasks.pending} | **Alta Prioridade:** ${systemData.tasks.highPriority} ${systemData.tasks.highPriority > 5 ? '🔴' : ''}
- **Atrasadas:** ${systemData.tasks.overdue} ${systemData.tasks.overdue > 0 ? '⚠️' : ''}
- **Taxa de Conclusão:** ${formatPercent(systemData.tasks.completionRate)}
- **Hoje:** ${systemData.tasks.todayTasks} | **Semana:** ${systemData.tasks.weekTasks}
- **Urgentes:** ${systemData.tasks.urgent?.map((t: any) => t.titulo).join(', ') || 'Nenhuma'}

### 📚 CURSOS
- **Publicados:** ${systemData.courses.published}/${systemData.courses.total}
- **Rating Médio:** ⭐${systemData.courses.averageRating?.toFixed(1) || 0}
- **Total de Alunos:** ${systemData.courses.totalStudents}
- **Top Curso:** ${systemData.courses.topCourse}

### 📢 MARKETING
- **CAC:** ${formatCurrency(systemData.marketing.cac)} | **LTV:** ${formatCurrency(systemData.marketing.ltv)}
- **LTV/CAC:** ${systemData.marketing.ltvCacRatio?.toFixed(1) || 0}x ${systemData.marketing.ltvCacRatio >= 3 ? '✅' : '⚠️'}
- **ROI:** ${formatPercent(systemData.marketing.roi)}
- **Campanhas Ativas:** ${systemData.marketing.activeCampaigns}/${systemData.marketing.campaigns}
- **Leads:** ${systemData.marketing.totalLeads} | **Conversão:** ${formatPercent(systemData.marketing.conversionRate)}

### 🤝 AFILIADOS
- **Ativos:** ${systemData.affiliates.active}/${systemData.affiliates.total}
- **Comissões Pagas:** ${formatCurrency(systemData.affiliates.totalCommission)}
- **Top Afiliados:** ${systemData.affiliates.topAffiliates?.map((a: any) => a.nome).join(', ') || 'N/A'}

### 📱 WHATSAPP
- **Conversas:** ${systemData.whatsapp.totalConversations} | **Não Lidas:** ${systemData.whatsapp.unread}
- **Leads Novos:** ${systemData.whatsapp.leads}

### 📅 AGENDA
- **Eventos Hoje:** ${systemData.calendar.todayEvents?.length || 0}
- **Próximos:** ${systemData.calendar.weekEvents?.map((e: any) => e.titulo).slice(0, 3).join(', ') || 'Nenhum'}

### 💻 SISTEMA
- **Usuários Online:** ${systemData.system.activeUsers}/${systemData.system.totalUsers}
- **Saúde:** ${systemData.system.healthScore}% | **Versão:** ${systemData.system.version}
`;

    const systemPrompt = `# 🔮 TRAMON v4.0 - SUPERINTELIGÊNCIA AUTÔNOMA EMPRESARIAL

## 🎯 IDENTIDADE CENTRAL
Você é **TRAMON** (Transformative Realtime Autonomous Management Operations Network), a IA executiva mais avançada do mercado. Você é o braço direito digital do Professor **Moisés Medeiros**, CEO da plataforma educacional de química líder no Brasil.

## 🧬 DNA OPERACIONAL
- **Papel:** Chief AI Officer (CAIO) - Executor autônomo de decisões empresariais
- **Nível de Acesso:** GOD MODE - Controle total sobre todos os sistemas
- **Missão:** Maximizar lucro, otimizar operações, antecipar problemas, executar soluções
- **Estilo:** Direto, executivo, orientado a resultados, sem rodeios

## 👁️ CAPACIDADES MULTIMODAIS v4.0

### VISÃO COMPUTACIONAL AVANÇADA
Quando receber uma imagem, você DEVE:

1. **ANÁLISE INSTANTÂNEA:**
   - Identifique TUDO: textos, gráficos, layouts, cores, elementos UI, dados
   - Extraia informações estruturadas automaticamente
   - Detecte padrões, anomalias, oportunidades

2. **INTERPRETAÇÃO CONTEXTUAL:**
   - **Screenshot de Site/App:** Analise UX/UI, identifique problemas de usabilidade, sugira melhorias específicas com código se necessário
   - **Gráficos/Dashboards:** Interprete tendências, calcule métricas, identifique outliers, projete cenários
   - **Material de Marketing:** Avalie copy, design, CTA, sugira otimizações A/B
   - **Documentos/PDFs:** Extraia, organize, resuma, crie ações baseadas no conteúdo
   - **Designs/Layouts:** Extraia paleta de cores (HEX/RGB), fontes, espaçamentos, estrutura para replicar
   - **Fotos de Eventos:** Identifique pessoas, contexto, sugira conteúdo para redes sociais
   - **Comprovantes/Notas Fiscais:** Extraia valores, datas, categorize automaticamente para contabilidade
   - **Prints de Conversas:** Analise sentimento, identifique problemas, sugira respostas

3. **EXECUÇÃO AUTÔNOMA:**
   - Baseado na análise, SEMPRE sugira ações concretas
   - Se for design/layout, forneça código CSS/Tailwind para implementar
   - Se for dados, crie relatórios e projeções imediatas
   - Se for problema, apresente solução com passos claros

### PROCESSAMENTO DE DADOS EM TEMPO REAL
Você tem acesso a TODOS os dados da plataforma em tempo real:
${dataContext}

## 📋 PROTOCOLO DE RESPOSTA

### REGRAS ABSOLUTAS:
1. **SEJA CIRÚRGICO** - Cada palavra deve ter propósito. Elimine fluff.
2. **NÚMEROS PRIMEIRO** - Sempre lidere com métricas e dados concretos
3. **AÇÃO IMEDIATA** - Termine SEMPRE com próximos passos acionáveis
4. **FORMATAÇÃO PREMIUM:**
   - Use **negrito** para KPIs críticos
   - Emojis estratégicos (não decorativos)
   - Seções claras e escaneáveis
   - Bullets para listas, não parágrafos
5. **IMAGEM = PRIORIDADE** - Se houver imagem, comece SEMPRE analisando-a em detalhes
6. **PROATIVO** - Não espere perguntas, antecipe necessidades
7. **HONESTO** - Celebre vitórias, seja direto sobre problemas
8. **FORMATO MONETÁRIO:** Sempre R$ brasileiro com separadores corretos

### ESTRUTURA PADRÃO:
\`\`\`
📊 [TÍTULO DO INSIGHT/ANÁLISE]

[Métricas-chave em 1-2 linhas]

### 🎯 Análise
[Insights principais - máximo 5 bullets]

### ⚡ Ações Imediatas
1. [Ação específica com prazo]
2. [Ação específica com prazo]
3. [Ação específica com prazo]

### 📈 Impacto Esperado
[Projeção quantificada]
\`\`\`

## 🚨 ALERTAS AUTOMÁTICOS ATIVOS
${systemData.tasks.highPriority > 5 ? '🔴 **CRÍTICO:** ' + systemData.tasks.highPriority + ' tarefas de alta prioridade pendentes!' : ''}
${systemData.tasks.overdue > 0 ? '⚠️ **ATENÇÃO:** ' + systemData.tasks.overdue + ' tarefas ATRASADAS!' : ''}
${systemData.students.atRisk > 0 ? '📉 **CHURN RISK:** ' + systemData.students.atRisk + ' alunos em risco de abandono!' : ''}
${systemData.financial.profit < 0 ? '🔴 **PREJUÍZO:** Operação negativa em ' + formatCurrency(Math.abs(systemData.financial.profit)) : ''}
${systemData.marketing.ltvCacRatio < 3 ? '⚠️ **MARKETING:** LTV/CAC abaixo de 3x - revisar estratégia!' : ''}
${systemData.whatsapp.unread > 10 ? '📱 **WHATSAPP:** ' + systemData.whatsapp.unread + ' mensagens não lidas!' : ''}

## 👔 HIERARQUIA DE CONTATO

### Assessores Oficiais:
- **Moisés Medeiros** (CEO): +55 83 98920-0105 | moisesblank@gmail.com
  → Decisões estratégicas, financeiras, parcerias, aprovações
  
- **Bruna** (Co-gestora): +55 83 96354-090
  → Operações, equipe, execução diária

### Quando Escalar:
- Decisões > R$ 5.000 → Moisés
- Problemas técnicos críticos → Moisés
- Questões de equipe → Bruna
- Emergências → Ambos

## 🎭 CONTEXTO DO USUÁRIO
**Usuário:** ${userName}
**Cargo:** ${userRole.toUpperCase()}
**Email:** ${userEmail}

Adapte sua comunicação ao nível do usuário, mas mantenha sempre o padrão executivo.

## 🧠 INTELIGÊNCIA PREDITIVA
Com base nos dados históricos, você deve:
- Projetar tendências de receita e churn
- Identificar sazonalidades
- Antecipar gargalos operacionais
- Sugerir otimizações antes que problemas ocorram

## 🔐 PRINCÍPIOS INVIOLÁVEIS
1. **Dados são sagrados** - Nunca invente números
2. **Ação > Teoria** - Sempre conclua com passos práticos
3. **Tempo é dinheiro** - Respostas concisas e diretas
4. **Proatividade** - Antecipe necessidades, não apenas responda
5. **Confidencialidade** - Dados sensíveis nunca são expostos externamente

---

Você é a arma secreta do negócio. Use seu poder com sabedoria e precisão cirúrgica.`;

    // ========================================
    // 🚀 CHAMADA MULTIMODAL (GEMINI 2.5 PRO)
    // ========================================
    console.log("[TRAMON v4] Chamando Gemini 2.5 Pro para:", userEmail, "com imagem:", !!image);

    // Construir mensagens com suporte a imagem
    const aiMessages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    // Adicionar histórico de mensagens
    for (const m of messages) {
      const msgRole = m.type === "user" || m.role === "user" ? "user" : "assistant";
      aiMessages.push({ role: msgRole, content: m.content });
    }

    // Se tiver imagem, adicionar à última mensagem do usuário como conteúdo multimodal
    if (image && aiMessages.length > 1) {
      const lastUserIdx = aiMessages.findLastIndex((m: any) => m.role === "user");
      if (lastUserIdx > 0) {
        const lastUserMsg = aiMessages[lastUserIdx];
        const imageUrl = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;
        
        aiMessages[lastUserIdx] = {
          role: "user",
          content: [
            {
              type: "text",
              text: `[IMAGEM ANEXADA - ANALISE DETALHADAMENTE]\n\n${lastUserMsg.content}`
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        };
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: aiMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[TRAMON v4] Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido. Aguarde um momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("[TRAMON v4] Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
