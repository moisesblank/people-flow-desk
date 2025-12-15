// ============================================
// MOISES MEDEIROS v5.0 - AUTOMATION RULES
// Sistema de Automações e Regras de Negócio
// ============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Play,
  Pause,
  Plus,
  Edit,
  Trash2,
  Settings,
  Bell,
  Mail,
  Calendar,
  DollarSign,
  Users,
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Workflow,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AutomationRule {
  id: string;
  rule_name: string;
  rule_type: string;
  trigger_event: string;
  conditions: any[];
  actions: any[];
  is_active: boolean;
  priority: number;
  created_at: string;
}

const triggerEvents = [
  { value: "new_student", label: "Novo Aluno Matriculado", icon: Users },
  { value: "new_sale", label: "Nova Venda Realizada", icon: DollarSign },
  { value: "task_overdue", label: "Tarefa Atrasada", icon: Calendar },
  { value: "low_stock", label: "Estoque Baixo", icon: AlertTriangle },
  { value: "goal_reached", label: "Meta Atingida", icon: Target },
  { value: "schedule", label: "Agendamento (Cron)", icon: Clock },
];

const actionTypes = [
  { value: "send_email", label: "Enviar E-mail", icon: Mail },
  { value: "send_notification", label: "Criar Notificação", icon: Bell },
  { value: "create_task", label: "Criar Tarefa", icon: Calendar },
  { value: "webhook", label: "Chamar Webhook", icon: Zap },
];

const ruleTypeColors: Record<string, string> = {
  automation: "bg-stats-blue/10 text-stats-blue border-stats-blue/20",
  notification: "bg-stats-gold/10 text-stats-gold border-stats-gold/20",
  workflow: "bg-stats-purple/10 text-stats-purple border-stats-purple/20",
};

function AutomationRuleCard({
  rule,
  onToggle,
  onEdit,
  onDelete,
}: {
  rule: AutomationRule;
  onToggle: (id: string, active: boolean) => void;
  onEdit: (rule: AutomationRule) => void;
  onDelete: (id: string) => void;
}) {
  const trigger = triggerEvents.find(t => t.value === rule.trigger_event);
  const TriggerIcon = trigger?.icon || Zap;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "p-4 rounded-xl border transition-all",
        rule.is_active 
          ? "bg-card/80 border-primary/30 shadow-sm" 
          : "bg-card/40 border-border/50 opacity-70"
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "p-3 rounded-lg border shrink-0",
          rule.is_active ? "bg-primary/10 border-primary/30" : "bg-muted border-border"
        )}>
          <TriggerIcon className={cn(
            "h-5 w-5",
            rule.is_active ? "text-primary" : "text-muted-foreground"
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium truncate">{rule.rule_name}</h4>
            <Badge variant="outline" className={ruleTypeColors[rule.rule_type]}>
              {rule.rule_type}
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground mb-2">
            Quando: {trigger?.label || rule.trigger_event}
          </p>

          <div className="flex flex-wrap gap-1">
            {rule.actions?.slice(0, 3).map((action: any, index: number) => {
              const actionDef = actionTypes.find(a => a.value === action.type);
              const ActionIcon = actionDef?.icon || Zap;
              return (
                <Badge key={index} variant="secondary" className="text-xs">
                  <ActionIcon className="h-3 w-3 mr-1" />
                  {actionDef?.label || action.type}
                </Badge>
              );
            })}
            {rule.actions?.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{rule.actions.length - 3}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Switch
            checked={rule.is_active}
            onCheckedChange={(checked) => onToggle(rule.id, checked)}
          />
          <Button variant="ghost" size="icon" onClick={() => onEdit(rule)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onDelete(rule.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function AutomationRules() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    rule_name: "",
    rule_type: "automation",
    trigger_event: "",
    actions: [] as any[],
  });

  // Fetch rules
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["automation-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_rules")
        .select("*")
        .order("priority", { ascending: true });
      
      if (error) throw error;
      return data as AutomationRule[];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: {
      rule_name: string;
      rule_type: string;
      trigger_event: string;
      actions: any[];
      conditions: any[];
    }) => {
      if (editingRule) {
        const { error } = await supabase
          .from("custom_rules")
          .update({
            rule_name: data.rule_name,
            rule_type: data.rule_type,
            trigger_event: data.trigger_event,
            actions: data.actions,
            conditions: data.conditions,
          })
          .eq("id", editingRule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("custom_rules")
          .insert({
            rule_name: data.rule_name,
            rule_type: data.rule_type,
            trigger_event: data.trigger_event,
            actions: data.actions,
            conditions: data.conditions,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast.success(editingRule ? "Regra atualizada!" : "Regra criada!");
      setIsCreateOpen(false);
      setEditingRule(null);
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao salvar regra");
      console.error(error);
    },
  });

  // Toggle mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("custom_rules")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("custom_rules")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast.success("Regra excluída!");
    },
  });

  const resetForm = () => {
    setFormData({
      rule_name: "",
      rule_type: "automation",
      trigger_event: "",
      actions: [],
    });
  };

  const handleEdit = (rule: AutomationRule) => {
    setEditingRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      rule_type: rule.rule_type,
      trigger_event: rule.trigger_event || "",
      actions: rule.actions || [],
    });
    setIsCreateOpen(true);
  };

  const handleSave = () => {
    if (!formData.rule_name || !formData.trigger_event) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    saveMutation.mutate({
      rule_name: formData.rule_name,
      rule_type: formData.rule_type,
      trigger_event: formData.trigger_event,
      actions: formData.actions,
      conditions: [],
    });
  };

  const addAction = (actionType: string) => {
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, { type: actionType, config: {} }],
    }));
  };

  const removeAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index),
    }));
  };

  const activeRules = rules.filter(r => r.is_active);
  const inactiveRules = rules.filter(r => !r.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Workflow className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Automações</h3>
          <Badge variant="secondary">{rules.length} regras</Badge>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingRule(null); resetForm(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? "Editar Regra" : "Nova Automação"}
              </DialogTitle>
              <DialogDescription>
                Configure gatilhos e ações para automatizar processos
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome da Regra *</Label>
                <Input
                  value={formData.rule_name}
                  onChange={e => setFormData(prev => ({ ...prev, rule_name: e.target.value }))}
                  placeholder="Ex: Notificar nova venda"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select 
                    value={formData.rule_type}
                    onValueChange={v => setFormData(prev => ({ ...prev, rule_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automation">Automação</SelectItem>
                      <SelectItem value="notification">Notificação</SelectItem>
                      <SelectItem value="workflow">Workflow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Gatilho *</Label>
                  <Select 
                    value={formData.trigger_event}
                    onValueChange={v => setFormData(prev => ({ ...prev, trigger_event: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {triggerEvents.map(trigger => (
                        <SelectItem key={trigger.value} value={trigger.value}>
                          <div className="flex items-center gap-2">
                            <trigger.icon className="h-4 w-4" />
                            {trigger.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ações</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {actionTypes.map(action => (
                    <Button
                      key={action.value}
                      variant="outline"
                      size="sm"
                      onClick={() => addAction(action.value)}
                    >
                      <action.icon className="h-3 w-3 mr-1" />
                      {action.label}
                    </Button>
                  ))}
                </div>
                
                {formData.actions.length > 0 && (
                  <div className="space-y-2 p-3 rounded-lg bg-muted/50">
                    {formData.actions.map((action, index) => {
                      const actionDef = actionTypes.find(a => a.value === action.type);
                      const ActionIcon = actionDef?.icon || Zap;
                      return (
                        <div key={index} className="flex items-center justify-between p-2 bg-card rounded-lg">
                          <div className="flex items-center gap-2">
                            <ActionIcon className="h-4 w-4 text-primary" />
                            <span className="text-sm">{actionDef?.label || action.type}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAction(index)}
                            className="h-6 w-6 p-0 text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rules List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : rules.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <Workflow className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h4 className="font-medium mb-2">Nenhuma automação configurada</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Crie regras para automatizar processos do seu negócio
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Regra
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active Rules */}
          {activeRules.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Play className="h-4 w-4 text-stats-green" />
                Ativas ({activeRules.length})
              </h4>
              <AnimatePresence mode="popLayout">
                {activeRules.map(rule => (
                  <AutomationRuleCard
                    key={rule.id}
                    rule={rule}
                    onToggle={(id, active) => toggleMutation.mutate({ id, is_active: active })}
                    onEdit={handleEdit}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Inactive Rules */}
          {inactiveRules.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Pause className="h-4 w-4 text-muted-foreground" />
                Inativas ({inactiveRules.length})
              </h4>
              <AnimatePresence mode="popLayout">
                {inactiveRules.map(rule => (
                  <AutomationRuleCard
                    key={rule.id}
                    rule={rule}
                    onToggle={(id, active) => toggleMutation.mutate({ id, is_active: active })}
                    onEdit={handleEdit}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AutomationRules;
