// ============================================
// 🌌🔥 HOLOGRAM TEXT OMEGA — TEXTO INCOPIÁVEL NÍVEL NASA 🔥🌌
// ANO 2300 — RENDERIZAÇÃO EM CANVAS ANTI-SELEÇÃO
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================
//
// Renderiza texto em canvas, impossível de selecionar/copiar
// Mantém acessibilidade via elemento oculto para screen readers
//
// 📍 MAPA DE URLs DEFINITIVO:
//   🌐 NÃO PAGANTE: pro.moisesmedeiros.com.br/ + /comunidade
//   👨‍🎓 ALUNO BETA: pro.moisesmedeiros.com.br/alunos (PAGANTE)
//   👔 FUNCIONÁRIO: gestao.moisesmedeiros.com.br/gestao
//   👑 OWNER: TODAS (moisesblank@gmail.com = MASTER)
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
  color = "#1a1a1a",
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
  const { profile } = useAuth();

  // Verificar se é owner
  const isOwner = useMemo(() => {
    return (
      profile?.role === "owner" ||
      profile?.email?.toLowerCase() === OWNER_EMAIL
    );
  }, [profile]);

  // Renderizar canvas para não-owners
  const renderCanvas = useCallback(() => {
    if (isOwner) return; // Skip para owner
    
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

    // Configurar fonte e cor
    ctx.font = fontString;
    ctx.fillStyle = color;
    ctx.textAlign = textAlign;
    ctx.textBaseline = "top";

    // Aplicar letter-spacing simulado
    if (letterSpacing !== 0) {
      ctx.letterSpacing = `${letterSpacing}px`;
    }

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
    if (isOwner) return; // Skip para owner
    
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
      <div className={cn("hologram-text-owner", className)}>
        <div
          style={{
            fontFamily: font,
            fontSize: `${fontSize}px`,
            fontWeight,
            color,
            lineHeight,
            letterSpacing: `${letterSpacing}px`,
            textAlign,
            padding: `${padding}px`,
            whiteSpace: "pre-wrap",
            maxWidth: maxWidth ? `${maxWidth}px` : undefined,
          }}
        >
          {text}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "hologram-text-container relative",
        className
      )}
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        msUserSelect: "none",
        MozUserSelect: "none",
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
        className="hologram-canvas"
        style={{
          display: "block",
          width: "100%",
          pointerEvents: "none",
        }}
      />

      {/* Texto acessível para screen readers (invisível) */}
      {enableAccessibility && (
        <div
          className="sr-only"
          aria-hidden="false"
          role="article"
          aria-label="Conteúdo do texto"
          style={{
            position: "absolute",
            left: "-99999px",
            top: "-99999px",
            width: "1px",
            height: "1px",
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            clipPath: "inset(50%)",
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </div>
      )}

      {/* Overlay anti-inspeção */}
      <div
        className="hologram-shield"
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
          background: "transparent",
          zIndex: 1,
        }}
      />
    </div>
  );
});

HologramText.displayName = "HologramText";

export default HologramText;
