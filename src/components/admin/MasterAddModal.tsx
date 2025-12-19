// ============================================
// MOISÉS MEDEIROS v13.0 - MASTER ADD MODAL
// Modal inteligente para adicionar novos itens
// Com todos os campos e configurações
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
import { Loader2, Upload, Image as ImageIcon } from 'lucide-react';

interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'switch' | 'date' | 'file' | 'image';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: unknown;
}

interface EntityConfig {
  table: string;
  title: string;
  fields: FieldConfig[];
}

// Configuração de campos por tipo de entidade
const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  course: {
    table: 'courses',
    title: 'Novo Curso',
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true, placeholder: 'Nome do curso' },
      { name: 'description', label: 'Descrição', type: 'textarea', placeholder: 'Descrição detalhada' },
      { name: 'short_description', label: 'Descrição Curta', type: 'text', placeholder: 'Resumo breve' },
      { name: 'category', label: 'Categoria', type: 'select', options: [
        { value: 'quimica', label: 'Química' },
        { value: 'fisica', label: 'Física' },
        { value: 'matematica', label: 'Matemática' },
        { value: 'biologia', label: 'Biologia' },
        { value: 'outro', label: 'Outro' },
      ]},
      { name: 'difficulty_level', label: 'Nível', type: 'select', options: [
        { value: 'iniciante', label: 'Iniciante' },
        { value: 'intermediario', label: 'Intermediário' },
        { value: 'avancado', label: 'Avançado' },
      ]},
      { name: 'price', label: 'Preço (R$)', type: 'number', defaultValue: 0 },
      { name: 'is_published', label: 'Publicado', type: 'switch', defaultValue: false },
      { name: 'thumbnail_url', label: 'Imagem de Capa', type: 'image' },
    ]
  },
  employee: {
    table: 'employees',
    title: 'Novo Funcionário',
    fields: [
      { name: 'nome', label: 'Nome Completo', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'text' },
      { name: 'cargo', label: 'Cargo', type: 'text' },
      { name: 'departamento', label: 'Departamento', type: 'select', options: [
        { value: 'administrativo', label: 'Administrativo' },
        { value: 'financeiro', label: 'Financeiro' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'desenvolvimento', label: 'Desenvolvimento' },
        { value: 'suporte', label: 'Suporte' },
      ]},
      { name: 'status', label: 'Status', type: 'select', defaultValue: 'ativo', options: [
        { value: 'ativo', label: 'Ativo' },
        { value: 'ferias', label: 'Férias' },
        { value: 'afastado', label: 'Afastado' },
        { value: 'desligado', label: 'Desligado' },
      ]},
      { name: 'data_admissao', label: 'Data de Admissão', type: 'date' },
      { name: 'telefone', label: 'Telefone', type: 'text' },
    ]
  },
  task: {
    table: 'tasks',
    title: 'Nova Tarefa',
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'description', label: 'Descrição', type: 'textarea' },
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
        { value: 'urgent', label: 'Urgente' },
      ]},
      { name: 'due_date', label: 'Data Limite', type: 'date' },
    ]
  },
  transaction: {
    table: 'transactions',
    title: 'Nova Transação',
    fields: [
      { name: 'description', label: 'Descrição', type: 'text', required: true },
      { name: 'amount', label: 'Valor (R$)', type: 'number', required: true },
      { name: 'type', label: 'Tipo', type: 'select', required: true, options: [
        { value: 'income', label: 'Receita' },
        { value: 'expense', label: 'Despesa' },
      ]},
      { name: 'category', label: 'Categoria', type: 'text' },
      { name: 'date', label: 'Data', type: 'date' },
    ]
  },
  aluno: {
    table: 'alunos',
    title: 'Novo Aluno',
    fields: [
      { name: 'nome', label: 'Nome Completo', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'text', required: true },
      { name: 'telefone', label: 'Telefone', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', defaultValue: 'ativo', options: [
        { value: 'ativo', label: 'Ativo' },
        { value: 'inativo', label: 'Inativo' },
        { value: 'pendente', label: 'Pendente' },
      ]},
      { name: 'fonte', label: 'Fonte', type: 'select', options: [
        { value: 'hotmart', label: 'Hotmart' },
        { value: 'organico', label: 'Orgânico' },
        { value: 'indicacao', label: 'Indicação' },
        { value: 'outro', label: 'Outro' },
      ]},
      { name: 'observacoes', label: 'Observações', type: 'textarea' },
    ]
  },
  campaign: {
    table: 'marketing_campaigns',
    title: 'Nova Campanha',
    fields: [
      { name: 'name', label: 'Nome da Campanha', type: 'text', required: true },
      { name: 'description', label: 'Descrição', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', defaultValue: 'draft', options: [
        { value: 'draft', label: 'Rascunho' },
        { value: 'active', label: 'Ativa' },
        { value: 'paused', label: 'Pausada' },
        { value: 'completed', label: 'Concluída' },
      ]},
      { name: 'budget', label: 'Orçamento (R$)', type: 'number' },
      { name: 'start_date', label: 'Data de Início', type: 'date' },
      { name: 'end_date', label: 'Data de Término', type: 'date' },
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
    }
  }, [entityType, config]);

  const handleChange = useCallback((name: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleImageUpload = useCallback(async (name: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `uploads/${entityType}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('general-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('general-documents')
        .getPublicUrl(filePath);

      handleChange(name, publicUrl);
      setImagePreview(publicUrl);
      toast.success('Imagem carregada!');
    } catch (error: any) {
      toast.error('Erro ao carregar imagem', { description: error.message });
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
      // Adicionar user_id se necessário
      const { data: { user } } = await supabase.auth.getUser();
      const dataToInsert = { ...formData };
      
      if (['tasks', 'calendar_tasks', 'transactions'].includes(config.table) && user) {
        dataToInsert.user_id = user.id;
      }

      const { data, error } = await supabase
        .from(config.table as 'courses')
        .insert(dataToInsert as never)
        .select()
        .single();

      if (error) throw error;

      toast.success(`✅ ${config.title} criado com sucesso!`);
      
      // Emitir evento
      window.dispatchEvent(new CustomEvent('master-item-added', {
        detail: { table: config.table, data, entityType }
      }));

      onSuccess?.(data as Record<string, unknown>);
      onClose();
      setFormData({});
      setImagePreview(null);
    } catch (error: any) {
      console.error('Erro ao criar:', error);
      toast.error('Erro ao criar item', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [isOwner, config, formData, onSuccess, onClose]);

  if (!config) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tipo não suportado</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">O tipo "{entityType}" ainda não está configurado.</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            {config.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {config.fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name} className="flex items-center gap-1">
                {field.label}
                {field.required && <span className="text-destructive">*</span>}
              </Label>

              {field.type === 'text' && (
                <Input
                  id={field.name}
                  placeholder={field.placeholder}
                  value={(formData[field.name] as string) || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                />
              )}

              {field.type === 'number' && (
                <Input
                  id={field.name}
                  type="number"
                  step="0.01"
                  placeholder={field.placeholder}
                  value={(formData[field.name] as number) || ''}
                  onChange={(e) => handleChange(field.name, parseFloat(e.target.value) || 0)}
                />
              )}

              {field.type === 'textarea' && (
                <Textarea
                  id={field.name}
                  placeholder={field.placeholder}
                  value={(formData[field.name] as string) || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  rows={3}
                />
              )}

              {field.type === 'select' && field.options && (
                <Select
                  value={(formData[field.name] as string) || ''}
                  onValueChange={(value) => handleChange(field.name, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {field.type === 'switch' && (
                <Switch
                  checked={(formData[field.name] as boolean) || false}
                  onCheckedChange={(checked) => handleChange(field.name, checked)}
                />
              )}

              {field.type === 'date' && (
                <Input
                  id={field.name}
                  type="date"
                  value={(formData[field.name] as string) || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                />
              )}

              {field.type === 'image' && (
                <div className="space-y-2">
                  {imagePreview && (
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}
                  <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <Upload className="w-5 h-5" />
                    <span className="text-sm">Escolher imagem</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(field.name, file);
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
