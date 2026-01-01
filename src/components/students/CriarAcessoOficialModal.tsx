// ============================================
// 📜 PARTE 9 — UI Criação de Acesso Oficial
// CONSTITUIÇÃO SYNAPSE Ω v10.x — PATCH-ONLY
// ============================================
// Campos obrigatórios: nome, email, role, telefone
// Campos opcionais: endereço, foto_aluno, senha
// Edge Function: c-create-official-access (PARTE 10)
// ============================================

import { useState, useRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, Mail, User, Phone, MapPin, Lock, Image, Loader2, Calendar, Package, Globe, CreditCard, Upload, X, Camera } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { CPFInput, cleanCPF } from "@/components/ui/cpf-input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { StudentRole, STUDENT_ROLE_LABELS } from "@/types/studentIdentityContract";

// ============================================
// SCHEMA DE VALIDAÇÃO (Zod)
// ============================================
const criarAcessoSchema = z.object({
  // Campos obrigatórios
  nome: z.string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Nome contém caracteres inválidos"),
  
  email: z.string()
    .email("Email inválido")
    .max(255, "Email deve ter no máximo 255 caracteres")
    .transform(val => val.toLowerCase().trim()),
  
  // CONSTITUIÇÃO v10.x - 4 roles de aluno válidas
  role: z.enum(['beta', 'aluno_gratuito', 'aluno_presencial', 'beta_expira'], {
    required_error: "Selecione o tipo de acesso",
  }),

  // Novo: expires_days para beta_expira (30, 60, 90, 180, 365 ou custom)
  expires_days: z.number()
    .min(1, "Dias deve ser pelo menos 1")
    .max(3650, "Dias não pode exceder 10 anos")
    .optional(),

  // Novo: tipo_produto para Beta (livroweb ou fisico)
  tipo_produto: z.enum(['livroweb', 'fisico']).optional(),

  // Telefone OBRIGATÓRIO
  telefone: z.string()
    .min(8, "Telefone deve ter pelo menos 8 dígitos")
    .max(20, "Telefone deve ter no máximo 20 caracteres")
    .regex(/^[\d\s()+-]+$/, "Telefone inválido"),
  
  // CPF OBRIGATÓRIO — Validado na Receita Federal + Único no sistema
  cpf: z.string()
    .min(11, "CPF deve ter 11 dígitos")
    .max(14, "CPF inválido")
    .refine(val => {
      const digits = val.replace(/\D/g, '');
      return digits.length === 11;
    }, "CPF deve ter 11 dígitos"),
  
  // Campos opcionais
  foto_aluno: z.string()
    .url("URL da foto inválida")
    .optional()
    .or(z.literal("")),
  
  senha: z.string()
    .optional()
    .refine(val => !val || val.length >= 8, "Senha deve ter pelo menos 8 caracteres"),

  // Endereço (todos opcionais)
  logradouro: z.string().max(200).optional(),
  numero: z.string().max(20).optional(),
  complemento: z.string().max(100).optional(),
  bairro: z.string().max(100).optional(),
  cidade: z.string().max(100).optional(),
  estado: z.string().max(2).optional(),
  cep: z.string()
    .optional()
    .refine(val => !val || /^\d{5}-?\d{3}$/.test(val), "CEP inválido (formato: 00000-000)"),
}).superRefine((data, ctx) => {
  // Se role é beta_expira, expires_days é OBRIGATÓRIO
  if (data.role === 'beta_expira' && !data.expires_days) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Defina o tempo de expiração para Beta Expira",
      path: ["expires_days"],
    });
  }
  // Se role é beta ou beta_expira, tipo_produto é OBRIGATÓRIO
  if ((data.role === 'beta' || data.role === 'beta_expira') && !data.tipo_produto) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Selecione o tipo de produto (Livroweb ou Físico)",
      path: ["tipo_produto"],
    });
  }
});

type CriarAcessoFormData = z.infer<typeof criarAcessoSchema>;

interface CriarAcessoOficialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CriarAcessoOficialModal({ 
  open, 
  onOpenChange, 
  onSuccess 
}: CriarAcessoOficialModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomExpires, setShowCustomExpires] = useState(false);
  const [customExpiresValue, setCustomExpiresValue] = useState('');
  const [cpfValidated, setCpfValidated] = useState(false);
  const [cpfValidating, setCpfValidating] = useState(false);
  
  // Estado para upload de foto
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [isUploadingFoto, setIsUploadingFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CriarAcessoFormData>({
    resolver: zodResolver(criarAcessoSchema),
    defaultValues: {
      nome: "",
      email: "",
      role: undefined,
      expires_days: undefined,
      tipo_produto: undefined,
      telefone: "",
      cpf: "",
      foto_aluno: "",
      senha: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      cep: "",
    },
  });

  // Watch role para mostrar/ocultar campo de dias
  const selectedRole = form.watch("role");

  // Função para lidar com seleção de foto
  const handleFotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo (apenas imagens)
    if (!file.type.startsWith('image/')) {
      toast.error("Arquivo inválido", { description: "Selecione uma imagem (PNG, JPG, etc.)" });
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande", { description: "A foto deve ter no máximo 5MB" });
      return;
    }

    setFotoFile(file);
    
    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Função para remover foto selecionada
  const handleRemoveFoto = () => {
    setFotoFile(null);
    setFotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Função para fazer upload da foto no storage
  const uploadFotoToStorage = async (email: string): Promise<string | null> => {
    if (!fotoFile) return null;

    setIsUploadingFoto(true);
    try {
      const fileExt = fotoFile.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `${email.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${fileExt}`;
      const filePath = `alunos/${fileName}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, fotoFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error('[Upload Foto] Erro:', error);
        toast.error("Erro ao fazer upload da foto", { description: error.message });
        return null;
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('[Upload Foto] ✅ Sucesso:', urlData.publicUrl);
      return urlData.publicUrl;

    } catch (err: any) {
      console.error('[Upload Foto] Exceção:', err);
      return null;
    } finally {
      setIsUploadingFoto(false);
    }
  };

  const handleSubmit = async (data: CriarAcessoFormData) => {
    // 🔒 VALIDAÇÃO OBRIGATÓRIA: CPF deve estar validado na Receita Federal
    if (!cpfValidated) {
      toast.error("CPF não validado", {
        description: "Aguarde a validação do CPF na Receita Federal antes de continuar."
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 🎯 FIX CRÍTICO: Verificar e renovar sessão ANTES de chamar edge function
      // O erro "Auth session missing!" acontece quando o token JWT referencia uma sessão
      // que foi invalidada no servidor Supabase. Precisamos garantir uma sessão válida.
      console.log('[CriarAcessoOficial] Verificando sessão antes de criar acesso...');
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        console.error('[CriarAcessoOficial] Sessão inválida:', sessionError?.message);
        throw new Error('Sessão expirada. Faça logout e login novamente.');
      }
      
      // Tentar refresh do token para garantir sessão ativa no servidor
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('[CriarAcessoOficial] Erro ao renovar sessão:', refreshError.message);
        // Se não conseguiu renovar, a sessão está realmente inválida
        if (refreshError.message?.includes('session') || refreshError.message?.includes('token')) {
          throw new Error('Sessão expirada. Faça logout e login novamente.');
        }
      }
      
      if (!refreshData.session) {
        console.error('[CriarAcessoOficial] Nenhuma sessão após refresh');
        throw new Error('Sessão expirada. Faça logout e login novamente.');
      }
      
      console.log('[CriarAcessoOficial] ✅ Sessão válida. Criando acesso...');

      // 📸 Fazer upload da foto se houver
      let fotoUrl: string | null = null;
      if (fotoFile) {
        console.log('[CriarAcessoOficial] Fazendo upload da foto...');
        fotoUrl = await uploadFotoToStorage(data.email);
      }

      // ⚡ PARTE 10: Chamar Edge Function c-create-official-access
      const payload = {
        // Campos obrigatórios e únicos
        nome: data.nome.trim(),
        email: data.email,
        role: data.role,
        
        // Telefone (OBRIGATÓRIO e ÚNICO)
        telefone: data.telefone.trim(),
        
        // CPF (OBRIGATÓRIO e ÚNICO, apenas dígitos)
        cpf: cleanCPF(data.cpf),
        
        // Campos opcionais (só envia se preenchidos)
        ...(fotoUrl && { foto_aluno: fotoUrl }),
        ...(data.foto_aluno && !fotoUrl && { foto_aluno: data.foto_aluno.trim() }),
        ...(data.senha && { senha: data.senha }),
        ...(data.expires_days && { expires_days: data.expires_days }),
        ...(data.tipo_produto && { tipo_produto: data.tipo_produto }),
        
        // Endereço (só envia se algum campo preenchido)
        ...((data.logradouro || data.numero || data.complemento || 
             data.bairro || data.cidade || data.estado || data.cep) && {
          endereco: {
            ...(data.logradouro && { logradouro: data.logradouro.trim() }),
            ...(data.numero && { numero: data.numero.trim() }),
            ...(data.complemento && { complemento: data.complemento.trim() }),
            ...(data.bairro && { bairro: data.bairro.trim() }),
            ...(data.cidade && { cidade: data.cidade.trim() }),
            ...(data.estado && { estado: data.estado.toUpperCase().trim() }),
            ...(data.cep && { cep: data.cep.replace(/\D/g, '') }),
          }
        }),
      };

      const accessToken = refreshData.session.access_token;

      const { data: response, error } = await supabase.functions.invoke(
        'c-create-official-access',
        {
          body: payload,
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (error) {
        console.error('Edge function error:', error);
        // 🎯 FIX: Mensagem mais clara para erro de sessão expirada
        const isSessionError = error.message?.includes('session') 
          || error.message?.includes('Auth') 
          || error.message?.includes('401');
        if (isSessionError) {
          throw new Error('Sessão expirada. Faça logout e login novamente.');
        }
        throw new Error(error.message || 'Erro na comunicação com servidor');
      }

      if (!response?.success) {
        // 🎯 FIX: Detectar erro de token/sessão no response
        const errorMsg = response?.error || 'Erro ao criar acesso';
        if (errorMsg.includes('Token') || errorMsg.includes('session') || errorMsg.includes('Auth')) {
          throw new Error('Sessão expirada. Faça logout e login novamente.');
        }
        
        // 🎯 MENSAGENS ESPECÍFICAS PARA CAMPOS DUPLICADOS
        const errorLower = errorMsg.toLowerCase();
        if (errorLower.includes('cpf') && (errorLower.includes('cadastrado') || errorLower.includes('existe') || errorLower.includes('outro'))) {
          throw new Error('CPF_DUPLICADO');
        }
        if (errorLower.includes('email') && (errorLower.includes('cadastrado') || errorLower.includes('existe') || errorLower.includes('outro'))) {
          throw new Error('EMAIL_DUPLICADO');
        }
        if (errorLower.includes('telefone') && (errorLower.includes('cadastrado') || errorLower.includes('existe') || errorLower.includes('outro'))) {
          throw new Error('TELEFONE_DUPLICADO');
        }
        
        throw new Error(errorMsg);
      }

      // ============================================
      // 🔁 PATCH P0 — GARANTIA DE tipo_produto (LIVROWEB / FÍSICO)
      // Problema observado: acesso criado, mas tipo_produto fica NULL ⇒ contadores não atualizam.
      // Estratégia: validar e, se necessário, corrigir via update pós-criação.
      // ============================================
      if ((data.role === 'beta' || data.role === 'beta_expira') && data.tipo_produto) {
        try {
          const { data: alunoRow, error: alunoFetchErr } = await supabase
            .from('alunos')
            .select('email, tipo_produto')
            .eq('email', data.email)
            .maybeSingle();

          if (alunoFetchErr) {
            console.warn('[CriarAcessoOficial] ⚠️ Falha ao conferir tipo_produto:', alunoFetchErr.message);
          } else if (!alunoRow?.tipo_produto) {
            const { error: alunoUpdateErr } = await supabase
              .from('alunos')
              .update({ tipo_produto: data.tipo_produto })
              .eq('email', data.email);

            if (alunoUpdateErr) {
              console.warn('[CriarAcessoOficial] ⚠️ Falha ao aplicar tipo_produto:', alunoUpdateErr.message);
            } else {
              console.log('[CriarAcessoOficial] ✅ tipo_produto aplicado pós-criação:', data.tipo_produto);
            }
          }
        } catch (e: any) {
          console.warn('[CriarAcessoOficial] ⚠️ Exceção ao garantir tipo_produto:', e?.message || e);
        }
      }

      // Sucesso
      toast.success("✅ Acesso oficial criado!", {
        description: data.senha 
          ? `${data.nome} pode fazer login imediatamente.`
          : `Email de definição de senha enviado para ${data.email}`,
      });

      // Reset form e fecha modal
      form.reset();
      setShowCustomExpires(false);
      setCustomExpiresValue('');
      handleRemoveFoto(); // Limpar foto
      onOpenChange(false);
      
      // Callback de sucesso (para refetch/invalidate)
      onSuccess?.();

    } catch (error: any) {
      console.error("Erro ao criar acesso:", error);
      
      // 🎯 MENSAGENS ESPECÍFICAS E CLARAS PARA DUPLICADOS
      const errorCode = error.message || '';
      
      if (errorCode === 'CPF_DUPLICADO') {
        toast.error("❌ CPF JÁ CADASTRADO", {
          description: "Este CPF já está vinculado a outro usuário no sistema.",
          duration: 8000,
        });
      } else if (errorCode === 'EMAIL_DUPLICADO') {
        toast.error("❌ EMAIL JÁ CADASTRADO", {
          description: "Este email já está vinculado a outro usuário no sistema.",
          duration: 8000,
        });
      } else if (errorCode === 'TELEFONE_DUPLICADO') {
        toast.error("❌ TELEFONE JÁ CADASTRADO", {
          description: "Este telefone já está vinculado a outro usuário no sistema.",
          duration: 8000,
        });
      } else {
        toast.error("Erro ao criar acesso", {
          description: error.message || "Tente novamente",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      setShowCustomExpires(false);
      setCustomExpiresValue('');
      handleRemoveFoto(); // Limpar foto
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg border-emerald-500/30 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-400">
            <UserPlus className="h-5 w-5" />
            Criar Acesso Oficial
          </DialogTitle>
          <DialogDescription>
            Crie um novo acesso para aluno. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
            {/* ============================================ */}
            {/* CAMPOS OBRIGATÓRIOS */}
            {/* ============================================ */}
            
            {/* Nome */}
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Nome Completo *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="João da Silva"
                      className="border-emerald-500/30 focus:border-emerald-500"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    Email *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="email"
                      placeholder="aluno@exemplo.com"
                      className="border-emerald-500/30 focus:border-emerald-500"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role + Expiração lado a lado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Role */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <UserPlus className="h-4 w-4" />
                      Tipo de Acesso *
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="border-emerald-500/30">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beta">
                          {STUDENT_ROLE_LABELS.beta}
                        </SelectItem>
                        <SelectItem value="aluno_gratuito">
                          {STUDENT_ROLE_LABELS.aluno_gratuito}
                        </SelectItem>
                        <SelectItem value="aluno_presencial">
                          {STUDENT_ROLE_LABELS.aluno_presencial}
                        </SelectItem>
                        <SelectItem value="beta_expira">
                          {STUDENT_ROLE_LABELS.beta_expira}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dias de Expiração (OPCIONAL para todos, OBRIGATÓRIO só para beta_expira) */}
              <FormField
                control={form.control}
                name="expires_days"
                render={({ field }) => {
                  const handleSelectChange = (value: string) => {
                    if (value === 'custom') {
                      setShowCustomExpires(true);
                      setCustomExpiresValue('');
                    } else {
                      setShowCustomExpires(false);
                      field.onChange(value === 'permanente' ? undefined : Number(value));
                    }
                  };
                  
                  const handleCustomDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setCustomExpiresValue(value);
                    if (value && Number(value) > 0) {
                      field.onChange(Number(value));
                    }
                  };
                  
                  const currentValue = showCustomExpires 
                    ? 'custom' 
                    : (field.value?.toString() || 'permanente');
                  
                  return (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Expiração {selectedRole === 'beta_expira' ? '*' : '(opcional)'}
                      </FormLabel>
                      <div className="space-y-2">
                        <Select 
                          onValueChange={handleSelectChange} 
                          value={currentValue}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger className={selectedRole === 'beta_expira' ? "border-amber-500/30" : "border-muted-foreground/30"}>
                              <SelectValue placeholder="Vitalício" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="permanente">♾️ Vitalício</SelectItem>
                            <SelectItem value="30">30 dias</SelectItem>
                            <SelectItem value="60">60 dias</SelectItem>
                            <SelectItem value="90">90 dias</SelectItem>
                            <SelectItem value="180">180 dias</SelectItem>
                            <SelectItem value="365">1 ano</SelectItem>
                            <SelectItem value="custom">✏️ Personalizado...</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {/* Campo de dias personalizados */}
                        {showCustomExpires && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={1}
                              max={3650}
                              placeholder="Quantidade de dias"
                              value={customExpiresValue}
                              onChange={handleCustomDaysChange}
                              className="border-amber-500/30 focus:border-amber-500"
                              disabled={isSubmitting}
                            />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">dias</span>
                          </div>
                        )}
                      </div>
                      <FormDescription className="text-[10px]">
                        Quando expirar, aluno vai para Área Gratuita automaticamente
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            {/* Tipo de Produto — Aparece APENAS para Beta ou Beta Expira */}
            {(selectedRole === 'beta' || selectedRole === 'beta_expira') && (
              <FormField
                control={form.control}
                name="tipo_produto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Package className="h-4 w-4 text-purple-400" />
                      Tipo de Produto *
                    </FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      <div
                        onClick={() => !isSubmitting && field.onChange('livroweb')}
                        className={`
                          cursor-pointer rounded-lg border-2 p-3 transition-all
                          ${field.value === 'livroweb' 
                            ? 'border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/20' 
                            : 'border-muted-foreground/30 hover:border-violet-500/50 hover:bg-violet-500/5'
                          }
                          ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <Globe className={`h-5 w-5 ${field.value === 'livroweb' ? 'text-violet-400' : 'text-muted-foreground'}`} />
                          <div>
                            <div className={`font-semibold text-sm ${field.value === 'livroweb' ? 'text-violet-400' : 'text-foreground'}`}>
                              Livroweb
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              Material Digital
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div
                        onClick={() => !isSubmitting && field.onChange('fisico')}
                        className={`
                          cursor-pointer rounded-lg border-2 p-3 transition-all
                          ${field.value === 'fisico' 
                            ? 'border-fuchsia-500 bg-fuchsia-500/10 shadow-lg shadow-fuchsia-500/20' 
                            : 'border-muted-foreground/30 hover:border-fuchsia-500/50 hover:bg-fuchsia-500/5'
                          }
                          ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <Package className={`h-5 w-5 ${field.value === 'fisico' ? 'text-fuchsia-400' : 'text-muted-foreground'}`} />
                          <div>
                            <div className={`font-semibold text-sm ${field.value === 'fisico' ? 'text-fuchsia-400' : 'text-foreground'}`}>
                              Físico
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              Material Físico
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Descrição do tipo de acesso */}
            <p className="text-xs text-muted-foreground -mt-2">
              {selectedRole === 'beta' && "Beta = acesso completo permanente"}
              {selectedRole === 'aluno_gratuito' && "Gratuito = acesso limitado"}
              {selectedRole === 'aluno_presencial' && "Presencial = aulas presenciais"}
              {selectedRole === 'beta_expira' && "Beta Expira = acesso completo com prazo definido"}
              {!selectedRole && "Selecione o tipo de acesso"}
            </p>

            {/* ============================================ */}
            {/* TELEFONE — OBRIGATÓRIO */}
            {/* ============================================ */}
            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    Telefone *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="(83) 99999-9999"
                      className="border-muted-foreground/30"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground">
                    Formato obrigatório: <span className="font-mono text-emerald-400">+55 83 9 9999-9999</span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ============================================ */}
            {/* CPF — OBRIGATÓRIO + VALIDAÇÃO RECEITA FEDERAL */}
            {/* ============================================ */}
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    CPF * 
                    <span className="text-[10px] text-muted-foreground ml-1">
                      (validado na Receita Federal)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <CPFInput
                      value={field.value || ""}
                      onChange={(val) => {
                        field.onChange(val);
                        // Reset validação quando CPF muda
                        if (cpfValidated) setCpfValidated(false);
                      }}
                      validateOnBlur={true}
                      showStatusIcon={true}
                      showSecurityBadge={true}
                      disabled={isSubmitting}
                      onValidationComplete={(isValid, nome) => {
                        setCpfValidated(isValid);
                        setCpfValidating(false);
                        if (isValid && nome) {
                          // Opcional: preencher nome automaticamente se vazio
                          const currentNome = form.getValues("nome");
                          if (!currentNome && nome) {
                            form.setValue("nome", nome);
                            toast.info("Nome preenchido automaticamente", {
                              description: `CPF pertence a: ${nome}`
                            });
                          }
                        }
                      }}
                      className="border-muted-foreground/30"
                    />
                  </FormControl>
                  <FormDescription className="text-[10px]">
                    CPF será validado na Receita Federal. Deve ser único no sistema.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ============================================ */}
            {/* CAMPOS ADICIONAIS (sempre visíveis) */}
            {/* ============================================ */}
            <div className="space-y-4 pt-2 border-t border-border/30">
              {/* Upload de Foto */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-sm">
                  <Camera className="h-4 w-4" />
                  Foto do Aluno
                </Label>
                
                {/* Input de arquivo oculto */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFotoSelect}
                  className="hidden"
                  disabled={isSubmitting || isUploadingFoto}
                />
                
                {fotoPreview ? (
                  // Preview da foto
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-emerald-500/50 group">
                    <img 
                      src={fotoPreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveFoto}
                      className="absolute top-1 right-1 p-1 bg-destructive/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isSubmitting || isUploadingFoto}
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ) : (
                  // Botão de upload
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting || isUploadingFoto}
                    className="border-dashed border-muted-foreground/50 hover:border-emerald-500 hover:bg-emerald-500/5"
                  >
                    {isUploadingFoto ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Anexar Foto (PNG, JPG)
                      </>
                    )}
                  </Button>
                )}
                
                <p className="text-xs text-muted-foreground">
                  Opcional. Máximo 5MB. A foto será associada ao perfil do aluno.
                </p>
              </div>

              {/* Senha */}
              <FormField
                control={form.control}
                name="senha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Lock className="h-4 w-4" />
                      Senha (opcional)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="password"
                        placeholder="Deixe vazio para enviar email de definição"
                        className="border-muted-foreground/30"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription className="text-xs space-y-1">
                      <span className="block">Se vazio, um email será enviado para o aluno definir a senha.</span>
                      <span className="block text-muted-foreground/70">
                        Critérios: mínimo 8 caracteres, com letras maiúsculas, minúsculas, números e símbolos.
                      </span>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Endereço - Título */}
              <div className="flex items-center gap-2 pt-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm text-muted-foreground">Endereço</Label>
              </div>

              {/* Logradouro + Número */}
              <div className="grid grid-cols-3 gap-2">
                <FormField
                  control={form.control}
                  name="logradouro"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Rua, Avenida..."
                          className="border-muted-foreground/30"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Nº"
                          className="border-muted-foreground/30"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Complemento + Bairro */}
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="complemento"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Complemento"
                          className="border-muted-foreground/30"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bairro"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Bairro"
                          className="border-muted-foreground/30"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Cidade + Estado + CEP */}
              <div className="grid grid-cols-4 gap-2">
                <FormField
                  control={form.control}
                  name="cidade"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Cidade"
                          className="border-muted-foreground/30"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="UF"
                          maxLength={2}
                          className="border-muted-foreground/30 uppercase"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="CEP"
                          className="border-muted-foreground/30"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ============================================ */}
            {/* BOTÃO SUBMIT */}
            {/* ============================================ */}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando acesso...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Acesso Oficial
                </>
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
