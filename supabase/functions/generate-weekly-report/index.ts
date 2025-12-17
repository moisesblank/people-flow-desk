import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeeklyReportData {
  period: string;
  totalReceitas: number;
  totalDespesas: number;
  lucro: number;
  novosAlunos: number;
  totalAlunos: number;
  vendasHotmart: number;
  comissoesPendentes: number;
  tarefasConcluidas: number;
  tarefasPendentes: number;
  instagramSeguidores: number;
  facebookROI: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[Weekly Report] Generating report...");
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    
    // Período: últimos 7 dias
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = new Date();
    
    // 1. RECEITAS
    const { data: receitas } = await supabase
      .from("entradas")
      .select("valor, fonte")
      .gte("data", startDate.toISOString());
    
    const totalReceitas = receitas?.reduce((sum, r) => sum + (r.valor || 0), 0) || 0;
    const vendasHotmart = receitas?.filter(r => r.fonte === "Hotmart").reduce((sum, r) => sum + (r.valor || 0), 0) || 0;
    
    // 2. DESPESAS
    const { data: despesas } = await supabase
      .from("gastos")
      .select("valor")
      .gte("data", startDate.toISOString());
    
    const totalDespesas = despesas?.reduce((sum, d) => sum + (d.valor || 0), 0) || 0;
    
    // Também pegar despesas do command_finance
    const { data: commandExpenses } = await supabase
      .from("command_finance")
      .select("amount")
      .eq("type", "expense")
      .gte("date", startDate.toISOString().split('T')[0]);
    
    const commandExpensesTotal = commandExpenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
    
    // 3. LUCRO
    const lucro = totalReceitas - totalDespesas - commandExpensesTotal;
    
    // 4. ALUNOS
    const { data: novosAlunos } = await supabase
      .from("alunos")
      .select("*")
      .gte("data_matricula", startDate.toISOString());
    
    const { count: totalAlunos } = await supabase
      .from("alunos")
      .select("*", { count: "exact", head: true })
      .eq("status", "ativo");
    
    // 5. COMISSÕES PENDENTES
    const { data: comissoes } = await supabase
      .from("comissoes")
      .select("valor")
      .eq("status", "pendente");
    
    const comissoesPendentes = comissoes?.reduce((sum, c) => sum + (c.valor || 0), 0) || 0;
    
    // 6. TAREFAS
    const { data: tarefasConcluidas } = await supabase
      .from("tarefas")
      .select("*")
      .eq("status", "concluido")
      .gte("concluido_em", startDate.toISOString());
    
    const { count: tarefasPendentes } = await supabase
      .from("tarefas")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendente");
    
    // Também contar command_tasks
    const { count: commandTasksPending } = await supabase
      .from("command_tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "todo");
    
    // 7. MÉTRICAS INSTAGRAM
    const { data: instagramMetrics } = await supabase
      .from("instagram_metrics")
      .select("seguidores")
      .order("data", { ascending: false })
      .limit(1);
    
    const instagramSeguidores = instagramMetrics?.[0]?.seguidores || 0;
    
    // 8. ROI FACEBOOK
    const { data: facebookMetrics } = await supabase
      .from("facebook_ads_metrics")
      .select("roi")
      .order("data", { ascending: false })
      .limit(5);
    
    const facebookROI = facebookMetrics?.length 
      ? facebookMetrics.reduce((sum, m) => sum + (m.roi || 0), 0) / facebookMetrics.length 
      : 0;
    
    const reportData: WeeklyReportData = {
      period: `${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}`,
      totalReceitas,
      totalDespesas: totalDespesas + commandExpensesTotal,
      lucro,
      novosAlunos: novosAlunos?.length || 0,
      totalAlunos: totalAlunos || 0,
      vendasHotmart,
      comissoesPendentes,
      tarefasConcluidas: tarefasConcluidas?.length || 0,
      tarefasPendentes: (tarefasPendentes || 0) + (commandTasksPending || 0),
      instagramSeguidores,
      facebookROI: parseFloat(facebookROI.toFixed(2)),
    };
    
    console.log("[Weekly Report] Data collected:", reportData);
    
    // GERAR HTML DO RELATÓRIO
    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    .container { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #7D1128; margin-bottom: 5px; }
    .period { color: #666; font-size: 14px; margin-bottom: 30px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 16px; font-weight: bold; color: #333; border-bottom: 2px solid #7D1128; padding-bottom: 8px; margin-bottom: 15px; }
    .metric-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
    .metric { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
    .metric-value { font-size: 24px; font-weight: bold; color: #7D1128; }
    .metric-label { font-size: 12px; color: #666; margin-top: 5px; }
    .positive { color: #10b981; }
    .negative { color: #ef4444; }
    .highlight { background: linear-gradient(135deg, #7D1128, #a91e3a); color: white; }
    .highlight .metric-value { color: white; }
    .highlight .metric-label { color: rgba(255,255,255,0.9); }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Relatório Semanal</h1>
    <div class="period">${reportData.period}</div>
    
    <div class="section">
      <div class="section-title">💰 Resumo Financeiro</div>
      <div class="metric-grid">
        <div class="metric highlight">
          <div class="metric-value">${formatCurrency(reportData.totalReceitas)}</div>
          <div class="metric-label">Receitas</div>
        </div>
        <div class="metric">
          <div class="metric-value">${formatCurrency(reportData.totalDespesas)}</div>
          <div class="metric-label">Despesas</div>
        </div>
        <div class="metric">
          <div class="metric-value ${reportData.lucro >= 0 ? 'positive' : 'negative'}">${formatCurrency(reportData.lucro)}</div>
          <div class="metric-label">Lucro</div>
        </div>
        <div class="metric">
          <div class="metric-value">${formatCurrency(reportData.vendasHotmart)}</div>
          <div class="metric-label">Vendas Hotmart</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">👥 Alunos</div>
      <div class="metric-grid">
        <div class="metric">
          <div class="metric-value positive">+${reportData.novosAlunos}</div>
          <div class="metric-label">Novos esta semana</div>
        </div>
        <div class="metric">
          <div class="metric-value">${reportData.totalAlunos}</div>
          <div class="metric-label">Total de alunos ativos</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">📋 Produtividade</div>
      <div class="metric-grid">
        <div class="metric">
          <div class="metric-value positive">${reportData.tarefasConcluidas}</div>
          <div class="metric-label">Tarefas Concluídas</div>
        </div>
        <div class="metric">
          <div class="metric-value">${reportData.tarefasPendentes}</div>
          <div class="metric-label">Tarefas Pendentes</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">📱 Marketing</div>
      <div class="metric-grid">
        <div class="metric">
          <div class="metric-value">${reportData.instagramSeguidores.toLocaleString('pt-BR')}</div>
          <div class="metric-label">Seguidores Instagram</div>
        </div>
        <div class="metric">
          <div class="metric-value ${reportData.facebookROI >= 0 ? 'positive' : 'negative'}">${reportData.facebookROI}%</div>
          <div class="metric-label">ROI Facebook Ads</div>
        </div>
      </div>
    </div>
    
    ${reportData.comissoesPendentes > 0 ? `
    <div class="section">
      <div class="section-title">⚠️ Atenção</div>
      <div class="metric">
        <div class="metric-value">${formatCurrency(reportData.comissoesPendentes)}</div>
        <div class="metric-label">Comissões pendentes para pagamento</div>
      </div>
    </div>
    ` : ''}
    
    <div class="footer">
      <p>Relatório gerado automaticamente pelo sistema de gestão</p>
      <p><a href="https://gestao.moisesmedeiros.com.br/dashboard">Acessar Dashboard Completo</a></p>
    </div>
  </div>
</body>
</html>
    `;
    
    // ENVIAR POR EMAIL
    try {
      const emailResponse = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          },
          body: JSON.stringify({
            to: "moisesblank@gmail.com",
            subject: `📊 Relatório Semanal - ${reportData.period}`,
            html: html,
          }),
        }
      );
      
      const emailResult = await emailResponse.json();
      console.log("[Weekly Report] Email result:", emailResult);
    } catch (emailError) {
      console.error("[Weekly Report] Error sending email:", emailError);
    }
    
    // Registrar no log
    await supabase.from("audit_logs").insert({
      action: "weekly_report_generated",
      metadata: reportData,
    });
    
    console.log("[Weekly Report] ✅ Report generated successfully");
    
    return new Response(JSON.stringify({ 
      success: true,
      data: reportData,
      htmlPreview: html.substring(0, 500) + "..."
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Weekly Report] Error:", errorMessage);
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
