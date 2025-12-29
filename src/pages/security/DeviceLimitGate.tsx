// ============================================
// 🛡️ DEVICE LIMIT GATE
// Tela de bloqueio quando limite de dispositivos é excedido
// BLOCO 1: UX tipo JusBrasil + Mobile First
// ============================================

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Smartphone, 
  Loader2, 
  LogOut, 
  AlertTriangle,
  Monitor,
  CheckCircle2,
  XCircle,
  LockKeyhole
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

import { useDeviceGateStore, CurrentDeviceInfo } from '@/state/deviceGateStore';
import { DeviceLimitList } from '@/components/security/DeviceLimitList';
import { revokeAndRegister, triggerSecurityLockdown } from '@/lib/deviceLimitApi';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// COMPONENTE: Novo dispositivo detectado
// ============================================

function NewDeviceCard({ device }: { device: CurrentDeviceInfo }) {
  const getIcon = () => {
    switch (device.device_type) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />;
      case 'tablet':
        return <Monitor className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  const label = device.label || `${device.os_name || 'Sistema'} • ${device.browser_name || 'Navegador'}`;
  const osName = device.os_name || 'Sistema';
  const browserName = device.browser_name || 'Navegador';

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground truncate">
              {label}
            </span>
            <Badge className="bg-primary/20 text-primary border-0 text-xs">
              Novo
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {osName} • {browserName}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function DeviceLimitGate() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const {
    payload,
    selectedDeviceId,
    isRevoking,
    error,
    retryCount,
    setSelectedDevice,
    setRevoking,
    setError,
    incrementRetry,
    reset,
  } = useDeviceGateStore();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showLockdownDialog, setShowLockdownDialog] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Se não há payload, redirecionar para login
  useEffect(() => {
    if (!payload) {
      console.log('[DeviceLimitGate] Sem payload, redirecionando para /auth');
      navigate('/auth', { replace: true });
    }
  }, [payload, navigate]);

  // Handler: Confirmar desconexão
  const handleConfirmDisconnect = useCallback(async () => {
    if (!selectedDeviceId) return;

    setShowConfirmDialog(false);
    setRevoking(true);
    setError(null);

    try {
      console.log('[DeviceLimitGate] 🔐 Revogando DISPOSITIVO:', selectedDeviceId);
      
      // 🛡️ PIECE 3: Usar revokeAndRegister (revoga dispositivo + registra novo)
      const result = await revokeAndRegister(selectedDeviceId);

      if (!result.success) {
        console.error('[DeviceLimitGate] ❌ Falha:', result.error);
        
        // Se ainda deu limite excedido, mostrar erro
        if (result.error === 'DEVICE_LIMIT_EXCEEDED') {
          incrementRetry();
          setError('Limite ainda excedido. Tente desconectar outro dispositivo.');
          setRevoking(false);
          return;
        }
        
        incrementRetry();
        setError(result.error || 'Erro ao desconectar dispositivo. Tente novamente.');
        setRevoking(false);
        return;
      }

      console.log('[DeviceLimitGate] ✅ Dispositivo revogado e novo registrado!');

      // Criar sessão após registrar dispositivo
      try {
        const SESSION_TOKEN_KEY = 'matriz_session_token';
        const ua = navigator.userAgent;
        let device_type = 'desktop';
        if (/Mobi|Android|iPhone|iPad/i.test(ua)) {
          device_type = /iPad|Tablet/i.test(ua) ? 'tablet' : 'mobile';
        }
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

        const { data, error: sessError } = await supabase.rpc('create_single_session', {
          _ip_address: null,
          _user_agent: navigator.userAgent.slice(0, 255),
          _device_type: device_type,
          _browser: browser,
          _os: os,
          _device_hash_from_server: result.deviceHash || null,
        });

        if (sessError) {
          console.warn('[DeviceLimitGate] Aviso: erro ao criar sessão:', sessError);
          // Continuar mesmo assim - dispositivo foi registrado
        }

        if (data?.[0]?.session_token) {
          localStorage.setItem(SESSION_TOKEN_KEY, data[0].session_token);
          console.log('[DeviceLimitGate] ✅ Nova sessão criada');
        }
      } catch (sessErr) {
        console.warn('[DeviceLimitGate] Aviso: erro ao criar sessão:', sessErr);
        // Continuar mesmo assim
      }

      // Sucesso total!
      setIsSuccess(true);

      toast.success('Dispositivo trocado com sucesso!', {
        description: 'Sua conta está protegida.',
        duration: 4000,
      });

      // Limpar store e navegar
      setTimeout(() => {
        reset();
        navigate('/alunos', { replace: true });
      }, 1500);

    } catch (err) {
      console.error('[DeviceLimitGate] Erro:', err);
      incrementRetry();
      setError('Erro inesperado. Tente novamente.');
      setRevoking(false);
    }
  }, [selectedDeviceId, setRevoking, setError, incrementRetry, reset, navigate]);

  // Handler: Cancelar e sair
  const handleCancelAndExit = useCallback(async () => {
    console.log('[DeviceLimitGate] Cancelando e saindo...');
    reset();
    await signOut();
    navigate('/auth', { replace: true });
  }, [reset, signOut, navigate]);

  // Handler: Security Lockdown
  const handleSecurityLockdown = useCallback(async () => {
    setShowLockdownDialog(false);
    setRevoking(true);

    try {
      const result = await triggerSecurityLockdown();
      
      if (!result.success) {
        toast.error('Erro ao executar lockdown', {
          description: result.error,
        });
        setRevoking(false);
        return;
      }

      toast.success('Lockdown de segurança executado', {
        description: 'Todos os dispositivos foram desconectados. Faça login novamente.',
        duration: 6000,
      });

      reset();
      await signOut();
      navigate('/auth', { replace: true });
    } catch (err) {
      console.error('[DeviceLimitGate] Erro no lockdown:', err);
      toast.error('Erro ao executar lockdown');
      setRevoking(false);
    }
  }, [reset, signOut, navigate, setRevoking]);

  // Se ainda não tem payload, mostrar loading
  if (!payload) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Tela de sucesso
  if (isSuccess) {
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
            Dispositivo Trocado!
          </h2>
          <p className="text-muted-foreground">
            Sua conta está protegida. Redirecionando...
          </p>
        </motion.div>
      </div>
    );
  }

  const selectedDevice = payload.devices.find(d => d.device_id === selectedDeviceId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-destructive/5 border-b border-destructive/10 px-4 py-6 sm:py-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-destructive/20 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                {payload.message}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Desconecte um dispositivo para continuar neste novo aparelho
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 px-4 py-6 overflow-auto">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Aviso de segurança */}
          <div className="flex items-start gap-3 text-sm text-muted-foreground bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p>
              Isso protege sua conta contra compartilhamento. 
              Se você não reconhece algum dispositivo, desconecte-o agora.
            </p>
          </div>

          {/* Novo dispositivo detectado */}
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Novo dispositivo detectado
            </h2>
            <NewDeviceCard device={payload.current_device} />
          </div>

          <Separator />

          {/* Lista de dispositivos cadastrados */}
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Dispositivos cadastrados ({payload.devices.length}/{payload.max_devices})
            </h2>
            
            <DeviceLimitList
              devices={payload.devices}
              selectedDeviceId={selectedDeviceId}
              onSelectDevice={setSelectedDevice}
              isDisabled={isRevoking}
            />
          </div>

          {/* Erro */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive"
            >
              <XCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </motion.div>
          )}

          {/* Link de segurança */}
          <button
            type="button"
            onClick={() => setShowLockdownDialog(true)}
            disabled={isRevoking}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2 disabled:opacity-50"
          >
            <LockKeyhole className="w-4 h-4 inline mr-1" />
            Não reconheço esses acessos
          </button>
        </div>
      </div>

      {/* Footer fixo (mobile friendly) */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-4 sm:py-6">
        <div className="max-w-lg mx-auto space-y-3">
          <Button
            onClick={() => setShowConfirmDialog(true)}
            disabled={!selectedDeviceId || isRevoking || retryCount > 3}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            {isRevoking ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 mr-2" />
                Desconectar e continuar
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={handleCancelAndExit}
            disabled={isRevoking}
            className="w-full h-10 text-muted-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cancelar e sair
          </Button>
        </div>
      </div>

      {/* Dialog de confirmação */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar desconexão?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedDevice && (
                <>
                  O dispositivo <strong>"{selectedDevice.label}"</strong> será desconectado 
                  e perderá acesso à sua conta.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDisconnect}>
              Confirmar desconexão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de lockdown */}
      <AlertDialog open={showLockdownDialog} onOpenChange={setShowLockdownDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Lockdown de Segurança
            </AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá revogar <strong>TODOS</strong> os dispositivos e sessões da sua conta.
              Você precisará fazer login novamente em todos os aparelhos.
              <br /><br />
              <span className="text-foreground font-medium">
                Use esta opção se você suspeita que sua conta foi comprometida.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSecurityLockdown}
              className="bg-destructive hover:bg-destructive/90"
            >
              Executar Lockdown
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
