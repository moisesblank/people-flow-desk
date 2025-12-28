// ============================================
// SERVICE: financialService
// Centraliza agregações e cálculos financeiros
// Separado da UI para testabilidade e manutenção
// ============================================

import { supabase } from "@/integrations/supabase/client";

// ============================================
// TIPOS
// ============================================
export interface FinancialSummary {
  totalReceita: number;
  totalGastos: number;
  lucro: number;
  margem: number;
  alunosAtivos: number;
}

export interface MonthlyFinancialData {
  month: string;
  receita: number;
  despesas: number;
  lucro: number;
  alunos: number;
}

export interface VencimentoAlerta {
  id: number;
  nome: string;
  valor: number;
  dataVencimento: string;
  tipo: 'fixo' | 'extra';
}

// ============================================
// CONSTANTES
// ============================================
const MESES_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// ============================================
// FUNÇÕES DE AGREGAÇÃO
// ============================================

/**
 * Busca receitas do período especificado
 */
export async function fetchReceitas(startDate: Date, endDate?: Date) {
  const query = supabase
    .from("entradas")
    .select("valor, created_at")
    .gte("created_at", startDate.toISOString());
  
  if (endDate) {
    query.lte("created_at", endDate.toISOString());
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("[financialService] Erro ao buscar receitas:", error);
    return [];
  }
  
  return data || [];
}

/**
 * Calcula total de receitas a partir de array de entradas
 */
export function calcularTotalReceitas(entradas: { valor: number }[]): number {
  return entradas.reduce((acc, e) => acc + (e.valor || 0), 0);
}

/**
 * Busca gastos fixos e extras do mês/ano
 */
export async function fetchGastosMensais(mes: number, ano: number) {
  const [fixosRes, extrasRes] = await Promise.all([
    supabase.from("company_fixed_expenses").select("id, nome, valor, data_vencimento").eq("mes", mes).eq("ano", ano),
    supabase.from("company_extra_expenses").select("id, nome, valor, data_vencimento").eq("mes", mes).eq("ano", ano),
  ]);
  
  return {
    fixos: fixosRes.data || [],
    extras: extrasRes.data || [],
  };
}

/**
 * Calcula total de gastos a partir de fixos e extras
 */
export function calcularTotalGastos(
  fixos: { valor: number }[], 
  extras: { valor: number }[]
): number {
  const totalFixos = fixos.reduce((acc, g) => acc + (g.valor || 0), 0);
  const totalExtras = extras.reduce((acc, g) => acc + (g.valor || 0), 0);
  return totalFixos + totalExtras;
}

/**
 * Calcula lucro e margem
 */
export function calcularLucroMargem(receita: number, gastos: number): { lucro: number; margem: number } {
  const lucro = receita - gastos;
  const margem = receita > 0 ? (lucro / receita) * 100 : 0;
  return { lucro, margem };
}

/**
 * Busca resumo financeiro completo do mês atual
 */
export async function fetchResumoFinanceiroMensal(): Promise<FinancialSummary> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const mesAtual = new Date().getMonth() + 1;
  const anoAtual = new Date().getFullYear();
  
  // Buscar receitas
  const entradas = await fetchReceitas(startOfMonth);
  const totalReceita = calcularTotalReceitas(entradas);
  
  // Buscar gastos
  const { fixos, extras } = await fetchGastosMensais(mesAtual, anoAtual);
  const totalGastos = calcularTotalGastos(fixos, extras);
  
  // Calcular lucro e margem
  const { lucro, margem } = calcularLucroMargem(totalReceita, totalGastos);
  
  // Buscar alunos ativos
  const { count: alunosAtivos } = await supabase
    .from("alunos")
    .select("*", { count: "exact", head: true })
    .eq("status", "ativo");
  
  return {
    totalReceita,
    totalGastos,
    lucro,
    margem,
    alunosAtivos: alunosAtivos || 0,
  };
}

/**
 * Busca dados mensais para gráficos de evolução
 */
export async function fetchDadosMensaisEvolucao(ano: number): Promise<MonthlyFinancialData[]> {
  const mesAtual = new Date().getMonth() + 1;
  
  // Buscar fechamentos mensais
  const { data: fechamentos } = await supabase
    .from("company_monthly_closures")
    .select("*")
    .eq("ano", ano)
    .order("mes", { ascending: true });
  
  // Buscar dados do mês atual para completar
  const resumoAtual = await fetchResumoFinanceiroMensal();
  
  return MESES_PT.map((month, index) => {
    const mesNumero = index + 1;
    const fechamento = (fechamentos || []).find(f => f.mes === mesNumero);
    
    if (fechamento) {
      return {
        month,
        receita: Number(fechamento.total_receitas || 0) / 100,
        despesas: (Number(fechamento.total_gastos_fixos || 0) + Number(fechamento.total_gastos_extras || 0)) / 100,
        lucro: Number(fechamento.saldo_periodo || 0) / 100,
        alunos: 0,
      };
    }
    
    // Mês atual
    if (mesNumero === mesAtual) {
      return {
        month,
        receita: resumoAtual.totalReceita / 100,
        despesas: resumoAtual.totalGastos / 100,
        lucro: resumoAtual.lucro / 100,
        alunos: resumoAtual.alunosAtivos,
      };
    }
    
    return { month, receita: 0, despesas: 0, lucro: 0, alunos: 0 };
  }).filter(m => m.receita > 0 || m.despesas > 0);
}

/**
 * Busca alertas de vencimentos
 */
export async function fetchAlertasVencimento(
  dias: number = 7
): Promise<{ proximosVencimentos: VencimentoAlerta[]; vencendoHoje: VencimentoAlerta[] }> {
  const hoje = new Date();
  const limite = new Date();
  limite.setDate(limite.getDate() + dias);
  
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();
  
  const { fixos, extras } = await fetchGastosMensais(mesAtual, anoAtual);
  
  const processarGastos = (gastos: any[], tipo: 'fixo' | 'extra'): VencimentoAlerta[] => {
    return gastos
      .filter(g => {
        if (!g.data_vencimento) return false;
        const dataVenc = new Date(g.data_vencimento);
        return dataVenc >= hoje && dataVenc <= limite;
      })
      .map(g => ({
        id: g.id,
        nome: g.nome,
        valor: g.valor,
        dataVencimento: g.data_vencimento,
        tipo,
      }));
  };
  
  const proximosVencimentos = [
    ...processarGastos(fixos, 'fixo'),
    ...processarGastos(extras, 'extra'),
  ];
  
  const hojeStr = hoje.toISOString().slice(0, 10);
  const vencendoHoje = proximosVencimentos.filter(
    v => v.dataVencimento.slice(0, 10) === hojeStr
  );
  
  return { proximosVencimentos, vencendoHoje };
}

// ============================================
// IDEMPOTÊNCIA DE CHAMADAS
// ============================================

/**
 * Verifica se uma operação já foi executada na sessão atual
 * Substitui lógica que estava no frontend (FinancasEmpresa.tsx)
 */
export function checkSessionLock(operationKey: string): boolean {
  const lockKey = `${operationKey}_${new Date().toISOString().slice(0, 10)}`;
  return sessionStorage.getItem(lockKey) === 'true';
}

/**
 * Define lock de sessão para operação
 */
export function setSessionLock(operationKey: string): void {
  const lockKey = `${operationKey}_${new Date().toISOString().slice(0, 10)}`;
  sessionStorage.setItem(lockKey, 'true');
}

/**
 * Executa verificação de vencimentos com idempotência
 */
export async function executarVerificacaoVencimentos(): Promise<{ success: boolean; message: string }> {
  const OPERATION_KEY = 'check_vencimentos_invoked';
  
  if (checkSessionLock(OPERATION_KEY)) {
    console.log('[financialService] Verificação de vencimentos já executada nesta sessão');
    return { success: true, message: 'already_executed' };
  }
  
  try {
    setSessionLock(OPERATION_KEY);
    const response = await supabase.functions.invoke('check-vencimentos');
    
    if (response.data?.success) {
      console.log('[financialService] Edge function executada:', response.data);
      return { success: true, message: 'executed' };
    } else if (response.data?.skipped) {
      console.log('[financialService] Nenhum item novo a notificar:', response.data.reason);
      return { success: true, message: 'skipped' };
    }
    
    return { success: false, message: 'unknown_response' };
  } catch (error) {
    console.error('[financialService] Erro ao verificar vencimentos:', error);
    return { success: false, message: String(error) };
  }
}
