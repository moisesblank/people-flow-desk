// ============================================
// 🌌 SANCTUM PROTECTED CONTENT — WRAPPER UNIVERSAL
// Protege qualquer conteúdo premium
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================

import React, { useEffect, memo } from "react";
import { useSanctumCore } from "@/hooks/useSanctumCore";
import { SanctumWatermark } from "./SanctumWatermark";
import { cn } from "@/lib/utils";

interface SanctumProtectedContentProps {
  resourceId: string;
  resourceType: "pdf" | "web_text" | "image" | "video";
  children: React.ReactNode;
  watermark?: boolean;
  className?: string;
}

export const SanctumProtectedContent = memo(({
  resourceId,
  resourceType,
  children,
  watermark = true,
  className
}: SanctumProtectedContentProps) => {
  const { registerProtectedSurface, isOwner } = useSanctumCore({ resourceId, resourceType });

  // Registrar acesso ao montar
  useEffect(() => {
    registerProtectedSurface();
  }, [registerProtectedSurface]);

  return (
    <div 
      className={cn("sanctum-protected-surface relative", className)}
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      }}
    >
      {/* Watermark dinâmica (não aparece para owner) */}
      {watermark && !isOwner && <SanctumWatermark />}
      
      {/* Conteúdo protegido */}
      {children}
    </div>
  );
});

SanctumProtectedContent.displayName = "SanctumProtectedContent";

export default SanctumProtectedContent;
