// ============================================
// MOISÉS MEDEIROS - PÁGINA DE PERFIL
// Perfil do Usuário Logado
// ============================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Camera,
  Save,
  Loader2,
  Lock,
  CheckCircle,
  AlertCircle,
  LogOut,
  Settings,
  Key,
  CreditCard,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useValidateCPFReal, formatCPF, validateCPFFormat } from "@/hooks/useValidateCPFReal";
import { MFAActionGuard } from "@/components/security";

export default function Perfil() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { validateCPF, isValidating } = useValidateCPFReal();
  const [cpfValidated, setCpfValidated] = useState<boolean | null>(null);
  const [profile, setProfile] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    avatar_url: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showNewPassword, setShowNewPassword] = useState(true); // Visível por padrão
  const [showConfirmPassword, setShowConfirmPassword] = useState(true); // Visível por padrão

  // Carregar dados do perfil
  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Erro ao carregar perfil:", error);
        }

        if (data) {
          setProfile({
            nome: data.nome || "",
            email: data.email || user.email || "",
            telefone: data.phone || "",
            cpf: data.cpf || "",
            avatar_url: data.avatar_url || "",
          });
          // Se já tem CPF cadastrado, considera validado
          if (data.cpf) {
            setCpfValidated(true);
          }
        } else {
          setProfile(prev => ({
            ...prev,
            email: user.email || "",
            nome: user.user_metadata?.nome || "",
          }));
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  // Validar CPF quando usuário sair do campo
  const handleCPFBlur = async () => {
    const cleanCpf = profile.cpf.replace(/\D/g, '');
    if (cleanCpf.length === 11) {
      // Primeiro verifica formato local (grátis)
      if (!validateCPFFormat(profile.cpf)) {
        setCpfValidated(false);
        toast.error("CPF inválido", { description: "Dígitos verificadores incorretos" });
        return;
      }
      // Depois valida na Receita Federal
      const result = await validateCPF(profile.cpf);
      setCpfValidated(result?.valid || false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Se CPF foi preenchido, validar antes de salvar
    const cleanCpf = profile.cpf.replace(/\D/g, '');
    if (cleanCpf.length > 0) {
      if (cleanCpf.length !== 11) {
        toast.error("CPF deve ter 11 dígitos");
        return;
      }
      
      // Validar na Receita Federal se ainda não foi validado
      if (cpfValidated === null || cpfValidated === false) {
        toast.info("Validando CPF na Receita Federal...");
        const result = await validateCPF(profile.cpf);
        if (!result?.valid) {
          toast.error("CPF inválido", { 
            description: result?.error || "CPF não encontrado na Receita Federal" 
          });
          return;
        }
        setCpfValidated(true);
      }
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          nome: profile.nome,
          phone: profile.telefone,
          cpf: cleanCpf || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error("Erro ao atualizar perfil: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Executa a alteração de senha (chamado APÓS 2FA ser verificado)
  const executePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast.success("Senha alterada com sucesso!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      toast.error("Erro ao alterar senha: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsSaving(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // LEI VII: Usar signed URL para bucket privado
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("avatars")
        .createSignedUrl(filePath, 31536000); // 1 ano (avatars são semi-permanentes)
      
      if (signedUrlError) throw signedUrlError;
      
      // Armazenar o path no banco (não a URL assinada que expira)
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: filePath, // Guardar apenas o path, gerar signed URL quando necessário
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: signedUrlData?.signedUrl || filePath }));
      toast.success("Avatar atualizado!");
    } catch (error: any) {
      console.error("Erro ao atualizar avatar:", error);
      toast.error("Erro ao atualizar avatar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
    toast.success("Até logo!");
  };

  const getRoleBadge = () => {
    const roleColors: Record<string, string> = {
      owner: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
      admin: "bg-gradient-to-r from-purple-500 to-violet-500 text-white",
      employee: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white",
      coordenacao: "bg-gradient-to-r from-green-500 to-emerald-500 text-white",
      suporte: "bg-gradient-to-r from-pink-500 to-rose-500 text-white",
    };

    const roleLabels: Record<string, string> = {
      owner: "👑 Owner",
      admin: "⭐ Admin",
      employee: "👤 Funcionário",
      coordenacao: "📋 Coordenação",
      suporte: "💬 Suporte",
      monitoria: "📚 Monitoria",
      afiliado: "🤝 Afiliado",
      marketing: "📢 Marketing",
      contabilidade: "💼 Contabilidade",
    };

    return (
      <Badge className={roleColors[role || "employee"] || "bg-muted"}>
        {roleLabels[role || "employee"] || role}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <User className="h-8 w-8 text-primary" />
            Meu Perfil
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas informações pessoais e preferências
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/configuracoes")}>
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative group">
                <Avatar className="h-24 w-24 border-4 border-primary/20">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {profile.nome?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="h-6 w-6 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold">{profile.nome || "Usuário"}</h2>
                <p className="text-muted-foreground">{profile.email}</p>
                <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                  {getRoleBadge()}
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Verificado
                  </Badge>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {new Date(user?.created_at || "").toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                  </div>
                  <div className="text-xs text-muted-foreground">Membro desde</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs defaultValue="perfil" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="perfil" className="gap-2">
              <User className="h-4 w-4" />
              Dados Pessoais
            </TabsTrigger>
            <TabsTrigger value="seguranca" className="gap-2">
              <Shield className="h-4 w-4" />
              Segurança
            </TabsTrigger>
          </TabsList>

          {/* Tab: Perfil */}
          <TabsContent value="perfil">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>
                  Atualize suas informações de contato e identificação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome Completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="nome"
                          value={profile.nome}
                          onChange={(e) => setProfile(prev => ({ ...prev, nome: e.target.value }))}
                          placeholder="Seu nome completo"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          disabled
                          className="pl-10 bg-muted"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        O email não pode ser alterado
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="telefone"
                          value={profile.telefone}
                          onChange={(e) => setProfile(prev => ({ ...prev, telefone: e.target.value }))}
                          placeholder="(00) 00000-0000"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cpf">
                        CPF
                        {cpfValidated === true && (
                          <CheckCircle className="inline-block ml-2 h-4 w-4 text-green-500" />
                        )}
                        {cpfValidated === false && (
                          <AlertCircle className="inline-block ml-2 h-4 w-4 text-red-500" />
                        )}
                        {isValidating && (
                          <Loader2 className="inline-block ml-2 h-4 w-4 animate-spin text-primary" />
                        )}
                      </Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="cpf"
                          value={formatCPF(profile.cpf)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
                            setProfile(prev => ({ ...prev, cpf: raw }));
                            setCpfValidated(null); // Reset validation status on change
                          }}
                          onBlur={handleCPFBlur}
                          placeholder="000.000.000-00"
                          className={`pl-10 ${
                            cpfValidated === true 
                              ? 'border-green-500 focus:ring-green-500' 
                              : cpfValidated === false 
                              ? 'border-red-500 focus:ring-red-500' 
                              : ''
                          }`}
                          maxLength={14}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {cpfValidated === true 
                          ? "✓ CPF validado na Receita Federal" 
                          : cpfValidated === false 
                          ? "✗ CPF inválido ou não encontrado" 
                          : "Obrigatório para certificados e pagamentos"
                        }
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Criado em</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={new Date(user?.created_at || "").toLocaleDateString("pt-BR")}
                          disabled
                          className="pl-10 bg-muted"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <Button type="submit" disabled={isSaving || isValidating} className="w-full md:w-auto">
                    {isSaving || isValidating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {isValidating ? "Validando CPF..." : isSaving ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Segurança */}
          <TabsContent value="seguranca">
            <Card>
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
                <CardDescription>
                  Mantenha sua conta segura com uma senha forte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nova Senha</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Digite sua nova senha"
                          className="pl-10 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirme sua nova senha"
                          className="pl-10 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Requisitos da senha:</p>
                      <ul className="list-disc list-inside mt-1 space-y-0.5">
                        <li>Mínimo de 6 caracteres</li>
                        <li>Recomendado: letras, números e símbolos</li>
                      </ul>
                    </div>
                  </div>

                  {/* 🔐 Botão protegido por 2FA */}
                  <MFAActionGuard action="change_password" onVerified={executePasswordChange}>
                    <Button 
                      type="button" 
                      disabled={isSaving || !passwordData.newPassword || !passwordData.confirmPassword} 
                      variant="outline" 
                      className="w-full md:w-auto"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Shield className="h-4 w-4 mr-2" />
                      )}
                      Alterar Senha
                    </Button>
                  </MFAActionGuard>
                </div>
              </CardContent>
            </Card>

            {/* Session Info */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Sessão Atual</CardTitle>
                <CardDescription>
                  Informações sobre sua sessão de login
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">ID do Usuário</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{user?.id?.slice(0, 8)}...</code>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Último login</span>
                    <span className="text-sm">
                      {new Date(user?.last_sign_in_at || "").toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant="outline" className="gap-1 text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      Ativo
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
