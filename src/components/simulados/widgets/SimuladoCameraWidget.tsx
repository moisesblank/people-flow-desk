/**
 * 🎯 SIMULADOS — Camera Widget (Modo Hard)
 * Constituição SYNAPSE Ω v10.0
 * 
 * Widget de câmera como DETERRENTE.
 * Não grava, apenas monitora presença.
 */

import React, { useRef, useEffect } from "react";
import { Camera, CameraOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SimuladoCameraWidgetProps } from "@/components/simulados/types";

export function SimuladoCameraWidget({
  isActive,
  error,
  onRequestCamera,
  videoRef,
}: SimuladoCameraWidgetProps & { videoRef?: React.RefObject<HTMLVideoElement> }) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const effectiveRef = videoRef || localVideoRef;

  return (
    <div className="relative">
      {/* Container do vídeo */}
      <div
        className={cn(
          "w-32 h-24 rounded-lg overflow-hidden border-2 transition-all duration-300",
          isActive && "border-green-500 shadow-lg shadow-green-500/20",
          error && "border-red-500 bg-red-500/10",
          !isActive && !error && "border-muted bg-muted/20"
        )}
      >
        {isActive ? (
          <video
            ref={effectiveRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover scale-x-[-1]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground">
            {error ? (
              <>
                <CameraOff className="h-6 w-6 text-red-400" />
                <span className="text-[10px] text-center px-1">Erro</span>
              </>
            ) : (
              <>
                <Camera className="h-6 w-6" />
                <span className="text-[10px]">Inativa</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Indicador de status */}
      <div
        className={cn(
          "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
          isActive && "bg-green-500 animate-pulse",
          error && "bg-red-500",
          !isActive && !error && "bg-muted"
        )}
      />

      {/* Mensagem de erro */}
      {error && (
        <div className="absolute -bottom-8 left-0 right-0 flex items-center justify-center gap-1 text-[10px] text-red-400">
          <AlertCircle className="h-3 w-3" />
          <span className="truncate">{typeof error === 'string' ? error : 'Erro de câmera'}</span>
        </div>
      )}

      {/* Botão de ativar */}
      {!isActive && !error && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 bg-background/80 transition-opacity"
          onClick={onRequestCamera}
        >
          <Camera className="h-4 w-4 mr-1" />
          Ativar
        </Button>
      )}
    </div>
  );
}
