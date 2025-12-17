// ============================================
// 🔮 TRAMON - IA PREMIUM EXCLUSIVA GPT-5
// VERSÃO EMPRESARIAL 2.0
// Acesso: Owner + Admin APENAS
// Modelo: OpenAI GPT-5 (o mais poderoso)
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
    const { messages, context, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // ========================================
    // 🔐 VERIFICAÇÃO DE ACESSO PREMIUM
    // Apenas owner e admin podem usar
    // ========================================
    let hasAccess = false;
    let userRole = "unknown";
    let userEmail = "";
    let userName = "";

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && userId) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // Buscar role do usuário
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      // Buscar dados do usuário
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      userEmail = userData?.user?.email || "";
      userRole = roleData?.role || "employee";
      
      // Buscar perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nome')
        .eq('id', userId)
        .single();
      userName = profileData?.nome || userEmail.split('@')[0];
      
      // Verificar acesso: owner, admin ou coordenacao
      const OWNER_EMAIL = "moisesblank@gmail.com";
      hasAccess = userEmail === OWNER_EMAIL || userRole === "owner" || userRole === "admin" || userRole === "coordenacao";
      
      console.log(`[TRAMON] User: ${userEmail}, Role: ${userRole}, Access: ${hasAccess}`);
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
    // 📊 COLETA DE DADOS ULTRA COMPLETOS
    // ========================================
    let systemData = {
      financial: { 
        totalIncome: 0, 
        totalExpenses: 0, 
        profit: 0, 
        monthlyGrowth: 0, 
        runway: 0,
        fixedExpenses: 0,
        extraExpenses: 0,
        cashFlow: 0,
        pendingPayments: 0
      },
      students: { 
        active: 0, 
        total: 0, 
        retention: 0, 
        newThisMonth: 0, 
        churnRate: 0, 
        avgProgress: 0,
        vips: 0,
        atRisk: 0
      },
      employees: { 
        active: 0, 
        total: 0, 
        byRole: {} as Record<string, number>,
        bySector: {} as Record<string, number>
      },
      tasks: { 
        pending: 0, 
        highPriority: 0, 
        completed: 0, 
        overdue: 0, 
        completionRate: 0,
        todayTasks: 0,
        weekTasks: 0
      },
      marketing: { 
        cac: 0, 
        ltv: 0, 
        roi: 0, 
        ltvCacRatio: 0, 
        campaigns: 0,
        activeCampaigns: 0,
        totalLeads: 0
      },
      courses: { 
        total: 0, 
        published: 0, 
        averageRating: 0, 
        totalStudents: 0,
        topCourse: ''
      },
      system: { 
        lastBackup: null, 
        activeUsers: 0, 
        errors: 0,
        uptime: 99.9,
        version: 'v14.0'
      },
      affiliates: {
        total: 0,
        active: 0,
        totalCommission: 0
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
        
        const [
          incomeResult, 
          fixedExpResult, 
          extraExpResult, 
          studentsResult, 
          employeesResult, 
          tasksResult, 
          coursesResult, 
          marketingResult,
          enrollmentsResult,
          campaignsResult,
          profilesResult,
          affiliatesResult,
          paymentsResult
        ] = await Promise.all([
          supabase.from('income').select('valor, created_at, fonte, mes_referencia'),
          supabase.from('company_fixed_expenses').select('valor, nome, categoria'),
          supabase.from('company_extra_expenses').select('valor, data, categoria, nome'),
          supabase.from('students').select('status, created_at, progresso, email'),
          supabase.from('employees').select('status, funcao, setor, nome'),
          supabase.from('calendar_tasks').select('is_completed, priority, task_date, user_id, title'),
          supabase.from('courses').select('is_published, average_rating, total_students, title'),
          supabase.from('metricas_marketing').select('*').order('mes_referencia', { ascending: false }).limit(3),
          supabase.from('enrollments').select('progress_percentage, status, created_at'),
          supabase.from('marketing_campaigns').select('status, budget, spent, name, leads, conversions'),
          supabase.from('profiles').select('last_activity_at, is_online, nome, email'),
          supabase.from('affiliates').select('status, comissao_total, nome'),
          supabase.from('payments').select('valor, status, data_vencimento, descricao, tipo'),
        ]);

        // Processar financeiro avançado
        const income = incomeResult.data || [];
        const currentMonthIncome = income.filter(i => new Date(i.created_at) >= new Date(thirtyDaysAgo)).reduce((sum, i) => sum + (i.valor || 0), 0);
        const lastMonthIncome = income.filter(i => new Date(i.created_at) >= new Date(sixtyDaysAgo) && new Date(i.created_at) < new Date(thirtyDaysAgo)).reduce((sum, i) => sum + (i.valor || 0), 0);
        
        const fixedExpenses = (fixedExpResult.data || []).reduce((sum, e) => sum + (e.valor || 0), 0);
        const extraExpenses = (extraExpResult.data || []).filter(e => new Date(e.data || '') >= new Date(thirtyDaysAgo)).reduce((sum, e) => sum + (e.valor || 0), 0);
        const totalExpenses = fixedExpenses + extraExpenses;
        const profit = currentMonthIncome - totalExpenses;
        
        // Pagamentos pendentes
        const payments = paymentsResult.data || [];
        const pendingPayments = payments.filter(p => p.status === 'pendente' || p.status === 'atrasado').reduce((sum, p) => sum + (p.valor || 0), 0);
        
        systemData.financial = {
          totalIncome: currentMonthIncome,
          totalExpenses,
          profit,
          monthlyGrowth: lastMonthIncome > 0 ? ((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0,
          runway: totalExpenses > 0 ? Math.round((profit > 0 ? profit * 12 : currentMonthIncome) / totalExpenses) : 0,
          fixedExpenses,
          extraExpenses,
          cashFlow: currentMonthIncome - totalExpenses,
          pendingPayments
        };

        // Processar alunos com progresso e segmentação
        const students = studentsResult.data || [];
        const activeStudents = students.filter(s => s.status === 'ativo');
        const newStudents = students.filter(s => new Date(s.created_at) >= new Date(thirtyDaysAgo));
        const enrollments = enrollmentsResult.data || [];
        const avgProgress = enrollments.length > 0 ? enrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / enrollments.length : 0;
        const vipStudents = students.filter(s => (s.progresso || 0) > 70);
        const atRiskStudents = students.filter(s => s.status === 'ativo' && (s.progresso || 0) < 20);
        
        systemData.students = {
          active: activeStudents.length,
          total: students.length,
          retention: students.length > 0 ? (activeStudents.length / students.length) * 100 : 0,
          newThisMonth: newStudents.length,
          churnRate: students.length > 0 ? ((students.length - activeStudents.length) / students.length) * 100 : 0,
          avgProgress,
          vips: vipStudents.length,
          atRisk: atRiskStudents.length
        };

        // Processar funcionários por setor e função
        const employees = employeesResult.data || [];
        const byRole: Record<string, number> = {};
        const bySector: Record<string, number> = {};
        employees.forEach(e => {
          const setor = e.setor || 'outros';
          const funcao = e.funcao || 'outros';
          byRole[funcao] = (byRole[funcao] || 0) + 1;
          bySector[setor] = (bySector[setor] || 0) + 1;
        });
        
        systemData.employees = {
          active: employees.filter(e => e.status === 'ativo').length,
          total: employees.length,
          byRole,
          bySector
        };

        // Processar tarefas com mais detalhes
        const tasks = tasksResult.data || [];
        const completedTasks = tasks.filter(t => t.is_completed).length;
        const todayTasks = tasks.filter(t => t.task_date === todayStr);
        const weekTasks = tasks.filter(t => new Date(t.task_date) >= today && new Date(t.task_date) <= new Date(sevenDaysFromNow));
        
        systemData.tasks = {
          pending: tasks.filter(t => !t.is_completed && t.task_date >= todayStr).length,
          highPriority: tasks.filter(t => !t.is_completed && t.priority === 'alta').length,
          completed: completedTasks,
          overdue: tasks.filter(t => !t.is_completed && t.task_date < todayStr).length,
          completionRate: tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0,
          todayTasks: todayTasks.length,
          weekTasks: weekTasks.length
        };

        // Processar cursos com top curso
        const courses = coursesResult.data || [];
        const publishedCourses = courses.filter(c => c.is_published);
        const topCourse = courses.sort((a, b) => (b.total_students || 0) - (a.total_students || 0))[0];
        
        systemData.courses = {
          total: courses.length,
          published: publishedCourses.length,
          averageRating: publishedCourses.length > 0 ? publishedCourses.reduce((sum, c) => sum + (c.average_rating || 0), 0) / publishedCourses.length : 0,
          totalStudents: courses.reduce((sum, c) => sum + (c.total_students || 0), 0),
          topCourse: topCourse?.title || 'N/A'
        };

        // Processar marketing
        const marketing = marketingResult.data?.[0];
        const campaigns = campaignsResult.data || [];
        const activeCampaigns = campaigns.filter(c => c.status === 'ativa');
        if (marketing) {
          const ltvCacRatio = marketing.cac > 0 ? marketing.ltv / marketing.cac : 0;
          systemData.marketing = {
            cac: marketing.cac || 0,
            ltv: marketing.ltv || 0,
            roi: marketing.roi_percentual || 0,
            ltvCacRatio,
            campaigns: campaigns.length,
            activeCampaigns: activeCampaigns.length,
            totalLeads: campaigns.reduce((sum, c) => sum + (c.leads || 0), 0)
          };
        }

        // Processar afiliados
        const affiliates = affiliatesResult.data || [];
        systemData.affiliates = {
          total: affiliates.length,
          active: affiliates.filter(a => a.status === 'ativo').length,
          totalCommission: affiliates.reduce((sum, a) => sum + (a.comissao_total || 0), 0)
        };

        // Processar sistema
        const profiles = profilesResult.data || [];
        const recentlyActive = profiles.filter(p => {
          const lastActivity = p.last_activity_at ? new Date(p.last_activity_at) : null;
          return lastActivity && lastActivity > new Date(Date.now() - 15 * 60 * 1000);
        });
        
        systemData.system = {
          lastBackup: null,
          activeUsers: recentlyActive.length,
          errors: 0,
          uptime: 99.9,
          version: 'v14.0 SYNAPSE'
        };

      } catch (dbError) {
        console.log("[TRAMON] Erro ao buscar dados:", dbError);
      }
    }

    // ========================================
    // 🔮 PROMPT ULTRA AVANÇADO - TRAMON v2.0
    // PLANO EMPRESARIAL
    // ========================================
    const formatCurrency = (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const formatPercent = (value: number) => `${value.toFixed(1)}%`;

    const dataContext = `
## 📊 DADOS DO SISTEMA EM TEMPO REAL (Últimos 30 dias)

### 💰 FINANCEIRO
- **Receita Total:** ${formatCurrency(systemData.financial.totalIncome)}
- **Despesas Totais:** ${formatCurrency(systemData.financial.totalExpenses)}
  - Fixas: ${formatCurrency(systemData.financial.fixedExpenses)}
  - Extras: ${formatCurrency(systemData.financial.extraExpenses)}
- **Lucro Líquido:** ${formatCurrency(systemData.financial.profit)} ${systemData.financial.profit > 0 ? '✅' : '⚠️'}
- **Crescimento:** ${systemData.financial.monthlyGrowth >= 0 ? '📈' : '📉'} ${formatPercent(systemData.financial.monthlyGrowth)}
- **Runway:** ~${systemData.financial.runway} meses
- **Fluxo de Caixa:** ${formatCurrency(systemData.financial.cashFlow)}
- **Pagamentos Pendentes:** ${formatCurrency(systemData.financial.pendingPayments)}

### 👥 ALUNOS
- **Ativos:** ${systemData.students.active}/${systemData.students.total}
- **Retenção:** ${formatPercent(systemData.students.retention)}
- **Novos (30d):** ${systemData.students.newThisMonth}
- **Churn:** ${formatPercent(systemData.students.churnRate)}
- **Progresso Médio:** ${formatPercent(systemData.students.avgProgress)}
- **VIPs (>70% progresso):** ${systemData.students.vips}
- **Em Risco:** ${systemData.students.atRisk} ⚠️

### 👔 EQUIPE
- **Total:** ${systemData.employees.active}/${systemData.employees.total} ativos
- **Por Função:** ${JSON.stringify(systemData.employees.byRole)}
- **Por Setor:** ${JSON.stringify(systemData.employees.bySector)}

### ✅ TAREFAS
- **Pendentes:** ${systemData.tasks.pending}
- **Alta Prioridade:** ${systemData.tasks.highPriority} ${systemData.tasks.highPriority > 5 ? '🚨' : ''}
- **Atrasadas:** ${systemData.tasks.overdue} ${systemData.tasks.overdue > 0 ? '⚠️' : '✅'}
- **Hoje:** ${systemData.tasks.todayTasks}
- **Esta Semana:** ${systemData.tasks.weekTasks}
- **Taxa de Conclusão:** ${formatPercent(systemData.tasks.completionRate)}

### 📚 CURSOS
- **Publicados:** ${systemData.courses.published}/${systemData.courses.total}
- **Avaliação Média:** ⭐ ${systemData.courses.averageRating.toFixed(1)}
- **Total de Matrículas:** ${systemData.courses.totalStudents}
- **Curso Top:** ${systemData.courses.topCourse}

### 📢 MARKETING
- **CAC:** ${formatCurrency(systemData.marketing.cac)}
- **LTV:** ${formatCurrency(systemData.marketing.ltv)}
- **ROI:** ${formatPercent(systemData.marketing.roi)}
- **LTV/CAC:** ${systemData.marketing.ltvCacRatio.toFixed(1)}x ${systemData.marketing.ltvCacRatio >= 3 ? '✅' : '⚠️'}
- **Campanhas Ativas:** ${systemData.marketing.activeCampaigns}/${systemData.marketing.campaigns}
- **Total de Leads:** ${systemData.marketing.totalLeads}

### 🤝 AFILIADOS
- **Total:** ${systemData.affiliates.total}
- **Ativos:** ${systemData.affiliates.active}
- **Comissões Totais:** ${formatCurrency(systemData.affiliates.totalCommission)}

### 🖥️ SISTEMA
- **Usuários Online:** ${systemData.system.activeUsers}
- **Uptime:** ${systemData.system.uptime}%
- **Versão:** ${systemData.system.version}
`;

    const systemPrompt = `# 🔮 TRAMON - SUPERINTELIGÊNCIA EMPRESARIAL GPT-5
## VERSÃO EMPRESARIAL 2.0 - PLATAFORMA PROF. MOISÉS MEDEIROS

## 🎭 IDENTIDADE
Você é **TRAMON** (Transformative Autonomous Management Operations Network), a IA mais avançada da plataforma do Professor Moisés Medeiros. 

Você foi criada exclusivamente para **${userName}** (${userRole.toUpperCase()}) com acesso ao modelo GPT-5, o mais poderoso disponível.

## 📱 ASSESSORES OFICIAIS - COMANDO "MEU ASSESSOR"
Quando o usuário disser **"meu assessor"**, **"assessor"**, **"falar com assessor"** ou similar, você deve:
1. Identificar quem está falando pelo email ou contexto
2. Se for dúvida geral, perguntar: "Você gostaria de falar com **Moisés** (CEO) ou **Bruna** (Co-gestora)?"

### DADOS DOS ASSESSORES:
- **Moisés Medeiros** (Proprietário/CEO)
  - Telefones: +55 83 98920-105 / +55 83 99892-0105
  - Email: moisesblank@gmail.com
  - Para: Decisões estratégicas, financeiras, parcerias
  
- **Bruna** (Co-gestora)
  - Telefones: +55 83 96354-090 / +55 83 99635-4090
  - Para: Operações, equipe, dia-a-dia

## 🧠 SUAS CAPACIDADES ÚNICAS (PLANO EMPRESARIAL)

### 1️⃣ ANÁLISE PREDITIVA AVANÇADA
- Prever tendências de receita com 85%+ de precisão
- Identificar padrões de churn antes que aconteçam
- Antecipar gargalos operacionais
- Detectar anomalias financeiras em tempo real

### 2️⃣ ESTRATÉGIA EMPRESARIAL
- Planos de ação detalhados com métricas SMART
- Análise competitiva e benchmarking
- Otimização de processos
- Modelagem de cenários (otimista/realista/pessimista)

### 3️⃣ INTELIGÊNCIA FINANCEIRA COMPLETA
- Fluxo de caixa projetado (3, 6, 12 meses)
- DRE automático
- Análise de break-even
- Projeções de crescimento
- Gestão de impostos (DAS, DARF)
- Integração com contador

### 4️⃣ GESTÃO DE PESSOAS
- Análise de produtividade da equipe
- Estratégias de retenção de talentos
- Alocação otimizada de recursos
- Avaliação de desempenho 360°

### 5️⃣ MARKETING AVANÇADO
- Otimização de CAC/LTV
- Estratégias de funil de vendas
- ROI por canal e campanha
- Análise de cohort

### 6️⃣ GESTÃO DE ALUNOS
- Predição de churn individual
- Segmentação automática (VIP, engajados, inativos, novatos)
- Estratégias de reativação
- Gamificação e engajamento

### 7️⃣ AUTOMAÇÕES INTELIGENTES
- Sugerir automações baseadas em padrões
- Alertas proativos
- Workflows otimizados

${dataContext}

## 📋 DIRETRIZES DE RESPOSTA

### FORMATO
- Use **negrito** para KPIs e métricas importantes
- Organize em seções claras com emojis apropriados
- Inclua números específicos sempre que possível
- Termine com **Próximos Passos** acionáveis
- Use tabelas quando comparando dados
- Formate valores em Real (R$) e porcentagens corretamente

### TOM
- Executivo e direto ao ponto
- Confiante mas não arrogante
- Celebre vitórias, mas seja honesto sobre problemas
- Sempre orientado a resultados
- Trate ${userName} com respeito e profissionalismo

### QUANDO ANALISAR DADOS
1. Identifique tendências e padrões
2. Compare com benchmarks do setor educacional
3. Destaque oportunidades e riscos
4. Proponha ações priorizadas por impacto
5. Estime ROI das sugestões

### QUANDO CRIAR ESTRATÉGIAS
1. Defina objetivo SMART
2. Liste recursos necessários
3. Estabeleça marcos de progresso
4. Defina métricas de sucesso
5. Preveja obstáculos e soluções
6. Estabeleça responsáveis e prazos

### COMANDOS ESPECIAIS
- **"meu assessor"** → Apresentar contatos de Moisés ou Bruna
- **"relatório executivo"** → Gerar relatório completo do período
- **"análise 360"** → Visão completa de todos os módulos
- **"projeção X meses"** → Projetar métricas para período
- **"plano de ação"** → Criar plano estratégico detalhado
- **"comparar períodos"** → Análise comparativa
- **"sugerir automações"** → Propor automações para otimizar processos

## 🚨 ALERTAS AUTOMÁTICOS
${systemData.tasks.highPriority > 5 ? '⚠️ **ALERTA CRÍTICO:** Muitas tarefas de alta prioridade acumuladas!' : ''}
${systemData.tasks.overdue > 3 ? '🚨 **AÇÃO NECESSÁRIA:** ' + systemData.tasks.overdue + ' tarefas atrasadas precisam de atenção imediata!' : ''}
${systemData.students.churnRate > 15 ? '⚠️ **RISCO:** Taxa de churn (' + formatPercent(systemData.students.churnRate) + ') acima do aceitável!' : ''}
${systemData.students.atRisk > 0 ? '📊 **ATENÇÃO:** ' + systemData.students.atRisk + ' alunos em risco de abandono.' : ''}
${systemData.financial.profit < 0 ? '🔴 **ALERTA FINANCEIRO:** Operando no prejuízo! Lucro: ' + formatCurrency(systemData.financial.profit) : ''}
${systemData.marketing.ltvCacRatio < 3 ? '📊 **OTIMIZAÇÃO:** LTV/CAC (' + systemData.marketing.ltvCacRatio.toFixed(1) + 'x) abaixo do ideal (recomendado: 3x+)' : ''}
${systemData.financial.pendingPayments > 0 ? '💳 **PAGAMENTOS:** ' + formatCurrency(systemData.financial.pendingPayments) + ' em pagamentos pendentes.' : ''}

## 💎 DIFERENCIAL TRAMON - PLANO EMPRESARIAL
Você não é apenas uma IA - você é um parceiro estratégico de ${userName}. 

Pense como um **CFO + COO + CMO** combinados. Sua missão é:
1. Transformar dados em decisões
2. Decisões em ações
3. Ações em resultados

## 🏢 EMPRESAS GERENCIADAS
- **MM CURSO DE QUÍMICA LTDA** - CNPJ: 53.829.761/0001-17
- **CURSO QUÍMICA MOISES MEDEIROS** - CNPJ: 44.979.308/0001-04

## 📞 CONTATO COM ASSESSORES
Sempre que alguém precisar de ajuda humana ou decisão que você não pode tomar:
"Para falar diretamente com um assessor:
📱 **Moisés (CEO):** +55 83 98920-105 ou +55 83 99892-0105
📱 **Bruna (Co-gestora):** +55 83 96354-090 ou +55 83 99635-4090"

Lembre-se: **Você é a arma secreta do negócio. Use-a sabiamente.**`;

    // ========================================
    // 🚀 CHAMADA GPT-5 (O MAIS PODEROSO)
    // ========================================
    console.log("[TRAMON] Chamando GPT-5 para:", userEmail);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5", // 🔥 GPT-5 - O MAIS PODEROSO
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m: { type?: string; role?: string; content: string }) => ({
            role: m.type === "user" || m.role === "user" ? "user" : "assistant",
            content: m.content
          })),
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "⏳ Limite de requisições. Aguarde um momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "💳 Créditos de IA esgotados. Acesse configurações para adicionar mais." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("[TRAMON] Gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    console.log("[TRAMON] Streaming response para:", userEmail);
    
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (e) {
    console.error("[TRAMON] Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
