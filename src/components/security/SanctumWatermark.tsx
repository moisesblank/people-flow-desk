// ============================================
// 🌌🔥 SANCTUM WATERMARK OMEGA — MARCA D'ÁGUA FORENSE NÍVEL NASA 🔥🌌
// ANO 2300 — RASTREABILIDADE ABSOLUTA
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================
//
// 📍 MAPA DE URLs DEFINITIVO (MONO-DOMÍNIO v2.0 - 27/12/2025):
//   🌐 NÃO PAGANTE: pro.moisesmedeiros.com.br/ + /comunidade
//   👨‍🎓 ALUNO BETA: pro.moisesmedeiros.com.br/alunos (PAGANTE)
//   👔 FUNCIONÁRIO: pro.moisesmedeiros.com.br/gestaofc (STAFF)
//   👑 OWNER: TODAS (role='owner' - SEM WATERMARK)
//
// ============================================

import React, { useEffect, useMemo, useState, memo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

// ============================================
// CONSTANTES
// ============================================
// P1-2 FIX: OWNER_EMAIL removido - usar role='owner'
const UPDATE_INTERVAL_MS = 15000; // 15 segundos

// Detectar dispositivo
const isTouchDevice = () => 
  typeof window !== "undefined" && 
  ("ontouchstart" in window || navigator.maxTouchPoints > 0);

const isMobileDevice = () =>
  typeof window !== "undefined" &&
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Grid adaptativo por dispositivo
const getGridConfig = () => {
  if (typeof window === "undefined") return { rows: 8, cols: 3 };
  const width = window.innerWidth;
  if (width < 480) return { rows: 6, cols: 2 }; // Mobile pequeno
  if (width < 768) return { rows: 8, cols: 2 }; // Mobile
  if (width < 1024) return { rows: 10, cols: 3 }; // Tablet
  return { rows: 12, cols: 3 }; // Desktop
};

// ============================================
// TIPOS
// ============================================
interface WatermarkConfig {
  opacity: number;
  fontSize: string;
  rotation: number;
  color: string;
  showCPF: boolean;
  showTimestamp: boolean;
  showSessionId: boolean;
  animated: boolean;
}

interface SanctumWatermarkProps {
  config?: Partial<WatermarkConfig>;
  sessionId?: string;
  className?: string;
}

// ============================================
// CONFIGURAÇÃO PADRÃO
// ============================================
const DEFAULT_CONFIG: WatermarkConfig = {
  opacity: 0.08,
  fontSize: "clamp(10px, 1.2vw, 14px)",
  rotation: -25,
  color: "currentColor",
  showCPF: true,
  showTimestamp: true,
  showSessionId: true,
  animated: true,
};

// ============================================
// UTILITÁRIOS
// ============================================
// CPF COMPLETO - Sem máscara (cada usuário vê apenas o seu próprio)
function formatCPF(cpf: string): string {
  if (!cpf) return "";
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return cpf;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
}

function generateShortHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).toUpperCase().slice(0, 6);
}

function formatTimestamp(date: Date): string {
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const SanctumWatermark = memo(({
  config: userConfig,
  sessionId: externalSessionId,
  className,
}: SanctumWatermarkProps) => {
  const { user, session } = useAuth();
  const [tick, setTick] = useState(0);
  const [positions, setPositions] = useState<Array<{ x: number; y: number }>>([]);
  const [gridConfig, setGridConfig] = useState(getGridConfig());

  // Atualizar grid config ao redimensionar
  useEffect(() => {
    const handleResize = () => {
      setGridConfig(getGridConfig());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Mesclar configurações
  const config = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...userConfig }),
    [userConfig]
  );

  // Verificar se é owner (MASTER) - não exibir watermark
  // P1-2 FIX: Role como fonte da verdade
  const { role } = useAuth();
  const isOwner = useMemo(() => {
    return role === 'owner';
  }, [role]);

  // Session ID (externo ou gerado)
  const sessionId = useMemo(() => {
    if (externalSessionId) return externalSessionId;
    if (session?.access_token) {
      return generateShortHash(session.access_token);
    }
    return generateShortHash(Date.now().toString());
  }, [externalSessionId, session?.access_token]);

  // Gerar posições aleatórias para animação
  const generatePositions = useCallback(() => {
    const newPositions: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < gridConfig.rows * gridConfig.cols; i++) {
      newPositions.push({
        x: Math.random() * 20 - 10, // -10 a +10
        y: Math.random() * 20 - 10,
      });
    }
    setPositions(newPositions);
  }, [gridConfig]);

  // Atualizar tick e posições periodicamente
  useEffect(() => {
    if (isOwner) return;

    generatePositions();
    
    const intervalId = setInterval(() => {
      setTick((t) => t + 1);
      if (config.animated) {
        generatePositions();
      }
    }, UPDATE_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isOwner, config.animated, generatePositions]);

  // Dados do usuário para watermark
  const userName = user?.email?.split("@")[0]?.toUpperCase() || "ALUNO";
  const userId = user?.id?.slice(0, 8)?.toUpperCase() || "";

  // Gerar texto da watermark
  const watermarkText = useMemo(() => {
    if (isOwner) return "";

    const parts: string[] = [];

    // Nome
    parts.push(userName.slice(0, 25));

    // ID curto do usuário
    if (userId) {
      parts.push(`ID:${userId}`);
    }

    // Session ID
    if (config.showSessionId) {
      parts.push(`S:${sessionId}`);
    }

    // Timestamp - recalcula baseado no tick
    if (config.showTimestamp) {
      parts.push(formatTimestamp(new Date()));
    }

    return parts.join(" • ");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName, userId, config.showSessionId, config.showTimestamp, sessionId, isOwner, tick]);

  // Gerar grid de watermarks - RESPONSIVO
  const watermarkGrid = useMemo(() => {
    if (isOwner) return null;
    
    const grid: React.ReactNode[] = [];
    const { rows, cols } = gridConfig;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col;
        const pos = positions[index] || { x: 0, y: 0 };
        
        grid.push(
          <div
            key={`wm-${row}-${col}-${tick}`}
            style={{
              position: "absolute",
              left: `${(col / cols) * 100 + 5 + pos.x}%`,
              top: `${(row / rows) * 100 + 2 + pos.y}%`,
              transform: `rotate(${config.rotation}deg)`,
              fontSize: config.fontSize,
              color: config.color,
              opacity: config.opacity,
              whiteSpace: "nowrap",
              pointerEvents: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
              WebkitTouchCallout: "none",
              fontFamily: "monospace",
              letterSpacing: "0.05em",
              textShadow: "0 0 1px rgba(0,0,0,0.1)",
              transition: config.animated ? "all 0.5s ease-out" : "none",
            } as React.CSSProperties}
          >
            {watermarkText}
          </div>
        );
      }
    }

    return grid;
  }, [watermarkText, positions, config, tick, isOwner, gridConfig]);

  // Não renderizar para owner
  if (isOwner) {
    return null;
  }

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 9999,
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        WebkitTapHighlightColor: "transparent",
        touchAction: "none",
      } as React.CSSProperties}
      aria-hidden="true"
      data-sanctum-watermark="true"
      data-sanctum-protected="true"
    >
      {/* Grid de watermarks */}
      {watermarkGrid}

      {/* Overlay diagonal adicional - responsivo */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotate(-45deg)",
          fontSize: "clamp(12px, 2vw, 24px)",
          color: config.color,
          opacity: config.opacity * 0.5,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          fontWeight: "bold",
          letterSpacing: "0.1em",
        } as React.CSSProperties}
      >
        PROF. MOISÉS MEDEIROS • CONTEÚDO PROTEGIDO • {sessionId}
      </div>

      {/* Marca d'água de canto - oculta em mobile pequeno */}
      <div
        className="hidden sm:block"
        style={{
          position: "absolute",
          bottom: "8px",
          right: "8px",
          fontSize: "clamp(8px, 1vw, 12px)",
          color: config.color,
          opacity: config.opacity,
          fontFamily: "monospace",
          pointerEvents: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
        } as React.CSSProperties}
      >
        © MM-{sessionId}-{new Date().getFullYear()}
      </div>
    </div>
  );
});

SanctumWatermark.displayName = "SanctumWatermark";

export default SanctumWatermark;
