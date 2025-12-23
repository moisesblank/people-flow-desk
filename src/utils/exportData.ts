// ============================================
// 🏛️ LEI I - CSV EXPORT (Web Worker Ready)
// UI nunca congela durante exportação
// ============================================

interface ExportOptions {
  filename: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
}

// Cache do worker
let csvWorker: Worker | null = null;
let workerPromises = new Map<string, { resolve: (v: string) => void; reject: (e: Error) => void }>();

/**
 * Cria worker inline para CSV
 */
function getCSVWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  
  if (!csvWorker) {
    const workerCode = `
self.onmessage = (e) => {
  const { id, headers, rows } = e.data;
  const escapeCSV = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\\n")) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const csv = [headers.map(escapeCSV).join(","), ...rows.map(r => r.map(escapeCSV).join(","))].join("\\n");
  self.postMessage({ id, csv: "\\uFEFF" + csv });
};`;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    csvWorker = new Worker(URL.createObjectURL(blob));
    
    csvWorker.onmessage = (e) => {
      const { id, csv } = e.data;
      const pending = workerPromises.get(id);
      if (pending) {
        workerPromises.delete(id);
        pending.resolve(csv);
      }
    };
    
    csvWorker.onerror = (e) => {
      workerPromises.forEach(p => p.reject(new Error(e.message)));
      workerPromises.clear();
    };
  }
  
  return csvWorker;
}

/**
 * Processa CSV no worker (off-main-thread)
 */
async function processCSVInWorker(headers: string[], rows: (string | number | null | undefined)[][]): Promise<string> {
  const worker = getCSVWorker();
  
  // Fallback para main thread se Worker não disponível
  if (!worker) {
    const escapeCSV = (value: string | number | null | undefined): string => {
      if (value === null || value === undefined) return "";
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");
    return "\uFEFF" + csvContent;
  }
  
  return new Promise((resolve, reject) => {
    const id = `csv_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    workerPromises.set(id, { resolve, reject });
    worker.postMessage({ id, headers, rows });
  });
}

/**
 * Exporta para CSV usando Web Worker (UI fluida)
 */
export async function exportToCSV({ filename, headers, rows }: ExportOptions): Promise<void> {
  // Processar no worker (off-thread)
  const csvContent = await processCSVInWorker(headers, rows);
  
  // Download do arquivo
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
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

/**
 * Versão síncrona para compatibilidade (legado)
 * @deprecated Use exportToCSV (async) para melhor UX
 */
export function exportToCSVSync({ filename, headers, rows }: ExportOptions): void {
  const escapeCSV = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\n");

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
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
export async function exportEmployees(employees: any[]): Promise<void> {
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

  await exportToCSV({
    filename: `funcionarios_${new Date().toISOString().split("T")[0]}`,
    headers,
    rows,
  });
}

// Export expenses
export async function exportExpenses(
  expenses: any[],
  type: "personal" | "company"
): Promise<void> {
  const headers = ["Nome", "Valor (R$)", "Categoria", "Data"];

  const rows = expenses.map((e) => [
    e.nome,
    formatCurrencyForExport(e.valor || 0),
    e.categoria || "Outros",
    formatDateForExport(e.data || e.created_at),
  ]);

  await exportToCSV({
    filename: `gastos_${type === "personal" ? "pessoais" : "empresa"}_${new Date().toISOString().split("T")[0]}`,
    headers,
    rows,
  });
}

// Export income
export async function exportIncome(income: any[]): Promise<void> {
  const headers = ["Fonte", "Valor (R$)", "Banco", "Mês Referência", "Data"];

  const rows = income.map((e) => [
    e.fonte,
    formatCurrencyForExport(e.valor || 0),
    e.banco,
    formatDateForExport(e.mes_referencia),
    formatDateForExport(e.created_at),
  ]);

  await exportToCSV({
    filename: `entradas_${new Date().toISOString().split("T")[0]}`,
    headers,
    rows,
  });
}

// Export payments
export async function exportPayments(payments: any[]): Promise<void> {
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

  await exportToCSV({
    filename: `pagamentos_${new Date().toISOString().split("T")[0]}`,
    headers,
    rows,
  });
}

// Export affiliates
export async function exportAffiliates(affiliates: any[]): Promise<void> {
  const headers = ["Nome", "Email", "Hotmart ID", "Total Vendas", "Comissão Total (R$)"];

  const rows = affiliates.map((a) => [
    a.nome,
    a.email,
    a.hotmart_id,
    a.total_vendas,
    formatCurrencyForExport(a.comissao_total || 0),
  ]);

  await exportToCSV({
    filename: `afiliados_${new Date().toISOString().split("T")[0]}`,
    headers,
    rows,
  });
}

// Export students
export async function exportStudents(students: any[]): Promise<void> {
  const headers = ["Nome", "Email", "Curso", "Status", "WordPress ID"];

  const rows = students.map((s) => [
    s.nome,
    s.email,
    s.curso,
    s.status,
    s.wordpress_id,
  ]);

  await exportToCSV({
    filename: `alunos_${new Date().toISOString().split("T")[0]}`,
    headers,
    rows,
  });
}

// Export calendar tasks
export async function exportCalendarTasks(tasks: any[]): Promise<void> {
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

  await exportToCSV({
    filename: `tarefas_${new Date().toISOString().split("T")[0]}`,
    headers,
    rows,
  });
}

// Export contabilidade
export async function exportContabilidade(records: any[]): Promise<void> {
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

  await exportToCSV({
    filename: `contabilidade_${new Date().toISOString().split("T")[0]}`,
    headers,
    rows,
  });
}
