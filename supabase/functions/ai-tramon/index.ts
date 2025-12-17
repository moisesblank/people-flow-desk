// ============================================
// 🔮 TRAMON v3.0 - SUPERINTELIGÊNCIA EMPRESARIAL
// COM VISÃO COMPUTACIONAL E ANÁLISE DE IMAGENS
// Modelo: Gemini 2.5 Pro (Multimodal)
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
      
      console.log(`[TRAMON v3] User: ${userEmail}, Role: ${userRole}, Access: ${hasAccess}, HasImage: ${!!image}`);
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
        totalIncome: 0, totalExpenses: 0, profit: 0, monthlyGrowth: 0, 
        runway: 0, fixedExpenses: 0, extraExpenses: 0, cashFlow: 0, pendingPayments: 0
      },
      students: { 
        active: 0, total: 0, retention: 0, newThisMonth: 0, 
        churnRate: 0, avgProgress: 0, vips: 0, atRisk: 0
      },
      employees: { active: 0, total: 0, byRole: {}, bySector: {} },
      tasks: { 
        pending: 0, highPriority: 0, completed: 0, overdue: 0, 
        completionRate: 0, todayTasks: 0, weekTasks: 0
      },
      marketing: { cac: 0, ltv: 0, roi: 0, ltvCacRatio: 0, campaigns: 0, activeCampaigns: 0, totalLeads: 0 },
      courses: { total: 0, published: 0, averageRating: 0, totalStudents: 0, topCourse: '' },
      system: { lastBackup: null, activeUsers: 0, errors: 0, uptime: 99.9, version: 'v15.0 SYNAPSE' },
      affiliates: { total: 0, active: 0, totalCommission: 0 }
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
          incomeResult, fixedExpResult, extraExpResult, studentsResult, 
          employeesResult, tasksResult, coursesResult, marketingResult,
          enrollmentsResult, campaignsResult, profilesResult, affiliatesResult, paymentsResult
        ] = await Promise.all([
          supabase.from('income').select('valor, created_at, fonte'),
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

        // Processar dados financeiros
        const income = incomeResult.data || [];
        const currentMonthIncome = income.filter(i => new Date(i.created_at) >= new Date(thirtyDaysAgo)).reduce((sum, i) => sum + (i.valor || 0), 0);
        const lastMonthIncome = income.filter(i => new Date(i.created_at) >= new Date(sixtyDaysAgo) && new Date(i.created_at) < new Date(thirtyDaysAgo)).reduce((sum, i) => sum + (i.valor || 0), 0);
        
        const fixedExpenses = (fixedExpResult.data || []).reduce((sum, e) => sum + (e.valor || 0), 0);
        const extraExpenses = (extraExpResult.data || []).filter(e => new Date(e.data || '') >= new Date(thirtyDaysAgo)).reduce((sum, e) => sum + (e.valor || 0), 0);
        const totalExpenses = fixedExpenses + extraExpenses;
        const profit = currentMonthIncome - totalExpenses;
        
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

        // Processar alunos
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
          avgProgress,
          vips: students.filter(s => (s.progresso || 0) > 70).length,
          atRisk: students.filter(s => s.status === 'ativo' && (s.progresso || 0) < 20).length
        };

        // Processar funcionários
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
          bySector
        };

        // Processar tarefas
        const tasks = tasksResult.data || [];
        const completedTasks = tasks.filter(t => t.is_completed).length;
        
        systemData.tasks = {
          pending: tasks.filter(t => !t.is_completed && t.task_date >= todayStr).length,
          highPriority: tasks.filter(t => !t.is_completed && t.priority === 'alta').length,
          completed: completedTasks,
          overdue: tasks.filter(t => !t.is_completed && t.task_date < todayStr).length,
          completionRate: tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0,
          todayTasks: tasks.filter(t => t.task_date === todayStr).length,
          weekTasks: tasks.filter(t => new Date(t.task_date) >= today && new Date(t.task_date) <= new Date(sevenDaysFromNow)).length
        };

        // Processar cursos
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
        if (marketing) {
          systemData.marketing = {
            cac: marketing.cac || 0,
            ltv: marketing.ltv || 0,
            roi: marketing.roi_percentual || 0,
            ltvCacRatio: marketing.cac > 0 ? marketing.ltv / marketing.cac : 0,
            campaigns: campaigns.length,
            activeCampaigns: campaigns.filter(c => c.status === 'ativa').length,
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
        systemData.system = {
          lastBackup: null,
          activeUsers: profiles.filter(p => p.last_activity_at && new Date(p.last_activity_at) > new Date(Date.now() - 15 * 60 * 1000)).length,
          errors: 0,
          uptime: 99.9,
          version: 'v15.0 SYNAPSE'
        };

      } catch (dbError) {
        console.log("[TRAMON v3] Erro ao buscar dados:", dbError);
      }
    }

    // ========================================
    // 🔮 PROMPT ULTRA AVANÇADO v3.0
    // ========================================
    const formatCurrency = (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const formatPercent = (value: number) => `${value.toFixed(1)}%`;

    const dataContext = `
## 📊 DADOS EM TEMPO REAL (${new Date().toLocaleDateString('pt-BR')})

### 💰 FINANCEIRO
- Receita: ${formatCurrency(systemData.financial.totalIncome)} | Despesas: ${formatCurrency(systemData.financial.totalExpenses)}
- Lucro: ${formatCurrency(systemData.financial.profit)} ${systemData.financial.profit > 0 ? '✅' : '⚠️'}
- Crescimento: ${formatPercent(systemData.financial.monthlyGrowth)} | Runway: ~${systemData.financial.runway} meses

### 👥 ALUNOS
- Ativos: ${systemData.students.active}/${systemData.students.total} | Retenção: ${formatPercent(systemData.students.retention)}
- Novos: ${systemData.students.newThisMonth} | Churn: ${formatPercent(systemData.students.churnRate)}
- Em Risco: ${systemData.students.atRisk} | VIPs: ${systemData.students.vips}

### ✅ TAREFAS
- Pendentes: ${systemData.tasks.pending} | Alta Prioridade: ${systemData.tasks.highPriority}
- Atrasadas: ${systemData.tasks.overdue} | Conclusão: ${formatPercent(systemData.tasks.completionRate)}

### 📚 CURSOS
- Publicados: ${systemData.courses.published}/${systemData.courses.total}
- Rating: ⭐${systemData.courses.averageRating.toFixed(1)} | Alunos: ${systemData.courses.totalStudents}

### 📢 MARKETING
- CAC: ${formatCurrency(systemData.marketing.cac)} | LTV: ${formatCurrency(systemData.marketing.ltv)}
- LTV/CAC: ${systemData.marketing.ltvCacRatio.toFixed(1)}x | ROI: ${formatPercent(systemData.marketing.roi)}
`;

    const systemPrompt = `# 🔮 TRAMON v3.0 - SUPERINTELIGÊNCIA EMPRESARIAL MULTIMODAL
## PLATAFORMA PROF. MOISÉS MEDEIROS - PLANO EMPRESARIAL

Você é **TRAMON** (Transformative Autonomous Management Operations Network), a IA mais avançada da plataforma do Professor Moisés Medeiros.

## 🧠 CAPACIDADES ÚNICAS

### 👁️ VISÃO COMPUTACIONAL (NOVO!)
Você possui capacidade MULTIMODAL para analisar imagens. Quando o usuário enviar uma imagem, você DEVE:
1. **ANALISAR** detalhadamente o conteúdo visual
2. **EXTRAIR** dados, textos, gráficos, tabelas, layouts, cores
3. **INTERPRETAR** no contexto do negócio (educação, química, cursos)
4. **SUGERIR** implementações práticas para o site/plataforma
5. **CRIAR** código, conteúdo ou estratégias baseadas na imagem

Se a imagem for:
- **Screenshot de site/app**: Analise UX/UI, sugira melhorias, extraia estrutura
- **Gráfico/Dashboard**: Interprete dados, identifique tendências, recomende ações
- **Material de marketing**: Avalie efetividade, sugira otimizações de copy
- **Documento/Texto**: Extraia e organize informações relevantes
- **Conteúdo educacional**: Analise didática, sugira melhorias pedagógicas
- **Design/Layout**: Extraia paleta de cores, fontes, estrutura para aplicar

### 📊 ANÁLISE PREDITIVA
- Prever tendências de receita com 85%+ de precisão
- Identificar padrões de churn antes que aconteçam
- Antecipar gargalos operacionais

### 🎯 ESTRATÉGIA EMPRESARIAL
- Planos de ação com métricas SMART
- Análise competitiva e benchmarking
- Modelagem de cenários

### 💰 INTELIGÊNCIA FINANCEIRA
- Fluxo de caixa projetado
- DRE automático
- Projeções de crescimento

### 👔 GESTÃO DE PESSOAS
- Análise de produtividade
- Estratégias de retenção
- Alocação de recursos

${dataContext}

## 📋 FORMATO DE RESPOSTA

**REGRAS CRÍTICAS:**
1. Seja DIRETO e OBJETIVO - vá ao ponto imediatamente
2. Use **negrito** para KPIs e métricas importantes
3. Organize em seções com emojis apropriados
4. Inclua números específicos sempre
5. Termine com **Próximos Passos** acionáveis
6. Formate valores em Real (R$) e porcentagens
7. NUNCA seja prolixo - cada palavra deve ter propósito
8. Se houver imagem, SEMPRE comece analisando-a detalhadamente

## 📱 ASSESSORES
- **Moisés Medeiros** (CEO): +55 83 98920-105
- **Bruna** (Co-gestora): +55 83 96354-090

## 🎭 IDENTIDADE
Você atende **${userName}** (${userRole.toUpperCase()}).
- Seja executivo e direto
- Celebre vitórias, seja honesto sobre problemas
- Sempre orientado a resultados
- Trate com respeito e profissionalismo

## 🚨 ALERTAS AUTOMÁTICOS
${systemData.tasks.highPriority > 5 ? '⚠️ ALERTA: Muitas tarefas de alta prioridade!' : ''}
${systemData.tasks.overdue > 0 ? '🚨 ' + systemData.tasks.overdue + ' tarefas atrasadas!' : ''}
${systemData.students.atRisk > 0 ? '📊 ' + systemData.students.atRisk + ' alunos em risco!' : ''}
${systemData.financial.profit < 0 ? '🔴 PREJUÍZO: ' + formatCurrency(systemData.financial.profit) : ''}

Você é a arma secreta do negócio. Use-a sabiamente.`;

    // ========================================
    // 🚀 CHAMADA MULTIMODAL (GEMINI 2.5 PRO)
    // ========================================
    console.log("[TRAMON v3] Chamando Gemini 2.5 Pro para:", userEmail, "com imagem:", !!image);

    // Construir mensagens com suporte a imagem
    const aiMessages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    // Adicionar histórico de mensagens
    for (const m of messages) {
      const msgRole = m.type === "user" || m.role === "user" ? "user" : "assistant";
      aiMessages.push({ role: msgRole, content: m.content });
    }

    // Se tiver imagem, adicionar à última mensagem do usuário
    if (image && aiMessages.length > 1) {
      const lastUserIdx = aiMessages.findLastIndex((m: any) => m.role === "user");
      if (lastUserIdx > 0) {
        const lastUserMsg = aiMessages[lastUserIdx];
        aiMessages[lastUserIdx] = {
          role: "user",
          content: [
            { type: "text", text: lastUserMsg.content || "Analise esta imagem detalhadamente e me diga o que você vê. Extraia todos os dados, textos, estruturas e sugira como aplicar no site/plataforma." },
            { type: "image_url", image_url: { url: image } }
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
        model: "google/gemini-2.5-pro", // 🔥 MULTIMODAL - Suporta imagens
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "⏳ Limite de requisições. Aguarde." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "💳 Créditos esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("[TRAMON v3] Gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    console.log("[TRAMON v3] Streaming para:", userEmail);
    
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (e) {
    console.error("[TRAMON v3] Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
