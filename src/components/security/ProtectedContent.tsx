// ============================================
// 🌌 PROTECTED CONTENT — WRAPPER UNIVERSAL
// ANO 2300 — Proteção de conteúdo premium
// ============================================

import React, { useEffect, memo, ReactNode } from "react";
import { useSanctumCore, SanctumContext } from "@/hooks/useSanctumCore";
import { WatermarkOverlay } from "@/components/security/WatermarkOverlay";

interface ProtectedContentProps {
  resourceType: SanctumContext["resourceType"];
  resourceId: string;
  children: ReactNode;
  watermark?: boolean;
  className?: string;
}

export const ProtectedContent = memo(function ProtectedContent({
  resourceType,
  resourceId,
  children,
  watermark = true,
  className = "",
}: ProtectedContentProps) {
  const { registerProtectedSurface } = useSanctumCore({ resourceId, resourceType });

  useEffect(() => {
    registerProtectedSurface();
  }, [registerProtectedSurface]);

  return (
    <div
      className={`ena-protected-surface sanctum-protected-surface relative ${className}`}
      data-sanctum-protected="true"
      data-resource-id={resourceId}
      data-resource-type={resourceType}
    >
      {watermark && <WatermarkOverlay />}
      {children}
    </div>
  );
});

ProtectedContent.displayName = "ProtectedContent";

export default ProtectedContent;
