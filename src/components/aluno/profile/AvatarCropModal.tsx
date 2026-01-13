// ============================================
// 📸 AVATAR CROP MODAL — Edição de Foto de Perfil
// Permite cortar e redimensionar antes do upload
// ============================================

import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  RotateCcw, 
  ZoomIn, 
  Check, 
  X, 
  Crop as CropIcon,
  Maximize2,
  Move
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export function AvatarCropModal({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
}: AvatarCropModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerAspectCrop(width, height, 1);
    setCrop(crop);
  }, []);

  const handleZoomChange = (value: number[]) => {
    setZoom(value[0]);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height, 1));
    }
  };

  const getCroppedImage = useCallback(async (): Promise<Blob | null> => {
    const image = imgRef.current;
    if (!image || !crop) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Tamanho do crop em pixels reais
    const pixelCrop = {
      x: (crop.x / 100) * image.width * scaleX,
      y: (crop.y / 100) * image.height * scaleY,
      width: (crop.width / 100) * image.width * scaleX,
      height: (crop.height / 100) * image.height * scaleY,
    };

    // Tamanho final do avatar (quadrado)
    const outputSize = 400;
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Limpar canvas
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, outputSize, outputSize);

    // Aplicar rotação se necessário
    if (rotation !== 0) {
      ctx.translate(outputSize / 2, outputSize / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-outputSize / 2, -outputSize / 2);
    }

    // Aplicar zoom
    const zoomedWidth = pixelCrop.width / zoom;
    const zoomedHeight = pixelCrop.height / zoom;
    const zoomOffsetX = (pixelCrop.width - zoomedWidth) / 2;
    const zoomOffsetY = (pixelCrop.height - zoomedHeight) / 2;

    // Desenhar a imagem cortada
    ctx.drawImage(
      image,
      pixelCrop.x + zoomOffsetX,
      pixelCrop.y + zoomOffsetY,
      zoomedWidth,
      zoomedHeight,
      0,
      0,
      outputSize,
      outputSize
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        'image/jpeg',
        0.92
      );
    });
  }, [crop, zoom, rotation]);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImage();
      if (croppedBlob) {
        onCropComplete(croppedBlob);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CropIcon className="w-5 h-5 text-primary" />
            Editar Foto de Perfil
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto py-4">
          {/* Área de Crop */}
          <div className="relative bg-muted/50 rounded-lg overflow-hidden flex items-center justify-center min-h-[300px] max-h-[400px]">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              aspect={1}
              circularCrop
              className="max-h-[380px]"
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Imagem para edição"
                onLoad={onImageLoad}
                className="max-h-[380px] max-w-full object-contain"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center',
                  transition: 'transform 0.2s ease-out',
                }}
              />
            </ReactCrop>
          </div>

          {/* Controles */}
          <div className="mt-6 space-y-4">
            {/* Zoom */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <ZoomIn className="w-4 h-4" />
                  Zoom
                </label>
                <span className="text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
              </div>
              <Slider
                value={[zoom]}
                onValueChange={handleZoomChange}
                min={1}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Botões de ação */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotate}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Girar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="gap-2"
              >
                <Maximize2 className="w-4 h-4" />
                Resetar
              </Button>
            </div>

            {/* Instruções */}
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Move className="w-3.5 h-3.5" />
                Arraste para posicionar • Use os controles para ajustar
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing || !crop}
            className="gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Confirmar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
