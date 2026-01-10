// ============================================
// 📄 PDF COMPRESSION UTILS v1.0
// Compressão client-side de PDFs antes do upload
// ATIVO APENAS EM: /gestaofc/materiais e /alunos/materiais
// NÃO ATIVO EM: /gestaofc/livros-web e /alunos/livro-web
// ============================================

import { PDFDocument } from 'pdf-lib';

export interface PdfCompressionOptions {
  /** Remove metadados do PDF */
  removeMetadata?: boolean;
  /** Qualidade de compressão (0.1 a 1.0) - menor = mais comprimido */
  quality?: number;
}

export interface PdfCompressionResult {
  originalSize: number;
  compressedSize: number;
  reductionPercent: number;
  file: File;
}

const DEFAULT_OPTIONS: Required<PdfCompressionOptions> = {
  removeMetadata: true,
  quality: 0.8,
};

/**
 * Comprime um arquivo PDF removendo metadados e otimizando estrutura
 * Retorna o arquivo comprimido ou o original se compressão falhar
 */
export async function compressPdf(
  file: File,
  options: PdfCompressionOptions = {}
): Promise<PdfCompressionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const originalSize = file.size;

  // Se não for PDF, retornar original
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return {
      originalSize,
      compressedSize: originalSize,
      reductionPercent: 0,
      file,
    };
  }

  try {
    // Ler o PDF original
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
      updateMetadata: false,
    });

    // Remover metadados se configurado
    if (opts.removeMetadata) {
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer('');
      pdfDoc.setCreator('');
    }

    // Salvar com otimizações
    // useObjectStreams: true - agrupa objetos para melhor compressão
    // addDefaultPage: false - não adiciona página em branco
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    const compressedSize = compressedBytes.length;
    
    // Se o comprimido for maior, usar original
    if (compressedSize >= originalSize) {
      console.log(`[PDFCompression] ${file.name}: Sem ganho, usando original`);
      return {
        originalSize,
        compressedSize: originalSize,
        reductionPercent: 0,
        file,
      };
    }

    // Criar novo File com os bytes comprimidos
    // Usar spread para criar novo Uint8Array com ArrayBuffer regular
    const regularArray = new Uint8Array(compressedBytes);
    const compressedFile = new File(
      [regularArray.buffer as ArrayBuffer],
      file.name,
      { type: 'application/pdf', lastModified: Date.now() }
    );

    const reductionPercent = ((1 - compressedSize / originalSize) * 100);

    console.log(
      `[PDFCompression] ${file.name}: ${(originalSize / 1024).toFixed(0)}KB → ${(compressedSize / 1024).toFixed(0)}KB (-${reductionPercent.toFixed(1)}%)`
    );

    return {
      originalSize,
      compressedSize,
      reductionPercent,
      file: compressedFile,
    };
  } catch (error) {
    console.warn(`[PDFCompression] Erro ao comprimir ${file.name}, usando original:`, error);
    return {
      originalSize,
      compressedSize: originalSize,
      reductionPercent: 0,
      file,
    };
  }
}

/**
 * Comprime múltiplos PDFs em paralelo
 */
export async function compressPdfs(
  files: File[],
  options: PdfCompressionOptions = {}
): Promise<PdfCompressionResult[]> {
  const results = await Promise.all(
    files.map(file => compressPdf(file, options))
  );
  
  // Log resumo
  const totalOriginal = results.reduce((acc, r) => acc + r.originalSize, 0);
  const totalCompressed = results.reduce((acc, r) => acc + r.compressedSize, 0);
  const totalReduction = totalOriginal > 0 
    ? ((1 - totalCompressed / totalOriginal) * 100).toFixed(1)
    : '0';
  
  console.log(
    `[PDFCompression] Lote: ${files.length} arquivos, ${(totalOriginal / 1024 / 1024).toFixed(2)}MB → ${(totalCompressed / 1024 / 1024).toFixed(2)}MB (-${totalReduction}%)`
  );
  
  return results;
}

/**
 * Formata bytes para exibição humana
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
