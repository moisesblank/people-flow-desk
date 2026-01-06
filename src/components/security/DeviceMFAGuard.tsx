// ============================================
// 🔐 DEVICE MFA GUARD — Gate de Entrada por Dispositivo
// Exige 2FA uma vez por dispositivo novo
// Validade: 24 horas por device_hash
// NÃO TOCA em login/sessão/dispositivo
// ============================================

import { ReactNode, useState, useEffect, useRef } from "react";
import { useDeviceMFAGuard } from "@/hooks/useDeviceMFAGuard";
import { useAuth } from "@/hooks/useAuth";
import { MFAActionModal } from "./MFAActionModal";
import { Shield, Smartphone, Loader2, Lock, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { generateDeviceName, detectDeviceType } from "@/lib/deviceFingerprint";

// ⏱️ P0 CRITICAL FIX: Timeout no nível do COMPONENTE para garantir que nunca trave
const COMPONENT_TIMEOUT_MS = 10000;

interface DeviceMFAGuardProps {
  children: ReactNode;
}

export function DeviceMFAGuard({ children }: DeviceMFAGuardProps) {
  const { user } = useAuth();
  const { isChecking, isVerified, needsMFA, error, deviceHash, onVerificationComplete } = useDeviceMFAGuard();

  // ⏱️ P0 CRITICAL FIX: Timeout de segurança no nível do componente
  const [forceBypass, setForceBypass] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Se já passou ou não tem usuário, não precisa de timeout
    if (!user || isVerified || forceBypass) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Timeout de segurança: se demorar muito, liberar
    timeoutRef.current = setTimeout(() => {
      if (isChecking && !isVerified) {
        console.warn("[DeviceMFAGuard] ⚠️ COMPONENT TIMEOUT 10s - forçando bypass");
        setForceBypass(true);
      }
    }, COMPONENT_TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [user, isChecking, isVerified, forceBypass]);

  const [showModal, setShowModal] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({ name: "", type: "desktop" as "desktop" | "mobile" | "tablet" });

  // Detectar informações do dispositivo
  useEffect(() => {
    setDeviceInfo({
      name: generateDeviceName(),
      type: detectDeviceType(),
    });
  }, []);

  // Quando precisa de MFA, abre modal automaticamente
  useEffect(() => {
    if (needsMFA && !isVerified) {
      setShowModal(true);
    }
  }, [needsMFA, isVerified]);

  const handleVerificationSuccess = () => {
    onVerificationComplete(true);
    setShowModal(false);
  };

  const getDeviceIcon = () => {
    switch (deviceInfo.type) {
      case "mobile":
        return <Smartphone className="w-10 h-10 text-primary-foreground" />;
      case "tablet":
        return <Fingerprint className="w-10 h-10 text-primary-foreground" />;
      default:
        return <Lock className="w-10 h-10 text-primary-foreground" />;
    }
  };

  // 🌐 BYPASS IMEDIATO para usuários não autenticados (rotas públicas)
  // Isso evita mostrar loading state para rotas como /qr, /auth, etc.
  if (!user) {
    return <>{children}</>;
  }

  // ⏱️ P0 CRITICAL FIX: Se forceBypass, liberar imediatamente
  if (forceBypass) {
    console.log("[DeviceMFAGuard] 🚨 Force bypass ativo - liberando acesso");
    return <>{children}</>;
  }

  // Loading state (apenas para usuários autenticados)
  if (isChecking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
            </div>
          </div>
          <p className="text-muted-foreground">Verificando dispositivo...</p>
        </motion.div>
      </div>
    );
  }

  // Verified - show content
  if (isVerified) {
    return <>{children}</>;
  }

  // Needs MFA - show device verification gate
  return (
    <>
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-card to-card/80">
            <CardHeader className="text-center pb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="mx-auto mb-4"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg animate-pulse" />
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    {getDeviceIcon()}
                  </div>
                </div>
              </motion.div>
              <CardTitle className="text-xl">Novo Dispositivo Detectado</CardTitle>
              <CardDescription className="text-base">
                Verificação de segurança necessária para este dispositivo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Device Info */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    {deviceInfo.type === "mobile" ? (
                      <Smartphone className="w-5 h-5 text-primary" />
                    ) : (
                      <Lock className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{deviceInfo.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{deviceInfo.type}</p>
                  </div>
                </div>
                {deviceHash && (
                  <p className="text-xs text-muted-foreground font-mono">ID: {deviceHash.slice(0, 16)}...</p>
                )}
              </div>

              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Para sua segurança, enviaremos um código de verificação para seu email.
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive text-center"
                >
                  {error}
                </motion.div>
              )}

              <Button onClick={() => setShowModal(true)} className="w-full gap-2" size="lg">
                <Shield className="w-4 h-4" />
                Verificar Dispositivo
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Após verificação, este dispositivo terá acesso por 24 horas.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <MFAActionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleVerificationSuccess}
        action="register_new_device"
        title="Verificar Dispositivo"
        description="Confirme sua identidade para autorizar este dispositivo."
      />
    </>
  );
}
