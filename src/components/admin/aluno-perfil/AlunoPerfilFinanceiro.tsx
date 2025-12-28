// ============================================
// SEÇÃO: CENTRO FINANCEIRO COMPLETO
// ============================================

import { DollarSign, CreditCard, TrendingUp, AlertTriangle, CheckCircle, XCircle, RefreshCw, Users } from "lucide-react";
import { FuturisticCard } from "@/components/ui/futuristic-card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AlunoFinanceiroProps {
  alunoId: string;
  alunoEmail: string;
  valorPago?: number | null;
  hotmartTransactionId?: string | null;
}

export function AlunoPerfilFinanceiro({ alunoId, alunoEmail, valorPago, hotmartTransactionId }: AlunoFinanceiroProps) {
  // Buscar transações Hotmart
  const { data: transacoes } = useQuery({
    queryKey: ['aluno-transacoes-hotmart', alunoEmail],
    queryFn: async () => {
      const { data } = await supabase
        .from('transacoes_hotmart_completo')
        .select('*')
        .eq('buyer_email', alunoEmail)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!alunoEmail
  });

  // Buscar comissões geradas (se foi indicado por afiliado)
  const { data: comissoes } = useQuery({
    queryKey: ['aluno-comissoes', alunoId],
    queryFn: async () => {
      const { data } = await supabase
        .from('comissoes')
        .select('*, affiliates(nome)')
        .eq('aluno_id', alunoId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!alunoId
  });

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    try {
      return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return '-';
    }
  };

  // Calcular totais - usando valor_bruto que existe na tabela
  const totalPago = transacoes?.reduce((acc, t) => {
    if (t.status === 'approved' || t.status === 'APPROVED') {
      return acc + (t.valor_bruto || 0);
    }
    return acc;
  }, 0) || valorPago || 0;

  const totalComissoes = comissoes?.reduce((acc, c) => acc + (c.valor || 0), 0) || 0;
  const transacoesAprovadas = transacoes?.filter(t => t.status === 'approved' || t.status === 'APPROVED').length || 0;
  const transacoesPendentes = transacoes?.filter(t => t.status === 'pending' || t.status === 'PENDING').length || 0;
  const chargebacks = transacoes?.filter(t => t.status === 'chargeback' || t.status === 'CHARGEBACK').length || 0;
  const reembolsos = transacoes?.filter(t => t.status === 'refunded' || t.status === 'REFUNDED').length || 0;

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'approved') return <Badge className="bg-emerald-500/20 text-emerald-400">Aprovado</Badge>;
    if (s === 'pending') return <Badge className="bg-yellow-500/20 text-yellow-400">Pendente</Badge>;
    if (s === 'refunded') return <Badge className="bg-orange-500/20 text-orange-400">Reembolsado</Badge>;
    if (s === 'chargeback') return <Badge className="bg-red-500/20 text-red-400">Chargeback</Badge>;
    if (s === 'cancelled') return <Badge className="bg-gray-500/20 text-gray-400">Cancelado</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <FuturisticCard className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <DollarSign className="h-5 w-5 text-green-400" />
        <h3 className="text-lg font-semibold text-foreground">Centro Financeiro</h3>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-green-600/10 border border-emerald-500/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-muted-foreground">Lifetime Value</span>
          </div>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(totalPago)}</p>
        </div>

        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className="text-xs text-muted-foreground">Aprovadas</span>
          </div>
          <p className="text-xl font-bold text-foreground">{transacoesAprovadas}</p>
        </div>

        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="h-4 w-4 text-yellow-400" />
            <span className="text-xs text-muted-foreground">Pendentes</span>
          </div>
          <p className="text-xl font-bold text-foreground">{transacoesPendentes}</p>
        </div>

        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-4 w-4 text-orange-400" />
            <span className="text-xs text-muted-foreground">Reembolsos</span>
          </div>
          <p className="text-xl font-bold text-foreground">{reembolsos}</p>
        </div>

        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-xs text-muted-foreground">Chargebacks</span>
          </div>
          <p className="text-xl font-bold text-foreground">{chargebacks}</p>
        </div>

        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-muted-foreground">Comissões Geradas</span>
          </div>
          <p className="text-xl font-bold text-foreground">{formatCurrency(totalComissoes)}</p>
        </div>
      </div>

      {/* Transaction ID Original */}
      {hotmartTransactionId && (
        <div className="mb-6 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <span className="text-xs text-muted-foreground">Transaction ID Original (Cadastro): </span>
          <span className="text-sm font-mono text-blue-400">{hotmartTransactionId}</span>
        </div>
      )}

      {/* Timeline de Transações */}
      <div className="border-t border-border/50 pt-6">
        <h4 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-blue-400" />
          Histórico de Transações Hotmart
        </h4>
        
        {transacoes && transacoes.length > 0 ? (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {transacoes.map((t) => (
              <div key={t.id} className="p-3 rounded-lg bg-muted/20 border border-border/30 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{t.product_name || 'Produto'}</span>
                    {getStatusBadge(t.status)}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>📅 {formatDate(t.data_compra || t.created_at)}</span>
                    {t.metodo_pagamento && <span>💳 {t.metodo_pagamento}</span>}
                    {t.transaction_id && <span className="font-mono">#{t.transaction_id.slice(-8)}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">{formatCurrency(t.valor_bruto)}</p>
                  {t.valor_liquido && t.valor_liquido !== t.valor_bruto && (
                    <p className="text-xs text-muted-foreground">Líquido: {formatCurrency(t.valor_liquido)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma transação Hotmart encontrada</p>
          </div>
        )}
      </div>

      {/* Comissões de Afiliados */}
      {comissoes && comissoes.length > 0 && (
        <div className="border-t border-border/50 pt-6 mt-6">
          <h4 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-400" />
            Comissões de Afiliados Vinculadas
          </h4>
          <div className="space-y-2">
            {comissoes.map((c) => (
              <div key={c.id} className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-foreground">
                    {(c.affiliates as any)?.nome || 'Afiliado'}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {formatDate(c.created_at)}
                  </span>
                </div>
                <Badge className={c.status === 'pago' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                  {formatCurrency(c.valor)} - {c.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </FuturisticCard>
  );
}
