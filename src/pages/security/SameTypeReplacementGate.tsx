// ============================================
// 🛡️ BEYOND_THE_3_DEVICES — Same Type Replacement Gate
// Cenário: Usuário já tem 3 tipos (Desktop, Mobile, Tablet)
// e tenta acessar com um NOVO dispositivo do MESMO TIPO
// REGRA: Desktop↔Desktop, Mobile↔Mobile, Tablet↔Tablet
// 🛡️ P0 FIX: error é SEMPRE string (evita React Error #61)
// ============================================

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Smartphone, 
  Loader2, 
  Monitor,
  Tablet,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import { useSameTypeReplacementStore } from '@/state/sameTypeReplacementStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatError } from '@/lib/utils/formatError';

// ============================================
// CONSTANTES
// ============================================

const DEVICE_TYPE_LABELS: Record<string, { label: string; description: string }> = {
  desktop: { label: 'Computador', description: 'Desktop ou Notebook' },
  tablet: { label: 'Tablet', description: 'iPad ou Android Tablet' },
  mobile: { label: 'Celular', description: 'iPhone ou Android' },
};

// ============================================
// FUNÇÕES HELPER
// ============================================

function getDeviceIcon(deviceType: string) {
  switch (deviceType) {
    case 'mobile':
      return Smartphone;
    case 'tablet':
      return Tablet;
    default:
      return Monitor;
  }
}

function formatLastSeen(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 2) return 'agora';
    if (diffMins < 60) return `há ${diffMins} minutos`;
    if (diffHours < 24) {
      const hora = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return `Hoje às ${hora}`;
    }
    if (diffDays === 1) {
      const hora = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return `Ontem às ${hora}`;
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + 
           ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'desconhecido';
  }
}

// ============================================
// COMPONENTE: Device Card
// ============================================

function DeviceCard({ 
  label, 
  deviceType, 
  osName, 
  browserName, 
  lastSeen,
  isCurrent = false,
  isExisting = false,
}: { 
  label: string; 
  deviceType: string;
  osName?: string;
  browserName?: string;
  lastSeen?: string;
  isCurrent?: boolean;
  isExisting?: boolean;
}) {
  const DeviceIcon = getDeviceIcon(deviceType);
  const typeInfo = DEVICE_TYPE_LABELS[deviceType] || DEVICE_TYPE_LABELS.desktop;
  
  return (
    <div className={`bg-card border rounded-2xl p-5 ${isCurrent ? 'border-primary/50' : 'border-border'}`}>
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
          isCurrent ? 'bg-primary/10' : 'bg-muted'
        }`}>
          <DeviceIcon className={`w-7 h-7 ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">
            {label}
          </h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Globe className="w-4 h-4" />
            {isCurrent ? 'Dispositivo detectado automaticamente' : `Último acesso: ${formatLastSeen(lastSeen || '')}`}
          </p>
        </div>
        <Badge className={`shrink-0 border-0 ${
          isCurrent 
            ? 'bg-primary/20 text-primary' 
            : 'bg-muted text-muted-foreground'
        }`}>
          {isCurrent ? 'Atual' : typeInfo.label}
        </Badge>
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE: Device Types Grid (Visual)
// ============================================

function DeviceTypesGrid({ highlightType }: { highlightType: string }) {
  const types = [
    { type: 'desktop', icon: Monitor, label: 'Desktop', description: 'Computador' },
    { type: 'tablet', icon: Tablet, label: 'Tablet', description: 'iPad/Android' },
    { type: 'mobile', icon: Smartphone, label: 'Celular', description: 'iPhone/Android' },
  ];
  
  return (
    <div className="grid grid-cols-3 gap-3">
      {types.map((item) => {
        const Icon = item.icon;
        const isHighlighted = item.type === highlightType;
        
        return (
          <div 
            key={item.type}
            className={`text-center p-3 rounded-xl border-2 transition-all ${
              isHighlighted 
                ? 'border-primary bg-primary/5' 
                : 'border-border bg-card'
            }`}
          >
            <Icon className={`w-7 h-7 mx-auto mb-1.5 ${
              isHighlighted ? 'text-primary' : 'text-muted-foreground'
            }`} />
            <p className={`text-sm font-medium ${
              isHighlighted ? 'text-primary' : 'text-foreground'
            }`}>
              {item.label}
            </p>
            <p className="text-xs text-muted-foreground">{item.description}</p>
            {isHighlighted && (
              <span className="inline-block mt-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                Mesmo Tipo
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function SameTypeReplacementGate() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const {
    payload,
    step,
    isProcessing,
    is2FAVerified,
    error,
    setStep,
    setProcessing,
    set2FAVerified,
    setError,
    reset,
  } = useSameTypeReplacementStore();

  const [is2FALoading, setIs2FALoading] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);

  // Se não há payload, redirecionar para login
  useEffect(() => {
    if (!payload) {
      console.log('[SameTypeReplacementGate] Sem payload, redirecionando para /auth');
      navigate('/auth', { replace: true });
    }
  }, [payload, navigate]);

  // Handler: Usuário clicou SIM - iniciar 2FA
  const handleYes = useCallback(async () => {
    setStep('2fa_verification');
    setIs2FALoading(true);
    setOtpError(null);
    
    try {
      // 🔐 P0 FIX: Enviar código 2FA com email E userId (ambos obrigatórios)
      if (!user?.id || !user?.email) {
        throw new Error('Usuário não autenticado');
      }
      
      const { data, error: sendError } = await supabase.functions.invoke('send-2fa-code', {
        body: {
          userId: user.id,
          email: user.email,
          userName: user.user_metadata?.name || user.email.split('@')[0],
          channel: 'email',
        },
      });

      if (sendError || !data?.success) {
        throw new Error(data?.error || sendError?.message || 'Falha ao enviar código');
      }

      setCodeSent(true);
      toast.success('Código enviado!', {
        description: 'Verifique seu e-mail para o código de verificação.',
      });
    } catch (err) {
      console.error('[SameTypeReplacementGate] Erro ao enviar 2FA:', err);
      setOtpError('Erro ao enviar código. Tente novamente.');
    } finally {
      setIs2FALoading(false);
    }
  }, [user, setStep]);

  // Handler: Usuário clicou NÃO - cancelar e sair
  const handleNo = useCallback(async () => {
    setStep('cancelled');
    toast.info('Registro não permitido.', {
      description: 'Você será redirecionado para a tela de login.',
    });
    
    setTimeout(async () => {
      reset();
      await signOut();
      navigate('/auth', { replace: true });
    }, 2000);
  }, [reset, signOut, navigate, setStep]);

  // Handler: Verificar código 2FA
  const handleVerify2FA = useCallback(async () => {
    if (!otpCode || otpCode.length !== 6) {
      setOtpError('Digite o código de 6 dígitos');
      return;
    }

    // 🔐 P0 FIX: Validar user ANTES de enviar
    if (!user?.id) {
      setOtpError('Sessão expirada. Faça login novamente.');
      return;
    }

    setIs2FALoading(true);
    setOtpError(null);

    try {
      // Verificar código via edge function existente
      const { data, error: verifyError } = await supabase.functions.invoke('verify-2fa-code', {
        body: {
          userId: user.id,
          code: otpCode,
        },
      });

      if (verifyError || !data?.valid) {
        throw new Error(data?.error || 'Código inválido');
      }

      // 2FA verificado - agora fazer a substituição
      set2FAVerified(true);
      await executeReplacement();
    } catch (err: any) {
      console.error('[SameTypeReplacementGate] Erro na verificação:', err);
      setOtpError(err.message || 'Código inválido. Tente novamente.');
    } finally {
      setIs2FALoading(false);
    }
  }, [otpCode, user, set2FAVerified]);

  // Handler: Executar a substituição do dispositivo
  const executeReplacement = useCallback(async () => {
    if (!payload) return;

    setProcessing(true);
    setError(null);

    try {
      console.log('[SameTypeReplacementGate] 🔐 Executando substituição do mesmo tipo...');

      // 1. Revogar dispositivo existente do mesmo tipo
      const { error: revokeError } = await supabase
        .from('user_devices')
        .update({ 
          is_active: false,
          revoked_at: new Date().toISOString(),
          revoked_reason: 'same_type_replacement',
        })
        .eq('id', payload.existing_same_type_device.device_id);

      if (revokeError) {
        throw new Error('Falha ao desconectar dispositivo anterior');
      }

      // 2. Revogar sessões do dispositivo antigo
      await supabase
        .from('active_sessions')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString(),
          revoked_reason: 'device_replaced_same_type',
        })
        .eq('device_hash', payload.existing_same_type_device.device_id);

      // 3. Registrar novo dispositivo
      const { data: newDevice, error: insertError } = await supabase
        .from('user_devices')
        .insert({
          user_id: user?.id,
          device_fingerprint: payload.new_device_hash,
          device_name: payload.current_device.label,
          device_type: payload.current_device_type,
          browser: payload.current_device.browser_name,
          os: payload.current_device.os_name,
          is_active: true,
          is_trusted: true, // Já passou pelo 2FA
          first_seen_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (insertError) {
        throw new Error('Falha ao registrar novo dispositivo');
      }

      // 4. Criar sessão
      const ua = navigator.userAgent;
      let browser = 'unknown';
      if (ua.includes('Firefox')) browser = 'Firefox';
      else if (ua.includes('Edg')) browser = 'Edge';
      else if (ua.includes('Chrome')) browser = 'Chrome';
      else if (ua.includes('Safari')) browser = 'Safari';
      
      let os = 'unknown';
      if (ua.includes('Windows')) os = 'Windows';
      else if (ua.includes('Mac')) os = 'macOS';
      else if (ua.includes('Linux')) os = 'Linux';
      else if (ua.includes('Android')) os = 'Android';
      else if (ua.includes('iPhone')) os = 'iOS';

      const { data: sessionData } = await supabase.rpc('create_single_session', {
        _ip_address: null,
        _user_agent: navigator.userAgent.slice(0, 255),
        _device_type: payload.current_device_type,
        _browser: browser,
        _os: os,
        _device_hash_from_server: payload.new_device_hash,
      });

      if (sessionData?.[0]?.session_token) {
        localStorage.setItem('matriz_session_token', sessionData[0].session_token);
      }

      // 5. Log de segurança
      await supabase.from('security_events').insert({
        user_id: user?.id,
        event_type: 'SAME_TYPE_DEVICE_REPLACED',
        severity: 'info',
        description: `Dispositivo ${payload.current_device_type} substituído com sucesso após 2FA`,
        metadata: {
          old_device_id: payload.existing_same_type_device.device_id,
          new_device_id: newDevice.id,
          device_type: payload.current_device_type,
        },
      });

      setStep('success');

      toast.success('Dispositivo substituído com sucesso!', {
        description: 'Seu novo dispositivo está registrado.',
        duration: 4000,
      });

      setTimeout(() => {
        reset();
        navigate('/alunos/dashboard', { replace: true });
      }, 2000);

    } catch (err: any) {
      console.error('[SameTypeReplacementGate] Erro na substituição:', err);
      setError(err.message || 'Erro ao substituir dispositivo');
    } finally {
      setProcessing(false);
    }
  }, [payload, user?.id, setProcessing, setError, setStep, reset, navigate]);

  // Loading
  if (!payload) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Tela de sucesso
  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Dispositivo Substituído!
          </h2>
          <p className="text-muted-foreground">
            Redirecionando para o portal...
          </p>
        </motion.div>
      </div>
    );
  }

  // Tela de cancelamento
  if (step === 'cancelled') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <XCircle className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Registro não permitido
          </h2>
          <p className="text-muted-foreground">
            Redirecionando para login...
          </p>
        </motion.div>
      </div>
    );
  }

  const deviceTypeLabel = DEVICE_TYPE_LABELS[payload.current_device_type]?.label || 'dispositivo';
  const DeviceIcon = getDeviceIcon(payload.current_device_type);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-primary/5 border-b border-border px-4 py-6 sm:py-8">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Novo Dispositivo Detectado
          </h1>
          <p className="text-muted-foreground">
            Detectamos um novo {deviceTypeLabel} do mesmo tipo que você já possui registrado.
          </p>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 px-4 py-6 overflow-auto">
        <div className="max-w-lg mx-auto space-y-6">
          
          <AnimatePresence mode="wait">
            {/* Step: Decision */}
            {step === 'decision' && (
              <motion.div
                key="decision"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Aviso */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <p className="text-sm text-amber-200 text-center">
                    <strong>Por segurança</strong>, você só pode ter <strong>um dispositivo de cada tipo</strong> registrado por vez.
                  </p>
                </div>

                {/* Grid de tipos */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    Tipo de dispositivo detectado:
                  </p>
                  <DeviceTypesGrid highlightType={payload.current_device_type} />
                </div>

                {/* Dispositivo tentando entrar */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    Novo aparelho tentando acessar:
                  </p>
                  <DeviceCard
                    label={payload.current_device.label}
                    deviceType={payload.current_device_type}
                    osName={payload.current_device.os_name}
                    browserName={payload.current_device.browser_name}
                    isCurrent
                  />
                </div>

                {/* Dispositivo existente do mesmo tipo */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    {deviceTypeLabel} atualmente registrado:
                  </p>
                  <DeviceCard
                    label={payload.existing_same_type_device.label}
                    deviceType={payload.existing_same_type_device.device_type}
                    osName={payload.existing_same_type_device.os_name}
                    browserName={payload.existing_same_type_device.browser_name}
                    lastSeen={payload.existing_same_type_device.last_seen_at}
                    isExisting
                  />
                </div>

                {/* Pergunta */}
                <div className="bg-card border border-border rounded-xl p-5 text-center">
                  <p className="text-foreground font-medium mb-4">
                    Deseja registrar este novo dispositivo e desconectar o anterior?
                  </p>
                  
                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={handleYes}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      SIM, substituir dispositivo
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={handleNo}
                      className="w-full h-12"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      NÃO, cancelar e voltar
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step: 2FA Verification */}
            {step === '2fa_verification' && (
              <motion.div
                key="2fa"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">
                      Verificação de Segurança
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {codeSent 
                        ? 'Digite o código de 6 dígitos enviado para seu e-mail'
                        : 'Enviando código de verificação...'
                      }
                    </p>
                  </div>

                  {codeSent && (
                    <>
                      <div className="mb-6">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setOtpCode(value);
                            setOtpError(null);
                          }}
                          placeholder="000000"
                          className="w-full text-center text-3xl tracking-[0.5em] font-mono bg-muted border border-border rounded-xl py-4 focus:outline-none focus:ring-2 focus:ring-primary"
                          disabled={is2FALoading}
                        />
                        {otpError && (
                          <p className="text-sm text-destructive mt-2 text-center">{otpError}</p>
                        )}
                      </div>

                      <Button
                        onClick={handleVerify2FA}
                        disabled={is2FALoading || otpCode.length !== 6}
                        className="w-full h-12"
                      >
                        {is2FALoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Verificando...
                          </>
                        ) : (
                          'Verificar e Substituir'
                        )}
                      </Button>
                    </>
                  )}

                  {is2FALoading && !codeSent && (
                    <div className="flex justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  onClick={() => {
                    setStep('decision');
                    setOtpCode('');
                    setOtpError(null);
                    setCodeSent(false);
                  }}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
              <p className="text-sm text-destructive text-center">{formatError(error)}</p>
            </div>
          )}

          {/* Processing overlay */}
          {isProcessing && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-foreground font-medium">Substituindo dispositivo...</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
