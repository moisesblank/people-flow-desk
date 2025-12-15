// ============================================
// MOISES MEDEIROS v9.0 - AI ASSISTANT
// Assistente inteligente para gestão empresarial
// Conectado com dados reais do sistema
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

    // Buscar dados contextuais do sistema
    let systemContext = "";
    
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      try {
        // Buscar métricas financeiras
        const { data: income } = await supabase
          .from('income')
          .select('valor')
          .order('created_at', { ascending: false })
          .limit(30);
        
        const { data: expenses } = await supabase
          .from('company_fixed_expenses')
          .select('valor');
        
        const { data: students } = await supabase
          .from('students')
          .select('status');
        
        const { data: employees } = await supabase
          .from('employees')
          .select('status');
        
        const { data: tasks } = await supabase
          .from('calendar_tasks')
          .select('is_completed, priority')
          .gte('task_date', new Date().toISOString().split('T')[0]);

        // Calcular métricas
        const totalIncome = income?.reduce((sum, i) => sum + (i.valor || 0), 0) || 0;
        const totalExpenses = expenses?.reduce((sum, e) => sum + (e.valor || 0), 0) || 0;
        const activeStudents = students?.filter(s => s.status === 'ativo').length || 0;
        const totalStudents = students?.length || 0;
        const activeEmployees = employees?.filter(e => e.status === 'ativo').length || 0;
        const pendingTasks = tasks?.filter(t => !t.is_completed).length || 0;
        const highPriorityTasks = tasks?.filter(t => !t.is_completed && t.priority === 'alta').length || 0;

        systemContext = `
DADOS ATUAIS DO SISTEMA:
- Receita Total (últimos 30 registros): R$ ${totalIncome.toLocaleString('pt-BR')}
- Despesas Fixas: R$ ${totalExpenses.toLocaleString('pt-BR')}
- Lucro Estimado: R$ ${(totalIncome - totalExpenses).toLocaleString('pt-BR')}
- Alunos Ativos: ${activeStudents} de ${totalStudents} total
- Taxa de Retenção: ${totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0}%
- Funcionários Ativos: ${activeEmployees}
- Tarefas Pendentes Hoje: ${pendingTasks}
- Tarefas Alta Prioridade: ${highPriorityTasks}
`;
      } catch (dbError) {
        console.log("Erro ao buscar dados do banco:", dbError);
      }
    }

    // System prompts por contexto
    const contextPrompts: Record<string, string> = {
      dashboard: `Você é o Assistente de Gestão do Professor Moisés Medeiros, especializado em análise empresarial e educacional.

${systemContext}

SUAS RESPONSABILIDADES:
- Analisar métricas financeiras e de negócio
- Fornecer insights sobre performance de vendas
- Sugerir otimizações operacionais
- Ajudar com gestão de tarefas e agenda
- Monitorar KPIs importantes

ESTILO DE RESPOSTA:
- Use emojis relevantes para destacar pontos importantes (📊💰👥📈)
- Seja direto e objetivo
- Forneça números e percentuais quando possível
- Sugira ações práticas
- Responda em português brasileiro`,

      finance: `Você é um Consultor Financeiro especializado para o negócio do Professor Moisés Medeiros.

${systemContext}

SUAS ESPECIALIDADES:
- Análise de fluxo de caixa
- Projeções financeiras
- Identificação de oportunidades de economia
- Análise de ROI e margem
- Planejamento tributário básico
- Comparações período a período

Sempre forneça análises baseadas nos dados reais do sistema.`,

      students: `Você é um Analista Educacional focado na gestão de alunos.

${systemContext}

SUAS RESPONSABILIDADES:
- Analisar engajamento dos alunos
- Identificar padrões de abandono
- Sugerir estratégias de retenção
- Monitorar progresso de conclusão
- Análise de satisfação`,

      marketing: `Você é um Consultor de Marketing Digital.

${systemContext}

SUAS ESPECIALIDADES:
- Análise de funil de vendas
- ROI de campanhas
- Custo de Aquisição de Cliente (CAC)
- Lifetime Value (LTV)
- Estratégias de conversão
- Otimização de canais`
    };

    const systemPrompt = contextPrompts[context || "dashboard"] || contextPrompts.dashboard;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
