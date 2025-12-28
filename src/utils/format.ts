/**
 * ============================================
 * UTILITÁRIOS DE FORMATAÇÃO CENTRALIZADOS
 * ============================================
 * 
 * CONSTITUIÇÃO SYNAPSE Ω v10.x
 * 
 * Este arquivo centraliza TODAS as funções de formatação
 * para evitar duplicação de código (~51 arquivos afetados).
 * 
 * REGRAS:
 * - NUNCA declare formatCurrency/formatDate localmente
 * - SEMPRE importe deste arquivo
 * - Variantes (compact, masked) também estão aqui
 * 
 * @module utils/format
 */

// ============================================
// FORMATAÇÃO DE MOEDA (CURRENCY)
// ============================================

/**
 * Formata valor em centavos para moeda brasileira (R$)
 * 
 * @param cents - Valor em CENTAVOS (ex: 10000 = R$ 100,00)
 * @returns String formatada (ex: "R$ 100,00")
 * 
 * @example
 * formatCurrency(10000) // "R$ 100,00"
 * formatCurrency(0) // "R$ 0,00"
 * formatCurrency(null) // "R$ 0,00"
 */
export function formatCurrency(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

/**
 * Formata valor em REAIS (não centavos) para moeda brasileira
 * 
 * @param value - Valor em REAIS (ex: 100 = R$ 100,00)
 * @returns String formatada (ex: "R$ 100,00")
 * 
 * @example
 * formatCurrencyFromReais(100) // "R$ 100,00"
 */
export function formatCurrencyFromReais(value: number | null | undefined): string {
  if (value === null || value === undefined) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Formata moeda de forma compacta (K, M) para mobile/dashboards
 * 
 * @param cents - Valor em CENTAVOS
 * @returns String compacta (ex: "R$ 1,5K", "R$ 2,3M")
 * 
 * @example
 * formatCurrencyCompact(150000) // "R$ 1,5K"
 * formatCurrencyCompact(2300000000) // "R$ 23M"
 */
export function formatCurrencyCompact(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "R$ 0";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(cents / 100);
}

/**
 * Formata moeda com máscara de segurança (para dados sensíveis)
 * 
 * @param cents - Valor em CENTAVOS (null retorna máscara)
 * @returns String formatada ou "••••••" se null
 * 
 * @example
 * formatCurrencyMasked(null) // "••••••"
 * formatCurrencyMasked(10000) // "R$ 100,00"
 */
export function formatCurrencyMasked(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "••••••";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

/**
 * Formata moeda com abreviação manual (K, M) - para métricas rápidas
 * 
 * @param value - Valor em REAIS (não centavos)
 * @returns String abreviada (ex: "R$ 1.5K", "R$ 2.3M")
 */
export function formatCurrencyShort(value: number | null | undefined): string {
  if (value === null || value === undefined) return "R$ 0";
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}K`;
  return `R$ ${value.toFixed(0)}`;
}

// ============================================
// FORMATAÇÃO DE PORCENTAGEM
// ============================================

/**
 * Formata valor como porcentagem
 * 
 * @param value - Valor decimal (ex: 0.15 = 15%)
 * @param decimals - Casas decimais (default: 1)
 * @returns String formatada (ex: "15,0%")
 * 
 * @example
 * formatPercent(0.156) // "15,6%"
 * formatPercent(0.5, 0) // "50%"
 */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return "0%";
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formata porcentagem a partir de valor já em formato percentual
 * 
 * @param value - Valor já em porcentagem (ex: 15 = 15%)
 * @param decimals - Casas decimais (default: 1)
 * @returns String formatada (ex: "15,0%")
 */
export function formatPercentFromValue(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return "0%";
  return `${value.toFixed(decimals).replace(".", ",")}%`;
}

// ============================================
// FORMATAÇÃO DE DATA E HORA
// ============================================

/**
 * Formata data no padrão brasileiro (DD/MM/YYYY)
 * 
 * @param dateString - Data em formato ISO ou Date
 * @returns String formatada (ex: "25/12/2025")
 * 
 * @example
 * formatDate("2025-12-25") // "25/12/2025"
 * formatDate(new Date()) // "28/12/2025"
 */
export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return "-";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
}

/**
 * Formata data e hora no padrão brasileiro
 * 
 * @param dateString - Data em formato ISO ou Date
 * @returns String formatada (ex: "25/12/2025 14:30")
 */
export function formatDateTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return "-";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formata data de forma relativa (há X minutos, ontem, etc.)
 * 
 * @param dateString - Data em formato ISO ou Date
 * @returns String relativa (ex: "há 5 minutos", "ontem", "há 3 dias")
 */
export function formatRelativeTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return "-";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return "-";
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMinutes < 1) return "agora";
  if (diffMinutes < 60) return `há ${diffMinutes} min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays === 1) return "ontem";
  if (diffDays < 7) return `há ${diffDays} dias`;
  return formatDate(date);
}

/**
 * Formata apenas a hora
 * 
 * @param dateString - Data em formato ISO ou Date
 * @returns String formatada (ex: "14:30")
 */
export function formatTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return "-";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================
// FORMATAÇÃO DE NÚMEROS
// ============================================

/**
 * Formata número com separadores de milhar brasileiros
 * 
 * @param value - Número a formatar
 * @returns String formatada (ex: "1.234.567")
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "0";
  return new Intl.NumberFormat("pt-BR").format(value);
}

/**
 * Formata número de forma compacta (K, M)
 * 
 * @param value - Número a formatar
 * @returns String compacta (ex: "1,2K", "3,4M")
 */
export function formatNumberCompact(value: number | null | undefined): string {
  if (value === null || value === undefined) return "0";
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

// ============================================
// FORMATAÇÃO DE CPF/CNPJ/TELEFONE
// ============================================

/**
 * Formata CPF (###.###.###-##)
 * 
 * @param cpf - CPF sem formatação
 * @returns String formatada ou máscara
 */
export function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return "***.***.***-**";
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

/**
 * Formata CPF com máscara de segurança (***XXX***-**)
 * 
 * @param cpf - CPF sem formatação
 * @returns String mascarada (mostra apenas 3 dígitos centrais)
 */
export function formatCPFMasked(cpf: string | null | undefined): string {
  if (!cpf) return "***.***.***-**";
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return "***.***.***-**";
  return `***.${cleaned.substring(3, 6)}.***-**`;
}

/**
 * Formata telefone brasileiro
 * 
 * @param phone - Telefone sem formatação
 * @returns String formatada ((##) #####-####)
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "-";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
}

// ============================================
// EXPORT DEFAULT (para compatibilidade)
// ============================================

export default {
  formatCurrency,
  formatCurrencyFromReais,
  formatCurrencyCompact,
  formatCurrencyMasked,
  formatCurrencyShort,
  formatPercent,
  formatPercentFromValue,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatTime,
  formatNumber,
  formatNumberCompact,
  formatCPF,
  formatCPFMasked,
  formatPhone,
};
