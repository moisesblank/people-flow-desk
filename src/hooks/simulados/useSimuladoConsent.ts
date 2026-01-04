/**
 * 🎯 SIMULADOS — Hook de Consentimento Legal
 * Constituição SYNAPSE Ω v10.0
 * 
 * Registra aceite de termos do Modo Hard com:
 * - Timestamp
 * - Hash de IP/UserAgent
 * - Versão do termo
 */

import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConsentOptions {
  simuladoId: string;
  termVersion?: string;
  consentType?: "hard_mode" | "camera" | "terms";
}

interface UseSimuladoConsentReturn {
  registerConsent: (options: ConsentOptions) => Promise<string | null>;
  isRegistering: boolean;
  error: string | null;
}

/**
 * Gera hash simples para fingerprinting (não criptográfico, apenas identificação)
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function getDeviceFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    new Date().getTimezoneOffset().toString(),
    navigator.hardwareConcurrency?.toString() || "unknown",
  ];
  return hashString(components.join("|"));
}

function getUserAgentHash(): string {
  return hashString(navigator.userAgent);
}

export function useSimuladoConsent(): UseSimuladoConsentReturn {
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerConsent = useCallback(async (options: ConsentOptions): Promise<string | null> => {
    const { simuladoId, termVersion = "v1.0", consentType = "hard_mode" } = options;
    
    setIsRegistering(true);
    setError(null);

    try {
      // Gerar fingerprints
      const deviceFingerprint = getDeviceFingerprint();
      const userAgentHash = getUserAgentHash();

      const { data, error: rpcError } = await supabase.rpc("register_simulado_consent", {
        p_simulado_id: simuladoId,
        p_term_version: termVersion,
        p_consent_type: consentType,
        p_ip_hash: null, // IP é obtido server-side se necessário
        p_user_agent_hash: userAgentHash,
        p_device_fingerprint: deviceFingerprint,
      });

      if (rpcError) {
        throw rpcError;
      }

      console.log("[CONSENT] Consentimento registrado:", {
        consentId: data,
        simuladoId,
        termVersion,
        consentType,
      });

      return data as string;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao registrar consentimento";
      setError(message);
      toast.error("Erro ao registrar consentimento", { description: message });
      console.error("[CONSENT] Erro:", err);
      return null;
    } finally {
      setIsRegistering(false);
    }
  }, []);

  return {
    registerConsent,
    isRegistering,
    error,
  };
}
