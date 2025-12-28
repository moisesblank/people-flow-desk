// ============================================
// 📜 PARTE 9 — UI Criação de Acesso Oficial
// CONSTITUIÇÃO SYNAPSE Ω v10.x — PATCH-ONLY
// ============================================
// Campos obrigatórios: nome, email, role
// Campos opcionais: endereço, telefone, foto_aluno, senha
// Edge Function: c-create-official-access (PARTE 10)
// ============================================

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, Mail, User, Phone, MapPin, Lock, Image, Loader2, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

  // Campos opcionais
  telefone: z.string()
    .optional()
    .refine(val => !val || /^[\d\s()+-]+$/.test(val), "Telefone inválido"),
  
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
}).refine((data) => {
  // Se role é beta_expira, expires_days é recomendado (warning no console, não bloqueia)
  if (data.role === 'beta_expira' && !data.expires_days) {
    console.warn('[CriarAcessoOficial] beta_expira selecionado sem expires_days');
  }
  return true;
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
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  const form = useForm<CriarAcessoFormData>({
    resolver: zodResolver(criarAcessoSchema),
    defaultValues: {
      nome: "",
      email: "",
      role: undefined,
      expires_days: undefined,
      telefone: "",
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

  const handleSubmit = async (data: CriarAcessoFormData) => {
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

      // ⚡ PARTE 10: Chamar Edge Function c-create-official-access
      const payload = {
        // Campos obrigatórios
        nome: data.nome.trim(),
        email: data.email,
        role: data.role,
        
        // Campos opcionais (só envia se preenchidos)
        ...(data.telefone && { telefone: data.telefone.trim() }),
        ...(data.foto_aluno && { foto_aluno: data.foto_aluno.trim() }),
        ...(data.senha && { senha: data.senha }),
        ...(data.expires_days && { expires_days: data.expires_days }),
        
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
        throw new Error(errorMsg);
      }

      // Sucesso
      toast.success("✅ Acesso oficial criado!", {
        description: data.senha 
          ? `${data.nome} pode fazer login imediatamente.`
          : `Email de definição de senha enviado para ${data.email}`,
      });

      // Reset form e fecha modal
      form.reset();
      setShowOptionalFields(false);
      onOpenChange(false);
      
      // Callback de sucesso (para refetch/invalidate)
      onSuccess?.();

    } catch (error: any) {
      console.error("Erro ao criar acesso:", error);
      toast.error("Erro ao criar acesso", {
        description: error.message || "Tente novamente",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      setShowOptionalFields(false);
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
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Limpar expires_days se não for beta_expira
                      if (value !== 'beta_expira') {
                        form.setValue('expires_days', undefined);
                      }
                    }} 
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="border-emerald-500/30">
                        <SelectValue placeholder="Selecione o tipo de acesso" />
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
                  <FormDescription className="text-xs">
                    Beta = acesso completo | Gratuito = limitado | Presencial = aulas presenciais | Beta Expira = com prazo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dias de Expiração (só aparece se beta_expira) */}
            {selectedRole === 'beta_expira' && (
              <FormField
                control={form.control}
                name="expires_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Dias de Acesso *
                    </FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value))} 
                      value={field.value?.toString()}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="border-amber-500/30">
                          <SelectValue placeholder="Selecione a duração" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="30">30 dias</SelectItem>
                        <SelectItem value="60">60 dias</SelectItem>
                        <SelectItem value="90">90 dias</SelectItem>
                        <SelectItem value="180">180 dias (6 meses)</SelectItem>
                        <SelectItem value="365">365 dias (1 ano)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs text-amber-400">
                      O acesso expirará após o período selecionado.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* ============================================ */}
            {/* CAMPOS OPCIONAIS (Collapsible) */}
            {/* ============================================ */}
            <Collapsible open={showOptionalFields} onOpenChange={setShowOptionalFields}>
              <CollapsibleTrigger asChild>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="w-full border-dashed border-muted-foreground/30"
                >
                  {showOptionalFields ? "Ocultar campos opcionais" : "Mostrar campos opcionais"}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-4 pt-4">
                {/* Telefone */}
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        Telefone
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="(11) 99999-9999"
                          className="border-muted-foreground/30"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Foto URL */}
                <FormField
                  control={form.control}
                  name="foto_aluno"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Image className="h-4 w-4" />
                        URL da Foto
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="https://exemplo.com/foto.jpg"
                          className="border-muted-foreground/30"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                      <FormDescription className="text-xs">
                        Se vazio, um email será enviado para o aluno definir a senha.
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
              </CollapsibleContent>
            </Collapsible>

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
