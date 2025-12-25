import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Campaign {
  id: string;
  name: string;
  status: string;
  budget: number;
  spent: number;
  leads: number;
  conversions: number;
  platform?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface FunnelStage {
  stage: string;
  value: number;
  period: string;
}

export function useMarketingCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('id, name, platform, status, budget, spent, leads, conversions, start_date, end_date, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const fetchFunnelData = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_funnel_data')
        .select('id, stage, value, period, reference_date, created_at')
        .eq('period', 'monthly')
        .order('value', { ascending: false })
        .limit(50);

      if (error) throw error;
      setFunnelData(data || []);
    } catch (error) {
      console.error('Error fetching funnel data:', error);
    }
  };

  const addCampaign = async (campaign: Omit<Campaign, 'id'>) => {
    try {
      const { error } = await supabase
        .from('marketing_campaigns')
        .insert([campaign]);

      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Campanha criada!' });
      fetchCampaigns();
    } catch (error) {
      console.error('Error adding campaign:', error);
      toast({ title: 'Erro', description: 'Falha ao criar campanha', variant: 'destructive' });
    }
  };

  const updateCampaign = async (id: string, updates: Partial<Campaign>) => {
    try {
      const { error } = await supabase
        .from('marketing_campaigns')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Campanha atualizada!' });
      fetchCampaigns();
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast({ title: 'Erro', description: 'Falha ao atualizar', variant: 'destructive' });
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      const { error } = await supabase
        .from('marketing_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Campanha excluída!' });
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({ title: 'Erro', description: 'Falha ao excluir', variant: 'destructive' });
    }
  };

  const updateFunnelStage = async (stage: string, value: number) => {
    try {
      const { error } = await supabase
        .from('sales_funnel_data')
        .update({ value })
        .eq('stage', stage)
        .eq('period', 'monthly');

      if (error) throw error;
      fetchFunnelData();
    } catch (error) {
      console.error('Error updating funnel:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchCampaigns(), fetchFunnelData()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Calcular métricas
  const totalBudget = campaigns.reduce((sum, c) => sum + Number(c.budget), 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + Number(c.spent), 0);
  const totalLeads = campaigns.reduce((sum, c) => sum + c.leads, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'ativo').length;

  return {
    campaigns,
    funnelData,
    isLoading,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    updateFunnelStage,
    refetch: () => Promise.all([fetchCampaigns(), fetchFunnelData()]),
    metrics: {
      totalBudget,
      totalSpent,
      totalLeads,
      totalConversions,
      activeCampaigns,
      conversionRate: totalLeads > 0 ? ((totalConversions / totalLeads) * 100).toFixed(1) : '0'
    }
  };
}
