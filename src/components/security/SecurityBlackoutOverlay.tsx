// ============================================
// 🚨 BLACKOUT ANTI-PIRATARIA v1.0
// Overlay visual de bloqueio permanente/temporário
// Rota alvo: /alunos/videoaulas
// ============================================

import { memo, useEffect, useState } from "react";
import { ShieldX, RefreshCw, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSecurityBlackout } from "@/hooks/useSecurityBlackout";

const SecurityBlackoutOverlay = memo(() => {
  const { 
    isBlocked, 
    blockType, 
    blockEndTime, 
    lastViolationType,
    isOwner,
    isTargetRoute,
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
  
  // Só exibir na rota alvo
  if (!isTargetRoute) return null;
  
  // Não bloqueado
  if (!isBlocked) return null;

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
          {/* Ícone de espera */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-yellow-500/20 animate-ping" />
            <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-yellow-500/30 border-2 border-yellow-500">
              <Clock className="w-12 h-12 text-yellow-400 animate-pulse" />
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
        return "Tentativa de gravação de tela detectada";
      case "screen_capture":
        return "Software de captura detectado";
      case "printscreen":
      case "screenshot":
        return "Múltiplas tentativas de captura de tela";
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
