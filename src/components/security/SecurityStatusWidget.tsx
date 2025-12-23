// ============================================
// SYNAPSE v14.0 - SECURITY STATUS WIDGET
// Status de segurança da conta
// ============================================

import { motion } from 'framer-motion';
import { useQuantumReactivity } from '@/hooks/useQuantumReactivity';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  Lock,
  Key,
  Smartphone,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { useSubspaceQuery } from '@/hooks/useSubspaceCommunication';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SecurityCheck {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: 'complete' | 'warning' | 'incomplete';
  action?: string;
}

export function SecurityStatusWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: mfaSettings } = useSubspaceQuery(
    ['mfa-settings', user?.id || 'anon'],
    async () => {
      if (!user?.id) return null;
      try {
        const { data, error } = await supabase
          .from('user_mfa_settings')
          .select('id, user_id, mfa_enabled, mfa_type, phone_number, last_verified_at, created_at, updated_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.warn('MFA settings query error:', error.message);
          return null;
        }
        return data;
      } catch (err) {
        console.warn('Failed to fetch MFA settings:', err);
        return null;
      }
    },
    {
      profile: 'user',
      persistKey: `mfa_settings_${user?.id}`,
      enabled: !!user?.id,
    }
  );

  const securityChecks: SecurityCheck[] = [
    {
      id: 'email',
      name: 'Email Verificado',
      description: 'Seu email está confirmado',
      icon: Mail,
      status: user?.email_confirmed_at ? 'complete' : 'warning'
    },
    {
      id: 'password',
      name: 'Senha Forte',
      description: 'Use letras, números e símbolos',
      icon: Key,
      status: 'complete' // Assume strong if they got past validation
    },
    {
      id: '2fa',
      name: 'Autenticação 2FA',
      description: mfaSettings?.mfa_enabled ? 'Proteção extra ativada' : 'Adicione camada extra de segurança',
      icon: Smartphone,
      status: mfaSettings?.mfa_enabled ? 'complete' : 'incomplete',
      action: mfaSettings?.mfa_enabled ? undefined : 'Ativar 2FA'
    },
    {
      id: 'backup',
      name: 'Códigos de Backup',
      description: mfaSettings?.mfa_enabled ? 'Códigos disponíveis nas configurações' : 'Ative 2FA primeiro',
      icon: Lock,
      status: mfaSettings?.mfa_enabled ? 'complete' : 'incomplete'
    }
  ];

  const completedChecks = securityChecks.filter(c => c.status === 'complete').length;
  const securityScore = Math.round((completedChecks / securityChecks.length) * 100);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle2 className="w-4 h-4 text-stats-green" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-stats-gold" />;
      default: return <AlertTriangle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getScoreColor = () => {
    if (securityScore >= 75) return 'text-stats-green';
    if (securityScore >= 50) return 'text-stats-gold';
    return 'text-destructive';
  };

  const getScoreBadge = () => {
    if (securityScore >= 75) return { text: 'Excelente', class: 'bg-stats-green/20 text-stats-green border-stats-green/30' };
    if (securityScore >= 50) return { text: 'Moderado', class: 'bg-stats-gold/20 text-stats-gold border-stats-gold/30' };
    return { text: 'Precisa Atenção', class: 'bg-destructive/20 text-destructive border-destructive/30' };
  };

  const scoreBadge = getScoreBadge();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/20">
              {securityScore >= 75 ? (
                <ShieldCheck className="w-4 h-4 text-stats-green" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-stats-gold" />
              )}
            </div>
            Segurança da Conta
          </div>
          <Badge className={scoreBadge.class}>{scoreBadge.text}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Security Score */}
        <div className="text-center p-4 rounded-xl bg-muted/50">
          <div className={`text-4xl font-bold ${getScoreColor()}`}>
            {securityScore}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">Nível de Segurança</p>
          <Progress value={securityScore} className="h-2 mt-3" />
        </div>

        {/* Security Checks */}
        <div className="space-y-2">
          {securityChecks.map((check, index) => {
            const Icon = check.icon;
            return (
              <motion.div
                key={check.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{check.name}</p>
                    <p className="text-xs text-muted-foreground">{check.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {check.action && check.status === 'incomplete' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs h-7"
                      onClick={() => navigate('/configuracoes')}
                    >
                      {check.action}
                    </Button>
                  )}
                  {getStatusIcon(check.status)}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Action Button */}
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate('/configuracoes')}
        >
          <Settings className="w-4 h-4 mr-2" />
          Gerenciar Segurança
        </Button>
      </CardContent>
    </Card>
  );
}

export default SecurityStatusWidget;
