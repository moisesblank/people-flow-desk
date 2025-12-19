// ============================================
// COMPONENTE DE CONFIGURAÇÃO MFA
// Autenticação de dois fatores
// ============================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Smartphone, Mail, Key, Check, AlertTriangle, Copy, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MFASettings {
  id: string;
  user_id: string;
  mfa_enabled: boolean;
  mfa_method: 'totp' | 'sms' | 'email';
  mfa_type?: string;
  backup_codes: string[] | null;
  last_verified_at: string | null;
}

export function MFASetup() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<MFASettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'totp' | 'email'>('email');

  useEffect(() => {
    if (user?.id) {
      fetchSettings();
    }
  }, [user?.id]);

  const fetchSettings = async () => {
    try {
      // Select only allowed columns (totp_secret and backup_codes are revoked)
      const { data, error } = await supabase
        .from('user_mfa_settings')
        .select('id, user_id, mfa_enabled, mfa_type, phone_number, last_verified_at, created_at, updated_at')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('MFA fetch error:', error.message);
        return;
      }
      if (data) {
        setSettings({
          ...data,
          mfa_method: (data.mfa_type as 'totp' | 'sms' | 'email') || 'email',
          backup_codes: null, // Can't read back - write-only for security
        });
      }
    } catch (error) {
      console.error('Error fetching MFA settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const enableMFA = async () => {
    try {
      // Gerar códigos de backup
      const backupCodes = Array.from({ length: 8 }, () =>
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );

      const newSettings = {
        user_id: user?.id,
        mfa_enabled: true,
        mfa_method: selectedMethod,
        backup_codes: backupCodes,
        last_verified_at: new Date().toISOString(),
      };

      if (settings) {
        const { error } = await supabase
          .from('user_mfa_settings')
          .update(newSettings)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_mfa_settings')
          .insert(newSettings);
        if (error) throw error;
      }

      await fetchSettings();
      setShowSetupDialog(false);
      setShowBackupCodes(true);
      toast.success('Autenticação de dois fatores ativada!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao ativar MFA');
    }
  };

  const disableMFA = async () => {
    if (!settings) return;

    try {
      const { error } = await supabase
        .from('user_mfa_settings')
        .update({
          mfa_enabled: false,
          backup_codes: null,
        })
        .eq('id', settings.id);

      if (error) throw error;

      await fetchSettings();
      toast.success('Autenticação de dois fatores desativada');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao desativar MFA');
    }
  };

  const copyBackupCodes = () => {
    if (settings?.backup_codes) {
      navigator.clipboard.writeText(settings.backup_codes.join('\n'));
      toast.success('Códigos copiados!');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 bg-muted rounded" />
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-10 w-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isEnabled = settings?.mfa_enabled;

  return (
    <>
      <Card className={cn(isEnabled && "border-green-500/30")}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-3 rounded-xl",
                isEnabled ? "bg-green-500/20" : "bg-muted"
              )}>
                <Shield className={cn("h-6 w-6", isEnabled ? "text-green-500" : "text-muted-foreground")} />
              </div>
              <div>
                <CardTitle className="text-lg">Autenticação de Dois Fatores (2FA)</CardTitle>
                <CardDescription>
                  Adicione uma camada extra de segurança à sua conta
                </CardDescription>
              </div>
            </div>
            <Badge className={isEnabled ? "bg-green-500/20 text-green-500" : "bg-muted"}>
              {isEnabled ? 'Ativado' : 'Desativado'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isEnabled ? (
            <>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <Check className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Sua conta está protegida</p>
                  <p className="text-sm text-muted-foreground">
                    Método: {settings?.mfa_method === 'email' ? 'E-mail' : 'Aplicativo autenticador'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowBackupCodes(true)}>
                  <Key className="h-4 w-4 mr-2" />
                  Ver Códigos de Backup
                </Button>
                <Button variant="destructive" onClick={disableMFA}>
                  Desativar 2FA
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium">Sua conta pode estar vulnerável</p>
                  <p className="text-sm text-muted-foreground">
                    Ative a autenticação de dois fatores para maior segurança
                  </p>
                </div>
              </div>

              <Button onClick={() => setShowSetupDialog(true)} className="w-full sm:w-auto">
                <Shield className="h-4 w-4 mr-2" />
                Ativar 2FA
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Configuração */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Autenticação de Dois Fatores</DialogTitle>
            <DialogDescription>
              Escolha o método de verificação para proteger sua conta
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Método: E-mail */}
            <button
              onClick={() => setSelectedMethod('email')}
              className={cn(
                "w-full p-4 rounded-xl border text-left transition-all",
                selectedMethod === 'email'
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Verificação por E-mail</p>
                  <p className="text-sm text-muted-foreground">
                    Receba um código no seu e-mail
                  </p>
                </div>
              </div>
            </button>

            {/* Método: TOTP (futuro) */}
            <button
              onClick={() => setSelectedMethod('totp')}
              className={cn(
                "w-full p-4 rounded-xl border text-left transition-all",
                selectedMethod === 'totp'
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Aplicativo Autenticador</p>
                  <p className="text-sm text-muted-foreground">
                    Use Google Authenticator ou similar
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowSetupDialog(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={enableMFA} className="flex-1">
              Ativar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Códigos de Backup */}
      <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Códigos de Backup</DialogTitle>
            <DialogDescription>
              Guarde esses códigos em um lugar seguro. Cada código só pode ser usado uma vez.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-xl font-mono text-sm">
              {settings?.backup_codes?.map((code, idx) => (
                <div key={idx} className="p-2 bg-background rounded">
                  {code}
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={copyBackupCodes} className="w-full mt-4">
              <Copy className="h-4 w-4 mr-2" />
              Copiar Códigos
            </Button>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            <p className="text-sm text-yellow-600">
              Atenção: Esses códigos não serão mostrados novamente!
            </p>
          </div>

          <Button onClick={() => setShowBackupCodes(false)}>
            Entendi, já salvei
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
