// ============================================
// MOISÉS MEDEIROS v10.0 - PDF GENERATOR
// FASE 8: Relatórios PDF Avançados
// ============================================

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency, formatDate as formatDateUtil } from "@/utils/format";

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

interface PDFOptions {
  title: string;
  subtitle?: string;
  author?: string;
  date?: Date;
}

// Alias para compatibilidade (formatDate retorna "-" para null, igual ao original)
const formatDate = (date: string | Date | null): string => {
  if (!date) return "-";
  return formatDateUtil(date);
};

// Create base PDF with header
const createBasePDF = (options: PDFOptions): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header background
  doc.setFillColor(125, 17, 40); // Primary color
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(options.title, 14, 20);
  
  // Subtitle
  if (options.subtitle) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(options.subtitle, 14, 30);
  }
  
  // Date on right
  doc.setFontSize(10);
  const dateText = `Gerado em: ${formatDate(options.date || new Date())}`;
  doc.text(dateText, pageWidth - 14, 20, { align: 'right' });
  
  // Author
  if (options.author) {
    doc.text(`Por: ${options.author}`, pageWidth - 14, 30, { align: 'right' });
  }
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  return doc;
};

// ========== FINANCIAL REPORT ==========
export const generateFinancialPDF = (data: {
  income: number;
  personalFixed: number;
  personalExtra: number;
  companyFixed: number;
  companyExtra: number;
  lucroLiquido: number;
  month: string;
  categoryData?: { name: string; value: number }[];
}): void => {
  const doc = createBasePDF({
    title: 'Relatório Financeiro',
    subtitle: `Referência: ${data.month}`,
    author: 'Moisés Medeiros',
  });

  let yPos = 55;

  // Summary section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo Financeiro', 14, yPos);
  yPos += 10;

  const summaryData = [
    ['Receitas Totais', formatCurrency(data.income), '📈'],
    ['Gastos Pessoais Fixos', formatCurrency(data.personalFixed), '🏠'],
    ['Gastos Pessoais Extras', formatCurrency(data.personalExtra), '💳'],
    ['Gastos Empresa Fixos', formatCurrency(data.companyFixed), '🏢'],
    ['Gastos Empresa Extras', formatCurrency(data.companyExtra), '📦'],
    ['Lucro Líquido', formatCurrency(data.lucroLiquido), data.lucroLiquido >= 0 ? '✅' : '⚠️'],
  ];

  doc.autoTable({
    startY: yPos,
    head: [['Categoria', 'Valor', 'Status']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [125, 17, 40], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { fontSize: 11, cellPadding: 4 },
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // Category breakdown if available
  if (data.categoryData && data.categoryData.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Gastos por Categoria', 14, yPos);
    yPos += 10;

    const catData = data.categoryData.map(cat => [cat.name, formatCurrency(cat.value)]);

    doc.autoTable({
      startY: yPos,
      head: [['Categoria', 'Valor']],
      body: catData,
      theme: 'striped',
      headStyles: { fillColor: [125, 17, 40], textColor: 255 },
      styles: { fontSize: 10 },
    });
  }

  // Footer
  addFooter(doc);

  // Save
  doc.save(`relatorio-financeiro-${data.month}.pdf`);
};

// ========== EMPLOYEES REPORT ==========
export const generateEmployeesPDF = (employees: any[]): void => {
  const doc = createBasePDF({
    title: 'Relatório de Funcionários',
    subtitle: `Total: ${employees.length} funcionários`,
    author: 'Moisés Medeiros',
  });

  const tableData = employees.map(emp => [
    emp.nome,
    emp.funcao,
    emp.setor || '-',
    emp.status || 'Ativo',
    formatCurrency(emp.salario || 0),
    emp.email || '-',
  ]);

  doc.autoTable({
    startY: 55,
    head: [['Nome', 'Função', 'Setor', 'Status', 'Salário', 'Email']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [125, 17, 40], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 35 },
      4: { halign: 'right' },
    },
  });

  // Summary
  const totalSalarios = employees.reduce((acc, emp) => acc + (emp.salario || 0), 0);
  const yPos = doc.lastAutoTable.finalY + 10;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Folha de Pagamento: ${formatCurrency(totalSalarios)}`, 14, yPos);

  addFooter(doc);
  doc.save(`relatorio-funcionarios-${formatDate(new Date())}.pdf`);
};

// ========== TASKS REPORT ==========
export const generateTasksPDF = (tasks: any[]): void => {
  const doc = createBasePDF({
    title: 'Relatório de Tarefas',
    subtitle: `Total: ${tasks.length} tarefas`,
    author: 'Moisés Medeiros',
  });

  const statusMap: Record<string, string> = {
    todo: '📋 A Fazer',
    in_progress: '🔄 Em Progresso',
    review: '👁️ Revisão',
    done: '✅ Concluído',
  };

  const priorityMap: Record<string, string> = {
    low: '🟢 Baixa',
    medium: '🟡 Média',
    high: '🟠 Alta',
    urgent: '🔴 Urgente',
  };

  const tableData = tasks.map(task => [
    task.title,
    statusMap[task.status] || task.status,
    priorityMap[task.priority] || task.priority,
    formatDate(task.due_date),
    task.assigned_to || '-',
  ]);

  doc.autoTable({
    startY: 55,
    head: [['Tarefa', 'Status', 'Prioridade', 'Prazo', 'Responsável']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [125, 17, 40], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 50 },
    },
  });

  // Stats
  const done = tasks.filter(t => t.status === 'done').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const todo = tasks.filter(t => t.status === 'todo').length;
  
  const yPos = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Estatísticas:', 14, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`✅ Concluídas: ${done}  |  🔄 Em Progresso: ${inProgress}  |  📋 A Fazer: ${todo}`, 14, yPos + 7);

  addFooter(doc);
  doc.save(`relatorio-tarefas-${formatDate(new Date())}.pdf`);
};

// ========== TIME TRACKING REPORT ==========
export const generateTimeTrackingPDF = (records: any[]): void => {
  const doc = createBasePDF({
    title: 'Relatório de Ponto',
    subtitle: `Total: ${records.length} registros`,
    author: 'Moisés Medeiros',
  });

  const tableData = records.map(record => {
    const clockIn = new Date(record.clock_in);
    const clockOut = record.clock_out ? new Date(record.clock_out) : null;
    const duration = clockOut 
      ? Math.round((clockOut.getTime() - clockIn.getTime()) / 1000 / 60 / 60 * 100) / 100
      : '-';
    
    return [
      formatDate(record.clock_in),
      clockIn.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      clockOut ? clockOut.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-',
      typeof duration === 'number' ? `${duration}h` : duration,
      record.notes || '-',
    ];
  });

  doc.autoTable({
    startY: 55,
    head: [['Data', 'Entrada', 'Saída', 'Duração', 'Observações']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [125, 17, 40], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { fontSize: 10, cellPadding: 3 },
  });

  // Total hours
  const totalHours = records.reduce((acc, record) => {
    if (record.clock_in && record.clock_out) {
      const duration = (new Date(record.clock_out).getTime() - new Date(record.clock_in).getTime()) / 1000 / 60 / 60;
      return acc + duration;
    }
    return acc;
  }, 0);

  const yPos = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total de Horas: ${Math.round(totalHours * 100) / 100}h`, 14, yPos);

  addFooter(doc);
  doc.save(`relatorio-ponto-${formatDate(new Date())}.pdf`);
};

// ========== LABORATORY REPORT ==========
export const generateLabReportPDF = (data: {
  reagents: any[];
  equipment: any[];
}): void => {
  const doc = createBasePDF({
    title: 'Relatório do Laboratório',
    subtitle: `Reagentes: ${data.reagents.length} | Equipamentos: ${data.equipment.length}`,
    author: 'Moisés Medeiros',
  });

  let yPos = 55;

  // Reagents section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Reagentes', 14, yPos);
  yPos += 10;

  const reagentData = data.reagents.map(r => [
    r.name,
    r.formula || '-',
    `${r.quantity || 0} ${r.unit || ''}`,
    formatDate(r.expiry_date),
    r.is_hazardous ? '⚠️ Sim' : 'Não',
    r.location || '-',
  ]);

  doc.autoTable({
    startY: yPos,
    head: [['Nome', 'Fórmula', 'Qtd', 'Validade', 'Perigoso', 'Local']],
    body: reagentData,
    theme: 'grid',
    headStyles: { fillColor: [125, 17, 40], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2 },
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // Equipment section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Equipamentos', 14, yPos);
  yPos += 10;

  const equipmentData = data.equipment.map(e => [
    e.name,
    e.model || '-',
    e.status || 'Disponível',
    formatDate(e.last_maintenance),
    formatDate(e.next_maintenance),
    e.location || '-',
  ]);

  doc.autoTable({
    startY: yPos,
    head: [['Nome', 'Modelo', 'Status', 'Última Manut.', 'Próx. Manut.', 'Local']],
    body: equipmentData,
    theme: 'grid',
    headStyles: { fillColor: [125, 17, 40], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2 },
  });

  addFooter(doc);
  doc.save(`relatorio-laboratorio-${formatDate(new Date())}.pdf`);
};

// ========== COMPREHENSIVE REPORT ==========
export const generateComprehensiveReportPDF = (data: {
  financial: any;
  employees: any[];
  tasks: any[];
  month: string;
}): void => {
  const doc = createBasePDF({
    title: 'Relatório Executivo Completo',
    subtitle: `Referência: ${data.month}`,
    author: 'Moisés Medeiros',
  });

  let yPos = 55;

  // Executive Summary
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(125, 17, 40);
  doc.text('📊 Resumo Executivo', 14, yPos);
  doc.setTextColor(0, 0, 0);
  yPos += 10;

  const summaryData = [
    ['Receita Total', formatCurrency(data.financial.income)],
    ['Despesas Totais', formatCurrency(data.financial.personalExpenses + data.financial.companyExpenses)],
    ['Lucro Líquido', formatCurrency(data.financial.lucroLiquido)],
    ['Total Funcionários', `${data.employees.length}`],
    ['Folha de Pagamento', formatCurrency(data.employees.reduce((a: number, e: any) => a + (e.salario || 0), 0))],
    ['Tarefas Concluídas', `${data.tasks.filter((t: any) => t.status === 'done').length}/${data.tasks.length}`],
  ];

  doc.autoTable({
    startY: yPos,
    head: [['Indicador', 'Valor']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [125, 17, 40], textColor: 255 },
    styles: { fontSize: 11, cellPadding: 4 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // Financial breakdown
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('💰 Detalhamento Financeiro', 14, yPos);
  yPos += 8;

  const finData = [
    ['Gastos Pessoais Fixos', formatCurrency(data.financial.personalFixed)],
    ['Gastos Pessoais Extras', formatCurrency(data.financial.personalExtra)],
    ['Gastos Empresa Fixos', formatCurrency(data.financial.companyFixed)],
    ['Gastos Empresa Extras', formatCurrency(data.financial.companyExtra)],
  ];

  doc.autoTable({
    startY: yPos,
    body: finData,
    theme: 'striped',
    styles: { fontSize: 10 },
  });

  addFooter(doc);
  doc.save(`relatorio-executivo-${data.month}.pdf`);
};

// Add footer to all pages
const addFooter = (doc: jsPDF): void => {
  const pageCount = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Moisés Medeiros - Sistema de Gestão | Página ${i} de ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
};
