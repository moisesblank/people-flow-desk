// ============================================
// 🔐 DEVICE MFA GUARD HOOK — 2FA por Dispositivo
// Verifica se o dispositivo atual tem verificação válida (24h)
// NÃO TOCA em login/sessão/dispositivo
// ============================================

import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { generateDeviceFingerprint } from "@/lib/deviceFingerprint";
import { registerDeviceBeforeSession } from "@/lib/deviceRegistration";

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
// 🧪 BYPASS BETA TEST - usuário de teste não precisa verificar MFA repetidamente
const BETA_TEST_EMAIL = "moisescursoquimica@gmail.com";

// 🔐 Cache global para evitar re-verificação na mesma sessão
// 🎯 P0 FIX: Cache agora é por user_id + device_hash (não só user_id!)
const globalMFACache = new Map<string, { verified: boolean; expiresAt: number }>();

// Gerar chave de cache única por usuário+dispositivo
const getCacheKey = (userId: string, deviceHash: string) => `${userId}:${deviceHash}`;

/**
 * Hook para gerenciar 2FA por DISPOSITIVO
 * Cada dispositivo diferente precisa verificar 2FA separadamente
 * Cache de 24 horas por dispositivo
 */
export function useDeviceMFAGuard(): DeviceMFAGuardResult {
  const { user } = useAuth();
  const hasChecked = useRef(false);

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

  // 🧪 Beta test bypass
  const isBetaTest = user?.email?.toLowerCase() === BETA_TEST_EMAIL.toLowerCase();

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

    // 🧪 Beta test bypass - após primeira verificação, não pede mais
    // Nota: Para beta test, usamos cache por user_id (comportamento original mantido)
    if (isBetaTest) {
      const cached = globalMFACache.get(user.id);
      if (cached && cached.verified && cached.expiresAt > Date.now()) {
        console.log("[DeviceMFAGuard] 🧪 Beta test bypass - usando cache");
        setState((prev) => ({
          ...prev,
          isChecking: false,
          isVerified: true,
          needsMFA: false,
          expiresAt: new Date(cached.expiresAt),
        }));
        return true;
      }
    }

    setState((prev) => ({ ...prev, isChecking: true, error: null }));

    try {
      // Gerar fingerprint do dispositivo atual
      const deviceHash = await generateDeviceFingerprint();

      setState((prev) => ({ ...prev, deviceHash }));

      // 🔐 P0 FIX: Verificar cache local PRIMEIRO (evita chamada RPC desnecessária)
      const cacheKey = getCacheKey(user.id, deviceHash);
      const cached = globalMFACache.get(cacheKey);
      if (cached && cached.verified && cached.expiresAt > Date.now()) {
        console.log(`[DeviceMFAGuard] ✅ Usando cache local para ${deviceHash.slice(0, 8)}...`);
        setState((prev) => ({
          ...prev,
          isChecking: false,
          isVerified: true,
          needsMFA: false,
          expiresAt: new Date(cached.expiresAt),
        }));
        return true;
      }

      // Verificar no banco se este dispositivo tem MFA válido
      console.log(`[DeviceMFAGuard] 🔍 Consultando banco para ${deviceHash.slice(0, 8)}...`);
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

      // 🔐 Salvar no cache global se válido (por user_id + device_hash)
      if (isValid) {
        const cacheKey = getCacheKey(user.id, deviceHash);
        globalMFACache.set(cacheKey, {
          verified: true,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        });
        console.log(`[DeviceMFAGuard] ✅ Cache atualizado para ${cacheKey.slice(0, 20)}...`);
      }

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
  }, [user?.id, isOwner, isBetaTest]);

  /**
   * Callback chamado após verificação do código 2FA
   * 🔐 P0 FIX: Registro robusto de dispositivo pós-2FA
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

      console.log("[DeviceMFAGuard] ✅ 2FA verificado com sucesso! Iniciando registro de dispositivo...");

      // 1) PRIMEIRO: Registrar o DISPOSITIVO (user_devices) para obter hash do servidor
      let deviceReg: { success: boolean; deviceHash?: string; error?: string };
      
      try {
        deviceReg = await registerDeviceBeforeSession();
        console.log("[DeviceMFAGuard] 📱 Resultado do registro:", deviceReg);
      } catch (err) {
        console.error("[DeviceMFAGuard] ❌ Exceção ao registrar dispositivo:", err);
        deviceReg = { success: false, error: "EXCEPTION" };
      }

      if (!deviceReg.success) {
        console.error("[DeviceMFAGuard] ❌ Falha ao registrar dispositivo pós-2FA:", deviceReg.error);
        
        // 🔐 Se o erro for limite de dispositivos, não falhar - deixar o fluxo continuar
        // O usuário será redirecionado para a tela de gerenciamento de dispositivos
        if (deviceReg.error === "DEVICE_LIMIT_EXCEEDED" || deviceReg.error === "SAME_TYPE_REPLACEMENT_REQUIRED") {
          console.log("[DeviceMFAGuard] ⚠️ Limite atingido ou substituição necessária - redirecionando...");
          // Continuar com o hash local como fallback
        } else {
          setState((prev) => ({
            ...prev,
            needsMFA: true,
            isVerified: false,
            error: "Falha ao cadastrar este dispositivo. Tente novamente.",
          }));
          return;
        }
      }

      // 🔐 CRÍTICO: Usar o hash do servidor (que acabou de ser salvo no localStorage)
      const serverHash = deviceReg.deviceHash;
      const hashParaMFA = serverHash || state.deviceHash;

      console.log("[DeviceMFAGuard] 🔐 Hash para MFA:", hashParaMFA?.slice(0, 8) + "...");

      // 2) DEPOIS: Registrar verificação MFA com o hash do SERVIDOR
      if (user?.id && hashParaMFA) {
        try {
          const { data, error } = await supabase.rpc("register_device_mfa_verification", {
            _user_id: user.id,
            _device_hash: hashParaMFA,
            _ip_address: null,
          });

          if (error) {
            console.error("[DeviceMFAGuard] ⚠️ Erro ao registrar verificação MFA:", error);
            // Não falhar aqui - o dispositivo já foi registrado
          } else {
            console.log("[DeviceMFAGuard] ✅ Dispositivo verificado por 7 dias com hash:", hashParaMFA.slice(0, 8) + "...");
          }
        } catch (err) {
          console.error("[DeviceMFAGuard] ⚠️ Exceção ao salvar verificação MFA:", err);
        }
      }

      // 3) Cache global (por user_id + device_hash)
      if (user?.id && hashParaMFA) {
        const cacheKey = getCacheKey(user.id, hashParaMFA);
        globalMFACache.set(cacheKey, {
          verified: true,
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 dias
        });
        console.log(`[DeviceMFAGuard] ✅ Cache pós-2FA atualizado para ${cacheKey.slice(0, 20)}...`);
      }

      setState((prev) => ({
        ...prev,
        needsMFA: false,
        isVerified: true,
        error: null,
        deviceHash: hashParaMFA, // Atualizar com hash do servidor
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      }));

      console.log("[DeviceMFAGuard] 🎉 Fluxo completo! Dispositivo cadastrado e verificado.");
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

    // 🔐 P0 FIX: Cache por dispositivo - precisa gerar hash ANTES de verificar cache
    // Não usamos cache aqui pois precisamos do deviceHash, que é async
    // O checkDeviceMFA já faz a verificação de cache no banco via RPC

    // Verificar apenas uma vez
    if (!hasChecked.current) {
      hasChecked.current = true;
      checkDeviceMFA();
    }
  }, [user?.id, isOwner, checkDeviceMFA]);

  return {
    ...state,
    checkDeviceMFA,
    onVerificationComplete,
    resetState,
  };
}
