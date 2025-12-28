// ============================================
// 🌌🔥 HOLOGRAM TEXT OMEGA — TEXTO INCOPIÁVEL NÍVEL NASA 🔥🌌
// ANO 2300 — RENDERIZAÇÃO EM CANVAS ANTI-SELEÇÃO
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================
//
// Renderiza texto em canvas, impossível de selecionar/copiar
// Mantém acessibilidade via elemento oculto para screen readers
//
// 📍 MAPA DE URLs DEFINITIVO (MONO-DOMÍNIO v2.0 - 27/12/2025):
//   🌐 NÃO PAGANTE: pro.moisesmedeiros.com.br/ + /comunidade
//   👨‍🎓 ALUNO BETA: pro.moisesmedeiros.com.br/alunos (PAGANTE)
//   👔 FUNCIONÁRIO: pro.moisesmedeiros.com.br/gestaofc (STAFF)
//   👑 OWNER: TODAS (role='owner' do banco)
//
// ============================================

import React, { useEffect, useRef, memo, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

// ============================================
// TIPOS E INTERFACES
// ============================================
interface HologramTextProps {
  text: string;
  font?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: CanvasTextAlign;
  padding?: number;
  maxWidth?: number;
  className?: string;
  enableAccessibility?: boolean;
  antiAlias?: boolean;
  highDPI?: boolean;
}

interface TextLine {
  text: string;
  y: number;
}

// ============================================
// CONSTANTES
// ============================================
const OWNER_EMAIL = "moisesblank@gmail.com";
const DEFAULT_FONT_SIZE = 16;
const DEFAULT_LINE_HEIGHT = 1.6;
const DEFAULT_PADDING = 16;
const DPI_SCALE = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

// ============================================
// UTILITÁRIOS
// ============================================
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number
): TextLine[] {
  const lines: TextLine[] = [];
  const paragraphs = text.split("\n");
  let currentY = 0;

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === "") {
      currentY += lineHeight;
      continue;
    }

    const words = paragraph.split(" ");
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push({ text: currentLine, y: currentY });
        currentY += lineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push({ text: currentLine, y: currentY });
      currentY += lineHeight;
    }
  }

  return lines;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const HologramText = memo(({
  text,
  font = "Inter, system-ui, sans-serif",
  fontSize = DEFAULT_FONT_SIZE,
  fontWeight = 400,
  color = "hsl(var(--foreground))",
  lineHeight = DEFAULT_LINE_HEIGHT,
  letterSpacing = 0,
  textAlign = "left",
  padding = DEFAULT_PADDING,
  maxWidth,
  className,
  enableAccessibility = true,
  antiAlias = true,
  highDPI = true,
}: HologramTextProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user, role } = useAuth();

  // P1-2 FIX: Role-first, email como fallback UX
  const isOwner = useMemo(() => {
    return role === "owner";
  }, [role]);

  // Renderizar canvas para não-owners
  const renderCanvas = useCallback(() => {
    if (isOwner) return;
    
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calcular dimensões
    const containerWidth = container.clientWidth || 800;
    const effectiveMaxWidth = maxWidth || containerWidth - padding * 2;
    const scale = highDPI ? DPI_SCALE : 1;

    // Configurar fonte para medição
    const fontString = `${fontWeight} ${fontSize}px ${font}`;
    ctx.font = fontString;

    // Calcular linhas
    const pixelLineHeight = fontSize * lineHeight;
    const lines = wrapText(ctx, text, effectiveMaxWidth, pixelLineHeight);

    // Calcular altura necessária
    const totalHeight = lines.length * pixelLineHeight + padding * 2;

    // Configurar canvas com DPI alto
    canvas.width = containerWidth * scale;
    canvas.height = totalHeight * scale;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${totalHeight}px`;

    // Escalar para DPI
    ctx.scale(scale, scale);

    // Limpar canvas
    ctx.clearRect(0, 0, containerWidth, totalHeight);

    // Configurar renderização
    if (antiAlias) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    }

    // Obter cor computada do CSS
    const computedColor = getComputedStyle(container).color || color;

    // Configurar fonte e cor
    ctx.font = fontString;
    ctx.fillStyle = computedColor;
    ctx.textAlign = textAlign;
    ctx.textBaseline = "top";

    // Calcular posição X baseada no alinhamento
    let startX = padding;
    if (textAlign === "center") {
      startX = containerWidth / 2;
    } else if (textAlign === "right") {
      startX = containerWidth - padding;
    }

    // Renderizar linhas
    for (const line of lines) {
      ctx.fillText(line.text, startX, padding + line.y);
    }
  }, [
    text,
    font,
    fontSize,
    fontWeight,
    color,
    lineHeight,
    letterSpacing,
    textAlign,
    padding,
    maxWidth,
    antiAlias,
    highDPI,
    isOwner,
  ]);

  // Renderizar ao montar e quando mudar
  useEffect(() => {
    if (isOwner) return;
    
    renderCanvas();

    // Re-renderizar em resize
    const handleResize = () => {
      requestAnimationFrame(renderCanvas);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [renderCanvas, isOwner]);

  // Se for owner, renderizar texto normal
  if (isOwner) {
    return (
      <div
        ref={containerRef}
        className={cn("relative", className)}
      >
        <p
          style={{
            fontFamily: font,
            fontSize: `${fontSize}px`,
            fontWeight,
            lineHeight,
            letterSpacing: `${letterSpacing}px`,
            textAlign,
            padding: `${padding}px`,
          }}
          className="text-foreground"
        >
          {text}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative select-none",
        "pointer-events-auto",
        className
      )}
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        msUserSelect: "none",
        MozUserSelect: "none" as React.CSSProperties["userSelect"],
        WebkitTouchCallout: "none",
      }}
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Canvas com o texto renderizado */}
      <canvas
        ref={canvasRef}
        className="block w-full text-foreground"
        style={{
          imageRendering: antiAlias ? "auto" : "pixelated",
        }}
      />

      {/* Texto acessível para screen readers (invisível) */}
      {enableAccessibility && (
        <span
          className="sr-only"
          aria-live="polite"
        >
          {text}
        </span>
      )}

      {/* Overlay anti-inspeção */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: "transparent",
          zIndex: 1,
        }}
      />
    </div>
  );
});

HologramText.displayName = "HologramText";

export default HologramText;
