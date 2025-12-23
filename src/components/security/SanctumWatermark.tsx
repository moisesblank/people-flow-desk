// ============================================
// 🌌🔥 SANCTUM WATERMARK OMEGA — MARCA D'ÁGUA FORENSE NÍVEL NASA 🔥🌌
// ANO 2300 — RASTREABILIDADE ABSOLUTA
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================
//
// 📍 MAPA DE URLs DEFINITIVO:
//   🌐 NÃO PAGANTE: pro.moisesmedeiros.com.br/ + /comunidade
//   👨‍🎓 ALUNO BETA: pro.moisesmedeiros.com.br/alunos (PAGANTE)
//   👔 FUNCIONÁRIO: gestao.moisesmedeiros.com.br/gestao
//   👑 OWNER: TODAS (moisesblank@gmail.com = MASTER - SEM WATERMARK)
//
// ============================================

import React, { useEffect, useMemo, useState, memo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

// ============================================
// CONSTANTES
// ============================================
const OWNER_EMAIL = "moisesblank@gmail.com";
const UPDATE_INTERVAL_MS = 15000; // 15 segundos
const GRID_ROWS = 12;
const GRID_COLS = 3;

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
function maskCPF(cpf: string): string {
  if (!cpf || cpf.length < 11) return "";
  // Formato: ***.123.456-**
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return cpf.slice(0, 3) + "***";
  return `***.${clean.slice(3, 6)}.${clean.slice(6, 9)}-**`;
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

  // Mesclar configurações
  const config = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...userConfig }),
    [userConfig]
  );

  // Verificar se é owner (MASTER) - não exibir watermark
  const isOwner = useMemo(() => {
    return user?.email?.toLowerCase() === OWNER_EMAIL;
  }, [user]);

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
    for (let i = 0; i < GRID_ROWS * GRID_COLS; i++) {
      newPositions.push({
        x: Math.random() * 20 - 10, // -10 a +10
        y: Math.random() * 20 - 10,
      });
    }
    setPositions(newPositions);
  }, []);

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

  // Gerar grid de watermarks
  const watermarkGrid = useMemo(() => {
    if (isOwner) return null;
    
    const grid: React.ReactNode[] = [];
    
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const index = row * GRID_COLS + col;
        const pos = positions[index] || { x: 0, y: 0 };
        
        grid.push(
          <div
            key={`wm-${row}-${col}-${tick}`}
            style={{
              position: "absolute",
              left: `${(col / GRID_COLS) * 100 + 5 + pos.x}%`,
              top: `${(row / GRID_ROWS) * 100 + 2 + pos.y}%`,
              transform: `rotate(${config.rotation}deg)`,
              fontSize: config.fontSize,
              color: config.color,
              opacity: config.opacity,
              whiteSpace: "nowrap",
              pointerEvents: "none",
              userSelect: "none",
              fontFamily: "monospace",
              letterSpacing: "0.05em",
              textShadow: "0 0 1px rgba(0,0,0,0.1)",
              transition: config.animated ? "all 0.5s ease-out" : "none",
            }}
          >
            {watermarkText}
          </div>
        );
      }
    }

    return grid;
  }, [watermarkText, positions, config, tick, isOwner]);

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
      }}
      aria-hidden="true"
      data-sanctum-watermark="true"
    >
      {/* Grid de watermarks */}
      {watermarkGrid}

      {/* Overlay diagonal adicional */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotate(-45deg)",
          fontSize: "clamp(16px, 2vw, 24px)",
          color: config.color,
          opacity: config.opacity * 0.5,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          userSelect: "none",
          fontWeight: "bold",
          letterSpacing: "0.1em",
        }}
      >
        PROF. MOISÉS MEDEIROS • CONTEÚDO PROTEGIDO • {sessionId}
      </div>

      {/* Marca d'água de canto */}
      <div
        style={{
          position: "absolute",
          bottom: "8px",
          right: "8px",
          fontSize: "10px",
          color: config.color,
          opacity: config.opacity,
          fontFamily: "monospace",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        © MM-{sessionId}-{new Date().getFullYear()}
      </div>
    </div>
  );
});

SanctumWatermark.displayName = "SanctumWatermark";

export default SanctumWatermark;
