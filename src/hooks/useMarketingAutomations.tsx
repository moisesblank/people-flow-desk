// ============================================
// MARKETING AUTOMATIONS - Hook Tempo Real
// Sistema de automações, alertas e métricas
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ============================================
// INTERFACES
// ============================================

export interface MarketingLead {
  id: string;
  email: string;
  nome: string | null;
  telefone: string | null;
  origem: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  canal: string | null;
  campanha_id: string | null;
  status: string;
  score: number;
  convertido: boolean;
  data_conversao: string | null;
  valor_conversao: number;
  created_at: string;
  updated_at: string;
}

export interface MarketingAlert {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  severidade: string;
  dados: Record<string, unknown>;
  lido: boolean;
  resolvido: boolean;
  created_at: string;
}

export interface MarketingMetrics {
  totalLeads: number;
  leadsHoje: number;
  leadsSemana: number;
  leadsMes: number;
  conversoes: number;
  taxaConversao: number;
  cac: number;
  ltv: number;
  roas: number;
  roi: number;
  ticketMedio: number;
  leadsPorCanal: Record<string, number>;
  receitaTotal: number;
  investimentoTotal: number;
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useMarketingAutomations() {
  const queryClient = useQueryClient();
  const [leads, setLeads] = useState<MarketingLead[]>([]);
  const [alerts, setAlerts] = useState<MarketingAlert[]>([]);
  const [metrics, setMetrics] = useState<MarketingMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // ============================================
  // FETCH LEADS
  // ============================================
  const fetchLeads = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('marketing_leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setLeads((data || []) as MarketingLead[]);
    } catch (error) {
      console.error('[Marketing] Erro ao buscar leads:', error);
    }
  }, []);

  // ============================================
  // FETCH ALERTS
  // ============================================
  const fetchAlerts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('marketing_alerts')
        .select('*')
        .eq('resolvido', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAlerts((data || []) as MarketingAlert[]);
    } catch (error) {
      console.error('[Marketing] Erro ao buscar alertas:', error);
    }
  }, []);

  // ============================================
  // CALCULAR MÉTRICAS
  // ============================================
  const calculateMetrics = useCallback(async () => {
    try {
      const hoje = new Date();
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - 7);
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

      // Buscar campanhas
      const { data: campanhas } = await supabase
        .from('marketing_campaigns')
        .select('*');

      // Buscar entradas do mês
      const { data: entradas } = await supabase
        .from('entradas')
        .select('valor')
        .gte('created_at', inicioMes.toISOString());

      // Buscar alunos do mês
      const { data: alunos } = await supabase
        .from('alunos')
        .select('valor_pago, created_at')
        .gte('created_at', inicioMes.toISOString());

      // Calcular métricas
      const totalBudget = campanhas?.reduce((sum, c) => sum + Number(c.budget || 0), 0) || 0;
      const totalSpent = campanhas?.reduce((sum, c) => sum + Number(c.spent || 0), 0) || 0;
      const totalLeads = campanhas?.reduce((sum, c) => sum + Number(c.leads || 0), 0) || 0;
      const totalConversions = campanhas?.reduce((sum, c) => sum + Number(c.conversions || 0), 0) || 0;
      const receitaTotal = entradas?.reduce((sum, e) => sum + Number(e.valor || 0), 0) || 0;
      
      const leadsHoje = leads.filter(l => 
        new Date(l.created_at).toDateString() === hoje.toDateString()
      ).length;
      
      const leadsSemana = leads.filter(l => 
        new Date(l.created_at) >= inicioSemana
      ).length;
      
      const leadsMes = leads.filter(l => 
        new Date(l.created_at) >= inicioMes
      ).length;

      const conversoes = leads.filter(l => l.convertido).length;
      const taxaConversao = totalLeads > 0 ? (conversoes / totalLeads) * 100 : 0;
      
      // CAC = Investimento / Novos Clientes
      const cac = totalConversions > 0 ? totalSpent / totalConversions : 0;
      
      // LTV = Ticket Médio * Frequência de Compra (estimado)
      const ticketMedio = alunos && alunos.length > 0 
        ? alunos.reduce((sum, a) => sum + Number(a.valor_pago || 0), 0) / alunos.length 
        : 0;
      const ltv = ticketMedio * 1.5; // Estimativa conservadora
      
      // ROAS = Receita / Gasto com Ads
      const roas = totalSpent > 0 ? receitaTotal / totalSpent : 0;
      
      // ROI = (Receita - Custo) / Custo * 100
      const roi = totalSpent > 0 ? ((receitaTotal - totalSpent) / totalSpent) * 100 : 0;

      // Leads por canal
      const leadsPorCanal: Record<string, number> = {};
      leads.forEach(lead => {
        const canal = lead.canal || lead.origem || 'Direto';
        leadsPorCanal[canal] = (leadsPorCanal[canal] || 0) + 1;
      });

      setMetrics({
        totalLeads: leads.length,
        leadsHoje,
        leadsSemana,
        leadsMes,
        conversoes,
        taxaConversao,
        cac,
        ltv,
        roas,
        roi,
        ticketMedio,
        leadsPorCanal,
        receitaTotal,
        investimentoTotal: totalSpent
      });

      setLastUpdate(new Date());
    } catch (error) {
      console.error('[Marketing] Erro ao calcular métricas:', error);
    }
  }, [leads]);

  // ============================================
  // CRIAR LEAD
  // ============================================
  const createLead = async (lead: Partial<MarketingLead>) => {
    try {
      const { data, error } = await supabase
        .from('marketing_leads')
        .insert([{
          email: lead.email,
          nome: lead.nome,
          telefone: lead.telefone,
          origem: lead.origem || 'website',
          utm_source: lead.utm_source,
          utm_medium: lead.utm_medium,
          utm_campaign: lead.utm_campaign,
          canal: lead.canal,
          status: 'novo',
          score: 0
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Lead cadastrado!', {
        description: `${lead.nome || lead.email} adicionado ao CRM`
      });

      // Criar alerta para Owner
      await createAlert({
        tipo: 'novo_lead',
        titulo: '🎯 Novo Lead Captado',
        mensagem: `${lead.nome || 'Novo lead'} (${lead.email}) via ${lead.origem || 'website'}`,
        severidade: 'info',
        dados: { lead_id: data?.id, origem: lead.origem }
      });

      fetchLeads();
      return data;
    } catch (error) {
      console.error('[Marketing] Erro ao criar lead:', error);
      toast.error('Erro ao criar lead');
      return null;
    }
  };

  // ============================================
  // CONVERTER LEAD
  // ============================================
  const convertLead = async (leadId: string, valorConversao: number) => {
    try {
      const { error } = await supabase
        .from('marketing_leads')
        .update({
          convertido: true,
          data_conversao: new Date().toISOString(),
          valor_conversao: valorConversao,
          status: 'convertido'
        })
        .eq('id', leadId);

      if (error) throw error;

      toast.success('Lead convertido!', {
        description: `Conversão de R$ ${valorConversao.toLocaleString('pt-BR')}`
      });

      fetchLeads();
      calculateMetrics();
    } catch (error) {
      console.error('[Marketing] Erro ao converter lead:', error);
      toast.error('Erro ao converter lead');
    }
  };

  // ============================================
  // CRIAR ALERTA
  // ============================================
  const createAlert = async (alert: Partial<MarketingAlert>) => {
    try {
      const { error } = await supabase
        .from('marketing_alerts')
        .insert([{
          tipo: alert.tipo || 'info',
          titulo: alert.titulo || 'Alerta',
          mensagem: alert.mensagem || '',
          severidade: alert.severidade || 'info',
          dados: JSON.parse(JSON.stringify(alert.dados || {}))
        }]);

      if (error) throw error;
      fetchAlerts();
    } catch (error) {
      console.error('[Marketing] Erro ao criar alerta:', error);
    }
  };

  // ============================================
  // MARCAR ALERTA COMO LIDO
  // ============================================
  const markAlertRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('marketing_alerts')
        .update({ lido: true })
        .eq('id', alertId);

      if (error) throw error;
      fetchAlerts();
    } catch (error) {
      console.error('[Marketing] Erro ao marcar alerta:', error);
    }
  };

  // ============================================
  // RESOLVER ALERTA
  // ============================================
  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('marketing_alerts')
        .update({ resolvido: true })
        .eq('id', alertId);

      if (error) throw error;
      toast.success('Alerta resolvido');
      fetchAlerts();
    } catch (error) {
      console.error('[Marketing] Erro ao resolver alerta:', error);
    }
  };

  // ============================================
  // VERIFICAR ALERTAS AUTOMÁTICOS
  // ============================================
  const checkAutomaticAlerts = useCallback(async () => {
    if (!metrics) return;

    // Alerta: CAC muito alto
    if (metrics.cac > 500) {
      await createAlert({
        tipo: 'cac_alto',
        titulo: '⚠️ CAC Elevado',
        mensagem: `CAC atual R$ ${metrics.cac.toFixed(2)} está acima do limite recomendado (R$ 500)`,
        severidade: 'warning',
        dados: { cac: metrics.cac }
      });
    }

    // Alerta: ROI baixo
    if (metrics.roi < 100 && metrics.investimentoTotal > 0) {
      await createAlert({
        tipo: 'roi_baixo',
        titulo: '📉 ROI Abaixo do Esperado',
        mensagem: `ROI atual ${metrics.roi.toFixed(1)}% está abaixo de 100%`,
        severidade: 'warning',
        dados: { roi: metrics.roi }
      });
    }

    // Alerta: Leads sem conversão há muito tempo
    const leadsSemConversao = leads.filter(l => {
      if (l.convertido) return false;
      const diasSemConversao = Math.floor(
        (Date.now() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      return diasSemConversao > 30;
    });

    if (leadsSemConversao.length > 10) {
      await createAlert({
        tipo: 'leads_frios',
        titulo: '❄️ Leads Esfriando',
        mensagem: `${leadsSemConversao.length} leads sem conversão há mais de 30 dias`,
        severidade: 'info',
        dados: { count: leadsSemConversao.length }
      });
    }
  }, [metrics, leads]);

  // ============================================
  // SYNC EXTERNO (APIs)
  // ============================================
  const syncExternalData = async () => {
    try {
      toast.info('Sincronizando dados externos...');

      // Sync paralelo de todas as APIs
      const [instagram, youtube, facebook, ga] = await Promise.allSettled([
        supabase.functions.invoke('instagram-sync'),
        supabase.functions.invoke('youtube-sync'),
        supabase.functions.invoke('facebook-ads-sync'),
        supabase.functions.invoke('google-analytics-sync', { body: {} })
      ]);

      const successCount = [instagram, youtube, facebook, ga]
        .filter(r => r.status === 'fulfilled').length;

      toast.success(`Sincronização completa`, {
        description: `${successCount}/4 integrações atualizadas`
      });

      queryClient.invalidateQueries({ queryKey: ['social-media-stats'] });
      queryClient.invalidateQueries({ queryKey: ['integrated-metrics'] });
    } catch (error) {
      console.error('[Marketing] Erro ao sincronizar:', error);
      toast.error('Erro na sincronização');
    }
  };

  // ============================================
  // REALTIME SUBSCRIPTIONS
  // ============================================
  useEffect(() => {
    // Channel para leads
    const leadsChannel = supabase
      .channel('marketing-leads-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'marketing_leads'
      }, (payload) => {
        console.log('[Marketing] Lead update:', payload.eventType);
        fetchLeads();
        calculateMetrics();

        if (payload.eventType === 'INSERT') {
          const newLead = payload.new as MarketingLead;
          toast.success('🎯 Novo Lead!', {
            description: `${newLead.nome || newLead.email} via ${newLead.origem}`
          });
        }
      })
      .subscribe();

    // Channel para alertas
    const alertsChannel = supabase
      .channel('marketing-alerts-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'marketing_alerts'
      }, (payload) => {
        console.log('[Marketing] Novo alerta:', payload.new);
        fetchAlerts();
        
        const alert = payload.new as MarketingAlert;
        if (alert.severidade === 'error') {
          toast.error(alert.titulo, { description: alert.mensagem });
        } else if (alert.severidade === 'warning') {
          toast.warning(alert.titulo, { description: alert.mensagem });
        }
      })
      .subscribe();

    // Channel para campanhas
    const campaignsChannel = supabase
      .channel('marketing-campaigns-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'marketing_campaigns'
      }, () => {
        console.log('[Marketing] Campanha atualizada');
        calculateMetrics();
        queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(alertsChannel);
      supabase.removeChannel(campaignsChannel);
    };
  }, [fetchLeads, fetchAlerts, calculateMetrics, queryClient]);

  // ============================================
  // INIT
  // ============================================
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchLeads(), fetchAlerts()]);
      setIsLoading(false);
    };
    init();
  }, [fetchLeads, fetchAlerts]);

  useEffect(() => {
    if (leads.length > 0) {
      calculateMetrics();
    }
  }, [leads, calculateMetrics]);

  // ============================================
  // RETURN
  // ============================================
  return {
    // Data
    leads,
    alerts,
    metrics,
    isLoading,
    lastUpdate,

    // Actions
    createLead,
    convertLead,
    createAlert,
    markAlertRead,
    resolveAlert,
    syncExternalData,
    checkAutomaticAlerts,

    // Refetch
    refetch: () => Promise.all([fetchLeads(), fetchAlerts(), calculateMetrics()]),

    // Computed
    alertsNaoLidos: alerts.filter(a => !a.lido).length,
    leadsHoje: metrics?.leadsHoje || 0,
    taxaConversao: metrics?.taxaConversao || 0
  };
}

// ============================================
// HOOK PARA MÉTRICAS ESPECÍFICAS
// ============================================
export function useMarketingKPIs() {
  const { metrics, isLoading } = useMarketingAutomations();

  return {
    isLoading,
    cac: metrics?.cac || 0,
    ltv: metrics?.ltv || 0,
    roas: metrics?.roas || 0,
    roi: metrics?.roi || 0,
    taxaConversao: metrics?.taxaConversao || 0,
    ticketMedio: metrics?.ticketMedio || 0,
    ltvCacRatio: metrics?.cac && metrics?.cac > 0 ? (metrics.ltv / metrics.cac) : 0
  };
}
