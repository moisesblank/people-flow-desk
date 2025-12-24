// ============================================
// 🌌 WATERMARK OVERLAY — MARCA D'ÁGUA DINÂMICA
// ANO 2300 — Proteção visual de conteúdo
// ============================================

import React, { useEffect, useMemo, useState, memo } from "react";
import { useAuth } from "@/hooks/useAuth";

function bucket20s() {
  return Math.floor(Date.now() / 20000);
}

interface WatermarkOverlayProps {
  className?: string;
  opacity?: number;
}

export const WatermarkOverlay = memo(function WatermarkOverlay({
  className = "",
  opacity = 0.14,
}: WatermarkOverlayProps) {
  const { user, role } = useAuth();
  const [tick, setTick] = useState(bucket20s());

  // Update every 20 seconds for dynamic watermark
  useEffect(() => {
    const id = setInterval(() => setTick(bucket20s()), 20000);
    return () => clearInterval(id);
  }, []);

  const watermarkText = useMemo(() => {
    const name = user?.email?.split("@")[0] || "ALUNO";
    const id = user?.id?.slice(0, 8) || "UNKNOWN";
    
    // CPF mascarado do aluno (***.***.XXX-XX) - últimos 6 dígitos visíveis
    // Em produção virá do perfil do aluno, aqui exemplo para teste
    const cpfExample = "***.***.789-01";
    
    const timestamp = new Date().toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${name.toUpperCase()} • CPF: ${cpfExample} • ${id} • ${timestamp}`;
  }, [user, tick]);

  // Owner bypass - no watermark for owner
  if (role === "owner") {
    return null;
  }

  // Generate grid of watermarks
  const watermarkGrid = useMemo(() => {
    const rows = 8;
    const cols = 4;
    const items = [];
    
    for (let i = 0; i < rows * cols; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      items.push(
        <div
          key={i}
          className="sanctum-watermark-cell"
          style={{
            position: "absolute",
            top: `${(row / rows) * 100 + 5}%`,
            left: `${(col / cols) * 100 + 5}%`,
            transform: "rotate(-25deg)",
            whiteSpace: "nowrap",
          }}
        >
          {watermarkText}
        </div>
      );
    }
    
    return items;
  }, [watermarkText]);

  return (
    <div
      className={`sanctum-watermark-container ena-watermark ${className}`}
      style={{ 
        opacity,
        // Proteções para todos os dispositivos
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        WebkitTapHighlightColor: "transparent",
        touchAction: "none",
        pointerEvents: "none",
      } as React.CSSProperties}
      aria-hidden="true"
      data-sanctum-protected="true"
    >
      <div 
        className="ena-watermark-inner"
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
        }}
      >
        {watermarkGrid}
      </div>
      
      {/* Central diagonal watermark - responsivo */}
      <div 
        className="sanctum-watermark-overlay"
        style={{
          fontSize: "clamp(12px, 2.5vw, 24px)",
        }}
      >
        {watermarkText}
      </div>
      
      {/* Corner watermark - oculto em mobile pequeno */}
      <div 
        className="sanctum-watermark-corner hidden sm:block"
        style={{
          fontSize: "clamp(8px, 1vw, 12px)",
        }}
      >
        {user?.id?.slice(0, 8) || "---"}
      </div>
    </div>
  );
});

WatermarkOverlay.displayName = "WatermarkOverlay";

export default WatermarkOverlay;
