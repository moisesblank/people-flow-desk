// ============================================
// SYNAPSE v5.0 - Hook de Ponto Eletrônico
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface TimeClockEntry {
  id: string;
  employee_id: number;
  user_id: string;
  entry_type: 'entrada' | 'saida' | 'inicio_almoco' | 'fim_almoco';
  registered_at: string;
  latitude: number | null;
  longitude: number | null;
  location_address: string | null;
  ip_address: string | null;
  device_info: string | null;
  photo_url: string | null;
  notes: string | null;
  is_manual: boolean;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface TimeClockReport {
  id: string;
  employee_id: number;
  report_date: string;
  total_worked_minutes: number;
  overtime_minutes: number;
  late_minutes: number;
  early_departure_minutes: number;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  observations: string | null;
}

export interface TimeClockAbsence {
  id: string;
  employee_id: number;
  absence_date: string;
  absence_type: 'falta' | 'atestado' | 'ferias' | 'licenca' | 'folga' | 'outro';
  justification: string | null;
  document_url: string | null;
  approved: boolean;
  approved_by: string | null;
  approved_at: string | null;
}

// Hook para buscar registros de ponto do usuário
export function useMyTimeClockEntries(dateRange?: { start: Date; end: Date }) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['time-clock-entries', user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('time_clock_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('registered_at', { ascending: false });
      
      if (dateRange) {
        query = query
          .gte('registered_at', dateRange.start.toISOString())
          .lte('registered_at', dateRange.end.toISOString());
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as TimeClockEntry[];
    },
    enabled: !!user?.id,
  });
}

// Hook para buscar todos os registros (admin)
export function useAllTimeClockEntries(filters?: { 
  employeeId?: number; 
  startDate?: Date; 
  endDate?: Date;
}) {
  return useQuery({
    queryKey: ['time-clock-entries-all', filters],
    queryFn: async () => {
      let query = supabase
        .from('time_clock_entries')
        .select(`
          *,
          employees:employee_id (id, nome, funcao, setor)
        `)
        .order('registered_at', { ascending: false });
      
      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
      }
      if (filters?.startDate) {
        query = query.gte('registered_at', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        query = query.lte('registered_at', filters.endDate.toISOString());
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// Hook para registrar ponto
export function useRegisterTimeClock() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      employee_id: number;
      entry_type: 'entrada' | 'saida' | 'inicio_almoco' | 'fim_almoco';
      latitude?: number;
      longitude?: number;
      location_address?: string;
      notes?: string;
      photo_url?: string;
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      // Buscar IP e device info
      const deviceInfo = navigator.userAgent;
      
      const { data: entry, error } = await supabase
        .from('time_clock_entries')
        .insert({
          ...data,
          user_id: user.id,
          device_info: deviceInfo,
          is_manual: false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return entry;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['time-clock-entries'] });
      const typeLabels = {
        entrada: 'Entrada',
        saida: 'Saída',
        inicio_almoco: 'Início do Almoço',
        fim_almoco: 'Fim do Almoço',
      };
      toast.success(`${typeLabels[data.entry_type]} registrada com sucesso!`);
    },
    onError: (error) => {
      console.error('Erro ao registrar ponto:', error);
      toast.error('Erro ao registrar ponto');
    },
  });
}

// Hook para buscar último registro do dia
export function useTodayEntries() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['time-clock-today', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('time_clock_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('registered_at', today.toISOString())
        .order('registered_at', { ascending: true });
      
      if (error) throw error;
      return data as TimeClockEntry[];
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Atualiza a cada minuto
  });
}

// Hook para buscar relatórios do funcionário
export function useMyTimeClockReports(month?: Date) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['time-clock-reports', user?.id, month],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Primeiro buscar o employee_id do usuário
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (empError || !employee) return [];
      
      let query = supabase
        .from('time_clock_reports')
        .select('*')
        .eq('employee_id', employee.id)
        .order('report_date', { ascending: false });
      
      if (month) {
        const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
        const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        query = query
          .gte('report_date', startOfMonth.toISOString().split('T')[0])
          .lte('report_date', endOfMonth.toISOString().split('T')[0]);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as TimeClockReport[];
    },
    enabled: !!user?.id,
  });
}

// Hook para ausências
export function useMyAbsences() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['time-clock-absences', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!employee) return [];
      
      const { data, error } = await supabase
        .from('time_clock_absences')
        .select('*')
        .eq('employee_id', employee.id)
        .order('absence_date', { ascending: false });
      
      if (error) throw error;
      return data as TimeClockAbsence[];
    },
    enabled: !!user?.id,
  });
}

// Hook para solicitar ausência
export function useRequestAbsence() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      absence_date: string;
      absence_type: TimeClockAbsence['absence_type'];
      justification?: string;
      document_url?: string;
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      // Buscar employee_id
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (empError || !employee) throw new Error('Funcionário não encontrado');
      
      const { data: absence, error } = await supabase
        .from('time_clock_absences')
        .insert({
          employee_id: employee.id,
          ...data,
        })
        .select()
        .single();
      
      if (error) throw error;
      return absence;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-clock-absences'] });
      toast.success('Solicitação de ausência enviada!');
    },
    onError: () => {
      toast.error('Erro ao solicitar ausência');
    },
  });
}

// Hook para calcular horas trabalhadas
export function useWorkHoursCalculation(entries: TimeClockEntry[]) {
  const calculateHours = () => {
    if (!entries.length) return { worked: 0, overtime: 0, late: 0 };
    
    let totalMinutes = 0;
    let entrada: Date | null = null;
    let inicioAlmoco: Date | null = null;
    
    const sortedEntries = [...entries].sort(
      (a, b) => new Date(a.registered_at).getTime() - new Date(b.registered_at).getTime()
    );
    
    for (const entry of sortedEntries) {
      const time = new Date(entry.registered_at);
      
      switch (entry.entry_type) {
        case 'entrada':
          entrada = time;
          break;
        case 'inicio_almoco':
          if (entrada) {
            totalMinutes += (time.getTime() - entrada.getTime()) / 60000;
            entrada = null;
          }
          inicioAlmoco = time;
          break;
        case 'fim_almoco':
          entrada = time;
          inicioAlmoco = null;
          break;
        case 'saida':
          if (entrada) {
            totalMinutes += (time.getTime() - entrada.getTime()) / 60000;
            entrada = null;
          }
          break;
      }
    }
    
    const worked = Math.floor(totalMinutes);
    const overtime = Math.max(0, worked - 480); // 8 horas = 480 minutos
    
    return { worked, overtime, late: 0 };
  };
  
  return calculateHours();
}

// Utilitário para formatar minutos em horas
export function formatMinutesToHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}
