// ============================================
// 🔐 DEVICE MFA GUARD — Gate de Entrada por Dispositivo
// Exige 2FA uma vez por dispositivo novo
// Validade: 7 dias por device_hash
// MOSTRA CONTADOR DE DISPOSITIVOS (1/3, 2/3, 3/3)
// ============================================

import { ReactNode, useState, useEffect } from "react";
import { useDeviceMFAGuard } from "@/hooks/useDeviceMFAGuard";
import { MFAActionModal } from "./MFAActionModal";
import { Shield, Smartphone, Loader2, Lock, Fingerprint, Monitor, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { generateDeviceName, detectDeviceType } from "@/lib/deviceFingerprint";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DeviceMFAGuardProps {
  children: ReactNode;
}

const MAX_DEVICES = 3;

export function DeviceMFAGuard({ children }: DeviceMFAGuardProps) {
  const { isChecking, isVerified, needsMFA, error, deviceHash, onVerificationComplete } = useDeviceMFAGuard();
  const { user } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({ name: "", type: "desktop" as "desktop" | "mobile" | "tablet" });
  const [deviceCount, setDeviceCount] = useState<number>(0);
  const [isLoadingCount, setIsLoadingCount] = useState(true);

  // Detectar informações do dispositivo
  useEffect(() => {
    setDeviceInfo({
      name: generateDeviceName(),
      type: detectDeviceType(),
    });
  }, []);

  // 🔐 Buscar contagem de dispositivos ativos do usuário
  useEffect(() => {
    const fetchDeviceCount = async () => {
      if (!user?.id) {
        setIsLoadingCount(false);
        return;
      }

      try {
        const { count, error } = await supabase
          .from("user_devices")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_active", true);

        if (!error && count !== null) {
          setDeviceCount(count);
          console.log(`[DeviceMFAGuard] 📱 Dispositivos ativos: ${count}/${MAX_DEVICES}`);
        }
      } catch (err) {
        console.error("[DeviceMFAGuard] Erro ao buscar contagem:", err);
      } finally {
        setIsLoadingCount(false);
      }
    };

    fetchDeviceCount();
  }, [user?.id]);

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
        return <Tablet className="w-10 h-10 text-primary-foreground" />;
      default:
        return <Monitor className="w-10 h-10 text-primary-foreground" />;
    }
  };

  const getDeviceTypeLabel = () => {
    switch (deviceInfo.type) {
      case "mobile":
        return "Celular";
      case "tablet":
        return "Tablet";
      default:
        return "Computador";
    }
  };

  // O número do dispositivo que será cadastrado
  const nextDeviceNumber = deviceCount + 1;

  // Loading state
  if (isChecking || isLoadingCount) {
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

  // Needs MFA - show device verification gate with counter
  return (
    <>
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-card to-card/80">
            <CardHeader className="text-center pb-4">
              {/* 🔐 CONTADOR DE DISPOSITIVOS */}
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">
                    Cadastrar Dispositivo {nextDeviceNumber}/{MAX_DEVICES}
                  </span>
                </div>
              </motion.div>

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
              <CardTitle className="text-xl">Novo {getDeviceTypeLabel()} Detectado</CardTitle>
              <CardDescription className="text-base">
                Verificação de segurança necessária para cadastrar este dispositivo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Device Info */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    {deviceInfo.type === "mobile" ? (
                      <Smartphone className="w-5 h-5 text-primary" />
                    ) : deviceInfo.type === "tablet" ? (
                      <Tablet className="w-5 h-5 text-primary" />
                    ) : (
                      <Monitor className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{deviceInfo.name}</p>
                    <p className="text-xs text-muted-foreground">{getDeviceTypeLabel()}</p>
                  </div>
                </div>
                {deviceHash && (
                  <p className="text-xs text-muted-foreground font-mono">ID: {deviceHash.slice(0, 16)}...</p>
                )}
              </div>

              {/* Indicador visual de slots */}
              <div className="flex justify-center gap-2">
                {[1, 2, 3].map((slot) => (
                  <div
                    key={slot}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      slot <= deviceCount
                        ? "bg-primary"
                        : slot === nextDeviceNumber
                          ? "bg-primary/50 animate-pulse"
                          : "bg-muted-foreground/20"
                    }`}
                    title={
                      slot <= deviceCount
                        ? `Dispositivo ${slot} (ativo)`
                        : slot === nextDeviceNumber
                          ? "Este dispositivo"
                          : "Slot disponível"
                    }
                  />
                ))}
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
                Verificar e Cadastrar Dispositivo
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Após verificação, este dispositivo terá acesso por 7 dias.
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
        title={`Cadastrar Dispositivo ${nextDeviceNumber}/${MAX_DEVICES}`}
        description="Confirme sua identidade para autorizar este dispositivo."
      />
    </>
  );
}
