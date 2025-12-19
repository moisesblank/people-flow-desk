// ============================================
// LEADS CAPTURE WIDGET
// Formulário e lista de leads recentes
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  UserPlus, 
  Users, 
  Mail, 
  Phone, 
  Globe,
  CheckCircle,
  Clock,
  Target,
  ArrowRight
} from 'lucide-react';
import { useMarketingAutomations, MarketingLead } from '@/hooks/useMarketingAutomations';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const origemOptions = [
  { value: 'website', label: 'Website' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'google', label: 'Google Ads' },
  { value: 'organico', label: 'Orgânico' }
];

const statusColors: Record<string, string> = {
  novo: 'bg-blue-500/10 text-blue-500',
  qualificado: 'bg-purple-500/10 text-purple-500',
  negociacao: 'bg-amber-500/10 text-amber-500',
  convertido: 'bg-emerald-500/10 text-emerald-500',
  perdido: 'bg-red-500/10 text-red-500'
};

interface LeadItemProps {
  lead: MarketingLead;
  onConvert: (id: string, valor: number) => void;
}

function LeadItem({ lead, onConvert }: LeadItemProps) {
  const [showConvert, setShowConvert] = useState(false);
  const [valorConversao, setValorConversao] = useState('');

  const handleConvert = () => {
    const valor = parseFloat(valorConversao);
    if (isNaN(valor) || valor <= 0) {
      toast.error('Informe um valor válido');
      return;
    }
    onConvert(lead.id, valor);
    setShowConvert(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-3 rounded-lg bg-secondary/30 border border-border/30 hover:border-primary/30 transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">
              {lead.nome || 'Sem nome'}
            </p>
            <Badge className={`text-[10px] ${statusColors[lead.status] || statusColors.novo}`}>
              {lead.status}
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
            <Mail className="h-3 w-3" />
            {lead.email}
          </p>
          
          {lead.telefone && (
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {lead.telefone}
            </p>
          )}
          
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-[10px]">
              <Globe className="h-2 w-2 mr-1" />
              {lead.origem}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(lead.created_at), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
          </div>
        </div>

        {!lead.convertido && (
          <div className="flex flex-col gap-1">
            {showConvert ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  placeholder="R$"
                  value={valorConversao}
                  onChange={(e) => setValorConversao(e.target.value)}
                  className="h-7 w-20 text-xs"
                />
                <Button size="icon" className="h-7 w-7" onClick={handleConvert}>
                  <CheckCircle className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => setShowConvert(true)}
              >
                <Target className="h-3 w-3 mr-1" />
                Converter
              </Button>
            )}
          </div>
        )}

        {lead.convertido && (
          <Badge className="bg-emerald-500/10 text-emerald-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            R$ {lead.valor_conversao.toLocaleString('pt-BR')}
          </Badge>
        )}
      </div>
    </motion.div>
  );
}

export function LeadsCaptureWidget() {
  const { leads, isLoading, createLead, convertLead } = useMarketingAutomations();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    origem: 'website'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      toast.error('E-mail é obrigatório');
      return;
    }
    
    await createLead(formData);
    setFormData({ nome: '', email: '', telefone: '', origem: 'website' });
    setShowForm(false);
  };

  const recentLeads = leads.slice(0, 10);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />
            Leads
            <Badge variant="secondary" className="ml-2">
              {leads.length}
            </Badge>
          </CardTitle>
          
          <Button 
            variant={showForm ? "secondary" : "default"}
            size="sm"
            onClick={() => setShowForm(!showForm)}
          >
            <UserPlus className="h-3 w-3 mr-1" />
            {showForm ? 'Cancelar' : 'Novo Lead'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Formulário */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSubmit}
              className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/20"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Nome</Label>
                  <Input
                    placeholder="Nome do lead"
                    value={formData.nome}
                    onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">E-mail *</Label>
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                    className="h-8 text-sm"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Telefone</Label>
                  <Input
                    placeholder="(00) 00000-0000"
                    value={formData.telefone}
                    onChange={(e) => setFormData(p => ({ ...p, telefone: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Origem</Label>
                  <Select
                    value={formData.origem}
                    onValueChange={(v) => setFormData(p => ({ ...p, origem: v }))}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {origemOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button type="submit" className="w-full h-8 text-sm">
                <UserPlus className="h-3 w-3 mr-1" />
                Cadastrar Lead
              </Button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Lista de Leads */}
        <ScrollArea className="h-[350px] pr-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <h4 className="font-medium text-foreground">Nenhum lead ainda</h4>
              <p className="text-sm text-muted-foreground">
                Cadastre seu primeiro lead
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentLeads.map(lead => (
                <LeadItem 
                  key={lead.id} 
                  lead={lead} 
                  onConvert={convertLead}
                />
              ))}
              
              {leads.length > 10 && (
                <Button variant="ghost" className="w-full text-xs">
                  Ver todos os {leads.length} leads
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
