// ============================================
// SYNAPSE v14.0 - RELATÓRIOS SEMANAIS AUTOMÁTICOS
// Envia relatórios por email automaticamente
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

// LEI VI: CORS seguro
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://gestao.moisesmedeiros.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeeklyReportData {
  period: {
    start: string;
    end: string;
  };
  financial: {
    totalIncome: number;
    totalExpenses: number;
    profit: number;
    profitMargin: number;
  };
  students: {
    total: number;
    newThisWeek: number;
    activeRate: number;
  };
  sales: {
    total: number;
    count: number;
    avgTicket: number;
    topProducts: string[];
  };
  tasks: {
    completed: number;
    pending: number;
    completionRate: number;
  };
  highlights: string[];
  alerts: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const { recipient_email, force_send } = body;

    // Calculate date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    // Gather report data
    const [
      incomeRes,
      personalFixedRes,
      personalExtraRes,
      companyFixedRes,
      companyExtraRes,
      studentsRes,
      salesRes,
      tasksRes,
      affiliatesRes
    ] = await Promise.all([
      supabase.from('income').select('*'),
      supabase.from('personal_fixed_expenses').select('*'),
      supabase.from('personal_extra_expenses').select('*').gte('created_at', startISO),
      supabase.from('company_fixed_expenses').select('*'),
      supabase.from('company_extra_expenses').select('*').gte('created_at', startISO),
      supabase.from('students').select('*'),
      supabase.from('synapse_transactions').select('*').gte('created_at', startISO).eq('status', 'approved'),
      supabase.from('calendar_tasks').select('*'),
      supabase.from('affiliates').select('*')
    ]);

    // Calculate financial summary
    const totalIncome = incomeRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;
    const personalFixed = personalFixedRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;
    const personalExtra = personalExtraRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;
    const companyFixed = companyFixedRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;
    const companyExtra = companyExtraRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;
    const totalExpenses = personalFixed + personalExtra + companyFixed + companyExtra;
    const profit = totalIncome - totalExpenses;

    // Sales summary
    const sales = salesRes.data || [];
    const totalSalesAmount = sales.reduce((acc, s) => acc + (s.amount || 0), 0);
    const avgTicket = sales.length > 0 ? totalSalesAmount / sales.length : 0;

    // Students summary
    const students = studentsRes.data || [];
    const newStudents = students.filter(s => 
      new Date(s.created_at || '') >= startDate
    ).length;

    // Tasks summary
    const tasks = tasksRes.data || [];
    const completedTasks = tasks.filter(t => t.is_completed).length;
    const pendingTasks = tasks.filter(t => !t.is_completed).length;
    const completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

    // Generate insights
    const highlights: string[] = [];
    const alerts: string[] = [];

    if (profit > 0) {
      highlights.push(`💰 Lucro positivo de R$ ${(profit / 100).toFixed(2)} esta semana`);
    } else {
      alerts.push(`⚠️ Prejuízo de R$ ${Math.abs(profit / 100).toFixed(2)} esta semana`);
    }

    if (newStudents > 0) {
      highlights.push(`🎓 ${newStudents} novo(s) aluno(s) matriculado(s)`);
    }

    if (sales.length > 0) {
      highlights.push(`🛒 ${sales.length} venda(s) realizada(s)`);
    }

    if (completionRate > 80) {
      highlights.push(`✅ ${completionRate.toFixed(0)}% das tarefas concluídas`);
    } else if (pendingTasks > 10) {
      alerts.push(`📋 ${pendingTasks} tarefas pendentes`);
    }

    const reportData: WeeklyReportData = {
      period: {
        start: startDate.toLocaleDateString('pt-BR'),
        end: endDate.toLocaleDateString('pt-BR'),
      },
      financial: {
        totalIncome,
        totalExpenses,
        profit,
        profitMargin: totalIncome > 0 ? (profit / totalIncome) * 100 : 0,
      },
      students: {
        total: students.length,
        newThisWeek: newStudents,
        activeRate: 85, // Would need actual activity data
      },
      sales: {
        total: totalSalesAmount,
        count: sales.length,
        avgTicket,
        topProducts: [],
      },
      tasks: {
        completed: completedTasks,
        pending: pendingTasks,
        completionRate,
      },
      highlights,
      alerts,
    };

    // Generate HTML report
    const htmlReport = generateHTMLReport(reportData);

    // Send email if Resend is configured
    let emailSent = false;
    if (resendApiKey && recipient_email) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'SYNAPSE <reports@resend.dev>',
            to: [recipient_email],
            subject: `📊 Relatório Semanal - ${reportData.period.start} a ${reportData.period.end}`,
            html: htmlReport,
          }),
        });

        if (emailResponse.ok) {
          emailSent = true;
        } else {
          console.error('Email send failed:', await emailResponse.text());
        }
      } catch (emailError) {
        console.error('Email error:', emailError);
      }
    }

    // Log report generation
    await supabase.from('audit_logs').insert({
      action: 'weekly_report_generated',
      metadata: {
        period: reportData.period,
        email_sent: emailSent,
        recipient: recipient_email || null,
        summary: {
          income: totalIncome,
          expenses: totalExpenses,
          profit,
          sales_count: sales.length,
          new_students: newStudents,
        },
      },
    });

    return new Response(JSON.stringify({
      success: true,
      report: reportData,
      email_sent: emailSent,
      html_preview: htmlReport,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Report error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateHTMLReport(data: WeeklyReportData): string {
  const formatCurrency = (cents: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório Semanal SYNAPSE</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; color: #fff; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #111; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #7c3aed 100%); padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 10px 0 0; opacity: 0.9; }
    .content { padding: 30px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 16px; font-weight: 600; margin-bottom: 15px; color: #a3a3a3; text-transform: uppercase; letter-spacing: 1px; }
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
    .stat-card { background: #1a1a1a; border-radius: 12px; padding: 20px; }
    .stat-value { font-size: 24px; font-weight: 700; color: #fff; }
    .stat-label { font-size: 12px; color: #737373; margin-top: 5px; }
    .stat-positive { color: #22c55e; }
    .stat-negative { color: #ef4444; }
    .highlight { background: #1a2e1a; border-left: 4px solid #22c55e; padding: 12px 15px; border-radius: 0 8px 8px 0; margin-bottom: 10px; }
    .alert { background: #2e1a1a; border-left: 4px solid #ef4444; padding: 12px 15px; border-radius: 0 8px 8px 0; margin-bottom: 10px; }
    .footer { text-align: center; padding: 20px; color: #525252; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Relatório Semanal</h1>
      <p>${data.period.start} — ${data.period.end}</p>
    </div>
    
    <div class="content">
      <div class="section">
        <div class="section-title">Resumo Financeiro</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value stat-positive">${formatCurrency(data.financial.totalIncome)}</div>
            <div class="stat-label">Receitas</div>
          </div>
          <div class="stat-card">
            <div class="stat-value stat-negative">${formatCurrency(data.financial.totalExpenses)}</div>
            <div class="stat-label">Despesas</div>
          </div>
          <div class="stat-card">
            <div class="stat-value ${data.financial.profit >= 0 ? 'stat-positive' : 'stat-negative'}">${formatCurrency(data.financial.profit)}</div>
            <div class="stat-label">Lucro Líquido</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.financial.profitMargin.toFixed(1)}%</div>
            <div class="stat-label">Margem</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Vendas & Alunos</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${data.sales.count}</div>
            <div class="stat-label">Vendas</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${formatCurrency(data.sales.avgTicket)}</div>
            <div class="stat-label">Ticket Médio</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.students.total}</div>
            <div class="stat-label">Total Alunos</div>
          </div>
          <div class="stat-card">
            <div class="stat-value stat-positive">+${data.students.newThisWeek}</div>
            <div class="stat-label">Novos</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Produtividade</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value stat-positive">${data.tasks.completed}</div>
            <div class="stat-label">Tarefas Concluídas</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.tasks.pending}</div>
            <div class="stat-label">Pendentes</div>
          </div>
        </div>
      </div>

      ${data.highlights.length > 0 ? `
      <div class="section">
        <div class="section-title">Destaques</div>
        ${data.highlights.map(h => `<div class="highlight">${h}</div>`).join('')}
      </div>
      ` : ''}

      ${data.alerts.length > 0 ? `
      <div class="section">
        <div class="section-title">Alertas</div>
        ${data.alerts.map(a => `<div class="alert">${a}</div>`).join('')}
      </div>
      ` : ''}
    </div>

    <div class="footer">
      <p>Gerado automaticamente pelo SYNAPSE v14.0</p>
      <p>Moisés Medeiros - Sistema de Gestão</p>
    </div>
  </div>
</body>
</html>
  `;
}
