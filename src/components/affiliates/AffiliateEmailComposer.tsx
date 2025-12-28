// ============================================
// SISTEMA DE EMAIL PARA AFILIADOS
// Envio individual e em massa
// ============================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/utils";
import {
  Mail,
  Send,
  Users,
  User,
  X,
  Check,
  Loader2,
  AlertCircle,
  ChevronDown,
  Sparkles,
  Copy,
  Eye,
  FileText,
  Gift,
  DollarSign,
  Calendar,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Affiliate {
  id: number;
  nome: string;
  email: string;
  status?: string;
  cupom?: string;
  comissao_total?: number;
  total_vendas?: number;
}

interface AffiliateEmailComposerProps {
  affiliates: Affiliate[];
  isOpen: boolean;
  onClose: () => void;
  preselectedAffiliate?: Affiliate | null;
}

const EMAIL_TEMPLATES = [
  {
    id: "welcome",
    name: "Boas-vindas",
    icon: Gift,
    subject: "Bem-vindo ao Programa de Afiliados! 🎉",
    content: `Olá {{nome}}!

Seja muito bem-vindo(a) ao nosso programa de afiliados! 🚀

Estamos muito felizes em ter você como parceiro(a). A partir de agora, você faz parte de um time seleto que nos ajuda a transformar vidas através da educação.

📌 Seu cupom exclusivo: {{cupom}}
💰 Sua comissão: {{comissao}}%

Dicas para começar:
• Compartilhe seu link em suas redes sociais
• Use seu cupom exclusivo para oferecer descontos
• Acompanhe suas vendas pelo painel do afiliado

Qualquer dúvida, estamos à disposição!

Abraços,
Equipe Moisés Medeiros`
  },
  {
    id: "payment",
    name: "Pagamento",
    icon: DollarSign,
    subject: "Pagamento de Comissão Realizado! 💰",
    content: `Olá {{nome}}!

Temos ótimas notícias! 🎉

Acabamos de realizar o pagamento da sua comissão referente às vendas do período.

💵 Valor: R$ {{valor}}
📅 Data: {{data}}
🏦 Método: PIX

O valor já deve estar disponível na sua conta.

Continue com o excelente trabalho! Juntos vamos longe. 🚀

Abraços,
Equipe Moisés Medeiros`
  },
  {
    id: "promotion",
    name: "Promoção",
    icon: Sparkles,
    subject: "Nova Promoção Exclusiva para Afiliados! 🔥",
    content: `Olá {{nome}}!

Temos uma novidade IMPERDÍVEL para você! 🔥

Durante esta semana, estamos com uma promoção especial e sua comissão será AUMENTADA!

🎯 Comissão especial: {{comissao_especial}}%
📅 Válido até: {{data_fim}}
🏷️ Seu cupom: {{cupom}}

Esta é a hora perfeita para divulgar e aumentar seus ganhos!

Não perca essa oportunidade!

Abraços,
Equipe Moisés Medeiros`
  },
  {
    id: "reminder",
    name: "Lembrete",
    icon: Bell,
    subject: "Lembrete Importante 📢",
    content: `Olá {{nome}}!

Passando para lembrar que você tem comissões acumuladas aguardando para serem resgatadas.

💰 Total disponível: R$ {{valor_disponivel}}
📊 Vendas realizadas: {{total_vendas}}

Para receber seus valores, certifique-se de que seus dados bancários estão atualizados no sistema.

Qualquer dúvida, entre em contato!

Abraços,
Equipe Moisés Medeiros`
  },
  {
    id: "custom",
    name: "Personalizado",
    icon: FileText,
    subject: "",
    content: ""
  }
];

export function AffiliateEmailComposer({ 
  affiliates, 
  isOpen, 
  onClose, 
  preselectedAffiliate 
}: AffiliateEmailComposerProps) {
  const [mode, setMode] = useState<"individual" | "bulk">(preselectedAffiliate ? "individual" : "bulk");
  const [selectedAffiliates, setSelectedAffiliates] = useState<number[]>(
    preselectedAffiliate ? [preselectedAffiliate.id] : []
  );
  const [selectedTemplate, setSelectedTemplate] = useState("custom");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendResults, setSendResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });
  const [showPreview, setShowPreview] = useState(false);
  const [filterStatus, setFilterStatus] = useState("todos");

  const activeAffiliates = affiliates.filter(a => 
    a.email && 
    (filterStatus === "todos" || a.status === filterStatus)
  );

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setContent(template.content);
    }
  };

  const toggleAffiliate = (id: number) => {
    setSelectedAffiliates(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedAffiliates(activeAffiliates.map(a => a.id));
  };

  const deselectAll = () => {
    setSelectedAffiliates([]);
  };

  const replaceVariables = (text: string, affiliate: Affiliate) => {
    return text
      .replace(/\{\{nome\}\}/g, affiliate.nome.split(" ")[0])
      .replace(/\{\{nome_completo\}\}/g, affiliate.nome)
      .replace(/\{\{email\}\}/g, affiliate.email || "")
      .replace(/\{\{cupom\}\}/g, affiliate.cupom || "N/A")
      .replace(/\{\{comissao\}\}/g, "20")
      .replace(/\{\{total_vendas\}\}/g, String(affiliate.total_vendas || 0))
      .replace(/\{\{valor_disponivel\}\}/g, formatCurrency(affiliate.comissao_total || 0))
      .replace(/\{\{data\}\}/g, new Date().toLocaleDateString("pt-BR"))
      .replace(/\{\{valor\}\}/g, formatCurrency(affiliate.comissao_total || 0))
      .replace(/\{\{comissao_especial\}\}/g, "30")
      .replace(/\{\{data_fim\}\}/g, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR"));
  };

  // formatCurrency importado de @/utils

  const sendEmails = async () => {
    if (selectedAffiliates.length === 0) {
      toast.error("Selecione pelo menos um afiliado");
      return;
    }

    if (!subject.trim() || !content.trim()) {
      toast.error("Preencha o assunto e o conteúdo do email");
      return;
    }

    setIsSending(true);
    setSendResults({ success: 0, failed: 0 });

    let successCount = 0;
    let failedCount = 0;

    for (const affiliateId of selectedAffiliates) {
      const affiliate = affiliates.find(a => a.id === affiliateId);
      if (!affiliate || !affiliate.email) {
        failedCount++;
        continue;
      }

      try {
        const personalizedContent = replaceVariables(content, affiliate);
        const personalizedSubject = replaceVariables(subject, affiliate);

        const { error } = await supabase.functions.invoke("send-notification-email", {
          body: {
            to: affiliate.email,
            type: "affiliate",
            data: {
              nome: affiliate.nome,
              cupom: affiliate.cupom,
              titulo: personalizedSubject,
              mensagem: personalizedContent
            }
          }
        });

        if (error) throw error;
        successCount++;
      } catch (error) {
        console.error(`Error sending email to ${affiliate.email}:`, error);
        failedCount++;
      }

      // Update progress
      setSendResults({ success: successCount, failed: failedCount });
    }

    setIsSending(false);

    if (successCount > 0) {
      toast.success(`${successCount} email(s) enviado(s) com sucesso!`);
    }
    if (failedCount > 0) {
      toast.error(`${failedCount} email(s) falharam`);
    }

    if (successCount > 0 && failedCount === 0) {
      onClose();
    }
  };

  const getPreviewAffiliate = () => {
    if (selectedAffiliates.length > 0) {
      return affiliates.find(a => a.id === selectedAffiliates[0]);
    }
    return activeAffiliates[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Central de Emails — Afiliados
          </DialogTitle>
          <DialogDescription>
            Envie emails individuais ou em massa para seus afiliados
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "individual" | "bulk")} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="individual" className="gap-2">
              <User className="h-4 w-4" />
              Individual
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-2">
              <Users className="h-4 w-4" />
              Em Massa
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden mt-4">
            <div className="grid lg:grid-cols-2 gap-6 h-full">
              {/* Left Side - Recipients & Templates */}
              <div className="space-y-4 overflow-hidden flex flex-col">
                {/* Template Selection */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Modelo de Email</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {EMAIL_TEMPLATES.map((template) => {
                      const Icon = template.icon;
                      return (
                        <Button
                          key={template.id}
                          variant={selectedTemplate === template.id ? "default" : "outline"}
                          size="sm"
                          className="flex flex-col h-auto py-2 px-1"
                          onClick={() => handleTemplateSelect(template.id)}
                        >
                          <Icon className="h-4 w-4 mb-1" />
                          <span className="text-[10px]">{template.name}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Recipients */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">
                      Destinatários ({selectedAffiliates.length})
                    </Label>
                    <div className="flex gap-2">
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="h-7 text-xs w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          <SelectItem value="ativo">Ativos</SelectItem>
                          <SelectItem value="inativo">Inativos</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-7">
                        Todos
                      </Button>
                      <Button variant="ghost" size="sm" onClick={deselectAll} className="text-xs h-7">
                        Limpar
                      </Button>
                    </div>
                  </div>
                  
                  <ScrollArea className="flex-1 border rounded-lg">
                    <div className="p-2 space-y-1">
                      {activeAffiliates.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Nenhum afiliado com email cadastrado</p>
                        </div>
                      ) : (
                        activeAffiliates.map((affiliate) => (
                          <div
                            key={affiliate.id}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                              selectedAffiliates.includes(affiliate.id)
                                ? "bg-primary/10 border border-primary/30"
                                : "hover:bg-muted/50"
                            }`}
                            onClick={() => toggleAffiliate(affiliate.id)}
                          >
                            <Checkbox
                              checked={selectedAffiliates.includes(affiliate.id)}
                              onCheckedChange={() => toggleAffiliate(affiliate.id)}
                            />
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {affiliate.nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{affiliate.nome}</p>
                              <p className="text-xs text-muted-foreground truncate">{affiliate.email}</p>
                            </div>
                            {affiliate.cupom && (
                              <Badge variant="outline" className="text-[10px]">
                                {affiliate.cupom}
                              </Badge>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {/* Right Side - Email Composer */}
              <div className="space-y-4 overflow-hidden flex flex-col">
                <div>
                  <Label htmlFor="subject">Assunto *</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Digite o assunto do email..."
                    className="mt-1.5"
                  />
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-1.5">
                    <Label htmlFor="content">Conteúdo *</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 gap-1"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      <Eye className="h-3 w-3" />
                      {showPreview ? "Editar" : "Prévia"}
                    </Button>
                  </div>

                  {showPreview ? (
                    <Card className="flex-1 overflow-auto">
                      <CardContent className="p-4">
                        <div className="text-sm whitespace-pre-wrap">
                          {getPreviewAffiliate() 
                            ? replaceVariables(content, getPreviewAffiliate()!)
                            : content
                          }
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Digite o conteúdo do email...

Variáveis disponíveis:
{{nome}} - Primeiro nome do afiliado
{{nome_completo}} - Nome completo
{{email}} - Email do afiliado
{{cupom}} - Cupom do afiliado
{{comissao}} - Percentual de comissão
{{total_vendas}} - Total de vendas
{{valor_disponivel}} - Valor disponível para saque
{{data}} - Data atual"
                      className="flex-1 resize-none"
                    />
                  )}
                </div>

                {/* Variables Help */}
                <div className="p-3 rounded-lg bg-muted/50 text-xs">
                  <p className="font-medium mb-1">Variáveis disponíveis:</p>
                  <div className="flex flex-wrap gap-1">
                    {["{{nome}}", "{{cupom}}", "{{comissao}}", "{{total_vendas}}", "{{valor_disponivel}}", "{{data}}"].map((v) => (
                      <Badge 
                        key={v} 
                        variant="outline" 
                        className="text-[10px] cursor-pointer hover:bg-primary/10"
                        onClick={() => {
                          setContent(prev => prev + " " + v);
                        }}
                      >
                        {v}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Tabs>

        {/* Footer */}
        <Separator className="my-4" />
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedAffiliates.length > 0 ? (
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4 text-primary" />
                {selectedAffiliates.length} afiliado(s) selecionado(s)
              </span>
            ) : (
              <span className="flex items-center gap-1 text-destructive">
                <AlertCircle className="h-4 w-4" />
                Selecione pelo menos um afiliado
              </span>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={sendEmails} 
              disabled={isSending || selectedAffiliates.length === 0 || !subject || !content}
              className="gap-2 min-w-32"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando... ({sendResults.success}/{selectedAffiliates.length})
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar {selectedAffiliates.length > 1 ? `(${selectedAffiliates.length})` : ""}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
