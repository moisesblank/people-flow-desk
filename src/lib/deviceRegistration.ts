// ============================================
// 🔐 deviceRegistration — REATIVADO v2.0
// Registro de dispositivos via Edge Function
// Limite de 3 dispositivos por usuário
// ============================================

import { supabase } from "@/integrations/supabase/client";
import { collectFingerprintRawData } from "@/lib/deviceFingerprintRaw";
import type { DeviceGatePayload } from "@/state/deviceGateStore";
import type { SameTypeReplacementPayload } from "@/state/sameTypeReplacementStore";

export interface DeviceNotice {
  level: "INFO" | "WARNING" | "HARD_WARNING" | null;
  message: string | null;
}

export interface DeviceRegistrationResult {
  success: boolean;
  error?: string;
  deviceId?: string;
  deviceHash?: string;
  isNewDevice?: boolean;
  deviceCount?: number;
  maxDevices?: number;
  notice?: DeviceNotice;
  devices?: Array<{
    id?: string;
    device_id?: string;
    device_name?: string;
    label?: string;
    device_type: string;
    browser?: string;
    os?: string;
    last_seen_at: string;
    first_seen_at?: string;
    is_recommended_to_disconnect?: boolean;
  }>;
  currentDevice?: {
    device_type: string;
    os_name?: string;
    browser_name?: string;
    label?: string;
  };
  gatePayload?: DeviceGatePayload;
  sameTypePayload?: SameTypeReplacementPayload;
}

/**
 * REATIVADO: Registra dispositivo via Edge Function
 * - Coleta fingerprint real
 * - Envia para servidor gerar hash com pepper
 * - Verifica limite de 3 dispositivos
 * - Retorna gatePayload se limite excedido
 */
export async function registerDeviceBeforeSession(): Promise<DeviceRegistrationResult> {
  console.log("[deviceRegistration] 🔐 ATIVADO - registrando dispositivo...");

  try {
    // 1. Verificar sessão atual
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      console.warn("[deviceRegistration] ⚠️ Sem sessão ativa");
      return {
        success: false,
        error: "NO_SESSION",
      };
    }

    // 2. Coletar dados de fingerprint REAIS
    const fingerprintData = await collectFingerprintRawData();
    console.log(
      "[deviceRegistration] 📱 Fingerprint coletado:",
      fingerprintData.deviceType,
      fingerprintData.browser,
      fingerprintData.os
    );

    // 3. Chamar Edge Function para registro server-side
    const { data, error } = await supabase.functions.invoke("register-device-server", {
      body: {
        fingerprintData,
        deviceName: `${fingerprintData.browser} on ${fingerprintData.os}`,
        deviceType: fingerprintData.deviceType,
        browser: fingerprintData.browser,
        os: fingerprintData.os,
      },
    });

    if (error) {
      console.error("[deviceRegistration] ❌ Erro na Edge Function:", error);
      return {
        success: false,
        error: error.message || "EDGE_FUNCTION_ERROR",
      };
    }

    // 4. Processar resposta
    if (!data.success) {
      console.warn("[deviceRegistration] ⚠️ Registro negado:", data.error);

      // Limite de dispositivos excedido
      if (data.error === "DEVICE_LIMIT_EXCEEDED") {
        return {
          success: false,
          error: "DEVICE_LIMIT_EXCEEDED",
          deviceCount: data.current_devices,
          maxDevices: data.max_devices || 3,
          devices: data.devices,
          currentDevice: data.current_device,
          gatePayload: {
            code: "DEVICE_LIMIT_EXCEEDED",
            message: data.message || "Limite de dispositivos atingido",
            max_devices: data.max_devices || 3,
            current_devices: data.current_devices,
            action_required: data.action_required || "REVOKE_ONE_DEVICE_TO_CONTINUE",
            current_device: data.current_device,
            devices: data.devices,
          },
        };
      }

      // Substituição de mesmo tipo
      if (data.error === "SAME_TYPE_REPLACEMENT_REQUIRED") {
        return {
          success: false,
          error: "SAME_TYPE_REPLACEMENT_REQUIRED",
          sameTypePayload: {
            code: "SAME_TYPE_REPLACEMENT_REQUIRED",
            message: data.message,
            current_device_type: data.current_device_type,
            current_device: data.current_device,
            existing_same_type_device: data.existing_same_type_device,
            new_device_hash: data.new_device_hash,
          },
        };
      }

      return {
        success: false,
        error: data.error,
      };
    }

    // 5. Sucesso!
    console.log(
      "[deviceRegistration] ✅ Dispositivo registrado:",
      data.status,
      data.deviceHash?.slice(0, 8) + "..."
    );

    return {
      success: true,
      deviceId: data.deviceId,
      deviceHash: data.deviceHash,
      isNewDevice: data.status === "NEW_DEVICE_REGISTERED",
      deviceCount: data.deviceCount,
      maxDevices: 3,
      notice: data.notice,
    };
  } catch (err) {
    console.error("[deviceRegistration] ❌ Erro inesperado:", err);
    return {
      success: false,
      error: "UNEXPECTED_ERROR",
    };
  }
}

/**
 * Retorna mensagem de erro formatada para o usuário
 */
export function getDeviceErrorMessage(error: string): { title: string; description: string } {
  switch (error) {
    case "DEVICE_LIMIT_EXCEEDED":
      return {
        title: "Limite de dispositivos atingido",
        description:
          "Você atingiu o limite máximo de 3 dispositivos. Desconecte um dispositivo antigo para continuar.",
      };
    case "SAME_TYPE_REPLACEMENT_REQUIRED":
      return {
        title: "Substituição de dispositivo",
        description:
          "Você já possui um dispositivo do mesmo tipo. Deseja substituí-lo?",
      };
    case "DEVICE_SPOOF_DETECTED":
      return {
        title: "Dispositivo suspeito detectado",
        description:
          "Este dispositivo foi identificado como potencialmente fraudulento. Entre em contato com o suporte.",
      };
    case "FINGERPRINT_REQUIRED":
      return {
        title: "Dados do dispositivo necessários",
        description:
          "Não foi possível coletar as informações do dispositivo. Tente novamente ou use outro navegador.",
      };
    case "NO_SESSION":
      return {
        title: "Sessão expirada",
        description: "Por favor, faça login novamente.",
      };
    default:
      return {
        title: "Erro ao verificar dispositivo",
        description:
          "Ocorreu um erro ao verificar seu dispositivo. Tente novamente.",
      };
  }
}
