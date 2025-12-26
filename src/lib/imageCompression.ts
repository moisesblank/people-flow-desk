// ============================================
// IMAGE COMPRESSION UTILS v1.0
// Compressão client-side antes de upload
// ============================================

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  format?: 'webp' | 'jpeg' | 'png';
  maxSizeKB?: number; // Tamanho máximo em KB
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.85,
  format: 'webp',
  maxSizeKB: 500, // 500KB padrão
};

/**
 * Comprime uma imagem no cliente antes do upload
 * Reduz significativamente o tamanho e tempo de upload
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Se não for imagem, retornar original
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // SVG não precisa de compressão
  if (file.type === 'image/svg+xml') {
    return file;
  }

  // GIF mantém original (para preservar animação)
  if (file.type === 'image/gif') {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      try {
        // Calcular dimensões mantendo aspect ratio
        let { width, height } = img;
        
        if (width > opts.maxWidth) {
          height = (height * opts.maxWidth) / width;
          width = opts.maxWidth;
        }
        
        if (height > opts.maxHeight) {
          width = (width * opts.maxHeight) / height;
          height = opts.maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        if (!ctx) {
          resolve(file);
          return;
        }

        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Determinar MIME type
        const mimeType = opts.format === 'webp' 
          ? 'image/webp' 
          : opts.format === 'png' 
            ? 'image/png' 
            : 'image/jpeg';

        // Compressão adaptativa se necessário
        let quality = opts.quality;
        
        const compress = (q: number): void => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }

              const sizeKB = blob.size / 1024;
              
              // Se ainda muito grande e quality > 0.3, reduzir mais
              if (sizeKB > opts.maxSizeKB && q > 0.3) {
                compress(q - 0.1);
                return;
              }

              // Criar novo arquivo com mesmo nome mas extensão correta
              const extension = opts.format === 'webp' ? 'webp' : opts.format === 'png' ? 'png' : 'jpg';
              const baseName = file.name.replace(/\.[^/.]+$/, '');
              const newFileName = `${baseName}.${extension}`;

              const compressedFile = new File([blob], newFileName, {
                type: mimeType,
                lastModified: Date.now(),
              });

              // Log de compressão
              const originalKB = file.size / 1024;
              const finalKB = compressedFile.size / 1024;
              const reduction = ((1 - finalKB / originalKB) * 100).toFixed(1);
              
              console.log(`[ImageCompression] ${file.name}: ${originalKB.toFixed(0)}KB → ${finalKB.toFixed(0)}KB (-${reduction}%)`);

              resolve(compressedFile);
            },
            mimeType,
            q
          );
        };

        compress(quality);
      } catch (error) {
        console.error('[ImageCompression] Error:', error);
        resolve(file); // Fallback para original
      }
    };

    img.onerror = () => {
      console.error('[ImageCompression] Failed to load image');
      resolve(file); // Fallback para original
    };

    // Carregar imagem
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Comprime múltiplas imagens em paralelo
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  const compressionPromises = files.map((file) => compressImage(file, options));
  return Promise.all(compressionPromises);
}

/**
 * Verifica se o browser suporta WebP
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width > 0 && img.height > 0);
    img.onerror = () => resolve(false);
    img.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
  });
}

/**
 * Retorna o melhor formato suportado
 */
export async function getBestFormat(): Promise<'webp' | 'jpeg'> {
  const hasWebP = await supportsWebP();
  return hasWebP ? 'webp' : 'jpeg';
}
