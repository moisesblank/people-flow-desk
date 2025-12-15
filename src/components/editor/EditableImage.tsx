// ============================================
// MOISÉS MEDEIROS v7.0 - EDITABLE IMAGE
// Componente de imagem editável inline
// ============================================

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, Upload, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableImageProps {
  src: string;
  alt?: string;
  onUpload: (file: File) => Promise<string | null>;
  isEditMode: boolean;
  canEdit: boolean;
  className?: string;
  containerClassName?: string;
}

export function EditableImage({
  src,
  alt = "Imagem editável",
  onUpload,
  isEditMode,
  canEdit,
  className = "",
  containerClassName = "",
}: EditableImageProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setPendingFile(file);
    }
  };

  const handleConfirm = async () => {
    if (!pendingFile) return;

    setIsUploading(true);
    try {
      await onUpload(pendingFile);
      setPreviewUrl(null);
      setPendingFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setPreviewUrl(null);
    setPendingFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  if (!isEditMode || !canEdit) {
    return (
      <div className={containerClassName}>
        <img src={src} alt={alt} className={className} />
      </div>
    );
  }

  return (
    <motion.div
      className={cn("relative group cursor-pointer", containerClassName)}
      whileHover={{ scale: 1.02 }}
    >
      <img
        src={previewUrl || src}
        alt={alt}
        className={cn(
          className,
          "border-2 border-dashed border-transparent group-hover:border-primary/50 transition-all"
        )}
      />

      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"
        onClick={() => !pendingFile && inputRef.current?.click()}
      >
        {isUploading ? (
          <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full" />
        ) : pendingFile ? (
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                handleConfirm();
              }}
              className="p-2 rounded-full bg-green-500 text-white shadow-lg"
            >
              <Check className="h-5 w-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                handleCancel();
              }}
              className="p-2 rounded-full bg-red-500 text-white shadow-lg"
            >
              <X className="h-5 w-5" />
            </motion.button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-white">
            <Camera className="h-8 w-8" />
            <span className="text-sm font-medium">Clique para trocar</span>
          </div>
        )}
      </motion.div>

      {/* Edit badge */}
      {!pendingFile && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-2 -right-2 p-1.5 rounded-full bg-primary text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
        >
          <Upload className="h-4 w-4" />
        </motion.div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </motion.div>
  );
}
