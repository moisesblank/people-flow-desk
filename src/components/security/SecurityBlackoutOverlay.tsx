// ============================================
// 🚨 BLACKOUT ANTI-PIRATARIA v1.2
// Overlay visual de bloqueio permanente/temporário
// PROTEÇÃO GLOBAL + DETECÇÃO DE GRAVAÇÃO
// ============================================

import { memo, useEffect, useState } from "react";
import { ShieldX, RefreshCw, Clock, AlertTriangle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSecurityBlackout } from "@/hooks/useSecurityBlackout";
import { supabase } from "@/integrations/supabase/client";

const SecurityBlackoutOverlay = memo(() => {
  const { 
    isBlocked, 
    blockType, 
    blockEndTime, 
    lastViolationType,
    isOwner,
    isTargetRoute,
    isRecordingDetected,
    recordingReason,
  } = useSecurityBlackout();
  
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  // ═══════════════════════════════════════════════════════════
  // COUNTDOWN PARA BLOQUEIO TEMPORÁRIO
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (blockType !== "temporary" || !blockEndTime) {
      setRemainingTime(null);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((blockEndTime - Date.now()) / 1000));
      setRemainingTime(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [blockType, blockEndTime]);

  // Owner nunca vê o overlay
  if (isOwner) return null;
  
  // Só exibir na rota alvo (não-pública)
  if (!isTargetRoute) return null;
  
  // Não bloqueado
  if (!isBlocked && !isRecordingDetected) return null;

  // ═══════════════════════════════════════════════════════════
  // v1.2: BLOQUEIO POR GRAVAÇÃO (permanente com logout)
  // ═══════════════════════════════════════════════════════════
  if (isRecordingDetected) {
    const handleLogout = async () => {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error("[SecurityBlackout] Erro ao fazer logout:", err);
      }
      window.location.href = "/";
    };

    const getRecordingMessage = () => {
      if (!recordingReason) return "Tentativa de gravação detectada";

      if (recordingReason.includes("getDisplayMedia")) {
        return "Compartilhamento de tela detectado";
      }
      if (recordingReason.includes("MediaRecorder")) {
        return "Gravador de mídia detectado";
      }
      if (recordingReason.includes("extension")) {
        return "Extensão de gravação detectada (Loom, Vidyard, etc.)";
      }
      if (recordingReason.includes("picture_in_picture")) {
        return "Picture-in-Picture detectado";
      }
      if (recordingReason.includes("iframe")) {
        return "Iframe suspeito detectado";
      }

      return "Tentativa de gravação detectada";
    };

    return (
      <div
        className="fixed inset-0 z-[2147483647] flex items-center justify-center"
        style={{
          backgroundColor: "#000000",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        <div className="text-center space-y-8 p-8 max-w-lg mx-4">
          {/* Ícone de bloqueio */}
          <div className="relative mx-auto w-28 h-28">
            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-pulse" />
            <div className="relative flex items-center justify-center w-28 h-28 rounded-full bg-red-500/30 border-4 border-red-500">
              <ShieldX className="w-14 h-14 text-red-500" />
            </div>
          </div>

          {/* Título */}
          <h1 className="text-4xl font-bold text-red-500 tracking-wide">
            GRAVAÇÃO DE TELA DETECTADA
          </h1>

          {/* Subtítulo */}
          <div className="space-y-2">
            <p className="text-xl text-gray-300 font-medium">
              SUA SESSÃO FOI ENCERRADA
            </p>
            <p className="text-lg text-red-400">
              {getRecordingMessage()}
            </p>
          </div>

          {/* Warning box */}
          <div className="bg-red-950/50 border border-red-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 justify-center text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold">ESTA VIOLAÇÃO FOI REGISTRADA</span>
            </div>
            <div className="text-sm text-gray-400 space-y-1">
              <p>Seus dados pessoais foram associados a este incidente:</p>
              <p className="text-red-300 font-mono text-xs">
                CPF • Nome • Email • IP • Dispositivo • Horário
              </p>
            </div>
          </div>

          {/* Aviso legal */}
          <div className="text-sm text-gray-500 space-y-1">
            <p>
              A pirataria de conteúdo é crime previsto na Lei 9.610/98.
            </p>
            <p className="text-yellow-500/80 font-medium">
              Múltiplas violações resultarão em banimento permanente.
            </p>
          </div>

          {/* Separador */}
          <div className="w-32 h-0.5 bg-red-500/30 mx-auto" />

          {/* Botão de sair */}
          <div className="pt-4">
            <Button
              onClick={handleLogout}
              variant="destructive"
              size="lg"
              className="gap-2 px-8 py-6 text-lg font-bold"
            >
              <LogOut className="w-5 h-5" />
              SAIR DA PLATAFORMA
            </Button>
          </div>

          {/* Nota de suporte */}
          <p className="text-xs text-gray-600">
            Se acredita que isso é um erro, entre em contato com o suporte.
          </p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // BLOQUEIO TEMPORÁRIO (com countdown)
  // ═══════════════════════════════════════════════════════════
  if (blockType === "temporary" && remainingTime !== null && remainingTime > 0) {
    return (
      <div
        className="fixed inset-0 z-[2147483647] flex items-center justify-center"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.95)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="text-center space-y-6 p-8 max-w-md mx-4">
          {/* Ícone de espera - static for performance */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-yellow-500/20" />
            <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-yellow-500/30 border-2 border-yellow-500">
              <Clock className="w-12 h-12 text-yellow-400" />
            </div>
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-yellow-400">
            SUSPENSÃO TEMPORÁRIA
          </h1>

          {/* Countdown */}
          <div className="text-6xl font-mono font-bold text-white">
            {remainingTime}s
          </div>

          {/* Descrição */}
          <p className="text-lg text-gray-300">
            Múltiplas tentativas de captura de tela detectadas.
            <br />
            Aguarde para continuar assistindo.
          </p>

          {/* Warning */}
          <div className="flex items-center gap-2 justify-center text-sm text-yellow-400/80">
            <AlertTriangle className="w-4 h-4" />
            <span>Próxima violação resultará em bloqueio permanente</span>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // BLOQUEIO PERMANENTE
  // ═══════════════════════════════════════════════════════════
  const getViolationMessage = () => {
    switch (lastViolationType) {
      case "devtools":
        return "Ferramentas de desenvolvedor detectadas";
      case "window_blur":
        return "Padrão suspeito de atividade detectado";
      case "screen_capture":
        return "Software de captura detectado";
      case "printscreen":
      case "screenshot":
        return "Múltiplas tentativas de captura de tela";
      case "suspicious_blur":
        return "Padrão suspeito de saída de janela (5+ vezes)";
      case "recording_api":
        return "API de gravação interceptada";
      case "recording_extension":
        return "Extensão de gravação detectada";
      case "picture_in_picture":
        return "Picture-in-Picture detectado";
      default:
        return "Violação de segurança detectada";
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div
      className="fixed inset-0 z-[2147483647] flex items-center justify-center"
      style={{
        backgroundColor: "#000000",
      }}
    >
      <div className="text-center space-y-8 p-8 max-w-lg mx-4">
        {/* Ícone de bloqueio */}
        <div className="relative mx-auto w-28 h-28">
          <div className="absolute inset-0 rounded-full bg-red-500/20 animate-pulse" />
          <div className="relative flex items-center justify-center w-28 h-28 rounded-full bg-red-500/30 border-4 border-red-500">
            <ShieldX className="w-14 h-14 text-red-500" />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-4xl font-bold text-red-500 tracking-wide">
          ACESSO BLOQUEADO
        </h1>

        {/* Subtítulo */}
        <div className="space-y-2">
          <p className="text-xl text-gray-300 font-medium">
            {getViolationMessage()}
          </p>
          <p className="text-gray-400">
            Esta tentativa foi registrada e associada à sua conta.
          </p>
        </div>

        {/* Separador */}
        <div className="w-32 h-0.5 bg-red-500/30 mx-auto" />

        {/* Informação legal */}
        <div className="text-sm text-gray-500 space-y-1">
          <p>
            A pirataria de conteúdo é crime previsto na Lei 9.610/98.
          </p>
          <p>
            Seu IP, dispositivo e dados foram registrados para auditoria.
          </p>
        </div>

        {/* Botão de recarregar */}
        <div className="pt-4">
          <Button
            onClick={handleReload}
            variant="outline"
            size="lg"
            className="gap-2 border-gray-600 text-gray-400 hover:text-white hover:border-gray-500"
          >
            <RefreshCw className="w-4 h-4" />
            Recarregar Página
          </Button>
        </div>

        {/* Nota de suporte */}
        <p className="text-xs text-gray-600">
          Se acredita que isso é um erro, entre em contato com o suporte.
        </p>
      </div>
    </div>
  );
});

SecurityBlackoutOverlay.displayName = "SecurityBlackoutOverlay";

export { SecurityBlackoutOverlay };
