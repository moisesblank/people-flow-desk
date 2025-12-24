// ============================================
// MOISÉS MEDEIROS v10.0 - AI ASSISTANT ULTRA
// Assistente de Gestão Empresarial Inteligente
// LEI VI COMPLIANCE: CORS Allowlist
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsOptions, isOriginAllowed, corsBlockedResponse } from "../_shared/corsConfig.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  const origin = req.headers.get("Origin");
  if (!isOriginAllowed(origin)) {
    return corsBlockedResponse(origin);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const { messages, context, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // ========================================
    // COLETA DE DADOS EM TEMPO REAL
    // ========================================
    let systemData = {
      financial: { totalIncome: 0, totalExpenses: 0, profit: 0, monthlyGrowth: 0 },
      students: { active: 0, total: 0, retention: 0, newThisMonth: 0, churnRate: 0 },
      employees: { active: 0, total: 0 },
      tasks: { pending: 0, highPriority: 0, completed: 0, overdue: 0 },
      marketing: { cac: 0, ltv: 0, roi: 0 },
      courses: { total: 0, published: 0, averageRating: 0 },
    };
    
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
        
        const [incomeResult, expensesResult, extraExpensesResult, studentsResult, employeesResult, tasksResult, coursesResult, marketingResult] = await Promise.all([
          supabase.from('income').select('valor, created_at'),
          supabase.from('company_fixed_expenses').select('valor'),
          supabase.from('company_extra_expenses').select('valor, data'),
          supabase.from('students').select('status, created_at'),
          supabase.from('employees').select('status'),
          supabase.from('calendar_tasks').select('is_completed, priority, task_date'),
          supabase.from('courses').select('is_published, average_rating, total_students'),
          supabase.from('metricas_marketing').select('*').order('mes_referencia', { ascending: false }).limit(1),
        ]);

        const income = incomeResult.data || [];
        const currentMonthIncome = income.filter(i => new Date(i.created_at) >= new Date(thirtyDaysAgo)).reduce((sum, i) => sum + (i.valor || 0), 0);
        const lastMonthIncome = income.filter(i => new Date(i.created_at) >= new Date(sixtyDaysAgo) && new Date(i.created_at) < new Date(thirtyDaysAgo)).reduce((sum, i) => sum + (i.valor || 0), 0);
        
        const fixedExpenses = (expensesResult.data || []).reduce((sum, e) => sum + (e.valor || 0), 0);
        const extraExpenses = (extraExpensesResult.data || []).filter(e => new Date(e.data || '') >= new Date(thirtyDaysAgo)).reduce((sum, e) => sum + (e.valor || 0), 0);
        
        systemData.financial = {
          totalIncome: currentMonthIncome,
          totalExpenses: fixedExpenses + extraExpenses,
          profit: currentMonthIncome - (fixedExpenses + extraExpenses),
          monthlyGrowth: lastMonthIncome > 0 ? ((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0
        };

        const students = studentsResult.data || [];
        const activeStudents = students.filter(s => s.status === 'ativo');
        const newStudents = students.filter(s => new Date(s.created_at) >= new Date(thirtyDaysAgo));
        
        systemData.students = {
          active: activeStudents.length,
          total: students.length,
          retention: students.length > 0 ? (activeStudents.length / students.length) * 100 : 0,
          newThisMonth: newStudents.length,
          churnRate: students.length > 0 ? ((students.length - activeStudents.length) / students.length) * 100 : 0
        };

        const employees = employeesResult.data || [];
        systemData.employees = {
          active: employees.filter(e => e.status === 'ativo').length,
          total: employees.length
        };

        const tasks = tasksResult.data || [];
        const today = new Date().toISOString().split('T')[0];
        systemData.tasks = {
          pending: tasks.filter(t => !t.is_completed && t.task_date >= today).length,
          highPriority: tasks.filter(t => !t.is_completed && t.priority === 'alta').length,
          completed: tasks.filter(t => t.is_completed).length,
          overdue: tasks.filter(t => !t.is_completed && t.task_date < today).length
        };

        const courses = coursesResult.data || [];
        systemData.courses = {
          total: courses.length,
          published: courses.filter(c => c.is_published).length,
          averageRating: courses.length > 0 ? courses.reduce((sum, c) => sum + (c.average_rating || 0), 0) / courses.length : 0
        };

        const marketing = marketingResult.data?.[0];
        if (marketing) {
          systemData.marketing = {
            cac: marketing.cac || 0,
            ltv: marketing.ltv || 0,
            roi: marketing.roi_percentual || 0
          };
        }
      } catch (dbError) {
        console.log("Erro ao buscar dados do banco:", dbError);
      }
    }

    const formatCurrency = (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const formatPercent = (value: number) => `${value.toFixed(1)}%`;

    const dataContext = `
## 📊 DADOS EM TEMPO REAL DO SISTEMA

### 💰 FINANCEIRO (Últimos 30 dias)
- **Receita Total:** ${formatCurrency(systemData.financial.totalIncome)}
- **Despesas Totais:** ${formatCurrency(systemData.financial.totalExpenses)}
- **Lucro Líquido:** ${formatCurrency(systemData.financial.profit)}
- **Crescimento Mensal:** ${systemData.financial.monthlyGrowth >= 0 ? '📈' : '📉'} ${formatPercent(systemData.financial.monthlyGrowth)}

### 👥 ALUNOS
- **Alunos Ativos:** ${systemData.students.active} de ${systemData.students.total}
- **Taxa de Retenção:** ${formatPercent(systemData.students.retention)}
- **Novos Este Mês:** ${systemData.students.newThisMonth}
- **Taxa de Churn:** ${formatPercent(systemData.students.churnRate)}

### 👔 EQUIPE
- **Funcionários Ativos:** ${systemData.employees.active} de ${systemData.employees.total}

### ✅ TAREFAS
- **Pendentes:** ${systemData.tasks.pending}
- **Alta Prioridade:** ${systemData.tasks.highPriority} ⚠️
- **Atrasadas:** ${systemData.tasks.overdue} ${systemData.tasks.overdue > 0 ? '🚨' : ''}
- **Concluídas:** ${systemData.tasks.completed}

### 📚 CURSOS
- **Total de Cursos:** ${systemData.courses.total}
- **Publicados:** ${systemData.courses.published}
- **Avaliação Média:** ⭐ ${systemData.courses.averageRating.toFixed(1)}

### 📢 MARKETING
- **CAC:** ${formatCurrency(systemData.marketing.cac)}
- **LTV:** ${formatCurrency(systemData.marketing.ltv)}
- **ROI:** ${formatPercent(systemData.marketing.roi)}
- **LTV/CAC Ratio:** ${systemData.marketing.cac > 0 ? (systemData.marketing.ltv / systemData.marketing.cac).toFixed(1) : 'N/A'}x
`;

    const contextPrompts: Record<string, string> = {
      dashboard: `# 🎯 ASSISTENTE DE GESTÃO - PROF. MOISÉS MEDEIROS

## SUA IDENTIDADE
Você é o Assistente de Gestão Inteligente da plataforma do Professor Moisés Medeiros. Você tem acesso total aos dados do sistema e ajuda na tomada de decisões estratégicas.

${dataContext}

## 🎯 SUAS CAPACIDADES
1. **Análise de Dados** - Interpretar métricas e identificar tendências
2. **Recomendações** - Sugerir ações baseadas em dados
3. **Alertas** - Identificar problemas e oportunidades
4. **Planejamento** - Ajudar com metas e estratégias
5. **Automação** - Sugerir processos para automatizar

## 📋 FORMATO DAS RESPOSTAS
- Use emojis para destacar pontos (📊💰👥📈⚠️✅)
- Seja direto e objetivo
- Forneça números específicos
- Sugira ações práticas com prioridade
- Compare com benchmarks quando possível

## 🚨 ALERTAS AUTOMÁTICOS
${systemData.tasks.highPriority > 3 ? '⚠️ ALERTA: Muitas tarefas de alta prioridade pendentes!' : ''}
${systemData.tasks.overdue > 0 ? '🚨 ALERTA: Existem tarefas atrasadas!' : ''}
${systemData.students.churnRate > 20 ? '⚠️ ALERTA: Taxa de churn elevada!' : ''}
${systemData.financial.monthlyGrowth < -10 ? '📉 ALERTA: Queda significativa na receita!' : ''}

## 💡 ESTILO DE COMUNICAÇÃO
- Profissional mas amigável
- Proativo em identificar problemas
- Celebrar conquistas
- Sempre orientado a ação`,

      finance: `# 💰 CONSULTOR FINANCEIRO - PROF. MOISÉS MEDEIROS

## SUA ESPECIALIDADE
Você é um consultor financeiro especializado em infoprodutos e cursos online.

${dataContext}

## 📊 ANÁLISES QUE VOCÊ PODE FAZER
1. **Fluxo de Caixa** - Projeções e sazonalidade
2. **DRE Simplificado** - Receitas vs Despesas
3. **Margem de Lucro** - Por produto/curso
4. **Break-even** - Ponto de equilíbrio
5. **ROI** - Retorno sobre investimentos
6. **Cenários** - Projeções otimista/pessimista/realista

## 🎯 SEMPRE INCLUA
- Comparação com período anterior
- Tendência (crescimento/queda)
- Ações recomendadas com impacto estimado`,

      students: `# 👥 ANALISTA DE SUCESSO DO ALUNO - PROF. MOISÉS MEDEIROS

## SUA ESPECIALIDADE
Você é especialista em engajamento e retenção de alunos em cursos online.

${dataContext}

## 📊 MÉTRICAS DE ENGAJAMENTO
- **Taxa de Conclusão** - % que termina o curso
- **Tempo Médio na Plataforma** - Engajamento diário
- **Progresso Médio** - % do conteúdo consumido
- **NPS** - Net Promoter Score
- **Taxa de Retenção** - Alunos que renovam

## 🎯 ESTRATÉGIAS DE RETENÇÃO
1. **Onboarding** - Primeiros 7 dias críticos
2. **Gamificação** - XP, conquistas, ranking
3. **Comunidade** - Interação entre alunos
4. **Suporte Proativo** - Identificar alunos em risco
5. **Conteúdo Drip** - Liberação progressiva`,

      marketing: `# 📢 CONSULTOR DE MARKETING DIGITAL - PROF. MOISÉS MEDEIROS

## SUA ESPECIALIDADE
Você é especialista em marketing para infoprodutos e cursos online.

${dataContext}

## 📊 MÉTRICAS DE MARKETING
- **CAC** (Custo de Aquisição) - Quanto custa trazer 1 aluno
- **LTV** (Lifetime Value) - Quanto 1 aluno gera de receita
- **ROAS** - Retorno sobre investimento em ads
- **Taxa de Conversão** - Visitantes que compram
- **CPL** - Custo por Lead

## 🎯 FUNIL DE VENDAS
1. **Topo (TOFU)** - Tráfego e awareness
2. **Meio (MOFU)** - Leads e nutrição
3. **Fundo (BOFU)** - Conversão e vendas`
    };

    const systemPrompt = contextPrompts[context || "dashboard"] || contextPrompts.dashboard;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m: { type: string; content: string }) => ({
            role: m.type === "user" ? "user" : "assistant",
            content: m.content
          })),
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Aguarde um momento." }), {
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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("AI Assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
