/**
 * 🎯 GESTÃO DE SIMULADOS — Constituição SYNAPSE Ω v10.0
 * 
 * Centro de comando COMPLETO para criação, monitoramento e controle de simulados.
 * FASE 2 COMPLETA: Edição, validações, hard_mode_override, manutenção, rascunho
 * FASE 5 COMPLETA: Permissões granulares (criar ≠ editar ≠ publicar ≠ responder)
 * FASE 6 COMPLETA: Compliance LGPD documentado
 */

import { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useSimuladoPermissions } from '@/hooks/simulados/useSimuladoPermissions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatError } from '@/lib/utils/formatError';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Brain, Plus, Settings, BarChart3, FileQuestion, Shield,
  Trophy, Clock, Calendar, Users, Eye, Edit, Trash2,
  Play, Pause, AlertTriangle, CheckCircle2, XCircle,
  RefreshCw, Search, MoreVertical, Camera, Lock,
  Activity, TrendingUp, Timer, Download, Upload,
  Zap, Target, Medal, BarChart, History, Gavel,
  AlertCircle, FileText, UserX, UserCheck, Wrench,
  Save, Power, PowerOff, Heart, RotateCcw, Shuffle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { LoadingState } from '@/components/LoadingState';
import { SimuladoFeatureFlagsPanel } from '@/components/gestao/simulados/SimuladoFeatureFlagsPanel';
import { DisputesPanel } from '@/components/gestao/simulados/DisputesPanel';
import { AlertsPanel } from '@/components/gestao/simulados/AlertsPanel';
import { HealthCheckPanel } from '@/components/gestao/simulados/HealthCheckPanel';
import { SimuladoQuestionSelector } from '@/components/gestao/simulados/SimuladoQuestionSelector';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// ============================================
// TIPOS
// ============================================

interface Simulado {
  id: string;
  title: string;
  description: string | null;
  slug: string | null;
  duration_minutes: number;
  tolerance_minutes: number;
  starts_at: string | null;
  ends_at: string | null;
  results_released_at: string | null;
  is_hard_mode: boolean;
  max_tab_switches: number;
  requires_camera: boolean;
  is_active: boolean;
  is_published: boolean;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_correct_answer_after: boolean;
  question_ids: string[] | null;
  total_questions: number;
  points_per_question: number;
  passing_score: number;
  created_at: string;
  updated_at: string;
  hard_mode_override: string | null;
  is_ranking_frozen: boolean;
  maintenance_message: string | null;
}

interface SimuladoFormData {
  title: string;
  description: string;
  duration_minutes: number;
  tolerance_minutes: number | null;
  starts_at: string;
  ends_at: string;
  results_released_at: string;
  is_hard_mode: boolean;
  max_tab_switches: number | null;
  requires_camera: boolean;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  points_per_question: number;
  passing_score: number | null;
  question_ids: string[];
  hard_mode_override: string;
  maintenance_message: string;
  is_active: boolean;
}

interface AttemptStats {
  simulado_id: string;
  total_attempts: number;
  finished_count: number;
  invalidated_count: number;
  average_score: number;
  average_time_seconds: number;
}

interface AuditLog {
  id: string;
  simulado_id: string | null;
  attempt_id: string | null;
  user_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  ip_hash: string | null;
  category: string | null;
  level: string | null;
  session_id: string | null;
  created_at: string;
}

// ============================================
// CONSTANTES E HELPERS — BRASÍLIA TIME (BRT) AUTHORITY
// ============================================
import { fromZonedTime, toZonedTime, format as formatTz } from 'date-fns-tz';

/**
 * GOVERNANÇA DE TIMEZONE — BRASÍLIA TIME (America/Sao_Paulo)
 * Autoridade única de tempo para toda a plataforma.
 * Nunca confiar no timezone do navegador do usuário.
 */
const BRASILIA_TIMEZONE = 'America/Sao_Paulo';

/**
 * Converte datetime-local (input em Brasília Time) para ISO UTC (para salvar no banco)
 * Input: "2026-01-05T08:00" (Brasília Time)
 * Output: "2026-01-05T11:00:00.000Z" (UTC)
 * 
 * IMPORTANTE: O input datetime-local é SEMPRE interpretado como Brasília Time,
 * independente do timezone do navegador do usuário.
 */
function localDatetimeToUTC(localDatetime: string): string | null {
  if (!localDatetime) return null;
  // Interpreta o datetime como Brasília Time e converte para UTC
  const brasiliaDate = fromZonedTime(localDatetime, BRASILIA_TIMEZONE);
  return brasiliaDate.toISOString();
}

/**
 * Converte ISO UTC (do banco) para datetime-local (Brasília Time, para exibir no input)
 * Input: "2026-01-05T11:00:00.000Z" (UTC)
 * Output: "2026-01-05T08:00" (Brasília Time)
 * 
 * IMPORTANTE: O output é SEMPRE em Brasília Time,
 * independente do timezone do navegador do usuário.
 */
function utcToLocalDatetime(isoUtc: string | null): string {
  if (!isoUtc) return '';
  const date = new Date(isoUtc);
  // Converte UTC para Brasília Time
  const brasiliaDate = toZonedTime(date, BRASILIA_TIMEZONE);
  // Formata para datetime-local (YYYY-MM-DDTHH:mm)
  return formatTz(brasiliaDate, "yyyy-MM-dd'T'HH:mm", { timeZone: BRASILIA_TIMEZONE });
}

const EMPTY_FORM: SimuladoFormData = {
  title: '',
  description: '',
  duration_minutes: 60,
  tolerance_minutes: 0,
  starts_at: '',
  ends_at: '',
  results_released_at: '',
  is_hard_mode: false,
  max_tab_switches: null,
  requires_camera: false,
  shuffle_questions: true,
  shuffle_options: true,
  points_per_question: 10,
  passing_score: 0,
  question_ids: [],
  hard_mode_override: 'default',
  maintenance_message: '',
  is_active: true,
};

const HARD_MODE_OVERRIDE_OPTIONS = [
  { value: 'default', label: 'Seguir Flag Global', description: 'Usa a configuração global de Hard Mode' },
  { value: 'force_on', label: 'Forçar Ativado', description: 'Hard Mode SEMPRE ativo neste simulado' },
  { value: 'force_off', label: 'Forçar Desativado', description: 'Hard Mode NUNCA ativo neste simulado' },
];

// ============================================
// HOOKS
// ============================================

function useSimulados() {
  return useQuery({
    queryKey: ['gestao-simulados-full'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulados')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as Simulado[];
    },
    staleTime: 30_000,
  });
}

function useSimuladoQuestions() {
  return useQuery({
    queryKey: ['simulado-questions-available'],
    queryFn: async () => {
      // BATCHING via .range() para escala 45K - Constituição SYNAPSE Ω v10.0
      const BATCH_SIZE = 1000;
      let allData: Array<{
        id: string;
        question_text: string | null;
        difficulty: string | null;
        banca: string | null;
        ano: number | null;
        macro: string | null;
        micro: string | null;
        tema: string | null;
        subtema: string | null;
        tags: string[] | null;
      }> = [];
      let from = 0;
      let hasMore = true;
      
      while (hasMore) {
        const { data, error } = await supabase
          .from('quiz_questions')
          .select('id, question_text, difficulty, banca, ano, macro, micro, tema, subtema, tags')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .range(from, from + BATCH_SIZE - 1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          from += BATCH_SIZE;
          hasMore = data.length === BATCH_SIZE;
        } else {
          hasMore = false;
        }
      }
      
      console.log(`[SimuladoQuestions] ✅ Carregadas ${allData.length} questões via batching`);
      return allData;
    },
    staleTime: 60_000,
  });
}

function useSimuladoAttemptStats() {
  return useQuery({
    queryKey: ['simulado-attempt-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulado_attempts')
        .select('simulado_id, status, score, time_spent_seconds');
      
      if (error) {
        console.warn('[Stats] Erro ao buscar tentativas:', error.message);
        return new Map<string, AttemptStats>();
      }
      
      const statsMap = new Map<string, AttemptStats>();
      
      (data || []).forEach(attempt => {
        const existing = statsMap.get(attempt.simulado_id) || {
          simulado_id: attempt.simulado_id,
          total_attempts: 0,
          finished_count: 0,
          invalidated_count: 0,
          average_score: 0,
          average_time_seconds: 0,
        };
        
        existing.total_attempts++;
        if (attempt.status === 'FINISHED') {
          existing.finished_count++;
          existing.average_score = (existing.average_score * (existing.finished_count - 1) + (attempt.score || 0)) / existing.finished_count;
          existing.average_time_seconds = (existing.average_time_seconds * (existing.finished_count - 1) + (attempt.time_spent_seconds || 0)) / existing.finished_count;
        }
        if (attempt.status === 'INVALIDATED') {
          existing.invalidated_count++;
        }
        
        statsMap.set(attempt.simulado_id, existing);
      });
      
      return statsMap;
    },
    staleTime: 30_000,
  });
}

function useAuditLogs() {
  return useQuery({
    queryKey: ['simulado-audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulado_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) {
        console.warn('[Audit] Tabela pode não existir:', error.message);
        return [];
      }
      return (data || []) as AuditLog[];
    },
    staleTime: 60_000,
  });
}

function useRankingSnapshots(simuladoId: string | null) {
  return useQuery({
    queryKey: ['ranking-snapshots', simuladoId],
    queryFn: async () => {
      if (!simuladoId) return [];
      
      const { data, error } = await supabase
        .from('simulado_ranking_snapshots')
        .select('*')
        .eq('simulado_id', simuladoId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.warn('[Snapshots] Erro:', error.message);
        return [];
      }
      return data || [];
    },
    enabled: !!simuladoId,
    staleTime: 60_000,
  });
}

function useCreateSimulado() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: SimuladoFormData) => {
      const slug = formData.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        + '-' + Date.now().toString(36);
      
      const { data, error } = await supabase
        .from('simulados')
        .insert({
          title: formData.title,
          description: formData.description || null,
          slug,
          duration_minutes: formData.duration_minutes,
          tolerance_minutes: formData.tolerance_minutes,
          starts_at: localDatetimeToUTC(formData.starts_at),
          ends_at: localDatetimeToUTC(formData.ends_at),
          results_released_at: localDatetimeToUTC(formData.results_released_at),
          is_hard_mode: formData.is_hard_mode,
          max_tab_switches: formData.max_tab_switches,
          requires_camera: formData.requires_camera,
          shuffle_questions: formData.shuffle_questions,
          shuffle_options: formData.shuffle_options,
          points_per_question: formData.points_per_question,
          passing_score: formData.passing_score,
          question_ids: formData.question_ids.length > 0 ? formData.question_ids : null,
          hard_mode_override: formData.hard_mode_override,
          maintenance_message: formData.maintenance_message || null,
          is_active: formData.is_active,
          is_published: false, // Sempre começa como rascunho
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestao-simulados-full'] });
      toast.success('Simulado criado como rascunho!');
    },
    onError: (error: unknown) => {
      toast.error(`Erro ao criar simulado: ${formatError(error)}`);
    },
  });
}

function useUpdateSimulado() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Simulado> }) => {
      const { error } = await supabase
        .from('simulados')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestao-simulados-full'] });
      toast.success('Simulado atualizado!');
    },
    onError: (error: unknown) => {
      toast.error(`Erro: ${formatError(error)}`);
    },
  });
}

function useDeleteSimulado() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (simuladoId: string) => {
      const { error } = await supabase
        .from('simulados')
        .delete()
        .eq('id', simuladoId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestao-simulados-full'] });
      toast.success('Simulado excluído');
    },
    onError: (error: unknown) => {
      toast.error(`Erro ao excluir: ${formatError(error)}`);
    },
  });
}

function useCreateRankingSnapshot() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ simuladoId, reason }: { simuladoId: string; reason: string }) => {
      const { data, error } = await supabase.rpc('create_ranking_snapshot', {
        p_simulado_id: simuladoId,
        p_snapshot_type: 'manual',
        p_reason: reason,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ranking-snapshots'] });
      toast.success('Snapshot do ranking criado!');
    },
    onError: (error: unknown) => {
      toast.error(`Erro: ${formatError(error)}`);
    },
  });
}

// ============================================
// COMPONENTES — FORMULÁRIO DE SIMULADO
// ============================================

interface SimuladoFormProps {
  formData: SimuladoFormData;
  setFormData: (data: SimuladoFormData) => void;
  questions: Array<{ id: string; question_text: string | null; difficulty: string | null; banca: string | null; ano: number | null; macro: string | null; micro?: string | null; tema?: string | null; subtema?: string | null; tags?: string[] | null }> | undefined;
  isLoadingQuestions: boolean;
}

function SimuladoForm({ formData, setFormData, questions, isLoadingQuestions }: SimuladoFormProps) {
  return (
    <div className="space-y-6 py-4">
      {/* Título e Descrição */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            placeholder="Ex: Simulado ENEM 2025 - Química"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            placeholder="Descrição do simulado..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
      </div>
      
      <Separator />
      
      {/* Datas */}
      <div className="space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Agendamento
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Data/Hora de Início</Label>
            <Input
              type="datetime-local"
              value={formData.starts_at}
              onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Quando o simulado fica disponível</p>
          </div>
          
          <div className="space-y-2">
            <Label>Data/Hora de Término</Label>
            <Input
              type="datetime-local"
              value={formData.ends_at}
              onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Quando encerra novas tentativas</p>
          </div>
          
          <div className="space-y-2">
            <Label>Liberação do Gabarito</Label>
            <Input
              type="datetime-local"
              value={formData.results_released_at}
              onChange={(e) => setFormData({ ...formData, results_released_at: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Quando o gabarito fica visível</p>
          </div>
        </div>
      </div>
      
      <Separator />
      
      {/* Configurações de Tempo e Pontuação */}
      <div className="space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <Timer className="h-4 w-4" />
          Configurações Gerais
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Tempo Limite (min)</Label>
            <Input
              type="number"
              min={10}
              max={480}
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Tolerância (min) <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Input
              type="number"
              min={0}
              max={60}
              placeholder="Ex: 15"
              value={formData.tolerance_minutes ?? ''}
              onChange={(e) => setFormData({ ...formData, tolerance_minutes: e.target.value === '' ? null : parseInt(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">Entrada após início</p>
          </div>
          
          <div className="space-y-2">
            <Label>XP por Questão</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={formData.points_per_question}
              onChange={(e) => setFormData({ ...formData, points_per_question: parseInt(e.target.value) || 10 })}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Nota Mínima (%) <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="Ex: 60"
              value={formData.passing_score ?? ''}
              onChange={(e) => setFormData({ ...formData, passing_score: e.target.value === '' ? null : parseInt(e.target.value) })}
            />
          </div>
        </div>
      </div>
      
      <Separator />
      
      {/* Opções de Prova */}
      <div className="space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <Shuffle className="h-4 w-4" />
          Opções de Prova
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label className="text-sm">Embaralhar Questões</Label>
              <p className="text-xs text-muted-foreground">Ordem diferente para cada aluno</p>
            </div>
            <Switch
              checked={formData.shuffle_questions}
              onCheckedChange={(checked) => setFormData({ ...formData, shuffle_questions: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label className="text-sm">Embaralhar Alternativas</Label>
              <p className="text-xs text-muted-foreground">Letras diferentes para cada aluno</p>
            </div>
            <Switch
              checked={formData.shuffle_options}
              onCheckedChange={(checked) => setFormData({ ...formData, shuffle_options: checked })}
            />
          </div>
        </div>
      </div>
      
      <Separator />
      
      {/* Modo Hard */}
      <div className="space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <Shield className="h-4 w-4 text-red-500" />
          Modo Hard (Anti-Cola)
        </h3>
        <p className="text-xs text-muted-foreground">
          Configurações de segurança avançada. Só funcionam quando o Modo Hard está ativado.
        </p>
        
        <div className="grid grid-cols-4 gap-4">
          <Card className={cn(
            "p-4 cursor-pointer border-2 transition-colors",
            formData.is_hard_mode ? "border-red-500 bg-red-500/5" : "border-border"
          )} onClick={() => setFormData({ ...formData, is_hard_mode: !formData.is_hard_mode })}>
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_hard_mode}
                onCheckedChange={(checked) => setFormData({ ...formData, is_hard_mode: checked })}
              />
              <div>
                <Label className="text-sm font-medium">Ativar Modo Hard</Label>
                <p className="text-xs text-muted-foreground">
                  Monitora trocas de aba
                </p>
              </div>
            </div>
          </Card>
          
          <Card className={cn(
            "p-4 cursor-pointer border-2 transition-colors",
            formData.requires_camera ? "border-amber-500 bg-amber-500/5" : "border-border",
            !formData.is_hard_mode && "opacity-50 cursor-not-allowed"
          )} onClick={() => formData.is_hard_mode && setFormData({ ...formData, requires_camera: !formData.requires_camera })}>
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.requires_camera}
                onCheckedChange={(checked) => setFormData({ ...formData, requires_camera: checked })}
                disabled={!formData.is_hard_mode}
              />
              <div>
                <Label className="text-sm font-medium flex items-center gap-1">
                  <Camera className="h-3 w-3" />
                  Câmera Ativa
                </Label>
                <p className="text-xs text-muted-foreground">
                  Efeito deterrent
                </p>
              </div>
            </div>
          </Card>
          
          <div className={cn("space-y-2", !formData.is_hard_mode && "opacity-50")}>
            <Label>Máx. Trocas de Aba</Label>
            <Input
              type="number"
              min={0}
              max={10}
              placeholder="Ex: 3"
              value={formData.max_tab_switches ?? ''}
              onChange={(e) => setFormData({ ...formData, max_tab_switches: e.target.value === '' ? null : parseInt(e.target.value) })}
              disabled={!formData.is_hard_mode}
            />
            <p className="text-xs text-muted-foreground">0 = invalida na 1ª troca</p>
          </div>
          
          <div className={cn("space-y-2", !formData.is_hard_mode && "opacity-50")}>
            <Label>Override Hard Mode</Label>
            <Select
              value={formData.hard_mode_override}
              onValueChange={(value) => setFormData({ ...formData, hard_mode_override: value })}
              disabled={!formData.is_hard_mode}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HARD_MODE_OVERRIDE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div>
                      <span>{opt.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">({opt.description})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Sobrescreve flag global</p>
          </div>
        </div>
      </div>
      
      <Separator />
      
      {/* Manutenção */}
      <div className="space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <Wrench className="h-4 w-4 text-amber-500" />
          Manutenção
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label className="text-sm">Simulado Ativo</Label>
              <p className="text-xs text-muted-foreground">
                {formData.is_active ? 'Visível para alunos' : 'Oculto para alunos'}
              </p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Mensagem de Manutenção</Label>
            <Input
              placeholder="Ex: Simulado em manutenção até 15h"
              value={formData.maintenance_message}
              onChange={(e) => setFormData({ ...formData, maintenance_message: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Exibida aos alunos se preenchida</p>
          </div>
        </div>
      </div>
      
      <Separator />
      
      {/* Questões com Drag-and-Drop */}
      <SimuladoQuestionSelector
        allQuestions={questions || []}
        selectedIds={formData.question_ids}
        onChange={(ids) => setFormData({ ...formData, question_ids: ids })}
        isLoading={isLoadingQuestions}
      />
    </div>
  );
}

// ============================================
// DIALOG CRIAR SIMULADO
// ============================================

function CreateSimuladoDialog({ 
  open, 
  onOpenChange 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const { data: questions, isLoading: isLoadingQuestions } = useSimuladoQuestions();
  const createSimulado = useCreateSimulado();
  const [formData, setFormData] = useState<SimuladoFormData>(EMPTY_FORM);
  
  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }
    
    createSimulado.mutate(formData, {
      onSuccess: () => {
        onOpenChange(false);
        setFormData(EMPTY_FORM);
      },
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-[98vw] max-h-[98vh] h-[98vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Criar Novo Simulado
          </DialogTitle>
          <DialogDescription>
            Configure todos os detalhes do simulado. Será salvo como rascunho.
          </DialogDescription>
        </DialogHeader>
        
        <SimuladoForm 
          formData={formData} 
          setFormData={setFormData} 
          questions={questions}
          isLoadingQuestions={isLoadingQuestions}
        />
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button 
            variant="destructive" 
            onClick={() => setFormData(EMPTY_FORM)}
            className="gap-1"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar Padrões
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={createSimulado.isPending} className="gap-2">
              {createSimulado.isPending ? 'Criando...' : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Rascunho
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// DIALOG EDITAR SIMULADO
// ============================================

function EditSimuladoDialog({ 
  simulado,
  open, 
  onOpenChange 
}: { 
  simulado: Simulado | null;
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const { data: questions, isLoading: isLoadingQuestions } = useSimuladoQuestions();
  const updateSimulado = useUpdateSimulado();
  
  const [formData, setFormData] = useState<SimuladoFormData>(EMPTY_FORM);
  
  // Preencher form quando simulado muda
  useEffect(() => {
    if (simulado) {
      setFormData({
        title: simulado.title,
        description: simulado.description || '',
        duration_minutes: simulado.duration_minutes,
        tolerance_minutes: simulado.tolerance_minutes ?? 0,
        starts_at: utcToLocalDatetime(simulado.starts_at),
        ends_at: utcToLocalDatetime(simulado.ends_at),
        results_released_at: utcToLocalDatetime(simulado.results_released_at),
        is_hard_mode: simulado.is_hard_mode,
        max_tab_switches: simulado.max_tab_switches,
        requires_camera: simulado.requires_camera || false,
        shuffle_questions: simulado.shuffle_questions,
        shuffle_options: simulado.shuffle_options,
        points_per_question: simulado.points_per_question,
        passing_score: simulado.passing_score ?? 0,
        question_ids: simulado.question_ids || [],
        hard_mode_override: simulado.hard_mode_override || 'default',
        maintenance_message: simulado.maintenance_message || '',
        is_active: simulado.is_active,
      });
    }
  }, [simulado]);
  
  const handleSubmit = () => {
    if (!simulado) return;
    if (!formData.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }
    
    updateSimulado.mutate({
      id: simulado.id,
      data: {
        title: formData.title,
        description: formData.description || null,
        duration_minutes: formData.duration_minutes,
        tolerance_minutes: formData.tolerance_minutes,
        starts_at: localDatetimeToUTC(formData.starts_at),
        ends_at: localDatetimeToUTC(formData.ends_at),
        results_released_at: localDatetimeToUTC(formData.results_released_at),
        is_hard_mode: formData.is_hard_mode,
        max_tab_switches: formData.max_tab_switches,
        requires_camera: formData.requires_camera,
        shuffle_questions: formData.shuffle_questions,
        shuffle_options: formData.shuffle_options,
        points_per_question: formData.points_per_question,
        passing_score: formData.passing_score,
        question_ids: formData.question_ids.length > 0 ? formData.question_ids : null,
        hard_mode_override: formData.hard_mode_override,
        maintenance_message: formData.maintenance_message || null,
        is_active: formData.is_active,
      },
    }, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };
  
  if (!simulado) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-[98vw] max-h-[98vh] h-[98vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            Editar Simulado
          </DialogTitle>
          <DialogDescription>
            Modifique as configurações do simulado "{simulado.title}"
          </DialogDescription>
        </DialogHeader>
        
        <SimuladoForm 
          formData={formData} 
          setFormData={setFormData} 
          questions={questions}
          isLoadingQuestions={isLoadingQuestions}
        />
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={updateSimulado.isPending} className="gap-2">
            {updateSimulado.isPending ? 'Salvando...' : (
              <>
                <Save className="h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// LISTA DE SIMULADOS
// ============================================

function SimuladosList() {
  const { data: simulados, isLoading, refetch } = useSimulados();
  const { data: statsMap } = useSimuladoAttemptStats();
  const deleteSimulado = useDeleteSimulado();
  const updateSimulado = useUpdateSimulado();
  
  const [search, setSearch] = useState('');
  const [editingSimulado, setEditingSimulado] = useState<Simulado | null>(null);
  const [detailsSimulado, setDetailsSimulado] = useState<Simulado | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<Simulado | null>(null);
  
  // Filtra e agrupa por modo (Hard primeiro, depois Normal)
  const filtered = useMemo(() => {
    if (!simulados) return [];
    let list = simulados;
    
    if (search.trim()) {
      list = list.filter(s => 
        s.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Ordena: Hard Mode primeiro, depois Normal
    return [...list].sort((a, b) => {
      if (a.is_hard_mode === b.is_hard_mode) return 0;
      return a.is_hard_mode ? -1 : 1;
    });
  }, [simulados, search]);
  
  const getStatus = (sim: Simulado) => {
    const now = new Date();
    const startsAt = sim.starts_at ? new Date(sim.starts_at) : null;
    const endsAt = sim.ends_at ? new Date(sim.ends_at) : null;
    
    if (!sim.is_active) return { label: 'Inativo', color: 'bg-gray-500', icon: PowerOff };
    if (!sim.is_published) return { label: 'Rascunho', color: 'bg-muted text-muted-foreground', icon: FileText };
    if (sim.maintenance_message) return { label: 'Manutenção', color: 'bg-amber-500', icon: Wrench };
    if (startsAt && now < startsAt) return { label: 'Agendado', color: 'bg-blue-500', icon: Calendar };
    if (endsAt && now > endsAt) return { label: 'Encerrado', color: 'bg-gray-500', icon: XCircle };
    return { label: 'Ativo', color: 'bg-green-500', icon: Play };
  };
  
  const handlePublish = (simulado: Simulado) => {
    // VALIDAÇÃO: Não publica sem questões
    if (!simulado.question_ids || simulado.question_ids.length === 0) {
      toast.error('Não é possível publicar um simulado sem questões!');
      return;
    }
    
    updateSimulado.mutate({ 
      id: simulado.id, 
      data: { is_published: true } 
    });
  };
  
  const handleUnpublish = (simulado: Simulado) => {
    updateSimulado.mutate({ 
      id: simulado.id, 
      data: { is_published: false } 
    });
  };
  
  const handleToggleActive = (simulado: Simulado) => {
    if (simulado.is_active) {
      // Desativar requer confirmação
      setConfirmDeactivate(simulado);
    } else {
      // Ativar direto
      updateSimulado.mutate({ 
        id: simulado.id, 
        data: { is_active: true } 
      });
    }
  };
  
  if (isLoading) {
    return <LoadingState message="Carregando simulados..." />;
  }
  
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Simulados Cadastrados
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum simulado cadastrado.</p>
              <p className="text-sm">Clique em "Novo Simulado" para criar.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Questões</TableHead>
                  <TableHead>Tempo</TableHead>
                  <TableHead>Modo</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tentativas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((simulado) => {
                  const status = getStatus(simulado);
                  const stats = statsMap?.get(simulado.id);
                  const StatusIcon = status.icon;
                  
                  return (
                    <TableRow key={simulado.id} className={!simulado.is_active ? 'opacity-50' : ''}>
                      <TableCell>
                        <div className="space-y-1">
                          <span className="font-medium">{simulado.title}</span>
                          <div className="flex gap-1">
                            {simulado.is_ranking_frozen && (
                              <Badge variant="outline" className="text-xs">
                                <Lock className="h-3 w-3 mr-1" />
                                Ranking Congelado
                              </Badge>
                            )}
                            {simulado.maintenance_message && (
                              <Badge variant="outline" className="text-xs text-amber-500">
                                <Wrench className="h-3 w-3 mr-1" />
                                {simulado.maintenance_message.substring(0, 20)}...
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={simulado.total_questions > 0 ? "outline" : "destructive"}>
                          {simulado.total_questions || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {simulado.duration_minutes} min
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {simulado.is_hard_mode ? (
                            <Badge className="bg-red-500 gap-1">
                              <Shield className="h-3 w-3" />
                              Hard
                              {simulado.requires_camera && <Camera className="h-3 w-3" />}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Normal</Badge>
                          )}
                          {simulado.hard_mode_override !== 'default' && (
                            <Badge variant="outline" className="text-xs block mt-1">
                              {simulado.hard_mode_override === 'force_on' ? '⚡ Forçado ON' : '⭕ Forçado OFF'}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {simulado.starts_at 
                          ? format(new Date(simulado.starts_at), "dd/MM HH:mm", { locale: ptBR })
                          : '—'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(status.color, "gap-1")}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {stats ? (
                          <div className="text-xs space-y-0.5">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {stats.total_attempts} total
                            </div>
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-3 w-3" />
                              {stats.finished_count} finalizados
                            </div>
                            {stats.invalidated_count > 0 && (
                              <div className="flex items-center gap-1 text-red-500">
                                <XCircle className="h-3 w-3" />
                                {stats.invalidated_count} invalidados
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* EDITAR */}
                            <DropdownMenuItem onClick={() => setEditingSimulado(simulado)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => setDetailsSimulado(simulado)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            {/* PUBLICAR/DESPUBLICAR */}
                            {simulado.is_published ? (
                              <DropdownMenuItem onClick={() => handleUnpublish(simulado)}>
                                <Pause className="h-4 w-4 mr-2" />
                                Despublicar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handlePublish(simulado)}>
                                <Play className="h-4 w-4 mr-2" />
                                Publicar
                              </DropdownMenuItem>
                            )}
                            
                            {/* ATIVAR/DESATIVAR */}
                            <DropdownMenuItem onClick={() => handleToggleActive(simulado)}>
                              {simulado.is_active ? (
                                <>
                                  <PowerOff className="h-4 w-4 mr-2" />
                                  Desativar
                                </>
                              ) : (
                                <>
                                  <Power className="h-4 w-4 mr-2" />
                                  Ativar
                                </>
                              )}
                            </DropdownMenuItem>
                            
                            {/* RANKING */}
                            <DropdownMenuItem onClick={() => updateSimulado.mutate({ 
                              id: simulado.id, 
                              data: { is_ranking_frozen: !simulado.is_ranking_frozen } 
                            })}>
                              <Lock className="h-4 w-4 mr-2" />
                              {simulado.is_ranking_frozen ? 'Descongelar Ranking' : 'Congelar Ranking'}
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            {/* EXCLUIR */}
                            <DropdownMenuItem 
                              className="text-red-500" 
                              onClick={() => {
                                if (confirm(`Excluir "${simulado.title}"? Esta ação não pode ser desfeita.`)) {
                                  deleteSimulado.mutate(simulado.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Dialog de Edição */}
      <EditSimuladoDialog 
        simulado={editingSimulado}
        open={!!editingSimulado}
        onOpenChange={(open) => !open && setEditingSimulado(null)}
      />
      
      {/* Dialog de Detalhes */}
      <SimuladoDetailsDialog
        simulado={detailsSimulado}
        onClose={() => setDetailsSimulado(null)}
      />
      
      {/* Confirmação de Desativar */}
      <AlertDialog open={!!confirmDeactivate} onOpenChange={(open) => !open && setConfirmDeactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Desativar Simulado?
            </AlertDialogTitle>
            <AlertDialogDescription>
              O simulado "{confirmDeactivate?.title}" será ocultado para todos os alunos.
              Tentativas em andamento serão mantidas, mas novas tentativas não serão permitidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-500 hover:bg-amber-600"
              onClick={() => {
                if (confirmDeactivate) {
                  updateSimulado.mutate({ 
                    id: confirmDeactivate.id, 
                    data: { is_active: false } 
                  });
                }
                setConfirmDeactivate(null);
              }}
            >
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ============================================
// DIALOG DE DETALHES
// ============================================

function SimuladoDetailsDialog({ 
  simulado, 
  onClose 
}: { 
  simulado: Simulado | null; 
  onClose: () => void;
}) {
  const { data: snapshots } = useRankingSnapshots(simulado?.id || null);
  const createSnapshot = useCreateRankingSnapshot();
  
  if (!simulado) return null;
  
  return (
    <Dialog open={!!simulado} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            {simulado.title}
          </DialogTitle>
          <DialogDescription>
            Criado em {format(new Date(simulado.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Info básica */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Duração</Label>
              <p className="font-medium">{simulado.duration_minutes} minutos</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tolerância</Label>
              <p className="font-medium">{simulado.tolerance_minutes} minutos</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Questões</Label>
              <p className="font-medium">{simulado.total_questions || 0}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">XP por Questão</Label>
              <p className="font-medium">{simulado.points_per_question}</p>
            </div>
          </div>
          
          <Separator />
          
          {/* Hard Mode */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Modo Hard
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <Badge variant={simulado.is_hard_mode ? "default" : "secondary"} className="justify-center">
                {simulado.is_hard_mode ? '✅ Ativado' : '❌ Desativado'}
              </Badge>
              <Badge variant={simulado.requires_camera ? "default" : "secondary"} className="justify-center">
                {simulado.requires_camera ? '📷 Câmera' : '🚫 Sem Câmera'}
              </Badge>
              <Badge variant="outline" className="justify-center">
                Override: {simulado.hard_mode_override || 'default'}
              </Badge>
            </div>
          </div>
          
          {/* Manutenção */}
          {simulado.maintenance_message && (
            <>
              <Separator />
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-amber-500 font-medium text-sm">
                  <Wrench className="h-4 w-4" />
                  Mensagem de Manutenção
                </div>
                <p className="text-sm mt-1">{simulado.maintenance_message}</p>
              </div>
            </>
          )}
          
          {/* Datas */}
          <Separator />
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">Início</Label>
              <p>{simulado.starts_at ? format(new Date(simulado.starts_at), "dd/MM HH:mm") : '—'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Término</Label>
              <p>{simulado.ends_at ? format(new Date(simulado.ends_at), "dd/MM HH:mm") : '—'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Gabarito</Label>
              <p>{simulado.results_released_at ? format(new Date(simulado.results_released_at), "dd/MM HH:mm") : '—'}</p>
            </div>
          </div>
          
          {/* Snapshots */}
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Snapshots do Ranking</h4>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => createSnapshot.mutate({ 
                  simuladoId: simulado.id, 
                  reason: 'Snapshot manual via gestão' 
                })}
                disabled={createSnapshot.isPending}
              >
                <Download className="h-4 w-4 mr-1" />
                Criar Snapshot
              </Button>
            </div>
            {snapshots && snapshots.length > 0 ? (
              <div className="space-y-1 max-h-[150px] overflow-y-auto">
                {snapshots.map((snap: { id: string; created_at: string; snapshot_type: string; reason: string | null }) => (
                  <div key={snap.id} className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                    <span>{format(new Date(snap.created_at), "dd/MM HH:mm:ss")}</span>
                    <Badge variant="outline">{snap.snapshot_type}</Badge>
                    <span className="text-muted-foreground truncate max-w-[150px]">{snap.reason}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Nenhum snapshot criado.</p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// MONITORAMENTO
// ============================================

function MonitoringDashboard() {
  const { data: simulados } = useSimulados();
  const { data: statsMap, refetch: refetchStats } = useSimuladoAttemptStats();
  
  const metrics = useMemo(() => {
    if (!statsMap) return { total: 0, finished: 0, invalidated: 0, avgScore: 0 };
    
    let total = 0, finished = 0, invalidated = 0, scoreSum = 0, scoreCount = 0;
    
    statsMap.forEach(stats => {
      total += stats.total_attempts;
      finished += stats.finished_count;
      invalidated += stats.invalidated_count;
      if (stats.finished_count > 0) {
        scoreSum += stats.average_score * stats.finished_count;
        scoreCount += stats.finished_count;
      }
    });
    
    return {
      total,
      finished,
      invalidated,
      avgScore: scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0,
    };
  }, [statsMap]);
  
  return (
    <div className="space-y-6">
      {/* Cards de métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tentativas', value: metrics.total, icon: Users, color: 'text-primary' },
          { label: 'Finalizados', value: metrics.finished, icon: CheckCircle2, color: 'text-green-500' },
          { label: 'Invalidados', value: metrics.invalidated, icon: XCircle, color: 'text-red-500' },
          { label: 'Média Score', value: `${metrics.avgScore}%`, icon: TrendingUp, color: 'text-blue-500' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("p-3 rounded-xl bg-muted", stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {/* Lista de simulados ativos com stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Monitoramento em Tempo Real
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => refetchStats()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {simulados && simulados.filter(s => s.is_published && s.is_active).length > 0 ? (
            <div className="space-y-4">
              {simulados.filter(s => s.is_published && s.is_active).map(sim => {
                const stats = statsMap?.get(sim.id);
                const completionRate = stats && stats.total_attempts > 0 
                  ? (stats.finished_count / stats.total_attempts) * 100 
                  : 0;
                
                return (
                  <div key={sim.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{sim.title}</h4>
                      <div className="flex gap-2">
                        {sim.is_hard_mode && (
                          <Badge className="bg-red-500">
                            <Shield className="h-3 w-3 mr-1" />
                            Hard Mode
                          </Badge>
                        )}
                        {sim.maintenance_message && (
                          <Badge variant="outline" className="text-amber-500">
                            <Wrench className="h-3 w-3 mr-1" />
                            Manutenção
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {stats ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{stats.total_attempts} tentativas</span>
                          </div>
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{stats.finished_count} finalizados</span>
                          </div>
                          <div className="flex items-center gap-1 text-red-500">
                            <XCircle className="h-4 w-4" />
                            <span>{stats.invalidated_count} invalidados</span>
                          </div>
                          <div className="flex items-center gap-1 text-blue-500">
                            <Target className="h-4 w-4" />
                            <span>Média: {Math.round(stats.average_score)}%</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Taxa de conclusão</span>
                            <span>{Math.round(completionRate)}%</span>
                          </div>
                          <Progress value={completionRate} className="h-2" />
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhuma tentativa ainda.</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum simulado ativo para monitorar.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// AUDITORIA
// ============================================

function AuditLogsPanel() {
  const { data: logs, isLoading, refetch } = useAuditLogs();
  const [filter, setFilter] = useState('');
  
  const filtered = useMemo(() => {
    if (!logs) return [];
    if (!filter) return logs;
    return logs.filter(log => 
      log.action.toLowerCase().includes(filter.toLowerCase())
    );
  }, [logs, filter]);
  
  const getActionIcon = (action: string) => {
    if (action.includes('START')) return <Play className="h-4 w-4 text-green-500" />;
    if (action.includes('FINISH')) return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
    if (action.includes('INVALIDAT')) return <XCircle className="h-4 w-4 text-red-500" />;
    if (action.includes('DISQUALIF')) return <UserX className="h-4 w-4 text-red-600" />;
    if (action.includes('TAB')) return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    return <FileText className="h-4 w-4 text-muted-foreground" />;
  };
  
  if (isLoading) {
    return <LoadingState message="Carregando logs..." />;
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Logs de Auditoria
          </CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Filtrar por ação..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-[200px]"
            />
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Registros de tentativas, invalidações e eventos do sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum log de auditoria registrado.</p>
            <p className="text-sm mt-1">Os logs aparecerão aqui após as primeiras tentativas.</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filtered.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50">
                  {getActionIcon(log.action)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {log.action}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {JSON.stringify(log.details).substring(0, 100)}...
                      </p>
                    )}
                    {log.user_id && (
                      <p className="text-xs text-muted-foreground">
                        User: {log.user_id.substring(0, 8)}...
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.created_at), "HH:mm:ss")}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// RANKING
// ============================================

function RankingPanel() {
  const { data: simulados } = useSimulados();
  const [selectedSimuladoId, setSelectedSimuladoId] = useState<string | null>(null);
  const createSnapshot = useCreateRankingSnapshot();
  
  const { data: ranking, isLoading: isLoadingRanking, refetch: refetchRanking } = useQuery({
    queryKey: ['simulado-ranking', selectedSimuladoId],
    queryFn: async () => {
      if (!selectedSimuladoId) return [];
      
      const { data, error } = await supabase.rpc('get_simulado_ranking', {
        p_simulado_id: selectedSimuladoId,
        p_limit: 100,
      });
      
      if (error) {
        console.warn('[Ranking] Erro:', error.message);
        return [];
      }
      return data || [];
    },
    enabled: !!selectedSimuladoId,
    staleTime: 30_000,
  });
  
  const publishedSimulados = simulados?.filter(s => s.is_published) || [];
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Ranking e Classificação
          </CardTitle>
          <CardDescription>
            Visualize o ranking e crie snapshots imutáveis para auditoria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {publishedSimulados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum simulado publicado.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label>Selecione um Simulado</Label>
                  <Select
                    value={selectedSimuladoId || ''}
                    onValueChange={(value) => setSelectedSimuladoId(value || null)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Escolha..." />
                    </SelectTrigger>
                    <SelectContent>
                      {publishedSimulados.map(sim => (
                        <SelectItem key={sim.id} value={sim.id}>
                          {sim.title}
                          {sim.is_ranking_frozen && ' 🔒'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedSimuladoId && (
                  <div className="flex gap-2 mt-6">
                    <Button variant="outline" onClick={() => refetchRanking()}>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Atualizar
                    </Button>
                    <Button
                      onClick={() => createSnapshot.mutate({
                        simuladoId: selectedSimuladoId,
                        reason: 'Snapshot manual para auditoria'
                      })}
                      disabled={createSnapshot.isPending}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Criar Snapshot
                    </Button>
                  </div>
                )}
              </div>
              
              {selectedSimuladoId && (
                isLoadingRanking ? (
                  <LoadingState message="Carregando ranking..." />
                ) : ranking && Array.isArray(ranking) && ranking.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Pos.</TableHead>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Acertos</TableHead>
                        <TableHead>Tempo</TableHead>
                        <TableHead>XP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(ranking as Array<{ rank: number; user_name: string; score: number; correct_answers: number; time_spent_seconds: number; xp_awarded: number }>).map((entry, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {entry.rank <= 3 ? (
                                <Medal className={cn(
                                  "h-5 w-5",
                                  entry.rank === 1 && "text-amber-500",
                                  entry.rank === 2 && "text-gray-400",
                                  entry.rank === 3 && "text-amber-700"
                                )} />
                              ) : (
                                <span className="text-muted-foreground">{entry.rank}º</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {entry.user_name || 'Anônimo'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{entry.score}%</Badge>
                          </TableCell>
                          <TableCell>{entry.correct_answers}</TableCell>
                          <TableCell>
                            {Math.floor((entry.time_spent_seconds || 0) / 60)}min
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-amber-500">
                              <Zap className="h-3 w-3 mr-1" />
                              {entry.xp_awarded}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Medal className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma tentativa finalizada neste simulado.</p>
                  </div>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// PÁGINA PRINCIPAL
// ============================================

export default function GestaoSimulados() {
  const { data: simulados } = useSimulados();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // 🔒 FASE 5: Permissões Granulares
  const permissions = useSimuladoPermissions();
  
  // Métricas
  const metrics = useMemo(() => {
    if (!simulados) return { total: 0, published: 0, active: 0, hardMode: 0 };
    return {
      total: simulados.length,
      published: simulados.filter(s => s.is_published).length,
      active: simulados.filter(s => s.is_active && s.is_published).length,
      hardMode: simulados.filter(s => s.is_hard_mode).length,
    };
  }, [simulados]);
  
  return (
    <>
      <Helmet>
        <title>Gestão de Simulados | PRO Moisés Medeiros</title>
      </Helmet>
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              Gestão de Simulados
            </h1>
            <p className="text-muted-foreground mt-1">
              Crie, configure e monitore simulados com Modo Hard e ranking competitivo.
            </p>
          </div>
          
          {/* 🔒 Só exibe botão se tiver permissão de criar */}
          {permissions.canCreate && (
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-5 w-5" />
              Novo Simulado
            </Button>
          )}
        </motion.div>
        
        {/* Cards de métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: metrics.total, icon: Brain, color: 'text-primary' },
            { label: 'Publicados', value: metrics.published, icon: Play, color: 'text-green-500' },
            { label: 'Ativos', value: metrics.active, icon: Activity, color: 'text-blue-500' },
            { label: 'Hard Mode', value: metrics.hardMode, icon: Shield, color: 'text-red-500' },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={cn("p-3 rounded-xl bg-muted", stat.color)}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="simulados" className="space-y-4">
          <TabsList className="grid grid-cols-7 w-full max-w-4xl">
            <TabsTrigger value="simulados" className="gap-2">
              <Brain className="h-4 w-4" />
              Simulados
            </TabsTrigger>
            <TabsTrigger value="monitoramento" className="gap-2">
              <Activity className="h-4 w-4" />
              Monitor
            </TabsTrigger>
            {/* 🔒 Só exibe se tiver permissão de ver contestações */}
            {permissions.canViewDisputes && (
              <TabsTrigger value="contestacoes" className="gap-2">
                <Gavel className="h-4 w-4" />
                Contestações
              </TabsTrigger>
            )}
            {/* 🔒 Só exibe se tiver permissão de ver alertas */}
            {permissions.canViewAlerts && (
              <TabsTrigger value="alertas" className="gap-2">
                <AlertCircle className="h-4 w-4" />
                Alertas
              </TabsTrigger>
            )}
            <TabsTrigger value="ranking" className="gap-2">
              <Trophy className="h-4 w-4" />
              Ranking
            </TabsTrigger>
            {/* 🔒 Só exibe se tiver permissão de ver auditoria */}
            {permissions.canViewAudit && (
              <TabsTrigger value="auditoria" className="gap-2">
                <History className="h-4 w-4" />
                Auditoria
              </TabsTrigger>
            )}
            {/* 🔒 Só exibe se tiver permissão de gerenciar flags ou ver healthcheck */}
            {(permissions.canManageFlags || permissions.canViewHealthcheck) && (
              <TabsTrigger value="flags" className="gap-2">
                <Settings className="h-4 w-4" />
                Sistema
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="simulados">
            <SimuladosList />
          </TabsContent>
          
          <TabsContent value="monitoramento">
            <MonitoringDashboard />
          </TabsContent>
          
          {/* 🔒 Só renderiza se tiver permissão */}
          {permissions.canViewDisputes && (
            <TabsContent value="contestacoes">
              <DisputesPanel canRespond={permissions.canRespondDisputes} />
            </TabsContent>
          )}
          
          {permissions.canViewAlerts && (
            <TabsContent value="alertas">
              <AlertsPanel />
            </TabsContent>
          )}
          
          <TabsContent value="ranking">
            <RankingPanel />
          </TabsContent>
          
          {/* 🔒 Só renderiza se tiver permissão */}
          {permissions.canViewAudit && (
            <TabsContent value="auditoria">
              <AuditLogsPanel />
            </TabsContent>
          )}
          
          {(permissions.canManageFlags || permissions.canViewHealthcheck) && (
            <TabsContent value="flags">
              <div className="space-y-6">
                {permissions.canManageFlags && <SimuladoFeatureFlagsPanel />}
                {permissions.canViewHealthcheck && <HealthCheckPanel />}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
      
      {/* Dialog de criação */}
      <CreateSimuladoDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
    </>
  );
}
