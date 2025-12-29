// ============================================
// ETAPA 4: CONFIANÇA NO DISPOSITIVO
// Modelo Facebook: confiar ou sempre confirmar
// Limite: Máximo 3 dispositivos confiáveis
// ============================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Smartphone, 
  ShieldCheck, 
  ShieldQuestion,
  Monitor,
  Tablet,
  Globe,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { collectEnhancedFingerprint } from "@/lib/enhancedFingerprint";
import { toast } from "sonner";

interface TrustDeviceStageProps {
  userId: string;
  onComplete: () => void;
}

interface DeviceInfo {
  browser: string;
  os: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  fingerprint: string;
}

interface TrustedDevice {
  id: string;
  device_name: string | null;
  device_type: string | null;
  last_seen_at: string | null;
}

const MAX_TRUSTED_DEVICES = 3;

// Exemplos visuais de dispositivos
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

export function TrustDeviceStage({ userId, onComplete }: TrustDeviceStageProps) {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'trust' | 'always_confirm' | null>(null);

  // Coletar informações do dispositivo e dispositivos já confiáveis
  useEffect(() => {
    const initialize = async () => {
      try {
        // 1. Coletar fingerprint do dispositivo atual
        const fp = await collectEnhancedFingerprint();
        
        // Detectar browser
        const ua = navigator.userAgent;
        let browser = 'Navegador Desconhecido';
        if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Edg')) browser = 'Microsoft Edge';
        else if (ua.includes('Chrome')) browser = 'Google Chrome';
        else if (ua.includes('Safari')) browser = 'Safari';
        else if (ua.includes('Opera')) browser = 'Opera';

        // Detectar OS
        let os = 'Sistema Desconhecido';
        if (ua.includes('Windows')) os = 'Windows';
        else if (ua.includes('Mac')) os = 'macOS';
        else if (ua.includes('Linux')) os = 'Linux';
        else if (ua.includes('Android')) os = 'Android';
        else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

        // Detectar tipo
        let deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop';
        if (/iPad|Tablet/i.test(ua)) {
          deviceType = 'tablet';
        } else if (/Mobi|Android/i.test(ua) && !/iPad|Tablet/i.test(ua)) {
          deviceType = 'mobile';
        }

        setDeviceInfo({
          browser,
          os,
          deviceType,
          fingerprint: fp.hash,
        });

        // 2. Buscar dispositivos já confiáveis
        const { data: devices, error } = await supabase
          .from('user_devices')
          .select('id, device_name, device_type, last_seen_at')
          .eq('user_id', userId)
          .eq('is_trusted', true)
          .order('last_seen_at', { ascending: false });

        if (!error && devices) {
          setTrustedDevices(devices);
        }

      } catch (err) {
        console.error('[TrustDevice] Erro ao coletar:', err);
        setDeviceInfo({
          browser: 'Navegador',
          os: 'Sistema',
          deviceType: 'desktop',
          fingerprint: 'unknown',
        });
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [userId]);

  const handleConfirm = async () => {
    if (!selectedOption || !deviceInfo) return;

    setIsSubmitting(true);

    try {
      if (selectedOption === 'trust') {
        // Verificar limite de dispositivos
        if (trustedDevices.length >= MAX_TRUSTED_DEVICES) {
          toast.error(`Limite de ${MAX_TRUSTED_DEVICES} dispositivos atingido`, {
            description: "Remova um dispositivo antigo nas configurações para adicionar este.",
          });
          setIsSubmitting(false);
          return;
        }

        // Registrar dispositivo como confiável
        const { error } = await supabase
          .from('user_devices')
          .upsert({
            user_id: userId,
            device_fingerprint: deviceInfo.fingerprint,
            device_name: `${deviceInfo.browser} no ${deviceInfo.os}`,
            device_type: deviceInfo.deviceType,
            is_trusted: true,
            last_seen_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,device_fingerprint',
          });

        if (error) {
          console.error('[TrustDevice] Erro ao salvar dispositivo:', error);
        }

        // Salvar cache local de confiança
        localStorage.setItem('mfa_trust_cache', JSON.stringify({
          deviceHash: deviceInfo.fingerprint,
          trustedAt: new Date().toISOString(),
          everVerified: true,
        }));

        toast.success("Dispositivo marcado como confiável!", {
          description: "Você não precisará confirmar seu login neste dispositivo.",
        });
      } else {
        // Não confiar - limpar qualquer cache existente
        localStorage.removeItem('mfa_trust_cache');

        toast.success("Preferência salva!", {
          description: "Sempre pediremos confirmação ao fazer login.",
        });
      }

      // Log de auditoria
      await supabase.from("audit_logs").insert({
        action: selectedOption === 'trust' ? 'device_trusted_onboarding' : 'device_untrusted_onboarding',
        user_id: userId,
        metadata: {
          device_type: deviceInfo.deviceType,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          decision: selectedOption,
          decided_at: new Date().toISOString(),
        },
      });

      onComplete();

    } catch (err) {
      console.error('[TrustDevice] Erro inesperado:', err);
      toast.error('Erro ao salvar preferência');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDeviceIcon = deviceInfo?.deviceType === 'mobile' 
    ? Smartphone 
    : deviceInfo?.deviceType === 'tablet' 
    ? Tablet 
    : Monitor;

  const CurrentDeviceIcon = currentDeviceIcon;
  const devicesRemaining = MAX_TRUSTED_DEVICES - trustedDevices.length;
  const canTrustMore = devicesRemaining > 0;

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-muted-foreground">Identificando seu dispositivo...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Você fez login. Confiar neste dispositivo?
        </h2>
        <p className="text-muted-foreground">
          Para agilizar o login, escolha a opção de confiar neste dispositivo para pular a etapa de confirmação.
        </p>
      </div>

      {/* Warning */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
        <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-start gap-2">
          <ShieldQuestion className="w-5 h-5 shrink-0 mt-0.5" />
          Se outras pessoas tiverem acesso a este dispositivo, é melhor sempre confirmar que é você.
        </p>
      </div>

      {/* Exemplos de tipos de dispositivos */}
      <div className="mb-6">
        <p className="text-sm font-medium text-muted-foreground mb-3">Tipos de dispositivos suportados:</p>
        <div className="grid grid-cols-3 gap-3">
          {DEVICE_EXAMPLES.map((example) => {
            const ExampleIcon = example.icon;
            const isCurrentType = deviceInfo?.deviceType === example.type;
            
            return (
              <div 
                key={example.type}
                className={`text-center p-3 rounded-xl border-2 transition-all ${
                  isCurrentType 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-card'
                }`}
              >
                <ExampleIcon className={`w-8 h-8 mx-auto mb-2 ${
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
      </div>

      {/* Device info atual */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <CurrentDeviceIcon className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {deviceInfo?.browser} no {deviceInfo?.os}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Globe className="w-4 h-4" />
              Dispositivo detectado automaticamente
            </p>
          </div>
        </div>
      </div>

      {/* Limite de dispositivos */}
      <div className={`rounded-xl p-4 mb-6 ${
        canTrustMore 
          ? 'bg-muted/50 border border-border' 
          : 'bg-destructive/10 border border-destructive/30'
      }`}>
        <div className="flex items-center gap-3">
          {!canTrustMore && <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />}
          <div>
            <p className={`text-sm font-medium ${!canTrustMore ? 'text-destructive' : 'text-foreground'}`}>
              {trustedDevices.length} de {MAX_TRUSTED_DEVICES} dispositivos confiáveis
            </p>
            <p className="text-xs text-muted-foreground">
              {canTrustMore 
                ? `Você pode adicionar mais ${devicesRemaining} dispositivo${devicesRemaining > 1 ? 's' : ''}`
                : 'Limite atingido. Remova um dispositivo nas configurações.'
              }
            </p>
          </div>
        </div>
        
        {/* Lista de dispositivos existentes */}
        {trustedDevices.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Dispositivos já confiáveis:</p>
            <div className="space-y-1">
              {trustedDevices.map((device) => (
                <div key={device.id} className="text-xs text-muted-foreground flex items-center gap-2">
                  {device.device_type === 'mobile' ? (
                    <Smartphone className="w-3 h-3" />
                  ) : device.device_type === 'tablet' ? (
                    <Tablet className="w-3 h-3" />
                  ) : (
                    <Monitor className="w-3 h-3" />
                  )}
                  {device.device_name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="space-y-4 mb-8">
        <motion.button
          onClick={() => setSelectedOption('trust')}
          disabled={!canTrustMore}
          whileHover={canTrustMore ? { scale: 1.01 } : {}}
          whileTap={canTrustMore ? { scale: 0.99 } : {}}
          className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
            !canTrustMore
              ? 'border-border bg-muted/50 opacity-50 cursor-not-allowed'
              : selectedOption === 'trust'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card hover:border-primary/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className={`w-6 h-6 ${
              selectedOption === 'trust' ? '' : canTrustMore ? 'text-primary' : 'text-muted-foreground'
            }`} />
            <span className="font-medium">Confiar neste dispositivo</span>
          </div>
        </motion.button>

        <motion.button
          onClick={() => setSelectedOption('always_confirm')}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
            selectedOption === 'always_confirm'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card hover:border-primary/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <ShieldQuestion className={`w-6 h-6 ${selectedOption === 'always_confirm' ? '' : 'text-muted-foreground'}`} />
            <span className="font-medium">Sempre confirmar que sou eu</span>
          </div>
        </motion.button>
      </div>

      {/* Confirm */}
      <Button
        onClick={handleConfirm}
        disabled={!selectedOption || isSubmitting}
        className="w-full h-12 text-base"
      >
        {isSubmitting ? (
          <>
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            Salvando...
          </>
        ) : (
          'Continuar'
        )}
      </Button>

      {/* Note */}
      <p className="text-xs text-muted-foreground text-center mt-4">
        Você pode gerenciar dispositivos confiáveis nas configurações de segurança
      </p>
    </div>
  );
}
