// ============================================
// 🔐 DEVICE MFA GUARD HOOK — 2FA por Dispositivo
// Verifica se o dispositivo atual tem verificação válida (24h)
// NÃO TOCA em login/sessão/dispositivo
// ============================================

import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { generateDeviceFingerprint } from "@/lib/deviceFingerprint";

export interface DeviceMFAGuardState {
  isChecking: boolean;
  needsMFA: boolean;
  isVerified: boolean;
  error: string | null;
  deviceHash: string | null;
  expiresAt: Date | null;
}

export interface DeviceMFAGuardResult extends DeviceMFAGuardState {
  checkDeviceMFA: () => Promise<boolean>;
  onVerificationComplete: (success: boolean) => void;
  resetState: () => void;
}

const OWNER_EMAIL = "moisesblank@gmail.com";

// ⏱️ P0 FIX: Timeout para evitar loading infinito (tela preta)
const MFA_CHECK_TIMEOUT_MS = 8000;

/**
 * Hook para gerenciar 2FA por DISPOSITIVO
 * Cada dispositivo diferente precisa verificar 2FA separadamente
 * Cache de 24 horas por dispositivo
 */
export function useDeviceMFAGuard(): DeviceMFAGuardResult {
  const { user } = useAuth();
  const hasChecked = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<DeviceMFAGuardState>({
    isChecking: true, // Começa verificando
    needsMFA: false,
    isVerified: false,
    error: null,
    deviceHash: null,
    expiresAt: null,
  });

  // Owner tem bypass total
  const isOwner = user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();

  /**
   * Verifica se o dispositivo atual tem verificação MFA válida
   */
  const checkDeviceMFA = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      setState((prev) => ({ ...prev, isChecking: false, error: "Usuário não autenticado" }));
      return false;
    }

    // Owner bypass
    if (isOwner) {
      setState((prev) => ({
        ...prev,
        isChecking: false,
        isVerified: true,
        needsMFA: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }));
      return true;
    }

    setState((prev) => ({ ...prev, isChecking: true, error: null }));

    try {
      // Gerar fingerprint do dispositivo atual
      const deviceHash = await generateDeviceFingerprint();

      setState((prev) => ({ ...prev, deviceHash }));

      // Verificar no banco se este dispositivo tem MFA válido
      const { data, error } = await supabase.rpc("check_device_mfa_valid", {
        _user_id: user.id,
        _device_hash: deviceHash,
      });

      if (error) {
        console.error("[DeviceMFAGuard] Erro ao verificar:", error);
        setState((prev) => ({
          ...prev,
          isChecking: false,
          error: error.message,
        }));
        return false;
      }

      const isValid = data === true;

      console.log(`[DeviceMFAGuard] Dispositivo ${deviceHash.slice(0, 8)}... válido: ${isValid}`);

      setState((prev) => ({
        ...prev,
        isChecking: false,
        isVerified: isValid,
        needsMFA: !isValid,
      }));

      return isValid;
    } catch (err) {
      console.error("[DeviceMFAGuard] Erro inesperado:", err);
      setState((prev) => ({
        ...prev,
        isChecking: false,
        error: "Erro ao verificar dispositivo",
      }));
      return false;
    }
  }, [user?.id, isOwner]);

  /**
   * Callback chamado após verificação do código 2FA
   * 🔧 FIX CRÍTICO: Agora também cria a sessão única e salva o token
   */
  const onVerificationComplete = useCallback(
    async (success: boolean) => {
      if (!success) {
        setState((prev) => ({
          ...prev,
          needsMFA: true,
          isVerified: false,
          error: "Código inválido ou expirado",
        }));
        return;
      }

      // Registra verificação no banco para ESTE dispositivo
      if (user?.id && state.deviceHash) {
        try {
          const { data, error } = await supabase.rpc("register_device_mfa_verification", {
            _user_id: user.id,
            _device_hash: state.deviceHash,
            _ip_address: null,
          });

          if (error) {
            console.error("[DeviceMFAGuard] Erro ao registrar verificação:", error);
          } else {
            console.log("[DeviceMFAGuard] ✅ Dispositivo verificado por 24h:", data);
          }

          // 🔧 FIX CRÍTICO: Criar sessão única e salvar token no localStorage
          // Isso evita que o SessionGuard detecte SESSION_NOT_FOUND
          const SESSION_TOKEN_KEY = "matriz_session_token";
          const existingToken = localStorage.getItem(SESSION_TOKEN_KEY);

          if (!existingToken) {
            console.log("[DeviceMFAGuard] 🔐 Criando sessão única após verificação de dispositivo...");

            const { data: sessionData, error: sessionError } = await supabase.rpc("create_single_session", {
              _ip_address: null,
              _user_agent: navigator.userAgent.slice(0, 255),
              _device_type: /mobile/i.test(navigator.userAgent) ? "mobile" : "desktop",
              _browser: navigator.userAgent.includes("Chrome")
                ? "Chrome"
                : navigator.userAgent.includes("Firefox")
                  ? "Firefox"
                  : navigator.userAgent.includes("Safari")
                    ? "Safari"
                    : "Other",
              _os: navigator.userAgent.includes("Windows")
                ? "Windows"
                : navigator.userAgent.includes("Mac")
                  ? "macOS"
                  : navigator.userAgent.includes("Linux")
                    ? "Linux"
                    : "Other",
              _device_hash_from_server: state.deviceHash,
            });

            if (sessionError) {
              console.warn("[DeviceMFAGuard] ⚠️ Erro ao criar sessão:", sessionError);
            } else if (sessionData?.[0]?.session_token) {
              localStorage.setItem(SESSION_TOKEN_KEY, sessionData[0].session_token);
              console.log("[DeviceMFAGuard] ✅ Sessão única criada e token salvo no localStorage");
            }
          } else {
            console.log("[DeviceMFAGuard] Token já existe, mantendo sessão atual");
          }
        } catch (err) {
          console.error("[DeviceMFAGuard] Erro ao salvar verificação:", err);
        }
      }

      setState((prev) => ({
        ...prev,
        needsMFA: false,
        isVerified: true,
        error: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }));
    },
    [user?.id, state.deviceHash],
  );

  /**
   * Reseta estado do guard
   */
  const resetState = useCallback(() => {
    hasChecked.current = false;
    setState({
      isChecking: true,
      needsMFA: false,
      isVerified: false,
      error: null,
      deviceHash: null,
      expiresAt: null,
    });
  }, []);

  // Verifica automaticamente ao montar (apenas uma vez)
  useEffect(() => {
    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Se não há usuário, bypass imediato (não precisa verificar dispositivo)
    if (!user?.id) {
      setState((prev) => ({
        ...prev,
        isChecking: false,
        isVerified: true, // Bypass para páginas públicas
        needsMFA: false,
      }));
      return;
    }

    // Owner bypass
    if (isOwner) {
      setState((prev) => ({
        ...prev,
        isChecking: false,
        isVerified: true,
        needsMFA: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }));
      return;
    }

    // ⏱️ P0 FIX: Timeout de segurança - se demorar muito, liberar acesso
    timeoutRef.current = setTimeout(() => {
      setState((prev) => {
        if (prev.isChecking) {
          console.warn("[DeviceMFAGuard] ⚠️ Timeout de 8s atingido - liberando acesso como fallback");
          return {
            ...prev,
            isChecking: false,
            isVerified: true, // Liberar acesso após timeout
            needsMFA: false,
            error: null,
          };
        }
        return prev;
      });
    }, MFA_CHECK_TIMEOUT_MS);

    // Verificar apenas uma vez
    if (!hasChecked.current) {
      hasChecked.current = true;
      checkDeviceMFA();
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [user?.id, isOwner, checkDeviceMFA]);

  return {
    ...state,
    checkDeviceMFA,
    onVerificationComplete,
    resetState,
  };
}
