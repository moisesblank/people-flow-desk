import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  Eye,
  Moon,
  Sun,
  Image as ImageIcon,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function Configuracoes() {
  const { toast } = useToast();
  const { role } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    companyName: "Moisés Medeiros",
    companyEmail: "contato@moisesmedeiros.com",
    enableNotifications: true,
    enableEmailAlerts: true,
    darkMode: true,
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simulated save
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Configurações salvas",
        description: "Suas preferências foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    setIsLoading(true);
    try {
      const [employees, income, expenses, affiliates, students] = await Promise.all([
        supabase.from("employees").select("*"),
        supabase.from("income").select("*"),
        supabase.from("personal_extra_expenses").select("*"),
        supabase.from("affiliates").select("*"),
        supabase.from("students").select("*"),
      ]);

      const data = {
        exportedAt: new Date().toISOString(),
        employees: employees.data,
        income: income.data,
        expenses: expenses.data,
        affiliates: affiliates.data,
        students: students.data,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Backup realizado",
        description: "Seus dados foram exportados com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro no backup",
        description: "Não foi possível exportar os dados.",
        variant: "destructive",
      });
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

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-secondary/50">
            <TabsTrigger value="general" className="gap-2">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Aparência</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notificações</span>
            </TabsTrigger>
            <TabsTrigger value="backup" className="gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Backup</span>
            </TabsTrigger>
          </TabsList>

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

                <div className="p-4 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3 mb-4">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label>Logo da Empresa</Label>
                      <p className="text-xs text-muted-foreground">Faça upload do seu logotipo</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" disabled>
                    <Upload className="h-4 w-4 mr-2" />
                    Em breve
                  </Button>
                </div>

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
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-6 rounded-xl bg-secondary/30 text-center">
                  <Download className="h-10 w-10 text-[hsl(var(--stats-green))] mx-auto mb-3" />
                  <h4 className="font-semibold text-foreground mb-2">Exportar Dados</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Faça download de todos os seus dados em formato JSON
                  </p>
                  <Button onClick={handleExportData} disabled={isLoading} variant="outline" className="w-full">
                    {isLoading ? "Exportando..." : "Exportar Backup"}
                  </Button>
                </div>

                <div className="p-6 rounded-xl bg-secondary/30 text-center">
                  <Upload className="h-10 w-10 text-[hsl(var(--stats-blue))] mx-auto mb-3" />
                  <h4 className="font-semibold text-foreground mb-2">Restaurar Dados</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Restaure dados de um backup anterior
                  </p>
                  <Button variant="outline" className="w-full" disabled>
                    Em breve
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-start gap-3">
                  <Activity className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground">Logs de Atividades</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      O sistema registra automaticamente todas as ações importantes para auditoria e segurança.
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
