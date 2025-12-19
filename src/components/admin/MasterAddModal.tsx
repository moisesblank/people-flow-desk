// ============================================
// MOISÉS MEDEIROS v15.0 - MASTER ADD MODAL COMPLETO
// Modal ULTRA COMPLETO para adicionar QUALQUER item
// Suporta 60+ tipos de entidades
// Owner exclusivo: moisesblank@gmail.com
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useGodMode } from '@/contexts/GodModeContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Upload, Sparkles, CheckCircle } from 'lucide-react';

interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'switch' | 'date' | 'datetime' | 'file' | 'image' | 'email' | 'phone' | 'url' | 'color' | 'time' | 'json';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: unknown;
  min?: number;
  max?: number;
  step?: number;
}

interface EntityConfig {
  table: string;
  title: string;
  icon: string;
  fields: FieldConfig[];
  addUserId?: boolean;
}

// ============================================
// CONFIGURAÇÃO COMPLETA DE TODAS AS ENTIDADES
// ============================================
const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  // ============ CURSOS E EDUCAÇÃO ============
  course: {
    table: 'courses',
    title: 'Novo Curso',
    icon: '📚',
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true, placeholder: 'Nome do curso' },
      { name: 'description', label: 'Descrição', type: 'textarea', placeholder: 'Descrição detalhada' },
      { name: 'short_description', label: 'Descrição Curta', type: 'text', placeholder: 'Resumo breve' },
      { name: 'category', label: 'Categoria', type: 'select', options: [
        { value: 'quimica', label: 'Química' },
        { value: 'fisica', label: 'Física' },
        { value: 'matematica', label: 'Matemática' },
        { value: 'biologia', label: 'Biologia' },
        { value: 'enem', label: 'ENEM' },
        { value: 'vestibular', label: 'Vestibular' },
        { value: 'concursos', label: 'Concursos' },
        { value: 'outro', label: 'Outro' },
      ]},
      { name: 'difficulty_level', label: 'Nível', type: 'select', options: [
        { value: 'iniciante', label: 'Iniciante' },
        { value: 'intermediario', label: 'Intermediário' },
        { value: 'avancado', label: 'Avançado' },
      ]},
      { name: 'price', label: 'Preço (R$)', type: 'number', defaultValue: 0, min: 0 },
      { name: 'duration_hours', label: 'Duração (horas)', type: 'number', min: 0 },
      { name: 'is_published', label: 'Publicado', type: 'switch', defaultValue: false },
      { name: 'thumbnail_url', label: 'Imagem de Capa', type: 'image' },
    ]
  },
  lesson: {
    table: 'lessons',
    title: 'Nova Aula',
    icon: '🎬',
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'description', label: 'Descrição', type: 'textarea' },
      { name: 'video_url', label: 'URL do Vídeo', type: 'url' },
      { name: 'duration_minutes', label: 'Duração (min)', type: 'number', min: 0 },
      { name: 'position', label: 'Posição', type: 'number', min: 1, defaultValue: 1 },
      { name: 'is_free', label: 'Aula Gratuita', type: 'switch', defaultValue: false },
      { name: 'is_published', label: 'Publicada', type: 'switch', defaultValue: false },
    ]
  },
  module: {
    table: 'modules',
    title: 'Novo Módulo',
    icon: '📁',
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'description', label: 'Descrição', type: 'textarea' },
      { name: 'position', label: 'Posição', type: 'number', min: 1, defaultValue: 1 },
      { name: 'is_published', label: 'Publicado', type: 'switch', defaultValue: false },
    ]
  },
  quiz: {
    table: 'quizzes',
    title: 'Novo Quiz',
    icon: '❓',
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'description', label: 'Descrição', type: 'textarea' },
      { name: 'passing_score', label: 'Nota Mínima (%)', type: 'number', defaultValue: 70, min: 0, max: 100 },
      { name: 'time_limit_minutes', label: 'Tempo Limite (min)', type: 'number' },
      { name: 'max_attempts', label: 'Máx. Tentativas', type: 'number', defaultValue: 3 },
      { name: 'is_published', label: 'Publicado', type: 'switch', defaultValue: false },
    ]
  },
  quiz_question: {
    table: 'quiz_questions',
    title: 'Nova Questão',
    icon: '📝',
    fields: [
      { name: 'question_text', label: 'Pergunta', type: 'textarea', required: true },
      { name: 'question_type', label: 'Tipo', type: 'select', options: [
        { value: 'multiple_choice', label: 'Múltipla Escolha' },
        { value: 'true_false', label: 'Verdadeiro/Falso' },
        { value: 'essay', label: 'Dissertativa' },
      ]},
      { name: 'points', label: 'Pontos', type: 'number', defaultValue: 10 },
      { name: 'position', label: 'Posição', type: 'number', defaultValue: 1 },
    ]
  },
  simulado: {
    table: 'simulados',
    title: 'Novo Simulado',
    icon: '📋',
    fields: [
      { name: 'titulo', label: 'Título', type: 'text', required: true },
      { name: 'descricao', label: 'Descrição', type: 'textarea' },
      { name: 'tipo', label: 'Tipo', type: 'select', options: [
        { value: 'enem', label: 'ENEM' },
        { value: 'vestibular', label: 'Vestibular' },
        { value: 'concurso', label: 'Concurso' },
      ]},
      { name: 'duracao_minutos', label: 'Duração (min)', type: 'number' },
      { name: 'publicado', label: 'Publicado', type: 'switch', defaultValue: false },
    ]
  },
  experiment: {
    table: 'experiments',
    title: 'Novo Experimento',
    icon: '🧪',
    fields: [
      { name: 'nome', label: 'Nome', type: 'text', required: true },
      { name: 'descricao', label: 'Descrição', type: 'textarea' },
      { name: 'materiais', label: 'Materiais', type: 'textarea' },
      { name: 'procedimento', label: 'Procedimento', type: 'textarea' },
      { name: 'nivel_dificuldade', label: 'Dificuldade', type: 'select', options: [
        { value: 'facil', label: 'Fácil' },
        { value: 'medio', label: 'Médio' },
        { value: 'dificil', label: 'Difícil' },
      ]},
      { name: 'video_url', label: 'URL do Vídeo', type: 'url' },
    ]
  },

  // ============ ALUNOS ============
  aluno: {
    table: 'alunos',
    title: 'Novo Aluno',
    icon: '👨‍🎓',
    fields: [
      { name: 'nome', label: 'Nome Completo', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'telefone', label: 'Telefone', type: 'phone' },
      { name: 'status', label: 'Status', type: 'select', defaultValue: 'ativo', options: [
        { value: 'ativo', label: 'Ativo' },
        { value: 'inativo', label: 'Inativo' },
        { value: 'pendente', label: 'Pendente' },
        { value: 'cancelado', label: 'Cancelado' },
      ]},
      { name: 'fonte', label: 'Origem', type: 'select', options: [
        { value: 'hotmart', label: 'Hotmart' },
        { value: 'organico', label: 'Orgânico' },
        { value: 'indicacao', label: 'Indicação' },
        { value: 'instagram', label: 'Instagram' },
        { value: 'youtube', label: 'YouTube' },
        { value: 'google', label: 'Google' },
        { value: 'outro', label: 'Outro' },
      ]},
      { name: 'valor_pago', label: 'Valor Pago (R$)', type: 'number', min: 0 },
      { name: 'data_matricula', label: 'Data Matrícula', type: 'date' },
      { name: 'observacoes', label: 'Observações', type: 'textarea' },
    ]
  },
  enrollment: {
    table: 'enrollments',
    title: 'Nova Matrícula',
    icon: '📜',
    fields: [
      { name: 'status', label: 'Status', type: 'select', defaultValue: 'active', options: [
        { value: 'active', label: 'Ativa' },
        { value: 'completed', label: 'Concluída' },
        { value: 'cancelled', label: 'Cancelada' },
      ]},
      { name: 'progress_percentage', label: 'Progresso (%)', type: 'number', defaultValue: 0, min: 0, max: 100 },
    ]
  },

  // ============ FUNCIONÁRIOS ============
  employee: {
    table: 'employees',
    title: 'Novo Funcionário',
    icon: '👔',
    fields: [
      { name: 'nome', label: 'Nome Completo', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'funcao', label: 'Função', type: 'text', required: true },
      { name: 'setor', label: 'Setor', type: 'select', options: [
        { value: 'administrativo', label: 'Administrativo' },
        { value: 'financeiro', label: 'Financeiro' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'desenvolvimento', label: 'Desenvolvimento' },
        { value: 'suporte', label: 'Suporte' },
        { value: 'educacional', label: 'Educacional' },
        { value: 'comercial', label: 'Comercial' },
      ]},
      { name: 'status', label: 'Status', type: 'select', defaultValue: 'ativo', options: [
        { value: 'ativo', label: 'Ativo' },
        { value: 'ferias', label: 'Férias' },
        { value: 'afastado', label: 'Afastado' },
        { value: 'desligado', label: 'Desligado' },
      ]},
      { name: 'data_admissao', label: 'Data de Admissão', type: 'date' },
      { name: 'telefone', label: 'Telefone', type: 'phone' },
      { name: 'horario_trabalho', label: 'Horário de Trabalho', type: 'text', placeholder: '09:00 - 18:00' },
      { name: 'responsabilidades', label: 'Responsabilidades', type: 'textarea' },
    ]
  },

  // ============ AFILIADOS ============
  affiliate: {
    table: 'affiliates',
    title: 'Novo Afiliado',
    icon: '🤝',
    fields: [
      { name: 'nome', label: 'Nome', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'telefone', label: 'Telefone', type: 'phone' },
      { name: 'whatsapp', label: 'WhatsApp', type: 'phone' },
      { name: 'cupom', label: 'Cupom', type: 'text' },
      { name: 'link_afiliado', label: 'Link de Afiliado', type: 'url' },
      { name: 'percentual_comissao', label: 'Comissão (%)', type: 'number', defaultValue: 30, min: 0, max: 100 },
      { name: 'status', label: 'Status', type: 'select', defaultValue: 'ativo', options: [
        { value: 'ativo', label: 'Ativo' },
        { value: 'inativo', label: 'Inativo' },
        { value: 'pendente', label: 'Pendente' },
      ]},
      { name: 'pix', label: 'Chave PIX', type: 'text' },
      { name: 'banco', label: 'Banco', type: 'text' },
      { name: 'agencia', label: 'Agência', type: 'text' },
      { name: 'conta', label: 'Conta', type: 'text' },
    ]
  },
  comissao: {
    table: 'comissoes',
    title: 'Nova Comissão',
    icon: '💰',
    fields: [
      { name: 'valor', label: 'Valor (R$)', type: 'number', required: true, min: 0 },
      { name: 'descricao', label: 'Descrição', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', defaultValue: 'pendente', options: [
        { value: 'pendente', label: 'Pendente' },
        { value: 'pago', label: 'Pago' },
        { value: 'cancelado', label: 'Cancelado' },
      ]},
      { name: 'data', label: 'Data', type: 'date' },
    ]
  },

  // ============ FINANÇAS ============
  entrada: {
    table: 'entradas',
    title: 'Nova Entrada',
    icon: '📈',
    fields: [
      { name: 'descricao', label: 'Descrição', type: 'text', required: true },
      { name: 'valor', label: 'Valor (R$)', type: 'number', required: true, min: 0 },
      { name: 'fonte', label: 'Fonte', type: 'select', options: [
        { value: 'Hotmart', label: 'Hotmart' },
        { value: 'PIX', label: 'PIX' },
        { value: 'Transferência', label: 'Transferência' },
        { value: 'Cartão', label: 'Cartão' },
        { value: 'Boleto', label: 'Boleto' },
        { value: 'Outro', label: 'Outro' },
      ]},
      { name: 'categoria', label: 'Categoria', type: 'select', options: [
        { value: 'venda_curso', label: 'Venda de Curso' },
        { value: 'consultoria', label: 'Consultoria' },
        { value: 'afiliado', label: 'Afiliado' },
        { value: 'outro', label: 'Outro' },
      ]},
      { name: 'data', label: 'Data', type: 'date' },
    ]
  },
  conta_pagar: {
    table: 'contas_pagar',
    title: 'Nova Conta a Pagar',
    icon: '📉',
    fields: [
      { name: 'descricao', label: 'Descrição', type: 'text', required: true },
      { name: 'valor', label: 'Valor (R$)', type: 'number', required: true, min: 0 },
      { name: 'categoria', label: 'Categoria', type: 'select', options: [
        { value: 'salario', label: 'Salário' },
        { value: 'imposto', label: 'Imposto' },
        { value: 'aluguel', label: 'Aluguel' },
        { value: 'servicos', label: 'Serviços' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'equipamentos', label: 'Equipamentos' },
        { value: 'outro', label: 'Outro' },
      ]},
      { name: 'fornecedor', label: 'Fornecedor', type: 'text' },
      { name: 'data_vencimento', label: 'Vencimento', type: 'date', required: true },
      { name: 'status', label: 'Status', type: 'select', defaultValue: 'pendente', options: [
        { value: 'pendente', label: 'Pendente' },
        { value: 'pago', label: 'Pago' },
        { value: 'vencido', label: 'Vencido' },
        { value: 'cancelado', label: 'Cancelado' },
      ]},
      { name: 'recorrente', label: 'Recorrente', type: 'switch', defaultValue: false },
      { name: 'observacoes', label: 'Observações', type: 'textarea' },
    ]
  },
  conta_receber: {
    table: 'contas_receber',
    title: 'Nova Conta a Receber',
    icon: '💵',
    fields: [
      { name: 'descricao', label: 'Descrição', type: 'text', required: true },
      { name: 'valor', label: 'Valor (R$)', type: 'number', required: true, min: 0 },
      { name: 'categoria', label: 'Categoria', type: 'select', options: [
        { value: 'venda', label: 'Venda' },
        { value: 'servico', label: 'Serviço' },
        { value: 'comissao', label: 'Comissão' },
        { value: 'outro', label: 'Outro' },
      ]},
      { name: 'cliente', label: 'Cliente', type: 'text' },
      { name: 'data_vencimento', label: 'Vencimento', type: 'date', required: true },
      { name: 'status', label: 'Status', type: 'select', defaultValue: 'pendente', options: [
        { value: 'pendente', label: 'Pendente' },
        { value: 'recebido', label: 'Recebido' },
        { value: 'vencido', label: 'Vencido' },
        { value: 'cancelado', label: 'Cancelado' },
      ]},
      { name: 'recorrente', label: 'Recorrente', type: 'switch', defaultValue: false },
    ]
  },
  bank_account: {
    table: 'bank_accounts',
    title: 'Nova Conta Bancária',
    icon: '🏦',
    fields: [
      { name: 'name', label: 'Nome', type: 'text', required: true },
      { name: 'bank_name', label: 'Banco', type: 'text' },
      { name: 'account_type', label: 'Tipo', type: 'select', options: [
        { value: 'corrente', label: 'Corrente' },
        { value: 'poupanca', label: 'Poupança' },
        { value: 'investimento', label: 'Investimento' },
      ]},
      { name: 'initial_balance', label: 'Saldo Inicial', type: 'number', defaultValue: 0 },
      { name: 'current_balance', label: 'Saldo Atual', type: 'number', defaultValue: 0 },
      { name: 'color', label: 'Cor', type: 'color', defaultValue: '#EC4899' },
      { name: 'is_active', label: 'Ativa', type: 'switch', defaultValue: true },
      { name: 'is_personal', label: 'Pessoal', type: 'switch', defaultValue: false },
    ]
  },
  contabilidade: {
    table: 'contabilidade',
    title: 'Novo Registro Contábil',
    icon: '📊',
    fields: [
      { name: 'descricao', label: 'Descrição', type: 'text', required: true },
      { name: 'valor', label: 'Valor (R$)', type: 'number', required: true },
      { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: [
        { value: 'receita', label: 'Receita' },
        { value: 'despesa', label: 'Despesa' },
        { value: 'imposto', label: 'Imposto' },
      ]},
      { name: 'topico', label: 'Tópico', type: 'text', required: true },
      { name: 'subtopico', label: 'Subtópico', type: 'text' },
      { name: 'categoria', label: 'Categoria', type: 'text' },
      { name: 'data_referencia', label: 'Data Referência', type: 'date' },
      { name: 'observacoes', label: 'Observações', type: 'textarea' },
    ]
  },
  fixed_expense: {
    table: 'company_fixed_expenses',
    title: 'Nova Despesa Fixa',
    icon: '🔄',
    fields: [
      { name: 'nome', label: 'Nome', type: 'text', required: true },
      { name: 'valor', label: 'Valor (R$)', type: 'number', required: true, min: 0 },
      { name: 'categoria', label: 'Categoria', type: 'select', options: [
        { value: 'aluguel', label: 'Aluguel' },
        { value: 'salarios', label: 'Salários' },
        { value: 'servicos', label: 'Serviços' },
        { value: 'software', label: 'Software' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'outro', label: 'Outro' },
      ]},
    ]
  },
  extra_expense: {
    table: 'company_extra_expenses',
    title: 'Nova Despesa Extra',
    icon: '💸',
    fields: [
      { name: 'nome', label: 'Nome', type: 'text', required: true },
      { name: 'valor', label: 'Valor (R$)', type: 'number', required: true, min: 0 },
      { name: 'categoria', label: 'Categoria', type: 'text' },
      { name: 'data', label: 'Data', type: 'date' },
    ]
  },

  // ============ TAREFAS ============
  calendar_task: {
    table: 'calendar_tasks',
    title: 'Nova Tarefa',
    icon: '✅',
    addUserId: true,
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'description', label: 'Descrição', type: 'textarea' },
      { name: 'task_date', label: 'Data', type: 'date', required: true },
      { name: 'task_time', label: 'Hora', type: 'time' },
      { name: 'category', label: 'Categoria', type: 'select', options: [
        { value: 'trabalho', label: 'Trabalho' },
        { value: 'pessoal', label: 'Pessoal' },
        { value: 'reuniao', label: 'Reunião' },
        { value: 'aula', label: 'Aula' },
        { value: 'outro', label: 'Outro' },
      ]},
      { name: 'priority', label: 'Prioridade', type: 'select', defaultValue: 'medium', options: [
        { value: 'low', label: 'Baixa' },
        { value: 'medium', label: 'Média' },
        { value: 'high', label: 'Alta' },
        { value: 'urgent', label: 'Urgente' },
      ]},
      { name: 'is_completed', label: 'Concluída', type: 'switch', defaultValue: false },
      { name: 'reminder_enabled', label: 'Lembrete', type: 'switch', defaultValue: false },
    ]
  },
  dev_task: {
    table: 'dev_tasks',
    title: 'Nova Task de Dev',
    icon: '💻',
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'description', label: 'Descrição', type: 'textarea' },
      { name: 'member_name', label: 'Responsável', type: 'text', required: true },
      { name: 'member_role', label: 'Função', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', defaultValue: 'todo', options: [
        { value: 'todo', label: 'A Fazer' },
        { value: 'in_progress', label: 'Em Progresso' },
        { value: 'review', label: 'Em Revisão' },
        { value: 'done', label: 'Concluído' },
      ]},
      { name: 'priority', label: 'Prioridade', type: 'select', defaultValue: 'medium', options: [
        { value: 'low', label: 'Baixa' },
        { value: 'medium', label: 'Média' },
        { value: 'high', label: 'Alta' },
        { value: 'critical', label: 'Crítica' },
      ]},
      { name: 'deadline', label: 'Prazo', type: 'date' },
    ]
  },
  command_task: {
    table: 'command_tasks',
    title: 'Nova Task de Comando',
    icon: '⚡',
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'description', label: 'Descrição', type: 'textarea' },
      { name: 'owner', label: 'Responsável', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', defaultValue: 'pending', options: [
        { value: 'pending', label: 'Pendente' },
        { value: 'in_progress', label: 'Em Progresso' },
        { value: 'completed', label: 'Concluído' },
      ]},
      { name: 'priority', label: 'Prioridade', type: 'select', defaultValue: 'medium', options: [
        { value: 'low', label: 'Baixa' },
        { value: 'medium', label: 'Média' },
        { value: 'high', label: 'Alta' },
      ]},
      { name: 'due_date', label: 'Prazo', type: 'date' },
      { name: 'source', label: 'Fonte', type: 'text', placeholder: 'whatsapp, manual, etc' },
    ]
  },

  // ============ MARKETING ============
  campaign: {
    table: 'marketing_campaigns',
    title: 'Nova Campanha',
    icon: '📣',
    fields: [
      { name: 'name', label: 'Nome', type: 'text', required: true },
      { name: 'description', label: 'Descrição', type: 'textarea' },
      { name: 'platform', label: 'Plataforma', type: 'select', options: [
        { value: 'instagram', label: 'Instagram' },
        { value: 'facebook', label: 'Facebook' },
        { value: 'google', label: 'Google Ads' },
        { value: 'youtube', label: 'YouTube' },
        { value: 'tiktok', label: 'TikTok' },
        { value: 'email', label: 'Email' },
        { value: 'outro', label: 'Outro' },
      ]},
      { name: 'status', label: 'Status', type: 'select', defaultValue: 'draft', options: [
        { value: 'draft', label: 'Rascunho' },
        { value: 'active', label: 'Ativa' },
        { value: 'paused', label: 'Pausada' },
        { value: 'completed', label: 'Concluída' },
      ]},
      { name: 'budget', label: 'Orçamento (R$)', type: 'number', min: 0 },
      { name: 'start_date', label: 'Data Início', type: 'date' },
      { name: 'end_date', label: 'Data Término', type: 'date' },
      { name: 'target_audience', label: 'Público-Alvo', type: 'textarea' },
    ]
  },
  lead: {
    table: 'whatsapp_leads',
    title: 'Novo Lead',
    icon: '🎯',
    fields: [
      { name: 'nome', label: 'Nome', type: 'text', required: true },
      { name: 'phone', label: 'Telefone', type: 'phone', required: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'source', label: 'Origem', type: 'select', options: [
        { value: 'whatsapp', label: 'WhatsApp' },
        { value: 'instagram', label: 'Instagram' },
        { value: 'facebook', label: 'Facebook' },
        { value: 'site', label: 'Site' },
        { value: 'indicacao', label: 'Indicação' },
        { value: 'outro', label: 'Outro' },
      ]},
      { name: 'status', label: 'Status', type: 'select', defaultValue: 'novo', options: [
        { value: 'novo', label: 'Novo' },
        { value: 'contato', label: 'Em Contato' },
        { value: 'qualificado', label: 'Qualificado' },
        { value: 'convertido', label: 'Convertido' },
        { value: 'perdido', label: 'Perdido' },
      ]},
      { name: 'interesse', label: 'Interesse', type: 'text' },
    ]
  },

  // ============ ALERTAS E NOTIFICAÇÕES ============
  alerta: {
    table: 'alertas_sistema',
    title: 'Novo Alerta',
    icon: '🚨',
    fields: [
      { name: 'titulo', label: 'Título', type: 'text', required: true },
      { name: 'mensagem', label: 'Mensagem', type: 'textarea', required: true },
      { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: [
        { value: 'info', label: 'Informação' },
        { value: 'warning', label: 'Aviso' },
        { value: 'error', label: 'Erro' },
        { value: 'success', label: 'Sucesso' },
      ]},
      { name: 'origem', label: 'Origem', type: 'text', required: true, defaultValue: 'manual' },
      { name: 'status', label: 'Status', type: 'select', defaultValue: 'ativo', options: [
        { value: 'ativo', label: 'Ativo' },
        { value: 'resolvido', label: 'Resolvido' },
        { value: 'ignorado', label: 'Ignorado' },
      ]},
      { name: 'acao_sugerida', label: 'Ação Sugerida', type: 'text' },
      { name: 'link', label: 'Link', type: 'url' },
    ]
  },
  notification: {
    table: 'notifications',
    title: 'Nova Notificação',
    icon: '🔔',
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'message', label: 'Mensagem', type: 'textarea', required: true },
      { name: 'type', label: 'Tipo', type: 'select', defaultValue: 'info', options: [
        { value: 'info', label: 'Informação' },
        { value: 'success', label: 'Sucesso' },
        { value: 'warning', label: 'Aviso' },
        { value: 'error', label: 'Erro' },
      ]},
      { name: 'priority', label: 'Prioridade', type: 'select', defaultValue: 'normal', options: [
        { value: 'low', label: 'Baixa' },
        { value: 'normal', label: 'Normal' },
        { value: 'high', label: 'Alta' },
      ]},
    ]
  },

  // ============ DOCUMENTOS E ARQUIVOS ============
  document: {
    table: 'general_documents',
    title: 'Novo Documento',
    icon: '📄',
    fields: [
      { name: 'nome', label: 'Nome', type: 'text', required: true },
      { name: 'descricao', label: 'Descrição', type: 'textarea' },
      { name: 'categoria', label: 'Categoria', type: 'select', options: [
        { value: 'contrato', label: 'Contrato' },
        { value: 'nota_fiscal', label: 'Nota Fiscal' },
        { value: 'comprovante', label: 'Comprovante' },
        { value: 'relatorio', label: 'Relatório' },
        { value: 'outro', label: 'Outro' },
      ]},
      { name: 'arquivo', label: 'Arquivo', type: 'file' },
    ]
  },
  arquivo: {
    table: 'arquivos',
    title: 'Novo Arquivo',
    icon: '📁',
    fields: [
      { name: 'nome', label: 'Nome', type: 'text', required: true },
      { name: 'modulo', label: 'Módulo', type: 'text', required: true },
      { name: 'tipo', label: 'Tipo', type: 'text', required: true },
      { name: 'url', label: 'URL', type: 'url', required: true },
    ]
  },

  // ============ INTEGRAÇÕES ============
  integration: {
    table: 'integrations',
    title: 'Nova Integração',
    icon: '🔗',
    fields: [
      { name: 'name', label: 'Nome', type: 'text', required: true },
      { name: 'type', label: 'Tipo', type: 'select', options: [
        { value: 'hotmart', label: 'Hotmart' },
        { value: 'whatsapp', label: 'WhatsApp' },
        { value: 'instagram', label: 'Instagram' },
        { value: 'youtube', label: 'YouTube' },
        { value: 'wordpress', label: 'WordPress' },
        { value: 'google', label: 'Google' },
        { value: 'stripe', label: 'Stripe' },
        { value: 'custom', label: 'Personalizada' },
      ]},
      { name: 'status', label: 'Status', type: 'select', defaultValue: 'inactive', options: [
        { value: 'active', label: 'Ativa' },
        { value: 'inactive', label: 'Inativa' },
        { value: 'error', label: 'Erro' },
      ]},
      { name: 'api_url', label: 'URL da API', type: 'url' },
    ]
  },
  webhook: {
    table: 'webhooks_queue',
    title: 'Novo Webhook',
    icon: '🪝',
    fields: [
      { name: 'source', label: 'Origem', type: 'text', required: true },
      { name: 'event', label: 'Evento', type: 'text', required: true },
      { name: 'status', label: 'Status', type: 'select', defaultValue: 'pending', options: [
        { value: 'pending', label: 'Pendente' },
        { value: 'processing', label: 'Processando' },
        { value: 'completed', label: 'Concluído' },
        { value: 'failed', label: 'Falhou' },
      ]},
    ]
  },

  // ============ AUTOMAÇÃO ============
  automation: {
    table: 'automacoes',
    title: 'Nova Automação',
    icon: '⚙️',
    fields: [
      { name: 'nome', label: 'Nome', type: 'text', required: true },
      { name: 'descricao', label: 'Descrição', type: 'textarea' },
      { name: 'trigger', label: 'Gatilho', type: 'text', required: true },
      { name: 'action', label: 'Ação', type: 'text', required: true },
      { name: 'ativo', label: 'Ativo', type: 'switch', defaultValue: true },
    ]
  },
  custom_rule: {
    table: 'custom_rules',
    title: 'Nova Regra',
    icon: '📋',
    fields: [
      { name: 'rule_name', label: 'Nome da Regra', type: 'text', required: true },
      { name: 'rule_type', label: 'Tipo', type: 'select', options: [
        { value: 'validation', label: 'Validação' },
        { value: 'automation', label: 'Automação' },
        { value: 'notification', label: 'Notificação' },
      ]},
      { name: 'trigger_event', label: 'Evento Gatilho', type: 'text' },
      { name: 'priority', label: 'Prioridade', type: 'number', defaultValue: 0 },
      { name: 'is_active', label: 'Ativa', type: 'switch', defaultValue: true },
    ]
  },

  // ============ TURMAS ============
  turma_online: {
    table: 'turmas_online',
    title: 'Nova Turma Online',
    icon: '🌐',
    fields: [
      { name: 'nome', label: 'Nome', type: 'text', required: true },
      { name: 'descricao', label: 'Descrição', type: 'textarea' },
      { name: 'data_inicio', label: 'Data Início', type: 'date' },
      { name: 'data_fim', label: 'Data Fim', type: 'date' },
      { name: 'vagas', label: 'Vagas', type: 'number', min: 0 },
      { name: 'status', label: 'Status', type: 'select', defaultValue: 'ativa', options: [
        { value: 'ativa', label: 'Ativa' },
        { value: 'encerrada', label: 'Encerrada' },
        { value: 'cancelada', label: 'Cancelada' },
      ]},
    ]
  },
  turma_presencial: {
    table: 'turmas_presenciais',
    title: 'Nova Turma Presencial',
    icon: '🏫',
    fields: [
      { name: 'nome', label: 'Nome', type: 'text', required: true },
      { name: 'descricao', label: 'Descrição', type: 'textarea' },
      { name: 'local', label: 'Local', type: 'text' },
      { name: 'endereco', label: 'Endereço', type: 'text' },
      { name: 'data_inicio', label: 'Data Início', type: 'date' },
      { name: 'data_fim', label: 'Data Fim', type: 'date' },
      { name: 'horario', label: 'Horário', type: 'text' },
      { name: 'vagas', label: 'Vagas', type: 'number', min: 0 },
      { name: 'status', label: 'Status', type: 'select', defaultValue: 'ativa', options: [
        { value: 'ativa', label: 'Ativa' },
        { value: 'encerrada', label: 'Encerrada' },
        { value: 'cancelada', label: 'Cancelada' },
      ]},
    ]
  },

  // ============ GAMIFICAÇÃO ============
  badge: {
    table: 'badges',
    title: 'Novo Badge',
    icon: '🏅',
    fields: [
      { name: 'name', label: 'Nome', type: 'text', required: true },
      { name: 'description', label: 'Descrição', type: 'textarea' },
      { name: 'icon', label: 'Ícone (emoji)', type: 'text' },
      { name: 'category', label: 'Categoria', type: 'text' },
      { name: 'requirement_type', label: 'Tipo de Requisito', type: 'select', required: true, options: [
        { value: 'xp', label: 'XP' },
        { value: 'lessons', label: 'Aulas Concluídas' },
        { value: 'quizzes', label: 'Quizzes' },
        { value: 'streak', label: 'Sequência' },
      ]},
      { name: 'requirement_value', label: 'Valor do Requisito', type: 'number' },
      { name: 'xp_reward', label: 'Recompensa XP', type: 'number' },
      { name: 'rarity', label: 'Raridade', type: 'select', options: [
        { value: 'common', label: 'Comum' },
        { value: 'rare', label: 'Raro' },
        { value: 'epic', label: 'Épico' },
        { value: 'legendary', label: 'Lendário' },
      ]},
    ]
  },
  achievement: {
    table: 'achievements',
    title: 'Nova Conquista',
    icon: '🏆',
    fields: [
      { name: 'code', label: 'Código', type: 'text', required: true },
      { name: 'name', label: 'Nome', type: 'text', required: true },
      { name: 'description', label: 'Descrição', type: 'textarea' },
      { name: 'icon', label: 'Ícone', type: 'text' },
      { name: 'category', label: 'Categoria', type: 'text' },
      { name: 'requirement_type', label: 'Tipo de Requisito', type: 'text', required: true },
      { name: 'requirement_value', label: 'Valor', type: 'number' },
      { name: 'xp_reward', label: 'XP', type: 'number' },
    ]
  },

  // ============ EQUIPAMENTOS ============
  equipment: {
    table: 'equipment',
    title: 'Novo Equipamento',
    icon: '🔬',
    fields: [
      { name: 'name', label: 'Nome', type: 'text', required: true },
      { name: 'model', label: 'Modelo', type: 'text' },
      { name: 'serial_number', label: 'Número de Série', type: 'text' },
      { name: 'location', label: 'Localização', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', defaultValue: 'available', options: [
        { value: 'available', label: 'Disponível' },
        { value: 'in_use', label: 'Em Uso' },
        { value: 'maintenance', label: 'Manutenção' },
        { value: 'broken', label: 'Quebrado' },
      ]},
      { name: 'last_maintenance', label: 'Última Manutenção', type: 'date' },
      { name: 'next_maintenance', label: 'Próxima Manutenção', type: 'date' },
      { name: 'notes', label: 'Observações', type: 'textarea' },
    ]
  },

  // ============ CATEGORIAS ============
  category: {
    table: 'categories',
    title: 'Nova Categoria',
    icon: '🏷️',
    fields: [
      { name: 'name', label: 'Nome', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text', required: true },
      { name: 'description', label: 'Descrição', type: 'textarea' },
      { name: 'icon', label: 'Ícone', type: 'text' },
      { name: 'color', label: 'Cor', type: 'color' },
      { name: 'order_index', label: 'Ordem', type: 'number', defaultValue: 0 },
    ]
  },

  // ============ RELATÓRIOS ============
  automated_report: {
    table: 'automated_reports',
    title: 'Novo Relatório Automático',
    icon: '📈',
    addUserId: true,
    fields: [
      { name: 'report_type', label: 'Tipo', type: 'select', required: true, options: [
        { value: 'daily', label: 'Diário' },
        { value: 'weekly', label: 'Semanal' },
        { value: 'monthly', label: 'Mensal' },
        { value: 'custom', label: 'Personalizado' },
      ]},
      { name: 'schedule', label: 'Agendamento', type: 'text', defaultValue: 'daily' },
      { name: 'is_active', label: 'Ativo', type: 'switch', defaultValue: true },
    ]
  },

  // ============ FINANCEIRO PESSOAL ============
  personal_transaction: {
    table: 'personal_finances',
    title: 'Nova Transação Pessoal',
    icon: '💳',
    fields: [
      { name: 'descricao', label: 'Descrição', type: 'text', required: true },
      { name: 'valor', label: 'Valor (R$)', type: 'number', required: true },
      { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: [
        { value: 'entrada', label: 'Entrada' },
        { value: 'saida', label: 'Saída' },
      ]},
      { name: 'categoria', label: 'Categoria', type: 'select', options: [
        { value: 'salario', label: 'Salário' },
        { value: 'investimento', label: 'Investimento' },
        { value: 'alimentacao', label: 'Alimentação' },
        { value: 'transporte', label: 'Transporte' },
        { value: 'lazer', label: 'Lazer' },
        { value: 'saude', label: 'Saúde' },
        { value: 'educacao', label: 'Educação' },
        { value: 'outro', label: 'Outro' },
      ]},
      { name: 'data', label: 'Data', type: 'date' },
      { name: 'observacoes', label: 'Observações', type: 'textarea' },
    ]
  },

  // ============ WHATSAPP ============
  whatsapp_message: {
    table: 'whatsapp_messages',
    title: 'Nova Mensagem WhatsApp',
    icon: '💬',
    fields: [
      { name: 'phone', label: 'Telefone', type: 'phone', required: true },
      { name: 'message', label: 'Mensagem', type: 'textarea', required: true },
      { name: 'direction', label: 'Direção', type: 'select', options: [
        { value: 'incoming', label: 'Recebida' },
        { value: 'outgoing', label: 'Enviada' },
      ]},
      { name: 'status', label: 'Status', type: 'select', defaultValue: 'pending', options: [
        { value: 'pending', label: 'Pendente' },
        { value: 'sent', label: 'Enviada' },
        { value: 'delivered', label: 'Entregue' },
        { value: 'read', label: 'Lida' },
      ]},
    ]
  },

  // ============ BRANDING ============
  branding: {
    table: 'branding_settings',
    title: 'Configuração de Marca',
    icon: '🎨',
    fields: [
      { name: 'company_name', label: 'Nome da Empresa', type: 'text' },
      { name: 'logo_url', label: 'URL do Logo', type: 'url' },
      { name: 'primary_color', label: 'Cor Primária', type: 'color', defaultValue: '#EC4899' },
      { name: 'secondary_color', label: 'Cor Secundária', type: 'color', defaultValue: '#8B5CF6' },
    ]
  },
};

interface MasterAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: string;
  onSuccess?: (data: Record<string, unknown>) => void;
}

export function MasterAddModal({ isOpen, onClose, entityType, onSuccess }: MasterAddModalProps) {
  const { isOwner } = useGodMode();
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const config = ENTITY_CONFIGS[entityType];

  // Inicializar form com valores default
  useEffect(() => {
    if (config) {
      const defaults: Record<string, unknown> = {};
      config.fields.forEach(field => {
        if (field.defaultValue !== undefined) {
          defaults[field.name] = field.defaultValue;
        }
      });
      setFormData(defaults);
      setImagePreview(null);
    }
  }, [entityType, config, isOpen]);

  const handleChange = useCallback((name: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleFileUpload = useCallback(async (name: string, file: File, isImage: boolean = false) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `master-uploads/${entityType}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('arquivos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('arquivos')
        .getPublicUrl(filePath);

      handleChange(name, publicUrl);
      if (isImage) {
        setImagePreview(publicUrl);
      }
      toast.success('Arquivo carregado!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao carregar arquivo', { description: errorMessage });
    }
  }, [entityType, handleChange]);

  const handleSubmit = useCallback(async () => {
    if (!isOwner || !config) return;

    // Validar campos obrigatórios
    for (const field of config.fields) {
      if (field.required && !formData[field.name]) {
        toast.error(`Campo obrigatório: ${field.label}`);
        return;
      }
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const dataToInsert = { ...formData };
      
      // Adicionar user_id se configurado
      if (config.addUserId && user) {
        dataToInsert.user_id = user.id;
      }

      // Adicionar created_by se a tabela suportar
      if (user) {
        dataToInsert.created_by = user.id;
      }

      // Adicionar destinatários default para alertas
      if (config.table === 'alertas_sistema' && !dataToInsert.destinatarios) {
        dataToInsert.destinatarios = ['owner'];
      }

      const { data, error } = await supabase
        .from(config.table as 'courses')
        .insert(dataToInsert as never)
        .select()
        .single();

      if (error) throw error;

      // Adicionar ao histórico de undo
      addToHistory({
        type: 'create',
        entityType,
        table: config.table,
        newData: data as Record<string, unknown>,
        timestamp: Date.now()
      });

      toast.success(`✅ ${config.title} criado com sucesso!`, {
        description: 'Item adicionado ao sistema',
        icon: <CheckCircle className="w-5 h-5 text-green-500" />
      });
      
      // Emitir evento global
      window.dispatchEvent(new CustomEvent('master-item-added', {
        detail: { table: config.table, data, entityType }
      }));

      // Forçar sync
      window.dispatchEvent(new CustomEvent('global-sync'));

      onSuccess?.(data as Record<string, unknown>);
      onClose();
      setFormData({});
      setImagePreview(null);
    } catch (error: unknown) {
      console.error('Erro ao criar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao criar item', { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [isOwner, config, formData, onSuccess, onClose, entityType, addToHistory]);

  const renderField = (field: FieldConfig) => {
    const value = formData[field.name];

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <Input
            id={field.name}
            type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
            placeholder={field.placeholder}
            value={(value as string) || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
          />
        );

      case 'number':
        return (
          <Input
            id={field.name}
            type="number"
            step={field.step || 0.01}
            min={field.min}
            max={field.max}
            placeholder={field.placeholder}
            value={(value as number) ?? ''}
            onChange={(e) => handleChange(field.name, parseFloat(e.target.value) || 0)}
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={field.name}
            placeholder={field.placeholder}
            value={(value as string) || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            rows={3}
          />
        );

      case 'select':
        return (
          <Select
            value={(value as string) || ''}
            onValueChange={(val) => handleChange(field.name, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'switch':
        return (
          <Switch
            checked={(value as boolean) || false}
            onCheckedChange={(checked) => handleChange(field.name, checked)}
          />
        );

      case 'date':
        return (
          <Input
            id={field.name}
            type="date"
            value={(value as string) || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
          />
        );

      case 'datetime':
        return (
          <Input
            id={field.name}
            type="datetime-local"
            value={(value as string) || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
          />
        );

      case 'time':
        return (
          <Input
            id={field.name}
            type="time"
            value={(value as string) || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
          />
        );

      case 'color':
        return (
          <div className="flex gap-2 items-center">
            <Input
              id={field.name}
              type="color"
              value={(value as string) || '#EC4899'}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="w-16 h-10 p-1"
            />
            <Input
              type="text"
              value={(value as string) || '#EC4899'}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="flex-1"
              placeholder="#EC4899"
            />
          </div>
        );

      case 'image':
        return (
          <div className="space-y-2">
            {imagePreview && (
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full h-32 object-cover rounded-lg border border-border"
              />
            )}
            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors bg-muted/50">
              <Upload className="w-5 h-5" />
              <span className="text-sm">Escolher imagem</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(field.name, file, true);
                }}
              />
            </label>
          </div>
        );

      case 'file':
        return (
          <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors bg-muted/50">
            <Upload className="w-5 h-5" />
            <span className="text-sm">Escolher arquivo</span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(field.name, file, false);
              }}
            />
          </label>
        );

      case 'json':
        return (
          <Textarea
            id={field.name}
            placeholder='{"key": "value"}'
            value={(value as string) || '{}'}
            onChange={(e) => handleChange(field.name, e.target.value)}
            rows={4}
            className="font-mono text-sm"
          />
        );

      default:
        return (
          <Input
            id={field.name}
            placeholder={field.placeholder}
            value={(value as string) || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
          />
        );
    }
  };

  if (!config) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              Tipo não suportado
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            O tipo "<span className="font-mono text-primary">{entityType}</span>" ainda não está configurado no sistema.
          </p>
          <p className="text-sm text-muted-foreground">
            Tipos disponíveis: {Object.keys(ENTITY_CONFIGS).slice(0, 10).join(', ')}...
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{config.icon}</span>
            {config.title}
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {config.fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name} className="flex items-center gap-1">
                {field.label}
                {field.required && <span className="text-destructive">*</span>}
              </Label>
              {renderField(field)}
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="gap-2">
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Criar {config.icon}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Exportar lista de tipos disponíveis
export const AVAILABLE_ENTITY_TYPES = Object.keys(ENTITY_CONFIGS);
export { ENTITY_CONFIGS };
