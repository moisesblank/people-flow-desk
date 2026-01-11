// ============================================
// 📍 STUDENT ADDRESS SECTION — PERFIL DO ALUNO
// CONSTITUIÇÃO SYNAPSE Ω v10.x — REALTIME SYNC
// Edição de endereço com validação CEP Correios
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  MapPin,
  Home,
  Edit3,
  Save,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
  Building2,
  MapPinned,
  Navigation,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddressData {
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
}

interface CepValidationResult {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  validado: boolean;
  validado_at: string;
}

export function StudentAddressSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isValidatingCep, setIsValidatingCep] = useState(false);
  const [cepValidated, setCepValidated] = useState(false);
  const [formData, setFormData] = useState<AddressData>({
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  });

  // ============================================
  // QUERY: Buscar dados do aluno
  // ============================================
  const { data: alunoData, isLoading } = useQuery({
    queryKey: ['student-address', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Primeiro buscar pelo email do usuário na tabela alunos
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      if (!profile?.email) return null;

      const { data, error } = await supabase
        .from('alunos')
        .select('id, cep, logradouro, numero, complemento, bairro, cidade, estado')
        .eq('email', profile.email)
        .maybeSingle();

      if (error) {
        console.error('[StudentAddress] Erro ao buscar aluno:', error);
        return null;
      }

      return data;
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });

  // ============================================
  // REALTIME: Sync automático
  // ============================================
  useEffect(() => {
    if (!alunoData?.id) return;

    const channel = supabase
      .channel(`student-address-${alunoData.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'alunos',
          filter: `id=eq.${alunoData.id}`,
        },
        (payload) => {
          console.log('[StudentAddress] Realtime update:', payload);
          queryClient.invalidateQueries({ queryKey: ['student-address', user?.id] });
          
          // Se não estiver editando, mostrar toast
          if (!isEditing) {
            toast.info('📍 Endereço atualizado', {
              description: 'Seu endereço foi sincronizado automaticamente.',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [alunoData?.id, user?.id, queryClient, isEditing]);

  // ============================================
  // Inicializar formulário com dados do aluno
  // ============================================
  useEffect(() => {
    if (alunoData && !isEditing) {
      setFormData({
        cep: alunoData.cep || '',
        logradouro: alunoData.logradouro || '',
        numero: alunoData.numero || '',
        complemento: alunoData.complemento || '',
        bairro: alunoData.bairro || '',
        cidade: alunoData.cidade || '',
        estado: alunoData.estado || '',
      });
    }
  }, [alunoData, isEditing]);

  // ============================================
  // MUTATION: Salvar endereço
  // ============================================
  const saveMutation = useMutation({
    mutationFn: async (data: AddressData) => {
      if (!alunoData?.id) throw new Error('Aluno não encontrado');

      const { error } = await supabase
        .from('alunos')
        .update({
          cep: data.cep || null,
          logradouro: data.logradouro || null,
          numero: data.numero || null,
          complemento: data.complemento || null,
          bairro: data.bairro || null,
          cidade: data.cidade || null,
          estado: data.estado || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', alunoData.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-address', user?.id] });
      setIsEditing(false);
      setCepValidated(false);
      toast.success('Endereço salvo com sucesso!', {
        description: 'Suas informações foram atualizadas.',
      });
    },
    onError: (error: any) => {
      console.error('[StudentAddress] Erro ao salvar:', error);
      toast.error('Erro ao salvar endereço', {
        description: error.message || 'Tente novamente.',
      });
    },
  });

  // ============================================
  // VALIDAÇÃO CEP (via ViaCEP - fallback gratuito)
  // ============================================
  const validateCep = useCallback(async () => {
    const cepLimpo = formData.cep?.replace(/\D/g, '') || '';
    
    if (cepLimpo.length !== 8) {
      toast.error('CEP inválido', { description: 'Digite um CEP com 8 dígitos.' });
      return;
    }

    setIsValidatingCep(true);
    
    try {
      // Usar ViaCEP (gratuito e sem autenticação)
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      // Preencher campos automaticamente
      setFormData(prev => ({
        ...prev,
        cep: data.cep.replace('-', ''),
        logradouro: data.logradouro || prev.logradouro,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado,
        complemento: data.complemento || prev.complemento,
      }));

      setCepValidated(true);
      toast.success('CEP validado!', {
        description: `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`,
      });
    } catch (error: any) {
      console.error('[StudentAddress] Erro ao validar CEP:', error);
      setCepValidated(false);
      toast.error('CEP não encontrado', {
        description: 'Verifique o CEP digitado e tente novamente.',
      });
    } finally {
      setIsValidatingCep(false);
    }
  }, [formData.cep]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleInputChange = (field: keyof AddressData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'cep') {
      setCepValidated(false);
    }
  };

  const handleCepKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      validateCep();
    }
  };

  const handleSave = () => {
    if (!formData.cep || !formData.logradouro || !formData.numero || !formData.cidade || !formData.estado) {
      toast.error('Campos obrigatórios', {
        description: 'Preencha CEP, logradouro, número, cidade e estado.',
      });
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCepValidated(false);
    // Restaurar dados originais
    if (alunoData) {
      setFormData({
        cep: alunoData.cep || '',
        logradouro: alunoData.logradouro || '',
        numero: alunoData.numero || '',
        complemento: alunoData.complemento || '',
        bairro: alunoData.bairro || '',
        cidade: alunoData.cidade || '',
        estado: alunoData.estado || '',
      });
    }
  };

  // ============================================
  // HELPERS
  // ============================================
  const hasAddress = alunoData?.cep || alunoData?.logradouro || alunoData?.cidade;
  
  const formatCep = (cep: string) => {
    const clean = cep.replace(/\D/g, '');
    if (clean.length === 8) {
      return `${clean.slice(0, 5)}-${clean.slice(5)}`;
    }
    return cep;
  };

  const getFormattedAddress = () => {
    if (!alunoData) return null;
    
    const parts = [
      alunoData.logradouro,
      alunoData.numero ? `nº ${alunoData.numero}` : null,
      alunoData.complemento,
    ].filter(Boolean);
    
    const line1 = parts.join(', ');
    const line2 = [alunoData.bairro, alunoData.cidade, alunoData.estado].filter(Boolean).join(' - ');
    const line3 = alunoData.cep ? `CEP: ${formatCep(alunoData.cep)}` : null;
    
    return { line1, line2, line3 };
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Se não tem registro de aluno, não mostrar
  if (!alunoData) {
    return null;
  }

  const formattedAddress = getFormattedAddress();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border-border/50 overflow-hidden">
        {/* Header com gradiente */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-holo-cyan to-secondary" />
        
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              Meu Endereço
              {hasAddress && !isEditing && (
                <Badge variant="outline" className="ml-2 gap-1 text-xs">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  Cadastrado
                </Badge>
              )}
            </CardTitle>
            
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Edit3 className="w-4 h-4" />
                {hasAddress ? 'Editar' : 'Adicionar'}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait">
            {isEditing ? (
              // ============================================
              // MODO EDIÇÃO
              // ============================================
              <motion.div
                key="edit"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                {/* CEP com validação */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="cep" className="flex items-center gap-1.5 mb-1.5">
                      <Navigation className="w-3.5 h-3.5" />
                      CEP *
                    </Label>
                    <div className="relative">
                      <Input
                        id="cep"
                        placeholder="00000-000"
                        value={formData.cep || ''}
                        onChange={(e) => handleInputChange('cep', e.target.value.replace(/\D/g, '').slice(0, 8))}
                        onKeyDown={handleCepKeyDown}
                        maxLength={9}
                        className={cn(
                          "pr-10",
                          cepValidated && "border-green-500 focus-visible:ring-green-500"
                        )}
                      />
                      {cepValidated && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={validateCep}
                      disabled={isValidatingCep || (formData.cep?.replace(/\D/g, '').length || 0) !== 8}
                      className="gap-2"
                    >
                      {isValidatingCep ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      Buscar
                    </Button>
                  </div>
                </div>

                {/* Logradouro + Número */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="logradouro" className="flex items-center gap-1.5 mb-1.5">
                      <Home className="w-3.5 h-3.5" />
                      Logradouro *
                    </Label>
                    <Input
                      id="logradouro"
                      placeholder="Rua, Avenida, etc."
                      value={formData.logradouro || ''}
                      onChange={(e) => handleInputChange('logradouro', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="numero" className="mb-1.5">Número *</Label>
                    <Input
                      id="numero"
                      placeholder="123"
                      value={formData.numero || ''}
                      onChange={(e) => handleInputChange('numero', e.target.value)}
                    />
                  </div>
                </div>

                {/* Complemento + Bairro */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="complemento" className="mb-1.5">Complemento</Label>
                    <Input
                      id="complemento"
                      placeholder="Apto, Bloco, etc."
                      value={formData.complemento || ''}
                      onChange={(e) => handleInputChange('complemento', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bairro" className="flex items-center gap-1.5 mb-1.5">
                      <MapPinned className="w-3.5 h-3.5" />
                      Bairro
                    </Label>
                    <Input
                      id="bairro"
                      placeholder="Centro"
                      value={formData.bairro || ''}
                      onChange={(e) => handleInputChange('bairro', e.target.value)}
                    />
                  </div>
                </div>

                {/* Cidade + Estado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cidade" className="flex items-center gap-1.5 mb-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      Cidade *
                    </Label>
                    <Input
                      id="cidade"
                      placeholder="São Paulo"
                      value={formData.cidade || ''}
                      onChange={(e) => handleInputChange('cidade', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="estado" className="mb-1.5">Estado *</Label>
                    <Input
                      id="estado"
                      placeholder="SP"
                      maxLength={2}
                      value={formData.estado || ''}
                      onChange={(e) => handleInputChange('estado', e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                  <Button
                    variant="ghost"
                    onClick={handleCancel}
                    disabled={saveMutation.isPending}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="gap-2"
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Salvar Endereço
                  </Button>
                </div>
              </motion.div>
            ) : (
              // ============================================
              // MODO VISUALIZAÇÃO
              // ============================================
              <motion.div
                key="view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {hasAddress ? (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/30">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        {formattedAddress?.line1 && (
                          <p className="font-medium text-foreground">{formattedAddress.line1}</p>
                        )}
                        {formattedAddress?.line2 && (
                          <p className="text-sm text-muted-foreground">{formattedAddress.line2}</p>
                        )}
                        {formattedAddress?.line3 && (
                          <p className="text-xs text-muted-foreground mt-2">{formattedAddress.line3}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border-2 border-dashed border-border/50 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-1">Nenhum endereço cadastrado</p>
                    <p className="text-xs text-muted-foreground/70">
                      Adicione seu endereço para receber materiais físicos
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
