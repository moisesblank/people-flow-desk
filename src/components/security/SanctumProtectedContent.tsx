// ============================================
// SANCTUM PROTECTED CONTENT — Wrapper de Proteção
// ============================================

import React, { memo, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SanctumProtectedContentProps {
  children: ReactNode;
  className?: string;
  disableRightClick?: boolean;
  disableSelection?: boolean;
  disableCopy?: boolean;
}

export const SanctumProtectedContent = memo(({
  children,
  className,
  disableRightClick = true,
  disableSelection = true,
  disableCopy = true,
}: SanctumProtectedContentProps) => {
  const handleContextMenu = (e: React.MouseEvent) => {
    if (disableRightClick) {
      e.preventDefault();
    }
  };

  const handleCopy = (e: React.ClipboardEvent) => {
    if (disableCopy) {
      e.preventDefault();
    }
  };

  return (
    <div
      className={cn(
        disableSelection && "select-none",
        className
      )}
      onContextMenu={handleContextMenu}
      onCopy={handleCopy}
    >
      {children}
    </div>
  );
});

SanctumProtectedContent.displayName = "SanctumProtectedContent";
