// ============================================
// SYNAPSE v14.0 - RELATÓRIOS SEMANAIS AUTOMÁTICOS
// Envia relatórios por email automaticamente
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

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
  // LEI VI: CORS dinâmico via allowlist
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
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
            from: Deno.env.get("RESEND_FROM") || 'SYNAPSE <falecom@moisesmedeiros.com.br>',
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

  // Template padrão da plataforma (PADRONIZADO v10.x)
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#0a0a0f;color:#ffffff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0f;">
    <tr>
      <td align="center" style="padding:24px;">
        <table role="presentation" width="100%" style="max-width:640px;" cellspacing="0" cellpadding="0">
          <tr>
            <td style="background:linear-gradient(180deg,#131318 0%,#0a0a0f 100%);border-radius:16px;padding:28px;border:1px solid #7D1128;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr><td align="center" style="padding-bottom:20px;">
                  <h1 style="margin:0;color:#E62B4A;font-size:24px;font-weight:700;">Curso Moisés Medeiros</h1>
                  <p style="margin:8px 0 0;color:#9aa0a6;font-size:13px;">📊 Relatório Semanal</p>
                </td></tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr><td style="color:#e6e6e6;line-height:1.7;font-size:14px;">
                  <div style="text-align:center;margin-bottom:20px;">
                    <p style="margin:0;color:#9aa0a6;font-size:14px;">${data.period.start} — ${data.period.end}</p>
                  </div>
                  
                  <h3 style="margin:20px 0 12px;font-size:14px;color:#E62B4A;text-transform:uppercase;letter-spacing:1px;">💰 Resumo Financeiro</h3>
                  <table role="presentation" width="100%" cellspacing="8" cellpadding="0">
                    <tr>
                      <td style="background:#1a1a1f;border-radius:8px;padding:16px;width:50%;text-align:center;">
                        <p style="margin:0;font-size:20px;font-weight:bold;color:#22c55e;">${formatCurrency(data.financial.totalIncome)}</p>
                        <p style="margin:4px 0 0;font-size:11px;color:#9aa0a6;">Receitas</p>
                      </td>
                      <td style="background:#1a1a1f;border-radius:8px;padding:16px;width:50%;text-align:center;">
                        <p style="margin:0;font-size:20px;font-weight:bold;color:#ef4444;">${formatCurrency(data.financial.totalExpenses)}</p>
                        <p style="margin:4px 0 0;font-size:11px;color:#9aa0a6;">Despesas</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#1a1a1f;border-radius:8px;padding:16px;width:50%;text-align:center;">
                        <p style="margin:0;font-size:20px;font-weight:bold;color:${data.financial.profit >= 0 ? '#22c55e' : '#ef4444'};">${formatCurrency(data.financial.profit)}</p>
                        <p style="margin:4px 0 0;font-size:11px;color:#9aa0a6;">Lucro Líquido</p>
                      </td>
                      <td style="background:#1a1a1f;border-radius:8px;padding:16px;width:50%;text-align:center;">
                        <p style="margin:0;font-size:20px;font-weight:bold;color:#ffffff;">${data.financial.profitMargin.toFixed(1)}%</p>
                        <p style="margin:4px 0 0;font-size:11px;color:#9aa0a6;">Margem</p>
                      </td>
                    </tr>
                  </table>
                  
                  <h3 style="margin:24px 0 12px;font-size:14px;color:#E62B4A;text-transform:uppercase;letter-spacing:1px;">🎓 Vendas & Alunos</h3>
                  <table role="presentation" width="100%" cellspacing="8" cellpadding="0">
                    <tr>
                      <td style="background:#1a1a1f;border-radius:8px;padding:16px;width:50%;text-align:center;">
                        <p style="margin:0;font-size:20px;font-weight:bold;color:#ffffff;">${data.sales.count}</p>
                        <p style="margin:4px 0 0;font-size:11px;color:#9aa0a6;">Vendas</p>
                      </td>
                      <td style="background:#1a1a1f;border-radius:8px;padding:16px;width:50%;text-align:center;">
                        <p style="margin:0;font-size:20px;font-weight:bold;color:#ffffff;">${formatCurrency(data.sales.avgTicket)}</p>
                        <p style="margin:4px 0 0;font-size:11px;color:#9aa0a6;">Ticket Médio</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#1a1a1f;border-radius:8px;padding:16px;width:50%;text-align:center;">
                        <p style="margin:0;font-size:20px;font-weight:bold;color:#ffffff;">${data.students.total}</p>
                        <p style="margin:4px 0 0;font-size:11px;color:#9aa0a6;">Total Alunos</p>
                      </td>
                      <td style="background:#1a1a1f;border-radius:8px;padding:16px;width:50%;text-align:center;">
                        <p style="margin:0;font-size:20px;font-weight:bold;color:#22c55e;">+${data.students.newThisWeek}</p>
                        <p style="margin:4px 0 0;font-size:11px;color:#9aa0a6;">Novos</p>
                      </td>
                    </tr>
                  </table>
                  
                  <h3 style="margin:24px 0 12px;font-size:14px;color:#E62B4A;text-transform:uppercase;letter-spacing:1px;">✅ Produtividade</h3>
                  <table role="presentation" width="100%" cellspacing="8" cellpadding="0">
                    <tr>
                      <td style="background:#1a1a1f;border-radius:8px;padding:16px;width:50%;text-align:center;">
                        <p style="margin:0;font-size:20px;font-weight:bold;color:#22c55e;">${data.tasks.completed}</p>
                        <p style="margin:4px 0 0;font-size:11px;color:#9aa0a6;">Concluídas</p>
                      </td>
                      <td style="background:#1a1a1f;border-radius:8px;padding:16px;width:50%;text-align:center;">
                        <p style="margin:0;font-size:20px;font-weight:bold;color:#eab308;">${data.tasks.pending}</p>
                        <p style="margin:4px 0 0;font-size:11px;color:#9aa0a6;">Pendentes</p>
                      </td>
                    </tr>
                  </table>
                  
                  ${data.highlights.length > 0 ? `
                  <h3 style="margin:24px 0 12px;font-size:14px;color:#E62B4A;text-transform:uppercase;letter-spacing:1px;">🌟 Destaques</h3>
                  ${data.highlights.map(h => `<div style="background:#1a2f1a;border-left:3px solid #22c55e;padding:12px 15px;border-radius:0 8px 8px 0;margin-bottom:8px;color:#e6e6e6;">${h}</div>`).join('')}
                  ` : ''}
                  
                  ${data.alerts.length > 0 ? `
                  <h3 style="margin:24px 0 12px;font-size:14px;color:#E62B4A;text-transform:uppercase;letter-spacing:1px;">⚠️ Alertas</h3>
                  ${data.alerts.map(a => `<div style="background:#2f1a1a;border-left:3px solid #ef4444;padding:12px 15px;border-radius:0 8px 8px 0;margin-bottom:8px;color:#e6e6e6;">${a}</div>`).join('')}
                  ` : ''}
                </td></tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr><td align="center" style="padding-top:24px;">
                  <a href="https://pro.moisesmedeiros.com.br/gestaofc/dashboard" style="display:inline-block;background:linear-gradient(135deg,#E62B4A,#7D1128);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:14px;">📊 Ver Dashboard Completo</a>
                </td></tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr><td style="padding:24px 0 18px;"><hr style="border:none;border-top:1px solid #2a2a2f;margin:0;" /></td></tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr><td style="color:#9aa0a6;font-size:12px;line-height:1.6;">
                  <p style="margin:0 0 8px;"><strong style="color:#e6e6e6;">Prof. Moisés Medeiros Melo</strong></p>
                  <p style="margin:0 0 8px;">MM CURSO DE QUÍMICA LTDA | O curso que mais aprova e comprova!</p>
                  <p style="margin:0;">WhatsApp: <a href="https://wa.me/558396169222" style="color:#E62B4A;">+55 83 9616-9222</a></p>
                </td></tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr><td align="center" style="padding-top:18px;">
                  <p style="margin:0;color:#666;font-size:11px;">Relatório automático • SYNAPSE v10.x</p>
                  <p style="margin:4px 0 0;color:#666;font-size:11px;">© ${new Date().getFullYear()} MM Curso de Química Ltda.</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
