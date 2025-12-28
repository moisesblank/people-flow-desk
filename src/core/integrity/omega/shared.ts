// Tipos e validação comuns para OmegaWrappers
import { useAuth } from "@/hooks/useAuth";
import { hasCapability, type Capability } from "../SecurityRegistry";
import { logAuditEvent } from "../TelemetryRegistry";
import type { FunctionId } from "../types";

// ============================================
// TIPOS COMUNS
// ============================================
export interface BaseFnProps {
  fn: FunctionId;
  "data-testid"?: string;
  disabled?: boolean;
  showLockIfNoAccess?: boolean;
}

// ============================================
// VALIDAÇÃO CENTRAL
// ============================================
export function useFnValidation(fn: FunctionId) {
  const { user, role } = useAuth();
  
  // Verificar se função existe (placeholder - expandir com registry real)
  const fnExists = fn && fn.startsWith("F.");
  
  // Verificar permissão básica
  const hasAccess = hasCapability(role || "viewer", "view_dashboard" as Capability);
  
  return {
    fnExists,
    hasAccess,
    userId: user?.id,
    userRole: role,
    isOwner: role === "owner",
  };
}

// ============================================
// TELEMETRIA WRAPPER
// ============================================
export async function trackFnEvent(
  fn: FunctionId,
  action: "click" | "submit" | "upload" | "download",
  success: boolean,
  metadata?: Record<string, unknown>
) {
  try {
    await logAuditEvent({
      functionId: fn,
      action,
      category: action === "upload" ? "upload" : action === "download" ? "download" : "crud",
      success,
      metadata,
      severity: success ? "info" : "error",
    });
  } catch (err) {
    console.warn("[OmegaWrappers] Telemetria falhou:", err);
  }
}
