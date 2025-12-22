// ============================================
// 🌌 SANCTUM WATERMARK — MARCA D'ÁGUA DINÂMICA
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================

import React, { useEffect, useMemo, useState, memo } from "react";
import { useAuth } from "@/contexts/AuthContext";

function bucket20s() {
  return Math.floor(Date.now() / 20000);
}

export const SanctumWatermark = memo(() => {
  const { profile } = useAuth();
  const [tick, setTick] = useState(bucket20s());

  // Atualizar a cada 20 segundos para mudar o timestamp
  useEffect(() => {
    const id = setInterval(() => setTick(bucket20s()), 20000);
    return () => clearInterval(id);
  }, []);

  // Gerar texto da watermark
  const text = useMemo(() => {
    const name = profile?.name ?? profile?.email ?? "ALUNO";
    const id = profile?.id?.slice(0, 8) ?? "UNKNOWN";
    const cpf = profile?.cpf 
      ? `${profile.cpf.slice(0, 3)}.***.***-${profile.cpf.slice(-2)}`
      : "";
    const time = new Date().toLocaleString("pt-BR");
    return `${name} • ${cpf || id} • ${time}`;
  }, [profile, tick]);

  return (
    <div className="sanctum-watermark" aria-hidden="true">
      <div className="sanctum-watermark-inner">
        {/* Repetir o texto várias vezes para cobrir a tela toda */}
        {Array.from({ length: 15 }).map((_, i) => (
          <span key={i}>{text}{"    "}</span>
        ))}
      </div>
    </div>
  );
});

SanctumWatermark.displayName = "SanctumWatermark";

export default SanctumWatermark;
