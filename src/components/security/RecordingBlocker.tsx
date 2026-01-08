// ============================================
// 🚨 RECORDING BLOCKER v1.0
// Tela preta permanente quando gravação é detectada
// Integrado ao Blackout Anti-Pirataria v1.2
// ============================================

import React, { memo, useCallback } from "react";
import { ShieldX, LogOut, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface RecordingBlockerProps {
  isVisible: boolean;
  detectionReason?: string | null;
}

const RecordingBlocker: React.FC<RecordingBlockerProps> = memo(({ isVisible, detectionReason }) => {
  if (!isVisible) return null;

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[RecordingBlocker] Erro ao fazer logout:", err);
    }
    // Redirecionar para página inicial
    window.location.href = "/";
  }, []);

  const getDetectionMessage = () => {
    if (!detectionReason) return "Tentativa de gravação detectada";

    if (detectionReason.includes("getDisplayMedia")) {
      return "Compartilhamento de tela detectado";
    }
    if (detectionReason.includes("MediaRecorder")) {
      return "Gravador de mídia detectado";
    }
    if (detectionReason.includes("extension")) {
      return "Extensão de gravação detectada";
    }
    if (detectionReason.includes("picture_in_picture")) {
      return "Picture-in-Picture detectado";
    }
    if (detectionReason.includes("iframe")) {
      return "Iframe suspeito detectado";
    }

    return "Tentativa de gravação detectada";
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        backgroundColor: "#000000",
        zIndex: 2147483647,
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
            {getDetectionMessage()}
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
});

RecordingBlocker.displayName = "RecordingBlocker";

export { RecordingBlocker };
