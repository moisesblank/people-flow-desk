// ============================================
// MOISES MEDEIROS v5.0 - SEND REPORT
// Edge Function para envio de relatórios automáticos
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

interface ReportData {
  period: string;
  income: number;
  expenses: number;
  profit: number;
  students: number;
  affiliates: number;
  pendingPayments: number;
  topExpenseCategories: { category: string; amount: number }[];
}

serve(async (req) => {
  // LEI VI: CORS dinâmico via allowlist centralizado
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, userId, email } = await req.json();

    // Fetch report data
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Fetch income
    const { data: incomeData } = await supabase
      .from("income")
      .select("valor")
      .gte("created_at", startOfMonth.toISOString())
      .lte("created_at", endOfMonth.toISOString());

    const totalIncome = incomeData?.reduce((sum, i) => sum + (i.valor || 0), 0) || 0;

    // Fetch personal expenses
    const { data: personalExpenses } = await supabase
      .from("personal_extra_expenses")
      .select("valor, categoria")
      .gte("created_at", startOfMonth.toISOString())
      .lte("created_at", endOfMonth.toISOString());

    const totalPersonalExpenses = personalExpenses?.reduce((sum, e) => sum + (e.valor || 0), 0) || 0;

    // Fetch company expenses
    const { data: companyExpenses } = await supabase
      .from("company_extra_expenses")
      .select("valor, categoria")
      .gte("created_at", startOfMonth.toISOString())
      .lte("created_at", endOfMonth.toISOString());

    const totalCompanyExpenses = companyExpenses?.reduce((sum, e) => sum + (e.valor || 0), 0) || 0;

    // Calculate totals
    const totalExpenses = totalPersonalExpenses + totalCompanyExpenses;
    const profit = totalIncome - totalExpenses;

    // Count students and affiliates
    const { count: studentsCount } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true });

    const { count: affiliatesCount } = await supabase
      .from("affiliates")
      .select("*", { count: "exact", head: true });

    // Count pending payments
    const { count: pendingPaymentsCount } = await supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendente");

    // Group expenses by category
    const categoryMap = new Map<string, number>();
    [...(personalExpenses || []), ...(companyExpenses || [])].forEach((e) => {
      const cat = e.categoria || "outros";
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + (e.valor || 0));
    });

    const topCategories = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    const reportData: ReportData = {
      period: `${startOfMonth.toLocaleDateString("pt-BR")} - ${endOfMonth.toLocaleDateString("pt-BR")}`,
      income: totalIncome,
      expenses: totalExpenses,
      profit,
      students: studentsCount || 0,
      affiliates: affiliatesCount || 0,
      pendingPayments: pendingPaymentsCount || 0,
      topExpenseCategories: topCategories,
    };

    // Format currency
    const formatCurrency = (value: number) =>
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);

    // Generate HTML report
    const htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    .container { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { color: #7c3aed; margin: 0; }
    .header p { color: #666; margin-top: 5px; }
    .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
    .stat-card { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
    .stat-card .label { color: #666; font-size: 12px; margin-bottom: 5px; }
    .stat-card .value { font-size: 20px; font-weight: bold; color: #333; }
    .stat-card.green .value { color: #22c55e; }
    .stat-card.red .value { color: #ef4444; }
    .stat-card.blue .value { color: #3b82f6; }
    .categories { margin-top: 20px; }
    .categories h3 { color: #333; margin-bottom: 10px; }
    .category-item { display: flex; justify-content: space-between; padding: 10px; background: #f8f9fa; margin-bottom: 5px; border-radius: 5px; }
    .footer { text-align: center; margin-top: 30px; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Relatório Mensal</h1>
      <p>Período: ${reportData.period}</p>
    </div>
    
    <div class="stat-grid">
      <div class="stat-card green">
        <div class="label">Receitas</div>
        <div class="value">${formatCurrency(reportData.income)}</div>
      </div>
      <div class="stat-card red">
        <div class="label">Despesas</div>
        <div class="value">${formatCurrency(reportData.expenses)}</div>
      </div>
      <div class="stat-card ${reportData.profit >= 0 ? 'green' : 'red'}">
        <div class="label">Lucro Líquido</div>
        <div class="value">${formatCurrency(reportData.profit)}</div>
      </div>
      <div class="stat-card blue">
        <div class="label">Alunos</div>
        <div class="value">${reportData.students}</div>
      </div>
      <div class="stat-card blue">
        <div class="label">Afiliados</div>
        <div class="value">${reportData.affiliates}</div>
      </div>
      <div class="stat-card">
        <div class="label">Pagamentos Pendentes</div>
        <div class="value">${reportData.pendingPayments}</div>
      </div>
    </div>
    
    ${reportData.topExpenseCategories.length > 0 ? `
    <div class="categories">
      <h3>Top 5 Categorias de Gastos</h3>
      ${reportData.topExpenseCategories.map((cat) => `
        <div class="category-item">
          <span>${cat.category}</span>
          <span><strong>${formatCurrency(cat.amount)}</strong></span>
        </div>
      `).join("")}
    </div>
    ` : ""}
    
    <div class="footer">
      <p>Moisés Medeiros v5.0 • Curso - Química</p>
      <p>Este é um relatório automático gerado pelo sistema.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Log report generation
    await supabase.from("audit_logs").insert({
      action: "report_generated",
      metadata: { type, userId, reportData },
    });

    return new Response(
      JSON.stringify({
        success: true,
        report: reportData,
        html: htmlReport,
        message: "Relatório gerado com sucesso",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error generating report:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao gerar relatório";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
