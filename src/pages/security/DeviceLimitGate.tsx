// ============================================
// 🛡️ DEVICE LIMIT GATE v2.0
// Tela de bloqueio quando limite de dispositivos é excedido
// Design: Linguagem simples + Mobile First + Alinhado com TrustDeviceStage
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
  Tablet,
  CheckCircle2,
  XCircle,
  LockKeyhole,
  ShieldCheck,
  Globe,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

import { useDeviceGateStore, CurrentDeviceInfo, DeviceInfo } from '@/state/deviceGateStore';
import { revokeAndRegister, triggerSecurityLockdown } from '@/lib/deviceLimitApi';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatError } from '@/lib/utils/formatError';

// ============================================
// CONSTANTES
// ============================================

const MAX_DEVICES = 3;

const DEVICE_EXAMPLES = [
  { 
    type: 'desktop', 
    icon: Monitor, 
    label: 'Computador',
    description: 'Desktop ou Notebook'
  },
  { 
    type: 'tablet', 
    icon: Tablet, 
    label: 'Tablet',
    description: 'iPad ou Android Tablet'
  },
  { 
    type: 'mobile', 
    icon: Smartphone, 
    label: 'Celular',
    description: 'iPhone ou Android'
  },
];

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
// COMPONENTE: Novo dispositivo detectado (card atual)
// ============================================

function CurrentDeviceCard({ device }: { device: CurrentDeviceInfo }) {
  const DeviceIcon = getDeviceIcon(device.device_type);
  const label = device.label || `${device.browser_name || 'Navegador'} no ${device.os_name || 'Sistema'}`;
  
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
          <DeviceIcon className="w-7 h-7 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">
            {label}
          </h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Globe className="w-4 h-4" />
            Dispositivo detectado automaticamente
          </p>
        </div>
        <Badge className="bg-primary/20 text-primary border-0 shrink-0">
          Novo
        </Badge>
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE: Item de dispositivo registrado
// ============================================

function RegisteredDeviceItem({ 
  device, 
  isSelected, 
  onSelect, 
  isDisabled 
}: { 
  device: DeviceInfo; 
  isSelected: boolean; 
  onSelect: () => void;
  isDisabled: boolean;
}) {
  const DeviceIcon = getDeviceIcon(device.device_type);
  const lastSeen = formatLastSeen(device.last_seen_at);
  
  return (
    <motion.button
      onClick={onSelect}
      disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.01 } : {}}
      whileTap={!isDisabled ? { scale: 0.99 } : {}}
      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
        isDisabled
          ? 'opacity-50 cursor-not-allowed border-border bg-muted/30'
          : isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:border-primary/50'
      }`}
      role="radio"
      aria-checked={isSelected}
    >
      <div className="flex items-center gap-3">
        {/* Radio visual */}
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          isSelected 
            ? 'border-primary bg-primary' 
            : 'border-muted-foreground/30'
        }`}>
          {isSelected && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-2 h-2 rounded-full bg-white"
            />
          )}
        </div>
        
        {/* Ícone do dispositivo */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
        }`}>
          <DeviceIcon className="w-5 h-5" />
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={`font-medium truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
            {device.label}
          </p>
          <p className="text-xs text-muted-foreground">
            Último acesso: {lastSeen}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

// ============================================
// COMPONENTE: Tipos de dispositivos (visual)
// ============================================

function DeviceTypesGrid({ currentType }: { currentType: string }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {DEVICE_EXAMPLES.map((example) => {
        const ExampleIcon = example.icon;
        const isCurrentType = currentType === example.type;
        
        return (
          <div 
            key={example.type}
            className={`text-center p-3 rounded-xl border-2 transition-all ${
              isCurrentType 
                ? 'border-primary bg-primary/5' 
                : 'border-border bg-card'
            }`}
          >
            <ExampleIcon className={`w-7 h-7 mx-auto mb-1.5 ${
              isCurrentType ? 'text-primary' : 'text-muted-foreground'
            }`} />
            <p className={`text-sm font-medium ${
              isCurrentType ? 'text-primary' : 'text-foreground'
            }`}>
              {example.label}
            </p>
            <p className="text-xs text-muted-foreground">{example.description}</p>
            {isCurrentType && (
              <span className="inline-block mt-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                Atual
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
      
      const result = await revokeAndRegister(selectedDeviceId);

      if (!result.success) {
        console.error('[DeviceLimitGate] ❌ Falha:', result.error);
        
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

        // 🔐 P0 FIX: Garantir hash do servidor mesmo se result.deviceHash vier vazio
        const serverDeviceHash = result.deviceHash || localStorage.getItem('matriz_device_server_hash');
        if (!serverDeviceHash) {
          console.error('[DeviceLimitGate] ❌ P0 VIOLATION: Sem hash do servidor!');
          toast.error('Erro de segurança', { description: 'Dispositivo não registrado corretamente.' });
          return;
        }
        
        const { data, error: sessError } = await supabase.rpc('create_single_session', {
          _ip_address: null,
          _user_agent: navigator.userAgent.slice(0, 255),
          _device_type: device_type,
          _browser: browser,
          _os: os,
          _device_hash_from_server: serverDeviceHash, // 🔐 P0 FIX: Hash do SERVIDOR
        });

        if (sessError) {
          console.warn('[DeviceLimitGate] Aviso: erro ao criar sessão:', sessError);
        }

        if (data?.[0]?.session_token) {
          localStorage.setItem(SESSION_TOKEN_KEY, data[0].session_token);
          console.log('[DeviceLimitGate] ✅ Nova sessão criada');
        }
      } catch (sessErr) {
        console.warn('[DeviceLimitGate] Aviso: erro ao criar sessão:', sessErr);
      }

      setIsSuccess(true);

      toast.success('Dispositivo trocado com sucesso!', {
        description: 'Sua conta está protegida.',
        duration: 4000,
      });

      setTimeout(() => {
        reset();
        navigate('/alunos/dashboard', { replace: true });
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

  // Loading
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
  const currentDeviceType = payload.current_device?.device_type || 'desktop';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-primary/5 border-b border-border px-4 py-6 sm:py-8">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Novo dispositivo detectado
          </h1>
          <p className="text-muted-foreground">
            Para proteger sua conta, controlamos o uso por aparelhos.
          </p>
        </div>
      </div>

      {/* Conteúdo scrollável */}
      <div className="flex-1 px-4 py-6 overflow-auto">
        <div className="max-w-lg mx-auto space-y-6">
          
          {/* Como funciona */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h2 className="flex items-center gap-2 font-semibold text-foreground mb-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Como funciona
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Você pode usar sua conta em até <strong className="text-foreground">{MAX_DEVICES} aparelhos diferentes</strong>{' '}
              (por exemplo: celular, notebook e tablet).
              <br />
              Mas <strong className="text-primary">apenas um aparelho</strong> pode estar conectado por vez.
            </p>
          </div>

          {/* Tipos de dispositivos */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">
              Tipos de dispositivos suportados:
            </p>
            <DeviceTypesGrid currentType={currentDeviceType} />
          </div>

          {/* Dispositivo atual detectado */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">
              Novo aparelho tentando acessar:
            </p>
            <CurrentDeviceCard device={payload.current_device} />
          </div>

          {/* Aviso de limite */}
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive mb-1">
                  Máximo atingido!
                </p>
                <p className="text-sm text-muted-foreground">
                  Você já tem <strong className="text-foreground">{payload.current_devices} aparelhos</strong> registrados.
                  <br />
                  Desconecte um aparelho para continuar neste novo.
                </p>
              </div>
            </div>
          </div>

          {/* Lista de dispositivos para desconectar */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">
              Aparelhos conectados à sua conta:
            </p>
            <div className="space-y-3" role="radiogroup" aria-label="Selecione um aparelho para desconectar">
              {payload.devices.map((device) => (
                <RegisteredDeviceItem
                  key={device.device_id}
                  device={device}
                  isSelected={selectedDeviceId === device.device_id}
                  onSelect={() => setSelectedDevice(device.device_id)}
                  isDisabled={isRevoking}
                />
              ))}
            </div>
          </div>

          {/* Erro */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive"
            >
              <XCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">{formatError(error)}</p>
            </motion.div>
          )}

          {/* O que acontece */}
          <div className="bg-muted/50 border border-border rounded-xl p-4">
            <p className="text-sm font-medium text-foreground mb-2">
              O que acontece agora:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• O aparelho escolhido será desconectado imediatamente</li>
              <li>• Este novo aparelho passará a ser o aparelho ativo</li>
              <li>• Sua conta continuará protegida</li>
            </ul>
          </div>

          {/* Segurança */}
          <div className="text-center text-xs text-muted-foreground space-y-1 pt-2">
            <p className="flex items-center justify-center gap-1">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Só um aparelho conectado por vez
            </p>
            <p>Sua conta segura</p>
          </div>

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

      {/* Footer fixo */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-4 sm:py-5">
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
            <XCircle className="w-4 h-4 mr-2" />
            Cancelar e sair
          </Button>
        </div>
      </div>

      {/* Dialog de confirmação */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent useOriginalSize>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar desconexão?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedDevice && (
                <>
                  O aparelho <strong>"{selectedDevice.label}"</strong> será desconectado 
                  e perderá acesso à sua conta.
                  <br /><br />
                  Este novo aparelho passará a ser o aparelho ativo.
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
        <AlertDialogContent useOriginalSize>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Lockdown de Segurança
            </AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá desconectar <strong>TODOS</strong> os aparelhos da sua conta.
              Você precisará fazer login novamente em todos os seus dispositivos.
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
