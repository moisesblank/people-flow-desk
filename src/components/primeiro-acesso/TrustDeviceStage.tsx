// ============================================
// ETAPA 4: CONFIANÇA NO DISPOSITIVO
// Modelo Facebook: confiar ou sempre confirmar
// ============================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Smartphone, 
  ShieldCheck, 
  ShieldQuestion,
  Monitor,
  Tablet,
  Chrome,
  Globe
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
  deviceType: string;
  fingerprint: string;
}

export function TrustDeviceStage({ userId, onComplete }: TrustDeviceStageProps) {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'trust' | 'always_confirm' | null>(null);

  // Coletar informações do dispositivo
  useEffect(() => {
    const collectDevice = async () => {
      try {
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
        let deviceType = 'desktop';
        if (/Mobi|Android/i.test(ua)) {
          deviceType = /iPad|Tablet/i.test(ua) ? 'tablet' : 'mobile';
        }

        setDeviceInfo({
          browser,
          os,
          deviceType,
          fingerprint: fp.hash,
        });
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

    collectDevice();
  }, []);

  const handleConfirm = async () => {
    if (!selectedOption || !deviceInfo) return;

    setIsSubmitting(true);

    try {
      if (selectedOption === 'trust') {
        // Registrar dispositivo como confiável
        const { error } = await supabase
          .from('user_devices')
          .upsert({
            user_id: userId,
            device_fingerprint: deviceInfo.fingerprint,
            device_name: `${deviceInfo.browser} no ${deviceInfo.os}`,
            device_type: deviceInfo.deviceType,
            is_trusted: true,
            last_active: new Date().toISOString(),
          }, {
            onConflict: 'user_id,device_fingerprint',
          });

        if (error) {
          console.error('[TrustDevice] Erro ao salvar dispositivo:', error);
          // Não falha, apenas loga
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

  const DeviceIcon = deviceInfo?.deviceType === 'mobile' 
    ? Smartphone 
    : deviceInfo?.deviceType === 'tablet' 
    ? Tablet 
    : Monitor;

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

      {/* Device info */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <DeviceIcon className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {deviceInfo?.browser} no {deviceInfo?.os}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Globe className="w-4 h-4" />
              Você também pode gerenciar dispositivos confiáveis nas configurações de segurança.
            </p>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-4 mb-8">
        <motion.button
          onClick={() => setSelectedOption('trust')}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
            selectedOption === 'trust'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card hover:border-primary/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className={`w-6 h-6 ${selectedOption === 'trust' ? '' : 'text-primary'}`} />
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
    </div>
  );
}
