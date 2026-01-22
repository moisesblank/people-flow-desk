// ============================================
// 🔐 DEVICE MFA GUARD HOOK — 2FA por Dispositivo
// Verifica se o dispositivo atual tem verificação válida (24h)
// NÃO TOCA em login/sessão/dispositivo
// 🛡️ P0 FIX: error é SEMPRE string (evita React Error #61)
// ============================================

import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { generateDeviceFingerprint } from "@/lib/deviceFingerprint";
import { registerDeviceBeforeSession } from "@/lib/deviceRegistration";
import { formatError } from "@/lib/utils/formatError";

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

// P1-2 FIX: OWNER_EMAIL removido - usar role='owner' via useAuth()
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
  const { user, role } = useAuth();
  const hasChecked = useRef(false);

  // 🛡️ P0: utilitário local para impedir travamentos (loading infinito)
  const withTimeout = useCallback(<T,>(label: string, promiseLike: PromiseLike<T>, timeoutMs: number): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const promise = Promise.resolve(promiseLike);

    return (async () => {
      const timeoutPromise = new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`Timeout ${timeoutMs}ms em: ${label}`)), timeoutMs);
      });
      try {
        return await Promise.race([promise, timeoutPromise]);
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    })();
  }, []);

  const [state, setState] = useState<DeviceMFAGuardState>({
    isChecking: true, // Começa verificando
    needsMFA: false,
    isVerified: false,
    error: null,
    deviceHash: null,
    expiresAt: null,
  });

  // P1-2 FIX: Owner bypass via role (não email)
  const isOwner = role === 'owner';

  // 🧪 Beta test bypass
  const isBetaTest = user?.email?.toLowerCase() === BETA_TEST_EMAIL.toLowerCase();

  /**
   * Verifica se o dispositivo atual tem verificação MFA válida
   * 🔐 P0 FIX v6: TAMBÉM verifica mfa_verified na sessão ativa
   */
  const checkDeviceMFA = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      setState((prev) => ({ ...prev, isChecking: false, error: formatError("Usuário não autenticado") }));
      return false;
    }

    // P0 FIX: Owner bypass - verifica role ATUAL (não stale)
    // Também verifica email como fallback caso role ainda não carregou
    const currentIsOwner = role === 'owner' || user?.email?.toLowerCase() === 'moisesblank@gmail.com';
    
    if (currentIsOwner) {
      console.log("[DeviceMFAGuard] 👑 Owner bypass ativado (role ou email)");
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
      // 🔐 P0 FIX v11.4: PRIMEIRO tentar usar o hash do SERVIDOR (fonte da verdade)
      // O hash do servidor inclui pepper e é o que foi registrado no 2FA
      let serverHash = localStorage.getItem('matriz_device_server_hash');
      
      // Se temos hash do servidor, usar. Senão, gerar local (fallback para dispositivo novo)
      let deviceHash: string;
      if (serverHash) {
        deviceHash = serverHash;
        console.log(`[DeviceMFAGuard] 🔐 Usando hash do SERVIDOR: ${deviceHash.slice(0, 8)}...`);
      } else {
        deviceHash = await generateDeviceFingerprint();
        console.log(`[DeviceMFAGuard] 🆕 Hash do servidor não encontrado, usando local: ${deviceHash.slice(0, 8)}...`);
      }

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

      // 🔐 P0 FIX v6: PRIMEIRO verificar se a sessão ativa tem mfa_verified = true
      const sessionToken = localStorage.getItem("matriz_session_token");
      if (sessionToken) {
        const { data: sessionData } = await supabase
          .from("active_sessions")
          .select("mfa_verified, device_hash")
          .eq("session_token", sessionToken)
          .eq("status", "active")
          .single();

        // 🔐 P0 FIX v11.4.1: Se o hash do servidor não estiver no localStorage,
        // mas a sessão ativa já tem device_hash, persistir para evitar loop eterno.
        // (Isso acontece em alguns fluxos onde o registro do dispositivo foi feito,
        // mas o client não persistiu o valor.)
        if (!serverHash && sessionData?.device_hash) {
          serverHash = sessionData.device_hash;
          try {
            localStorage.setItem('matriz_device_server_hash', serverHash);
            console.log(`[DeviceMFAGuard] 🔧 Reparando localStorage: salvando serverHash da sessão (${serverHash.slice(0, 8)}...)`);
          } catch {
            // noop
          }
        }

        if (sessionData?.mfa_verified === true) {
          console.log(`[DeviceMFAGuard] ✅ Sessão já tem mfa_verified=true`);
          // Atualizar cache
          globalMFACache.set(cacheKey, {
            verified: true,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
          });
          setState((prev) => ({
            ...prev,
            isChecking: false,
            isVerified: true,
            needsMFA: false,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          }));
          return true;
        }
        
        // 🔐 P0 FIX v11.4: SESSÃO COM mfa_verified=false MAS HASH VERIFICADO
        // Auto-reparar se o hash do servidor já foi verificado na tabela user_mfa_verifications
        if (sessionData?.mfa_verified === false && serverHash) {
          console.log(`[DeviceMFAGuard] 🔧 Sessão com mfa_verified=false, verificando se hash do servidor já foi validado...`);
          
          const { data: mfaCheck } = await supabase.rpc("check_device_mfa_valid", {
            _user_id: user.id,
            _device_hash: serverHash,
          });
          
          if (mfaCheck === true) {
            console.log(`[DeviceMFAGuard] 🔧 Hash do servidor já verificado! Auto-reparando sessão...`);
            
            // Auto-reparar: Marcar sessão como verificada e atualizar hash
            const { error: updateError } = await supabase
              .from("active_sessions")
              .update({ mfa_verified: true, device_hash: serverHash })
              .eq("session_token", sessionToken)
              .eq("status", "active");
            
            if (updateError) {
              // ⚠️ Não bloquear o usuário em loop se a atualização falhar por RLS/latência.
              // A fonte de verdade aqui é: mfaCheck === true (user_mfa_verifications).
              console.error(`[DeviceMFAGuard] ⚠️ Falha ao auto-reparar sessão (seguindo mesmo assim):`, updateError);
            } else {
              console.log(`[DeviceMFAGuard] ✅ Sessão auto-reparada com sucesso!`);
            }

            globalMFACache.set(cacheKey, {
              verified: true,
              expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
            });
            setState((prev) => ({
              ...prev,
              isChecking: false,
              isVerified: true,
              needsMFA: false,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            }));
            return true;
          }
        }
        
        console.log(`[DeviceMFAGuard] ⚠️ Sessão com mfa_verified=false - requer 2FA`);
      }

      // Verificar no banco se este dispositivo tem MFA válido via user_mfa_verifications
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
          error: formatError(error),
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
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 dias (v11.1)
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
        error: formatError(err, "Erro ao verificar dispositivo"),
      }));
      return false;
    }
  }, [user?.id, isOwner, isBetaTest]);

  /**
   * Callback chamado após verificação do código 2FA
   * 🔐 P0 FIX v2: Usa o deviceHash JÁ GERADO (state.deviceHash) em vez de gerar novo
   * O dispositivo é registrado ANTES de salvar MFA usando o MESMO hash
   */
  const onVerificationComplete = useCallback(
    async (success: boolean) => {
      if (!success) {
        setState((prev) => ({
          ...prev,
          needsMFA: true,
          isVerified: false,
          error: formatError("Código inválido ou expirado"),
        }));
        return;
      }

      console.log("[DeviceMFAGuard] ✅ 2FA verificado! Hash atual:", state.deviceHash?.slice(0, 8) + "...");

      // 🔐 CRÍTICO: Usar o hash que JÁ FOI GERADO no checkDeviceMFA
      // NÃO chamar registerDeviceBeforeSession() novamente pois gera hash diferente!
      const currentDeviceHash = state.deviceHash;

      if (!currentDeviceHash) {
        console.error("[DeviceMFAGuard] ❌ deviceHash não disponível no state!");
        setState((prev) => ({
          ...prev,
          needsMFA: true,
          isVerified: false,
          error: formatError("Erro interno: hash do dispositivo não encontrado."),
        }));
        return;
      }

      // 1) PRIMEIRO: Registrar o DISPOSITIVO em user_devices via Edge Function
      // Passamos o hash local para o servidor manter consistência
      console.log("[DeviceMFAGuard] 📱 Registrando dispositivo...");
      
      let deviceReg: { success: boolean; deviceHash?: string; error?: string };
      
      try {
        // v11.5 Resilience: impedir hang de rede
        deviceReg = await withTimeout('registerDeviceBeforeSession', registerDeviceBeforeSession(), 12_000);
        console.log("[DeviceMFAGuard] 📱 Resultado do registro:", deviceReg);
      } catch (err) {
        console.error("[DeviceMFAGuard] ❌ Exceção ao registrar dispositivo:", err);
        deviceReg = { success: false, error: "EXCEPTION" };
      }

      // 🔐 Hash final: preferir o do servidor, fallback para o local
      const finalHash = deviceReg.deviceHash || currentDeviceHash;
      console.log("[DeviceMFAGuard] 🔐 Hash final para MFA:", finalHash.slice(0, 8) + "...");

      // 🔐 P0 FIX v11.4.1: Persistir o hash final no localStorage para que o próximo
      // checkDeviceMFA use o hash correto e não gere um novo (causando loop eterno).
      try {
        localStorage.setItem('matriz_device_server_hash', finalHash);
      } catch {
        // noop
      }

      if (!deviceReg.success) {
        console.warn("[DeviceMFAGuard] ⚠️ Registro retornou erro:", deviceReg.error);
        
        // Se limite excedido ou substituição necessária, continuar (será tratado por outros gates)
        if (deviceReg.error === "DEVICE_LIMIT_EXCEEDED" || deviceReg.error === "SAME_TYPE_REPLACEMENT_REQUIRED") {
          console.log("[DeviceMFAGuard] ⚠️ Limite/substituição - fluxo continua com hash local");
        } else if (deviceReg.error !== "EXISTING_DEVICE" && !deviceReg.deviceHash) {
          // Erro real - mas tentar continuar com hash local se possível
          console.error("[DeviceMFAGuard] ⚠️ Continuando com hash local...");
        }
      }

      // 2) REGISTRAR verificação MFA com o hash FINAL
      if (user?.id && finalHash) {
        try {
          const mfaRes = await withTimeout(
            'register_device_mfa_verification',
            supabase.rpc("register_device_mfa_verification", {
              _user_id: user.id,
              _device_hash: finalHash,
              _ip_address: null,
            }),
            8_000,
          );

          const error = (mfaRes as any)?.error;

          if (error) {
            console.error("[DeviceMFAGuard] ⚠️ Erro ao registrar verificação MFA:", error);
          } else {
            console.log("[DeviceMFAGuard] ✅ MFA registrado por 7 dias:", finalHash.slice(0, 8) + "...");
          }
        } catch (err) {
          console.error("[DeviceMFAGuard] ⚠️ Exceção ao salvar verificação MFA:", err);
        }
      }

      // 🔐 P0 FIX v6: MARCAR SESSÃO ATIVA COM mfa_verified = true
      const sessionToken = localStorage.getItem("matriz_session_token");
      if (sessionToken) {
        try {
          const sessionRes = await withTimeout(
            'active_sessions.update(mfa_verified)',
            supabase
              .from("active_sessions")
              .update({ mfa_verified: true })
              .eq("session_token", sessionToken)
              .eq("status", "active"),
            8_000,
          );

          const sessionError = (sessionRes as any)?.error;

          if (sessionError) {
            console.error("[DeviceMFAGuard] ⚠️ Erro ao marcar sessão como mfa_verified:", sessionError);
          } else {
            console.log("[DeviceMFAGuard] ✅ Sessão marcada com mfa_verified=true");
          }
        } catch (err) {
          console.error("[DeviceMFAGuard] ⚠️ Exceção ao atualizar sessão:", err);
        }
      }

      // 3) Cache global (por user_id + device_hash)
      if (user?.id && finalHash) {
        const cacheKey = getCacheKey(user.id, finalHash);
        globalMFACache.set(cacheKey, {
          verified: true,
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 dias
        });
        console.log(`[DeviceMFAGuard] ✅ Cache atualizado: ${cacheKey.slice(0, 20)}...`);
      }

      setState((prev) => ({
        ...prev,
        needsMFA: false,
        isVerified: true,
        error: null,
        deviceHash: finalHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }));

      console.log("[DeviceMFAGuard] 🎉 Dispositivo cadastrado e verificado com sucesso!");
    },
    [user?.id, state.deviceHash, withTimeout],
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
    // 🔐 P0 FIX v6: NÃO fazer bypass imediato se !user
    // Isso evita que sessões sem MFA passem durante o carregamento inicial
    // O hook deve aguardar user carregar ANTES de decidir
    if (user === undefined) {
      // Ainda carregando auth - manter isChecking: true
      return;
    }
    
    // Se não há usuário (logout ou público), permitir acesso às rotas públicas
    if (user === null) {
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
  }, [user, isOwner, checkDeviceMFA]);

  return {
    ...state,
    checkDeviceMFA,
    onVerificationComplete,
    resetState,
  };
}
