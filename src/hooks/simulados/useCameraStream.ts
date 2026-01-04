/**
 * 🎯 SIMULADOS — Hook de Stream de Câmera
 * Constituição SYNAPSE Ω v10.0 | Modo Hard
 * 
 * Gerencia acesso à câmera para monitoramento.
 * NÃO grava vídeo, apenas mantém stream ativo como deterrent.
 */

import { useState, useCallback, useRef, useEffect } from "react";

export interface CameraState {
  status: "IDLE" | "REQUESTING" | "ACTIVE" | "DENIED" | "ERROR" | "NOT_SUPPORTED";
  stream: MediaStream | null;
  errorMessage: string | null;
}

interface UseCameraStreamOptions {
  enabled?: boolean;
  requiresCamera: boolean;
  onDenied?: () => void;
  onError?: (error: string) => void;
}

export function useCameraStream(options: UseCameraStreamOptions) {
  const { enabled = true, requiresCamera, onDenied, onError } = options;
  
  const [state, setState] = useState<CameraState>({
    status: "IDLE",
    stream: null,
    errorMessage: null,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);

  /**
   * Verifica se o navegador suporta câmera
   */
  const isSupported = useCallback((): boolean => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }, []);

  /**
   * Solicita acesso à câmera
   */
  const requestCamera = useCallback(async (): Promise<boolean> => {
    if (!enabled || !requiresCamera) {
      return true; // Não precisa de câmera
    }

    if (!isSupported()) {
      setState({
        status: "NOT_SUPPORTED",
        stream: null,
        errorMessage: "Seu navegador não suporta acesso à câmera.",
      });
      onError?.("NOT_SUPPORTED");
      return false;
    }

    setState(prev => ({ ...prev, status: "REQUESTING", errorMessage: null }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: "user",
        },
        audio: false, // Não precisa de áudio
      });

      setState({
        status: "ACTIVE",
        stream,
        errorMessage: null,
      });

      console.log("[useCameraStream] Camera access granted");
      return true;
    } catch (err) {
      console.error("[useCameraStream] Camera access error:", err);
      
      const error = err as Error;
      let status: CameraState["status"] = "ERROR";
      let message = "Erro ao acessar a câmera.";

      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        status = "DENIED";
        message = "Acesso à câmera negado. Ative a permissão nas configurações do navegador.";
        onDenied?.();
      } else if (error.name === "NotFoundError") {
        message = "Nenhuma câmera encontrada no dispositivo.";
      } else if (error.name === "NotReadableError") {
        message = "A câmera está sendo usada por outro aplicativo.";
      }

      setState({
        status,
        stream: null,
        errorMessage: message,
      });

      onError?.(message);
      return false;
    }
  }, [enabled, requiresCamera, isSupported, onDenied, onError]);

  /**
   * Para o stream da câmera
   */
  const stopCamera = useCallback(() => {
    if (state.stream) {
      state.stream.getTracks().forEach(track => {
        track.stop();
        console.log("[useCameraStream] Track stopped:", track.kind);
      });
    }

    setState({
      status: "IDLE",
      stream: null,
      errorMessage: null,
    });
  }, [state.stream]);

  /**
   * Conecta stream a um elemento de vídeo
   */
  const attachToVideo = useCallback((videoElement: HTMLVideoElement | null) => {
    videoRef.current = videoElement;
    
    if (videoElement && state.stream) {
      videoElement.srcObject = state.stream;
      videoElement.play().catch(console.error);
    }
  }, [state.stream]);

  /**
   * Cleanup automático ao desmontar
   */
  useEffect(() => {
    return () => {
      if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [state.stream]);

  /**
   * Atualiza vídeo quando stream muda
   */
  useEffect(() => {
    if (videoRef.current && state.stream) {
      videoRef.current.srcObject = state.stream;
    }
  }, [state.stream]);

  return {
    ...state,
    isActive: state.status === "ACTIVE",
    isDenied: state.status === "DENIED",
    isRequesting: state.status === "REQUESTING",
    isSupported: isSupported(),
    
    requestCamera,
    stopCamera,
    attachToVideo,
  };
}
