// ============================================
// ⚡ EVANGELHO DA VELOCIDADE v2.0 ⚡
// DOGMA II: A LITURGIA DA COMPRESSÃO TOTAL
// Otimização de imagens, SVGs e assets
// ============================================

/**
 * DOGMA II.1 - Compressão de Texto
 * Brotli/Gzip é configurado no servidor (Vercel/Supabase)
 * Aqui garantimos headers corretos nas requisições
 */
export const compressionHeaders = {
  'Accept-Encoding': 'br, gzip, deflate',
  'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
};

/**
 * DOGMA II.2 - Suporte a formatos modernos de imagem
 */
export function getImageFormatSupport(): {
  avif: boolean;
  webp: boolean;
  hasModernSupport: boolean;
} {
  if (typeof window === 'undefined') {
    return { avif: false, webp: false, hasModernSupport: false };
  }

  // Check WebP support
  const webp = document.createElement('canvas')
    .toDataURL('image/webp')
    .indexOf('data:image/webp') === 0;

  // AVIF support check (async, so we use a cached value)
  const avif = (window as any).__avifSupport ?? false;
  
  // Async AVIF check
  if ((window as any).__avifSupport === undefined) {
    const avifImage = new Image();
    avifImage.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKBzgAACsAAPMJYGY+lMH/ZIIxZcfLf4SJAA==';
    avifImage.onload = () => { (window as any).__avifSupport = true; };
    avifImage.onerror = () => { (window as any).__avifSupport = false; };
  }

  return { avif, webp, hasModernSupport: webp || avif };
}

/**
 * DOGMA II.2 - Gerar URL otimizada para imagem
 * Prioriza AVIF > WebP > original
 */
export function getOptimizedImageUrl(
  src: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'avif' | 'webp' | 'jpeg' | 'png';
  }
): string {
  if (!src) return src;
  
  const { width, height, quality = 80, format = 'auto' } = options || {};
  const support = getImageFormatSupport();
  
  // Para URLs do Supabase Storage, adicionar transformações
  if (src.includes('supabase.co/storage')) {
    const params = new URLSearchParams();
    
    if (width) params.set('width', String(width));
    if (height) params.set('height', String(height));
    params.set('quality', String(quality));
    
    // Escolher melhor formato
    if (format === 'auto') {
      if (support.avif) params.set('format', 'avif');
      else if (support.webp) params.set('format', 'webp');
    } else {
      params.set('format', format);
    }
    
    const separator = src.includes('?') ? '&' : '?';
    return `${src}${separator}${params.toString()}`;
  }
  
  return src;
}

/**
 * DOGMA II.3 - Otimização de SVG inline
 * Remove metadados desnecessários
 */
export function optimizeSvgString(svg: string): string {
  return svg
    // Remove comentários
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove metadata
    .replace(/<metadata[\s\S]*?<\/metadata>/gi, '')
    // Remove atributos xmlns desnecessários (mantém o principal)
    .replace(/xmlns:[\w]+="[^"]*"/g, '')
    // Remove ids não utilizados
    .replace(/\s+id="[^"]*"/g, (match) => {
      // Manter ids que são referenciados
      const id = match.match(/id="([^"]*)"/)?.[1];
      if (id && svg.includes(`#${id}`)) return match;
      return '';
    })
    // Compactar espaços em branco
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * DOGMA III.3 - Gerar BlurHash placeholder
 * Versão simplificada - CSS blur como fallback
 */
export function generateBlurPlaceholder(
  dominantColor: string = '#1a1a1a'
): string {
  // Gerar gradiente suave baseado na cor dominante
  return `linear-gradient(135deg, ${dominantColor}22 0%, ${dominantColor}44 50%, ${dominantColor}22 100%)`;
}

/**
 * Calcular cor dominante de uma imagem (simplificado)
 */
export async function extractDominantColor(src: string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve('#1a1a1a');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve('#1a1a1a'); return; }
        
        // Usar imagem pequena para performance
        canvas.width = 10;
        canvas.height = 10;
        ctx.drawImage(img, 0, 0, 10, 10);
        
        const data = ctx.getImageData(0, 0, 10, 10).data;
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
        
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);
        
        resolve(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
      } catch {
        resolve('#1a1a1a');
      }
    };
    
    img.onerror = () => resolve('#1a1a1a');
    img.src = src;
  });
}

/**
 * Verificar se elemento está no viewport
 */
export function isInViewport(element: Element, rootMargin: string = '200px'): boolean {
  const rect = element.getBoundingClientRect();
  const margin = parseInt(rootMargin);
  
  return (
    rect.top <= (window.innerHeight + margin) &&
    rect.bottom >= -margin &&
    rect.left <= (window.innerWidth + margin) &&
    rect.right >= -margin
  );
}

/**
 * Prefetch de imagem
 */
export function prefetchImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Batch prefetch de múltiplas imagens
 */
export async function prefetchImages(
  srcs: string[],
  options?: { concurrency?: number }
): Promise<void> {
  const { concurrency = 3 } = options || {};
  
  for (let i = 0; i < srcs.length; i += concurrency) {
    const batch = srcs.slice(i, i + concurrency);
    await Promise.allSettled(batch.map(prefetchImage));
  }
}
