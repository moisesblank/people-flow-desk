// CSV Export Utilities

interface ExportOptions {
  filename: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
}

export function exportToCSV({ filename, headers, rows }: ExportOptions): void {
  // Escape special characters for CSV
  const escapeCSV = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Build CSV content
  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\n");

  // Add BOM for Excel compatibility with special characters
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

  // Create download link
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Format currency for export
export function formatCurrencyForExport(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

// Format date for export
export function formatDateForExport(date: string | Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR");
}

// Export employees
export function exportEmployees(employees: any[]): void {
  const headers = [
    "Nome",
    "Função",
    "Email",
    "Telefone",
    "Setor",
    "Status",
    "Salário (R$)",
    "Data Admissão",
    "Horário",
    "Responsabilidades",
  ];

  const rows = employees.map((e) => [
    e.nome,
    e.funcao,
    e.email,
    e.telefone,
    e.setor,
    e.status,
    formatCurrencyForExport(e.salario || 0),
    formatDateForExport(e.data_admissao),
    e.horario_trabalho,
    e.responsabilidades,
  ]);

  exportToCSV({
    filename: `funcionarios_${new Date().toISOString().split("T")[0]}`,
    headers,
    rows,
  });
}

// Export expenses
export function exportExpenses(
  expenses: any[],
  type: "personal" | "company"
): void {
  const headers = ["Nome", "Valor (R$)", "Categoria", "Data"];

  const rows = expenses.map((e) => [
    e.nome,
    formatCurrencyForExport(e.valor || 0),
    e.categoria || "Outros",
    formatDateForExport(e.data || e.created_at),
  ]);

  exportToCSV({
    filename: `gastos_${type === "personal" ? "pessoais" : "empresa"}_${new Date().toISOString().split("T")[0]}`,
    headers,
    rows,
  });
}

// Export income
export function exportIncome(income: any[]): void {
  const headers = ["Fonte", "Valor (R$)", "Banco", "Mês Referência", "Data"];

  const rows = income.map((e) => [
    e.fonte,
    formatCurrencyForExport(e.valor || 0),
    e.banco,
    formatDateForExport(e.mes_referencia),
    formatDateForExport(e.created_at),
  ]);

  exportToCSV({
    filename: `entradas_${new Date().toISOString().split("T")[0]}`,
    headers,
    rows,
  });
}

// Export payments
export function exportPayments(payments: any[]): void {
  const headers = [
    "Descrição",
    "Valor (R$)",
    "Tipo",
    "Status",
    "Vencimento",
    "Pagamento",
    "Método",
    "Recorrente",
    "Observações",
  ];

  const rows = payments.map((p) => [
    p.descricao,
    formatCurrencyForExport(p.valor || 0),
    p.tipo,
    p.status,
    formatDateForExport(p.data_vencimento),
    formatDateForExport(p.data_pagamento),
    p.metodo_pagamento,
    p.recorrente ? "Sim" : "Não",
    p.observacoes,
  ]);

  exportToCSV({
    filename: `pagamentos_${new Date().toISOString().split("T")[0]}`,
    headers,
    rows,
  });
}

// Export affiliates
export function exportAffiliates(affiliates: any[]): void {
  const headers = ["Nome", "Email", "Hotmart ID", "Total Vendas", "Comissão Total (R$)"];

  const rows = affiliates.map((a) => [
    a.nome,
    a.email,
    a.hotmart_id,
    a.total_vendas,
    formatCurrencyForExport(a.comissao_total || 0),
  ]);

  exportToCSV({
    filename: `afiliados_${new Date().toISOString().split("T")[0]}`,
    headers,
    rows,
  });
}

// Export students
export function exportStudents(students: any[]): void {
  const headers = ["Nome", "Email", "Curso", "Status", "WordPress ID"];

  const rows = students.map((s) => [
    s.nome,
    s.email,
    s.curso,
    s.status,
    s.wordpress_id,
  ]);

  exportToCSV({
    filename: `alunos_${new Date().toISOString().split("T")[0]}`,
    headers,
    rows,
  });
}

// Export calendar tasks
export function exportCalendarTasks(tasks: any[]): void {
  const headers = [
    "Título",
    "Descrição",
    "Data",
    "Horário",
    "Categoria",
    "Prioridade",
    "Concluída",
  ];

  const rows = tasks.map((t) => [
    t.title,
    t.description,
    formatDateForExport(t.task_date),
    t.task_time,
    t.category,
    t.priority,
    t.is_completed ? "Sim" : "Não",
  ]);

  exportToCSV({
    filename: `tarefas_${new Date().toISOString().split("T")[0]}`,
    headers,
    rows,
  });
}

// Export contabilidade
export function exportContabilidade(records: any[]): void {
  const headers = [
    "Tópico",
    "Subtópico",
    "Descrição",
    "Tipo",
    "Valor (R$)",
    "Categoria",
    "Mês Referência",
    "Ano Referência",
    "Observações",
  ];

  const rows = records.map((r) => [
    r.topico,
    r.subtopico,
    r.descricao,
    r.tipo,
    formatCurrencyForExport(r.valor || 0),
    r.categoria,
    r.mes_referencia,
    r.ano_referencia,
    r.observacoes,
  ]);

  exportToCSV({
    filename: `contabilidade_${new Date().toISOString().split("T")[0]}`,
    headers,
    rows,
  });
}
