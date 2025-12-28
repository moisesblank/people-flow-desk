// ============================================
// PERFIL ALUNO: SEÇÃO ENVIOS CORREIOS
// CONSTITUIÇÃO SYNAPSE Ω v10.x — PATCH-ONLY
// Autoridade: CORREIOS OFICIAL
// ============================================

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FuturisticCard } from "@/components/ui/futuristic-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Package,
  Truck,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Plus,
  RefreshCw,
  Search,
  Clock,
  Mail,
  MessageSquare,
  ExternalLink,
} from "lucide-react";

interface AlunoEnviosProps {
  alunoId: string;
  alunoNome: string;
  alunoEmail: string;
  alunoTelefone?: string | null;
  endereco?: {
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
  };
}

interface Envio {
  id: string;
  codigo_rastreio: string | null;
  status: string;
  servico_correios: string | null;
  data_postagem: string | null;
  data_entrega_prevista: string | null;
  data_entrega_real: string | null;
  endereco_cidade: string;
  endereco_estado: string;
  endereco_validado: boolean;
  descricao_conteudo: string | null;
  created_at: string;
  eventos_rastreio: any[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Package }> = {
  pendente: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-500", icon: Clock },
  endereco_validado: { label: "Endereço Validado", color: "bg-blue-500/20 text-blue-500", icon: MapPin },
  postado: { label: "Postado", color: "bg-purple-500/20 text-purple-500", icon: Package },
  em_transito: { label: "Em Trânsito", color: "bg-blue-500/20 text-blue-500", icon: Truck },
  entregue: { label: "Entregue", color: "bg-green-500/20 text-green-500", icon: CheckCircle2 },
  devolvido: { label: "Devolvido", color: "bg-orange-500/20 text-orange-500", icon: AlertTriangle },
  extraviado: { label: "Extraviado", color: "bg-red-500/20 text-red-500", icon: AlertTriangle },
  cancelado: { label: "Cancelado", color: "bg-muted text-muted-foreground", icon: AlertTriangle },
};

export function AlunoPerfilEnvios({
  alunoId,
  alunoNome,
  alunoEmail,
  alunoTelefone,
  endereco,
}: AlunoEnviosProps) {
  const queryClient = useQueryClient();
  const [isNovoEnvioOpen, setIsNovoEnvioOpen] = useState(false);
  const [isRastreioOpen, setIsRastreioOpen] = useState(false);
  const [selectedEnvio, setSelectedEnvio] = useState<Envio | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rastreioResult, setRastreioResult] = useState<any>(null);
  
  // Form state para novo envio
  const [novoEnvio, setNovoEnvio] = useState({
    servico: "04014", // PAC
    descricao: "",
    codigoRastreio: "",
  });

  // Verificar status da API Correios
  const { data: correiosStatus } = useQuery({
    queryKey: ['correios-status'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke('correios-api', {
          body: { action: 'status' }
        });
        if (error) throw error;
        return data?.data || { correios_configurado: false };
      } catch {
        return { correios_configurado: false };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Buscar envios do aluno
  const { data: envios, isLoading: loadingEnvios } = useQuery({
    queryKey: ['envios-aluno', alunoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('envios_correios')
        .select('*')
        .eq('aluno_id', alunoId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Envio[];
    },
    enabled: !!alunoId,
  });

  // Validar endereço via Correios
  const validarEndereco = useCallback(async () => {
    if (!endereco?.cep) {
      toast.error("CEP não cadastrado", {
        description: "O aluno não possui CEP cadastrado no perfil."
      });
      return null;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('correios-api', {
        body: { action: 'validar_cep', cep: endereco.cep }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Erro ao validar CEP');
      }

      toast.success("Endereço validado", {
        description: `${data.data.logradouro}, ${data.data.cidade}/${data.data.estado}`
      });

      return data.data;
    } catch (err: any) {
      toast.error("Erro ao validar endereço", {
        description: err.message
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [endereco?.cep]);

  // Rastrear objeto
  const rastrearObjeto = useCallback(async (codigo: string) => {
    setIsLoading(true);
    setRastreioResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('correios-api', {
        body: { action: 'rastrear', codigo }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Erro ao rastrear');
      }

      setRastreioResult(data.data);
      toast.success("Rastreamento atualizado");
      queryClient.invalidateQueries({ queryKey: ['envios-aluno', alunoId] });
    } catch (err: any) {
      toast.error("Erro ao rastrear", { description: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [alunoId, queryClient]);

  // Criar novo envio
  const criarEnvio = useCallback(async () => {
    // Validar pré-condições
    if (!correiosStatus?.correios_configurado) {
      toast.error("Correios não configurado", {
        description: "A API oficial dos Correios não está integrada."
      });
      return;
    }

    if (!endereco?.cep || !endereco?.logradouro || !endereco?.numero || !endereco?.bairro || !endereco?.cidade || !endereco?.estado) {
      toast.error("Endereço incompleto", {
        description: "O aluno precisa ter endereço completo cadastrado."
      });
      return;
    }

    setIsLoading(true);
    try {
      // Validar endereço primeiro
      const enderecoValidado = await validarEndereco();
      if (!enderecoValidado) return;

      // Se tem código de rastreio, validar
      let codigoValidado = null;
      if (novoEnvio.codigoRastreio) {
        const { data, error } = await supabase.functions.invoke('correios-api', {
          body: { action: 'rastrear', codigo: novoEnvio.codigoRastreio }
        });
        if (error || !data?.success) {
          throw new Error('Código de rastreio inválido ou não encontrado');
        }
        codigoValidado = data.data;
      }

      // Criar registro
      const { error } = await supabase
        .from('envios_correios')
        .insert({
          aluno_id: alunoId,
          destinatario_nome: alunoNome,
          destinatario_email: alunoEmail,
          destinatario_telefone: alunoTelefone,
          endereco_cep: endereco.cep,
          endereco_logradouro: endereco.logradouro,
          endereco_numero: endereco.numero,
          endereco_complemento: endereco.complemento || null,
          endereco_bairro: endereco.bairro,
          endereco_cidade: endereco.cidade,
          endereco_estado: endereco.estado,
          endereco_validado: true,
          endereco_validado_at: new Date().toISOString(),
          endereco_correios_response: enderecoValidado,
          servico_correios: novoEnvio.servico === '04510' ? 'SEDEX' : 'PAC',
          descricao_conteudo: novoEnvio.descricao || null,
          codigo_rastreio: novoEnvio.codigoRastreio || null,
          codigo_rastreio_validado: !!codigoValidado,
          codigo_rastreio_validado_at: codigoValidado ? new Date().toISOString() : null,
          eventos_rastreio: codigoValidado?.eventos || [],
          status: codigoValidado ? 'postado' : 'endereco_validado',
          data_postagem: codigoValidado ? new Date().toISOString() : null,
        });

      if (error) throw error;

      toast.success("Envio registrado com sucesso");
      setIsNovoEnvioOpen(false);
      setNovoEnvio({ servico: "04014", descricao: "", codigoRastreio: "" });
      queryClient.invalidateQueries({ queryKey: ['envios-aluno', alunoId] });
    } catch (err: any) {
      toast.error("Erro ao criar envio", { description: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [alunoId, alunoNome, alunoEmail, alunoTelefone, endereco, novoEnvio, correiosStatus, validarEndereco, queryClient]);

  // Verificar pré-condições
  const enderecoCompleto = !!(endereco?.cep && endereco?.logradouro && endereco?.numero && endereco?.bairro && endereco?.cidade && endereco?.estado);
  const temContato = !!(alunoEmail || alunoTelefone);
  const correiosConfigurado = correiosStatus?.correios_configurado;

  return (
    <FuturisticCard className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Envios Correios</h3>
            <p className="text-sm text-muted-foreground">
              Gestão de envios físicos via Correios oficial
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsNovoEnvioOpen(true)}
          disabled={!correiosConfigurado || !enderecoCompleto || !temContato}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Envio
        </Button>
      </div>

      {/* Status API */}
      {!correiosConfigurado && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Correios oficial não integrado</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            A API oficial dos Correios não está configurada. Envio bloqueado.
          </p>
        </div>
      )}

      {/* Pré-condições */}
      <div className="grid gap-3 p-4 rounded-lg bg-muted/20">
        <h4 className="text-sm font-medium text-muted-foreground">Pré-condições para Envio</h4>
        <div className="flex flex-wrap gap-2">
          <Badge variant={correiosConfigurado ? "default" : "destructive"} className="gap-1">
            {correiosConfigurado ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
            API Correios
          </Badge>
          <Badge variant={enderecoCompleto ? "default" : "destructive"} className="gap-1">
            {enderecoCompleto ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
            Endereço Completo
          </Badge>
          <Badge variant={temContato ? "default" : "secondary"} className="gap-1">
            {temContato ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
            Email/WhatsApp
          </Badge>
        </div>
        {enderecoCompleto && endereco?.cep && (
          <p className="text-xs text-muted-foreground">
            {endereco.logradouro}, {endereco.numero}{endereco.complemento ? ` - ${endereco.complemento}` : ''} • {endereco.bairro} • {endereco.cidade}/{endereco.estado} • CEP: {endereco.cep}
          </p>
        )}
      </div>

      {/* Lista de Envios */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Histórico de Envios</h4>
        
        {loadingEnvios ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : envios && envios.length > 0 ? (
          <div className="space-y-2">
            {envios.map((envio) => {
              const statusConfig = STATUS_CONFIG[envio.status] || STATUS_CONFIG.pendente;
              const StatusIcon = statusConfig.icon;
              
              return (
                <div
                  key={envio.id}
                  className="p-4 rounded-lg border bg-card hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedEnvio(envio);
                    if (envio.codigo_rastreio) {
                      setIsRastreioOpen(true);
                      rastrearObjeto(envio.codigo_rastreio);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${statusConfig.color}`}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {envio.codigo_rastreio || "Sem código"}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {envio.servico_correios || "PAC"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {envio.endereco_cidade}/{envio.endereco_estado} • {envio.descricao_conteudo || "Material didático"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={statusConfig.color}>
                        {statusConfig.label}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(envio.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum envio registrado</p>
          </div>
        )}
      </div>

      {/* Modal Novo Envio */}
      <Dialog open={isNovoEnvioOpen} onOpenChange={setIsNovoEnvioOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Novo Envio</DialogTitle>
            <DialogDescription>
              O endereço será validado oficialmente pelos Correios antes do registro.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Destinatário</Label>
              <p className="text-sm text-muted-foreground">{alunoNome}</p>
              <p className="text-xs text-muted-foreground">{alunoEmail}</p>
            </div>

            <div>
              <Label>Endereço de Entrega</Label>
              {enderecoCompleto ? (
                <p className="text-sm text-muted-foreground">
                  {endereco?.logradouro}, {endereco?.numero} • {endereco?.cidade}/{endereco?.estado}
                </p>
              ) : (
                <p className="text-sm text-destructive">Endereço incompleto no cadastro</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Serviço</Label>
              <Select
                value={novoEnvio.servico}
                onValueChange={(v) => setNovoEnvio({ ...novoEnvio, servico: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="04014">PAC (Econômico)</SelectItem>
                  <SelectItem value="04510">SEDEX (Expresso)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Código de Rastreio (opcional)</Label>
              <Input
                placeholder="Ex: AA123456789BR"
                value={novoEnvio.codigoRastreio}
                onChange={(e) => setNovoEnvio({ ...novoEnvio, codigoRastreio: e.target.value.toUpperCase() })}
              />
              <p className="text-xs text-muted-foreground">
                Se já tiver o código, ele será validado junto aos Correios
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Descrição do Conteúdo</Label>
              <Textarea
                placeholder="Ex: Livro didático de Química"
                value={novoEnvio.descricao}
                onChange={(e) => setNovoEnvio({ ...novoEnvio, descricao: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNovoEnvioOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={criarEnvio} disabled={isLoading || !enderecoCompleto}>
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Registrar Envio
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Rastreamento */}
      <Dialog open={isRastreioOpen} onOpenChange={setIsRastreioOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Rastreamento: {selectedEnvio?.codigo_rastreio}
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : rastreioResult ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={rastreioResult.entregue ? "default" : "secondary"}>
                  {rastreioResult.entregue ? "Entregue" : "Em andamento"}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = `https://www.linkcorreios.com.br/?id=${selectedEnvio?.codigo_rastreio}`;
                    window.open(url, '_blank');
                  }}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Site Correios
                </Button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {rastreioResult.eventos?.map((evento: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border bg-muted/20 text-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{evento.descricao}</p>
                        <p className="text-xs text-muted-foreground">{evento.local}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(evento.data).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhum evento encontrado
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRastreioOpen(false)}>
              Fechar
            </Button>
            {selectedEnvio?.codigo_rastreio && (
              <Button
                onClick={() => rastrearObjeto(selectedEnvio.codigo_rastreio!)}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FuturisticCard>
  );
}