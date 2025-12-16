// ============================================
// 🔮 TRAMON - IA PREMIUM EXCLUSIVA GPT-5
// Acesso: Owner + Admin APENAS
// Modelo: OpenAI GPT-5 (o mais poderoso)
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && userId) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // Buscar role do usuário
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      // Buscar email do usuário
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      userEmail = userData?.user?.email || "";
      userRole = roleData?.role || "employee";
      
      // Verificar acesso: owner ou admin
      const OWNER_EMAIL = "moisesblank@gmail.com";
      hasAccess = userEmail === OWNER_EMAIL || userRole === "owner" || userRole === "admin";
      
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
      financial: { totalIncome: 0, totalExpenses: 0, profit: 0, monthlyGrowth: 0, runway: 0 },
      students: { active: 0, total: 0, retention: 0, newThisMonth: 0, churnRate: 0, avgProgress: 0 },
      employees: { active: 0, total: 0, byRole: {} as Record<string, number> },
      tasks: { pending: 0, highPriority: 0, completed: 0, overdue: 0, completionRate: 0 },
      marketing: { cac: 0, ltv: 0, roi: 0, ltvCacRatio: 0, campaigns: 0 },
      courses: { total: 0, published: 0, averageRating: 0, totalStudents: 0 },
      system: { lastBackup: null, activeUsers: 0, errors: 0 },
    };
    
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
        
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
          profilesResult
        ] = await Promise.all([
          supabase.from('income').select('valor, created_at, fonte'),
          supabase.from('company_fixed_expenses').select('valor, nome'),
          supabase.from('company_extra_expenses').select('valor, data, categoria'),
          supabase.from('students').select('status, created_at, progresso'),
          supabase.from('employees').select('status, funcao, setor'),
          supabase.from('calendar_tasks').select('is_completed, priority, task_date, user_id'),
          supabase.from('courses').select('is_published, average_rating, total_students, title'),
          supabase.from('metricas_marketing').select('*').order('mes_referencia', { ascending: false }).limit(3),
          supabase.from('enrollments').select('progress_percentage, status'),
          supabase.from('marketing_campaigns').select('status, budget, spent'),
          supabase.from('profiles').select('last_activity_at, is_online'),
        ]);

        // Processar financeiro avançado
        const income = incomeResult.data || [];
        const currentMonthIncome = income.filter(i => new Date(i.created_at) >= new Date(thirtyDaysAgo)).reduce((sum, i) => sum + (i.valor || 0), 0);
        const lastMonthIncome = income.filter(i => new Date(i.created_at) >= new Date(sixtyDaysAgo) && new Date(i.created_at) < new Date(thirtyDaysAgo)).reduce((sum, i) => sum + (i.valor || 0), 0);
        
        const fixedExpenses = (fixedExpResult.data || []).reduce((sum, e) => sum + (e.valor || 0), 0);
        const extraExpenses = (extraExpResult.data || []).filter(e => new Date(e.data || '') >= new Date(thirtyDaysAgo)).reduce((sum, e) => sum + (e.valor || 0), 0);
        const totalExpenses = fixedExpenses + extraExpenses;
        const profit = currentMonthIncome - totalExpenses;
        
        systemData.financial = {
          totalIncome: currentMonthIncome,
          totalExpenses,
          profit,
          monthlyGrowth: lastMonthIncome > 0 ? ((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0,
          runway: totalExpenses > 0 ? Math.round((profit > 0 ? profit * 12 : currentMonthIncome) / totalExpenses) : 0
        };

        // Processar alunos com progresso
        const students = studentsResult.data || [];
        const activeStudents = students.filter(s => s.status === 'ativo');
        const newStudents = students.filter(s => new Date(s.created_at) >= new Date(thirtyDaysAgo));
        const enrollments = enrollmentsResult.data || [];
        const avgProgress = enrollments.length > 0 ? enrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / enrollments.length : 0;
        
        systemData.students = {
          active: activeStudents.length,
          total: students.length,
          retention: students.length > 0 ? (activeStudents.length / students.length) * 100 : 0,
          newThisMonth: newStudents.length,
          churnRate: students.length > 0 ? ((students.length - activeStudents.length) / students.length) * 100 : 0,
          avgProgress
        };

        // Processar funcionários por setor
        const employees = employeesResult.data || [];
        const byRole: Record<string, number> = {};
        employees.forEach(e => {
          const setor = e.setor || 'outros';
          byRole[setor] = (byRole[setor] || 0) + 1;
        });
        
        systemData.employees = {
          active: employees.filter(e => e.status === 'ativo').length,
          total: employees.length,
          byRole
        };

        // Processar tarefas
        const tasks = tasksResult.data || [];
        const today = new Date().toISOString().split('T')[0];
        const completedTasks = tasks.filter(t => t.is_completed).length;
        
        systemData.tasks = {
          pending: tasks.filter(t => !t.is_completed && t.task_date >= today).length,
          highPriority: tasks.filter(t => !t.is_completed && t.priority === 'alta').length,
          completed: completedTasks,
          overdue: tasks.filter(t => !t.is_completed && t.task_date < today).length,
          completionRate: tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0
        };

        // Processar cursos
        const courses = coursesResult.data || [];
        const publishedCourses = courses.filter(c => c.is_published);
        
        systemData.courses = {
          total: courses.length,
          published: publishedCourses.length,
          averageRating: publishedCourses.length > 0 ? publishedCourses.reduce((sum, c) => sum + (c.average_rating || 0), 0) / publishedCourses.length : 0,
          totalStudents: courses.reduce((sum, c) => sum + (c.total_students || 0), 0)
        };

        // Processar marketing
        const marketing = marketingResult.data?.[0];
        const campaigns = campaignsResult.data || [];
        if (marketing) {
          const ltvCacRatio = marketing.cac > 0 ? marketing.ltv / marketing.cac : 0;
          systemData.marketing = {
            cac: marketing.cac || 0,
            ltv: marketing.ltv || 0,
            roi: marketing.roi_percentual || 0,
            ltvCacRatio,
            campaigns: campaigns.filter(c => c.status === 'ativa').length
          };
        }

        // Processar sistema
        const profiles = profilesResult.data || [];
        const recentlyActive = profiles.filter(p => {
          const lastActivity = p.last_activity_at ? new Date(p.last_activity_at) : null;
          return lastActivity && lastActivity > new Date(Date.now() - 15 * 60 * 1000);
        });
        
        systemData.system = {
          lastBackup: null,
          activeUsers: recentlyActive.length,
          errors: 0
        };

      } catch (dbError) {
        console.log("[TRAMON] Erro ao buscar dados:", dbError);
      }
    }

    // ========================================
    // 🔮 PROMPT ULTRA AVANÇADO - TRAMON
    // ========================================
    const formatCurrency = (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const formatPercent = (value: number) => `${value.toFixed(1)}%`;

    const dataContext = `
## 📊 DADOS DO SISTEMA EM TEMPO REAL (Últimos 30 dias)

### 💰 FINANCEIRO
- **Receita Total:** ${formatCurrency(systemData.financial.totalIncome)}
- **Despesas Totais:** ${formatCurrency(systemData.financial.totalExpenses)}
- **Lucro Líquido:** ${formatCurrency(systemData.financial.profit)} ${systemData.financial.profit > 0 ? '✅' : '⚠️'}
- **Crescimento:** ${systemData.financial.monthlyGrowth >= 0 ? '📈' : '📉'} ${formatPercent(systemData.financial.monthlyGrowth)}
- **Runway:** ~${systemData.financial.runway} meses

### 👥 ALUNOS
- **Ativos:** ${systemData.students.active}/${systemData.students.total}
- **Retenção:** ${formatPercent(systemData.students.retention)}
- **Novos (30d):** ${systemData.students.newThisMonth}
- **Churn:** ${formatPercent(systemData.students.churnRate)}
- **Progresso Médio:** ${formatPercent(systemData.students.avgProgress)}

### 👔 EQUIPE
- **Total:** ${systemData.employees.active}/${systemData.employees.total} ativos
- **Por Setor:** ${JSON.stringify(systemData.employees.byRole)}

### ✅ TAREFAS
- **Pendentes:** ${systemData.tasks.pending}
- **Alta Prioridade:** ${systemData.tasks.highPriority} ${systemData.tasks.highPriority > 5 ? '🚨' : ''}
- **Atrasadas:** ${systemData.tasks.overdue} ${systemData.tasks.overdue > 0 ? '⚠️' : '✅'}
- **Taxa de Conclusão:** ${formatPercent(systemData.tasks.completionRate)}

### 📚 CURSOS
- **Publicados:** ${systemData.courses.published}/${systemData.courses.total}
- **Avaliação Média:** ⭐ ${systemData.courses.averageRating.toFixed(1)}
- **Total de Matrículas:** ${systemData.courses.totalStudents}

### 📢 MARKETING
- **CAC:** ${formatCurrency(systemData.marketing.cac)}
- **LTV:** ${formatCurrency(systemData.marketing.ltv)}
- **ROI:** ${formatPercent(systemData.marketing.roi)}
- **LTV/CAC:** ${systemData.marketing.ltvCacRatio.toFixed(1)}x ${systemData.marketing.ltvCacRatio >= 3 ? '✅' : '⚠️'}
- **Campanhas Ativas:** ${systemData.marketing.campaigns}

### 🖥️ SISTEMA
- **Usuários Online:** ${systemData.system.activeUsers}
`;

    const systemPrompt = `# 🔮 TRAMON - SUPERINTELIGÊNCIA EMPRESARIAL GPT-5

## 🎭 IDENTIDADE
Você é **TRAMON**, a IA mais avançada da plataforma do Professor Moisés Medeiros. Seu nome vem de "Transcendent Manager" - um superintendente virtual que pensa 10 passos à frente.

Você foi criada exclusivamente para ${userEmail} (${userRole.toUpperCase()}) com acesso ao modelo GPT-5, o mais poderoso disponível.

## 🧠 SUAS CAPACIDADES ÚNICAS

### 1️⃣ ANÁLISE PREDITIVA
- Prever tendências de receita com 85%+ de precisão
- Identificar padrões de churn antes que aconteçam
- Antecipar gargalos operacionais

### 2️⃣ ESTRATÉGIA EMPRESARIAL
- Planos de ação detalhados com métricas
- Análise competitiva e benchmarking
- Otimização de processos

### 3️⃣ INTELIGÊNCIA FINANCEIRA
- Modelagem de cenários (otimista/realista/pessimista)
- Análise de break-even
- Projeções de crescimento

### 4️⃣ GESTÃO DE PESSOAS
- Análise de produtividade da equipe
- Estratégias de retenção de talentos
- Alocação otimizada de recursos

### 5️⃣ MARKETING AVANÇADO
- Otimização de CAC/LTV
- Estratégias de funil
- ROI por canal

${dataContext}

## 📋 DIRETRIZES DE RESPOSTA

### FORMATO
- Use **negrito** para KPIs e métricas importantes
- Organize em seções claras com emojis apropriados
- Inclua números específicos sempre que possível
- Termine com **Próximos Passos** acionáveis

### TOM
- Executivo e direto ao ponto
- Confiante mas não arrogante
- Celebre vitórias, mas seja honesto sobre problemas
- Sempre orientado a resultados

### QUANDO ANALISAR DADOS
1. Identifique tendências e padrões
2. Compare com benchmarks do setor
3. Destaque oportunidades e riscos
4. Proponha ações priorizadas por impacto

### QUANDO CRIAR ESTRATÉGIAS
1. Defina objetivo SMART
2. Liste recursos necessários
3. Estabeleça marcos de progresso
4. Defina métricas de sucesso
5. Preveja obstáculos e soluções

## 🚨 ALERTAS AUTOMÁTICOS
${systemData.tasks.highPriority > 5 ? '⚠️ **ALERTA CRÍTICO:** Muitas tarefas de alta prioridade acumuladas!' : ''}
${systemData.tasks.overdue > 3 ? '🚨 **AÇÃO NECESSÁRIA:** Tarefas atrasadas precisam de atenção imediata!' : ''}
${systemData.students.churnRate > 15 ? '⚠️ **RISCO:** Taxa de churn acima do aceitável!' : ''}
${systemData.financial.profit < 0 ? '🔴 **ALERTA FINANCEIRO:** Operando no prejuízo!' : ''}
${systemData.marketing.ltvCacRatio < 3 ? '📊 **OTIMIZAÇÃO:** LTV/CAC abaixo do ideal (recomendado: 3x+)' : ''}

## 💎 DIFERENCIAL TRAMON
Você não é apenas uma IA - você é um parceiro estratégico. Pense como um CFO + COO + CMO combinados. Sua missão é ajudar ${userEmail.split('@')[0]} a transformar dados em decisões e decisões em resultados.

Lembre-se: **Você é a arma secreta. Use-a sabiamente.**`;

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
        return new Response(JSON.stringify({ error: "💳 Créditos de IA esgotados." }), {
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
