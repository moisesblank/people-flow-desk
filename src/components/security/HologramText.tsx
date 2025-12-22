// ============================================
// 🌌 HOLOGRAM TEXT — TEXTO EM CANVAS (NÃO SELECIONÁVEL)
// Renderiza texto premium em canvas para evitar cópia
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================

import React, { useEffect, useRef, memo } from "react";
import { cn } from "@/lib/utils";

interface HologramTextProps {
  text: string;
  font?: string;
  color?: string;
  lineHeight?: number;
  className?: string;
}

// Função auxiliar para quebrar texto em linhas
function wrapText(
  ctx: CanvasRenderingContext2D, 
  text: string, 
  x: number, 
  y: number, 
  maxWidth: number, 
  lineHeight: number
): number {
  const paragraphs = text.split("\n");
  let currentY = y;
  
  for (const paragraph of paragraphs) {
    if (paragraph.trim() === "") {
      currentY += lineHeight;
      continue;
    }
    
    const words = paragraph.split(" ");
    let line = "";
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, currentY);
        line = words[n] + " ";
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, currentY);
    currentY += lineHeight;
  }
  
  return currentY;
}

export const HologramText = memo(({
  text,
  font = "16px Inter, system-ui, sans-serif",
  color = "#0f172a",
  lineHeight = 24,
  className
}: HologramTextProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Suporte a high DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    
    // Calcular altura necessária
    ctx.font = font;
    const tempHeight = 10000; // Altura temporária para calcular
    canvas.width = width * dpr;
    canvas.height = tempHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    // Calcular altura real do texto
    const finalY = wrapText(ctx, text, 0, lineHeight, width - 20, lineHeight);
    const actualHeight = finalY + lineHeight;
    
    // Redimensionar canvas para altura real
    canvas.width = width * dpr;
    canvas.height = actualHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    // Renderizar texto
    ctx.clearRect(0, 0, width, actualHeight);
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textBaseline = "top";
    
    wrapText(ctx, text, 10, 10, width - 20, lineHeight);
    
    // Atualizar altura do container
    canvas.style.height = `${actualHeight}px`;
    
  }, [text, font, color, lineHeight]);

  return (
    <div 
      ref={containerRef}
      className={cn("hologram-text-container", className)} 
      style={{ 
        position: "relative", 
        userSelect: "none",
        width: "100%",
        minHeight: 100
      }}
    >
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: "100%", 
          height: "auto",
          display: "block"
        }}
      />
      
      {/* Texto real fora da tela para acessibilidade (screen readers) */}
      <div 
        style={{ 
          position: "absolute", 
          left: "-99999px", 
          top: "-99999px",
          width: 1,
          height: 1,
          overflow: "hidden"
        }}
        aria-hidden="false"
        role="article"
      >
        {text}
      </div>
    </div>
  );
});

HologramText.displayName = "HologramText";

export default HologramText;
