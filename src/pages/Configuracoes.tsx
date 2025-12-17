// ============================================
// MOISÉS MEDEIROS v7.0 - CONFIGURAÇÕES
// Spider-Man Theme - Preferências do Sistema
// ============================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings as SettingsIcon, 
  Sparkles, 
  Database, 
  Palette, 
  Bell,
  Shield,
  Download,
  Upload,
  Activity,
  Moon,
  Image as ImageIcon,
  Save,
  FileJson,
  Table,
  Loader2,
  CheckCircle2,
  RotateCcw,
  HelpCircle,
  Trash2,
  Fingerprint,
  Smartphone,
  Key,
  QrCode,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  X,
  Lock,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { useOnboarding } from "@/components/onboarding/OnboardingManager";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LogoUploader } from "@/components/settings/LogoUploader";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Configuracoes() {
  const { role, user } = useAuth();
  const queryClient = useQueryClient();
  const { resetTour, hasCompleted: tourCompleted } = useOnboarding("dashboard");
  const [isLoading, setIsLoading] = useState(false);
  const [backupProgress, setBackupProgress] = useState<string | null>(null);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [mfaStep, setMfaStep] = useState<'initial' | 'setup' | 'verify'>('initial');
  const [verificationCode, setVerificationCode] = useState('');
  
  const [settings, setSettings] = useState({
    companyName: "Moisés Medeiros",
    companyEmail: "contato@moisesmedeiros.com",
    enableNotifications: true,
    enableEmailAlerts: true,
    darkMode: true,
  });

  // Fetch MFA settings
  const { data: mfaSettings } = useQuery({
    queryKey: ['mfa-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_mfa_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Generate backup codes
  const generateBackupCodes = () => {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(
        Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
        Math.random().toString(36).substring(2, 6).toUpperCase()
      );
    }
    return codes;
  };

  // Enable MFA mutation
  const enableMfaMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Usuário não encontrado');
      const backupCodes = generateBackupCodes();
      const { error } = await supabase
        .from('user_mfa_settings')
        .upsert({
          user_id: user.id,
          mfa_enabled: true,
          mfa_type: 'totp',
          backup_codes: backupCodes,
          updated_at: new Date().toISOString()
        });
      if (error) throw error;
      return { backupCodes };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfa-settings'] });
      toast.success("2FA Ativado com sucesso!");
      setMfaStep('initial');
      setVerificationCode('');
    },
    onError: () => {
      toast.error("Erro ao ativar 2FA");
    }
  });

  // Disable MFA mutation  
  const disableMfaMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Usuário não encontrado');
      const { error } = await supabase
        .from('user_mfa_settings')
        .update({ mfa_enabled: false, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfa-settings'] });
      toast.success("2FA Desativado");
    }
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!");
  };

  const backupCodes = (mfaSettings?.backup_codes as string[]) || [];

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Configurações salvas com sucesso!");
    } catch {
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async (format: 'json' | 'csv' = 'json') => {
    setIsLoading(true);
    setBackupProgress("Iniciando backup...");
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("Você precisa estar logado");
      }

      setBackupProgress("Coletando dados...");

      // Call the backup edge function
      const response = await supabase.functions.invoke('backup-data', {
        body: { format, tables: 'all' },
      });

      if (response.error) {
        throw response.error;
      }

      const data = response.data;

      if (!data.success) {
        throw new Error(data.error || "Erro no backup");
      }

      setBackupProgress("Gerando arquivo...");

      // Download the backup
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-moises-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`Backup realizado! ${data.total_records} registros exportados.`);
    } catch (error) {
      console.error("Backup error:", error);
      toast.error(error instanceof Error ? error.message : "Erro no backup");
    } finally {
      setIsLoading(false);
      setBackupProgress(null);
    }
  };

  const handleQuickExport = async () => {
    setIsLoading(true);
    try {
      const [employees, income, expenses, affiliates, students] = await Promise.all([
        supabase.from("employees").select("*"),
        supabase.from("income").select("*"),
        supabase.from("personal_extra_expenses").select("*"),
        supabase.from("affiliates").select("*"),
        supabase.from("students").select("*"),
      ]);

      const results = {
        exportedAt: new Date().toISOString(),
        employees: employees.data || [],
        income: income.data || [],
        personal_extra_expenses: expenses.data || [],
        affiliates: affiliates.data || [],
        students: students.data || [],
      };

      const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-rapido-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Backup rápido realizado!");
    } catch {
      toast.error("Erro no backup rápido");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="space-y-2">
            <motion.div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium tracking-wide uppercase">Sistema</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              Configurações
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Personalize o sistema de acordo com suas preferências.
            </p>
          </div>
        </motion.header>

        <Tabs defaultValue="security" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-card/50 border border-border/50 backdrop-blur-sm">
            <TabsTrigger value="general" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Segurança</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Aparência</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notificações</span>
            </TabsTrigger>
            <TabsTrigger value="help" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Ajuda</span>
            </TabsTrigger>
            <TabsTrigger value="backup" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Backup</span>
            </TabsTrigger>
          </TabsList>

          {/* Security Tab - 2FA/MFA */}
          <TabsContent value="security">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* 2FA Section */}
              <div className="cyber-card p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
                      <Fingerprint className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        Autenticação de Dois Fatores (2FA)
                        {mfaSettings?.mfa_enabled && (
                          <Badge className="bg-stats-green/20 text-stats-green border-stats-green/30">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Ativo
                          </Badge>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Adicione uma camada extra de segurança à sua conta
                      </p>
                    </div>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {!mfaSettings?.mfa_enabled ? (
                    <motion.div
                      key="setup"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      {mfaStep === 'initial' && (
                        <>
                          <div className="flex items-start gap-4 p-4 rounded-xl bg-stats-gold/10 border border-stats-gold/30">
                            <AlertTriangle className="w-5 h-5 text-stats-gold mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-stats-gold">Por que usar 2FA?</p>
                              <p className="text-sm text-muted-foreground">
                                Protege sua conta mesmo que sua senha seja comprometida. Você precisará do celular para fazer login.
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                              onClick={() => setMfaStep('setup')}
                              className="p-5 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <QrCode className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                                <span className="font-medium">Aplicativo Autenticador</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Google Authenticator, Authy ou similar
                              </p>
                            </button>

                            <button
                              className="p-5 rounded-xl border border-border opacity-50 cursor-not-allowed text-left"
                              disabled
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <Smartphone className="w-6 h-6 text-muted-foreground" />
                                <span className="font-medium">SMS</span>
                                <Badge variant="outline" className="text-xs">Em breve</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Receba códigos por mensagem de texto
                              </p>
                            </button>
                          </div>
                        </>
                      )}

                      {mfaStep === 'setup' && (
                        <div className="space-y-6">
                          <div className="flex flex-col items-center p-8 rounded-xl bg-card/50 border border-dashed border-border">
                            <div className="w-48 h-48 bg-white rounded-xl flex items-center justify-center mb-4 shadow-lg">
                              <QrCode className="w-32 h-32 text-gray-800" />
                            </div>
                            <p className="text-sm text-muted-foreground text-center">
                              Escaneie este código QR com seu aplicativo autenticador
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>Código de verificação</Label>
                            <div className="flex gap-3">
                              <Input 
                                placeholder="000000"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                maxLength={6}
                                className="font-mono text-center text-xl tracking-[0.5em] bg-card/50"
                              />
                              <Button 
                                onClick={() => enableMfaMutation.mutate()}
                                disabled={verificationCode.length !== 6 || enableMfaMutation.isPending}
                                className="cyber-button"
                              >
                                {enableMfaMutation.isPending ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4" />
                                )}
                                Verificar
                              </Button>
                            </div>
                          </div>

                          <Button variant="ghost" onClick={() => setMfaStep('initial')} className="w-full">
                            <X className="w-4 h-4 mr-2" />
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="enabled"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-stats-green/10 border border-stats-green/30">
                        <CheckCircle2 className="w-5 h-5 text-stats-green" />
                        <div>
                          <p className="font-medium text-stats-green">2FA está ativo</p>
                          <p className="text-sm text-muted-foreground">Sua conta está protegida</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Códigos de Backup</h4>
                            <p className="text-sm text-muted-foreground">Use se perder acesso ao autenticador</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setShowBackupCodes(!showBackupCodes)}>
                            {showBackupCodes ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                            {showBackupCodes ? 'Ocultar' : 'Mostrar'}
                          </Button>
                        </div>

                        <AnimatePresence>
                          {showBackupCodes && backupCodes.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="grid grid-cols-2 md:grid-cols-5 gap-2"
                            >
                              {backupCodes.map((code, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleCopyCode(code)}
                                  className="p-2 rounded-lg bg-muted/50 border border-border font-mono text-sm hover:bg-muted transition-colors flex items-center justify-between group"
                                >
                                  <span>{code}</span>
                                  <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <Separator />

                      <Button 
                        variant="destructive" 
                        onClick={() => disableMfaMutation.mutate()}
                        disabled={disableMfaMutation.isPending}
                      >
                        {disableMfaMutation.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
                        Desativar 2FA
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Password Section */}
              <div className="cyber-card p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-stats-blue/20 border border-stats-blue/30">
                    <Lock className="w-6 h-6 text-stats-blue" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Alterar Senha</h3>
                    <p className="text-sm text-muted-foreground">Atualize sua senha regularmente</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Senha Atual</Label>
                    <Input type="password" placeholder="••••••••" className="bg-card/50" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nova Senha</Label>
                      <Input type="password" placeholder="••••••••" className="bg-card/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirmar Nova Senha</Label>
                      <Input type="password" placeholder="••••••••" className="bg-card/50" />
                    </div>
                  </div>
                  <Button className="cyber-button">
                    <Key className="w-4 h-4 mr-2" />
                    Atualizar Senha
                  </Button>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* General Settings */}
          <TabsContent value="general">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6 space-y-6"
            >
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-primary" />
                Configurações Gerais
              </h3>
              
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa</Label>
                  <Input
                    id="companyName"
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    className="bg-secondary/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Email de Contato</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={settings.companyEmail}
                    onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                    className="bg-secondary/50"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                  <div className="space-y-1">
                    <Label>Seu Cargo</Label>
                    <p className="text-sm text-muted-foreground">
                      {role === "owner" ? "Proprietário (acesso total)" : 
                       role === "admin" ? "Administrador" : "Funcionário"}
                    </p>
                  </div>
                  <Shield className="h-6 w-6 text-primary" />
                </div>
              </div>

              <Button onClick={handleSave} disabled={isLoading} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </motion.div>
          </TabsContent>

          {/* Appearance */}
          <TabsContent value="appearance">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6 space-y-6"
            >
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Personalização Visual
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <Moon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label>Modo Escuro</Label>
                      <p className="text-xs text-muted-foreground">Interface escura para conforto visual</p>
                    </div>
                  </div>
                  <Switch checked={settings.darkMode} disabled />
                </div>

                <LogoUploader />

                <div className="p-4 rounded-xl bg-secondary/30">
                  <Label className="mb-2 block">Cor Principal</Label>
                  <div className="flex gap-2">
                    {["#7D1128", "#1a73e8", "#34a853", "#8b5cf6", "#f59e0b"].map((color) => (
                      <button
                        key={color}
                        className="w-10 h-10 rounded-lg border-2 border-transparent hover:border-white/50 transition-all"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6 space-y-6"
            >
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Preferências de Notificação
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                  <div>
                    <Label>Notificações do Sistema</Label>
                    <p className="text-xs text-muted-foreground">Receba alertas sobre atividades importantes</p>
                  </div>
                  <Switch 
                    checked={settings.enableNotifications}
                    onCheckedChange={(v) => setSettings({ ...settings, enableNotifications: v })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                  <div>
                    <Label>Alertas por Email</Label>
                    <p className="text-xs text-muted-foreground">Receba resumos diários por email</p>
                  </div>
                  <Switch 
                    checked={settings.enableEmailAlerts}
                    onCheckedChange={(v) => setSettings({ ...settings, enableEmailAlerts: v })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                  <div>
                    <Label>Alertas de Orçamento</Label>
                    <p className="text-xs text-muted-foreground">Notificar quando gastos passarem do limite</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Button onClick={handleSave} disabled={isLoading} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Salvar Preferências
              </Button>
            </motion.div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-6">
                <Bell className="h-5 w-5 text-primary" />
                Configurações de Notificações
              </h3>
              <NotificationSettings />
            </motion.div>
          </TabsContent>

          {/* Help & Onboarding */}
          <TabsContent value="help">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6 space-y-6"
            >
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Ajuda e Onboarding
              </h3>

              <div className="space-y-4">
                {/* Tour Reset */}
                <div className="p-6 rounded-xl bg-secondary/30">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <RotateCcw className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">Tour Guiado</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Veja novamente o tour de introdução ao sistema para conhecer todas as funcionalidades.
                      </p>
                      <div className="flex items-center gap-3">
                        <Button 
                          onClick={resetTour}
                          variant="outline"
                          className="gap-2"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Reiniciar Tour
                        </Button>
                        {tourCompleted && (
                          <Badge variant="outline" className="text-stats-green border-stats-green/50">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Concluído
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documentation Link */}
                <div className="p-6 rounded-xl bg-secondary/30">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-stats-blue/10">
                      <Sparkles className="h-6 w-6 text-stats-blue" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">Central de Ajuda</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Acesse a documentação completa e tutoriais sobre o sistema.
                      </p>
                      <Button 
                        variant="outline"
                        onClick={() => window.location.href = '/guia'}
                        className="gap-2"
                      >
                        <HelpCircle className="h-4 w-4" />
                        Ver Documentação
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Clear All Data (Danger Zone) */}
                <div className="p-6 rounded-xl bg-destructive/5 border border-destructive/20">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-destructive/10">
                      <Trash2 className="h-6 w-6 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-destructive mb-1">Zona de Perigo</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Limpar todos os dados locais (cache, preferências). Isso não afeta seus dados no servidor.
                      </p>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="gap-2">
                            <Trash2 className="h-4 w-4" />
                            Limpar Dados Locais
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Limpeza</AlertDialogTitle>
                            <AlertDialogDescription>
                              Isso vai limpar todos os dados locais do navegador (cache, preferências de tour, etc).
                              Seus dados salvos no servidor não serão afetados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                localStorage.clear();
                                sessionStorage.clear();
                                toast.success("Dados locais limpos! A página será recarregada.");
                                setTimeout(() => window.location.reload(), 1000);
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Confirmar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* Backup */}
          <TabsContent value="backup">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6 space-y-6"
            >
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Backup e Restauração
                {role && ['owner', 'admin'].includes(role) && (
                  <Badge variant="outline" className="ml-2">Acesso Completo</Badge>
                )}
              </h3>

              {backupProgress && (
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  <span className="text-sm text-foreground">{backupProgress}</span>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-6 rounded-xl bg-secondary/30 text-center">
                  <FileJson className="h-10 w-10 text-[hsl(var(--stats-green))] mx-auto mb-3" />
                  <h4 className="font-semibold text-foreground mb-2">Backup Completo</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Exporta todos os dados do sistema via Edge Function segura
                  </p>
                  <Button 
                    onClick={() => handleExportData('json')} 
                    disabled={isLoading || !['owner', 'admin'].includes(role || '')} 
                    className="w-full"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                    {isLoading ? "Exportando..." : "Backup Completo"}
                  </Button>
                </div>

                <div className="p-6 rounded-xl bg-secondary/30 text-center">
                  <Table className="h-10 w-10 text-[hsl(var(--stats-blue))] mx-auto mb-3" />
                  <h4 className="font-semibold text-foreground mb-2">Backup Rápido</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Exporta tabelas principais diretamente
                  </p>
                  <Button 
                    onClick={handleQuickExport} 
                    disabled={isLoading} 
                    variant="outline" 
                    className="w-full"
                  >
                    {isLoading ? "Exportando..." : "Backup Rápido"}
                  </Button>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-secondary/30 text-center">
                <Upload className="h-10 w-10 text-[hsl(var(--stats-gold))] mx-auto mb-3" />
                <h4 className="font-semibold text-foreground mb-2">Restaurar Dados</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Restaure dados de um backup anterior (em breve)
                </p>
                <Button variant="outline" className="w-full" disabled>
                  Em breve
                </Button>
              </div>

              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-start gap-3">
                  <Activity className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground">Logs de Auditoria</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Todos os backups são registrados automaticamente para segurança e auditoria.
                      {user?.email && <span className="block mt-1">Usuário: {user.email}</span>}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
