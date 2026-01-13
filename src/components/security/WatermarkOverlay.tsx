// ============================================
// 🌫️ WATERMARK OVERLAY — PHANTOM MODE v2.0
// Marca d'água ultra-discreta para proteção forense
// Quase invisível ao olho, rastreável em vazamentos
// ============================================

import React, { useEffect, useMemo, useState, memo } from "react";
import { useAuth } from "@/hooks/useAuth";

// 🕐 Bucket de 20 segundos para atualização
const bucket20s = () => Math.floor(Date.now() / 20000);

// 🎲 Tempo aleatório no range
const randomTime = (min: number, max: number) => 
  Math.floor(Math.random() * (max - min + 1)) + min;

interface WatermarkOverlayProps {
  className?: string;
  opacity?: number;
}

export const WatermarkOverlay = memo(function WatermarkOverlay({
  className = "",
  opacity = 0.001, // 🌫️ Opacidade fantasma
}: WatermarkOverlayProps) {
  const { user, role } = useAuth();
  const [tick, setTick] = useState(bucket20s());
  
  // 🔄 Estado de visibilidade intermitente
  const [isVisible, setIsVisible] = useState(true);

  // Update every 20 seconds for dynamic watermark position
  useEffect(() => {
    const id = setInterval(() => setTick(bucket20s()), 20000);
    return () => clearInterval(id);
  }, []);

  // 🎭 Ciclo de aparição/desaparição (40% visível / 60% invisível) — PROPORÇÃO INVERTIDA PERMANENTE
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const scheduleNext = () => {
      if (isVisible) {
        // ✅ Visível por 6-14 segundos (~40% do ciclo)
        const visibleTime = randomTime(6, 14) * 1000;
        timeoutId = setTimeout(() => {
          setIsVisible(false);
        }, visibleTime);
      } else {
        // ⬛ Invisível por 9-21 segundos (~60% do ciclo)
        const hiddenTime = randomTime(9, 21) * 1000;
        timeoutId = setTimeout(() => {
          setIsVisible(true);
        }, hiddenTime);
      }
    };
    
    scheduleNext();
    
    return () => clearTimeout(timeoutId);
  }, [isVisible]);

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

  // ⚠️ OWNER PARTICIPARÁ DE TODAS AS REGRAS - Sem bypass para watermark
  // Removido: if (role === "owner") return null;

  // 🎨 Grid reduzido (6x3 = 18 marcas) para menor poluição visual
  const watermarkGrid = useMemo(() => {
    const rows = 6;
    const cols = 3;
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
            top: `${(row / rows) * 100 + 8}%`,
            left: `${(col / cols) * 100 + 10}%`,
            transform: "rotate(-18deg)",
            whiteSpace: "nowrap",
          }}
        >
          {watermarkText}
        </div>
      );
    }
    
    return items;
  }, [watermarkText]);

  // 🚫 Se invisível, não renderiza
  if (!isVisible) {
    return null;
  }

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
        // 🎬 Transição suave ao aparecer
        transition: "opacity 0.5s ease-in-out",
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
