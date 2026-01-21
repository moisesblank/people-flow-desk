// ============================================
// SISTEMA DE ANEXOS UNIVERSAL - BIBLIOTECA DE UPLOAD
// Suporte a uploads até 2GB, qualquer formato,
// organização por data, integração com IA
// Owner: Professor Moisés Medeiros
// ============================================

import { supabase } from '@/integrations/supabase/client';
import { formatError } from '@/lib/utils/formatError';

// ═══════════════════════════════════════════════════════════════
// CONFIGURAÇÕES
// ═══════════════════════════════════════════════════════════════

export const UPLOAD_CONFIG = {
  // Tamanho máximo: 2GB
  maxFileSize: 2 * 1024 * 1024 * 1024,
  
  // Tamanho para upload direto (abaixo disso, upload simples)
  directUploadLimit: 50 * 1024 * 1024, // 50MB
  
  // Bucket padrão
  defaultBucket: 'arquivos',
  
  // Tipos de arquivo por categoria (para ícones e validação)
  fileTypes: {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff', 'image/heic', 'image/heif'],
    video: ['video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/aac', 'audio/flac', 'audio/x-m4a'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain', 'text/csv'],
    archive: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/gzip', 'application/x-tar']
  }
};

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

export interface UploadOptions {
  file: File;
  bucket?: string;
  folder?: string;
  categoria?: string;
  iaLer?: boolean;
  onProgress?: (progress: number) => void;
  relacionamentos?: {
    alunoId?: string;
    funcionarioId?: string;
    afiliadoId?: number;
    empresaId?: string;
    cursoId?: string;
    aulaId?: string;
  };
  descricao?: string;
  tags?: string[];
}

export interface UploadResult {
  id: string;
  nome: string;
  url: string;
  path: string;
  tipo: string;
  tamanho: number;
  dataUpload: Date;
  iaLer: boolean;
}

export interface BuscarArquivosOptions {
  categoria?: string;
  pasta?: string;
  empresaId?: string;
  tipo?: string;
  ano?: number;
  mes?: number;
  dia?: number;
  iaLer?: boolean;
  busca?: string;
  limite?: number;
  offset?: number;
  ordenarPor?: 'data_upload' | 'nome' | 'tamanho' | 'created_at';
  ordem?: 'asc' | 'desc';
}

// ═══════════════════════════════════════════════════════════════
// FUNÇÕES AUXILIARES
// ═══════════════════════════════════════════════════════════════

// Obter número da semana do ano
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Gerar nome único para o arquivo
function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const safeName = originalName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Substitui caracteres especiais
    .replace(/_+/g, '_'); // Remove underscores duplicados
  return `${timestamp}-${random}-${safeName}`;
}

// Obter extensão do arquivo
function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? `.${parts.pop()?.toLowerCase()}` : '';
}

// Determinar categoria do arquivo pelo MIME type
export function getFileCategory(mimeType: string): string {
  for (const [category, types] of Object.entries(UPLOAD_CONFIG.fileTypes)) {
    if (types.some(t => mimeType.startsWith(t.split('/')[0]) || mimeType === t)) {
      return category;
    }
  }
  return 'other';
}

// Formatar tamanho do arquivo
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ═══════════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL DE UPLOAD
// ═══════════════════════════════════════════════════════════════

export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const {
    file,
    bucket = UPLOAD_CONFIG.defaultBucket,
    folder = '',
    categoria = 'geral',
    iaLer = false,
    onProgress,
    relacionamentos = {},
    descricao,
    tags
  } = options;

  // Validar tamanho
  if (file.size > UPLOAD_CONFIG.maxFileSize) {
    throw new Error(`Arquivo muito grande. Máximo permitido: ${formatFileSize(UPLOAD_CONFIG.maxFileSize)}`);
  }

  // Obter usuário atual
  const { data: { user } } = await supabase.auth.getUser();

  // Preparar dados de data
  const now = new Date();
  const ano = now.getFullYear();
  const mes = now.getMonth() + 1;
  const dia = now.getDate();
  const semana = getWeekNumber(now);

  // Gerar nome único e path
  const uniqueFileName = generateUniqueFileName(file.name);
  const basePath = folder 
    ? `${folder}/${ano}/${String(mes).padStart(2, '0')}/${String(dia).padStart(2, '0')}`
    : `${ano}/${String(mes).padStart(2, '0')}/${String(dia).padStart(2, '0')}`;
  const filePath = `${basePath}/${uniqueFileName}`.replace(/\/+/g, '/');

  try {
    // Reportar progresso inicial
    onProgress?.(5);

    // Upload para o Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      throw new Error(`Erro no upload: ${uploadError.message}`);
    }

    onProgress?.(70);

    // LEI VII: Gerar signed URL para acesso seguro
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 3600); // 1 hora para acesso temporário
    
    if (signedUrlError) {
      console.warn('Erro ao gerar signed URL, usando path:', signedUrlError);
    }
    
    // Armazenar o path (não a URL assinada) para regerar quando necessário
    const storedPath = filePath;

    onProgress?.(80);

    // Salvar metadados no banco de dados
    const { data: arquivoDb, error: dbError } = await supabase
      .from('arquivos_universal')
      .insert({
        nome: file.name,
        nome_storage: uniqueFileName,
        url: storedPath, // Guardar path, não URL pública
        path: filePath,
        tipo: file.type || 'application/octet-stream',
        extensao: getFileExtension(file.name),
        tamanho: file.size,
        bucket,
        categoria,
        pasta: folder || null,
        ano,
        mes,
        semana,
        dia,
        data_upload: now.toISOString(),
        ativo: true,
        ia_ler: iaLer,
        descricao: descricao || null,
        tags: tags || null,
        usuario_id: user?.id || null,
        aluno_id: relacionamentos.alunoId || null,
        funcionario_id: relacionamentos.funcionarioId || null,
        afiliado_id: relacionamentos.afiliadoId || null,
        empresa_id: relacionamentos.empresaId || null,
        curso_id: relacionamentos.cursoId || null,
        aula_id: relacionamentos.aulaId || null
      })
      .select()
      .single();

    if (dbError) {
      console.error('Erro ao salvar metadados:', dbError);
      // Tentar deletar o arquivo do storage se falhou no banco
      await supabase.storage.from(bucket).remove([filePath]);
      throw new Error(`Erro ao salvar metadados: ${dbError.message}`);
    }

    onProgress?.(100);

    return {
      id: arquivoDb.id,
      nome: file.name,
      url: signedUrlData?.signedUrl || storedPath, // Retornar signed URL para uso imediato
      path: filePath,
      tipo: file.type,
      tamanho: file.size,
      dataUpload: now,
      iaLer
    };

  } catch (error: any) {
    console.error('Erro no processo de upload:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// FUNÇÃO PARA DELETAR ARQUIVO
// ═══════════════════════════════════════════════════════════════

export async function deleteFile(arquivoId: string): Promise<void> {
  // Buscar arquivo no banco
  const { data: arquivo, error: fetchError } = await supabase
    .from('arquivos_universal')
    .select('*')
    .eq('id', arquivoId)
    .single();

  if (fetchError || !arquivo) {
    throw new Error('Arquivo não encontrado');
  }

  // Deletar do storage
  const { error: storageError } = await supabase.storage
    .from(arquivo.bucket)
    .remove([arquivo.path]);

  if (storageError) {
    console.error('Erro ao deletar do storage:', storageError);
  }

  // Deletar do banco (ou soft delete)
  const { error: dbError } = await supabase
    .from('arquivos_universal')
    .delete()
    .eq('id', arquivoId);

  if (dbError) {
    throw new Error(`Erro ao deletar: ${dbError.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// FUNÇÃO PARA BUSCAR ARQUIVOS
// ═══════════════════════════════════════════════════════════════

export async function buscarArquivos(options: BuscarArquivosOptions = {}) {
  let query = supabase
    .from('arquivos_universal')
    .select('*', { count: 'exact' })
    .eq('ativo', true);

  if (options.categoria && options.categoria !== 'todas') {
    query = query.eq('categoria', options.categoria);
  }

  if (options.pasta) {
    // Usar ilike para buscar pastas que começam com o prefixo especificado
    query = query.ilike('pasta', `${options.pasta}%`);
  } else if (options.empresaId) {
    // Se não tem pasta, buscar por empresa_id
    query = query.eq('empresa_id', options.empresaId);
  }

  if (options.tipo && options.tipo !== 'todos') {
    query = query.ilike('tipo', `${options.tipo}%`);
  }

  if (options.ano) {
    query = query.eq('ano', options.ano);
  }

  if (options.mes) {
    query = query.eq('mes', options.mes);
  }

  if (options.dia) {
    query = query.eq('dia', options.dia);
  }

  if (options.iaLer !== undefined) {
    query = query.eq('ia_ler', options.iaLer);
  }

  if (options.busca) {
    query = query.or(`nome.ilike.%${options.busca}%,descricao.ilike.%${options.busca}%`);
  }

  // Ordenação
  const ordenarPor = options.ordenarPor || 'created_at';
  const ordem = options.ordem || 'desc';
  query = query.order(ordenarPor, { ascending: ordem === 'asc' });

  // Paginação
  if (options.limite) {
    query = query.limit(options.limite);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limite || 50) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao buscar arquivos: ${formatError(error)}`);
  }

  return { arquivos: data || [], total: count || 0 };
}

// ═══════════════════════════════════════════════════════════════
// FUNÇÃO PARA MARCAR ARQUIVO PARA IA LER
// ═══════════════════════════════════════════════════════════════

export async function toggleIaLer(arquivoId: string, iaLer: boolean): Promise<void> {
  const { error } = await supabase
    .from('arquivos_universal')
    .update({ ia_ler: iaLer })
    .eq('id', arquivoId);

  if (error) {
    throw new Error(`Erro ao atualizar: ${formatError(error)}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// FUNÇÃO PARA PROCESSAR ARQUIVO COM IA
// ═══════════════════════════════════════════════════════════════

export async function processarArquivoComIA(arquivoId: string): Promise<any> {
  const { data: arquivo, error: fetchError } = await supabase
    .from('arquivos_universal')
    .select('*')
    .eq('id', arquivoId)
    .single();

  if (fetchError || !arquivo) {
    throw new Error('Arquivo não encontrado');
  }

  try {
    // Chamar Edge Function para processar documento
    const { data, error } = await supabase.functions.invoke('extract-document', {
      body: { 
        fileUrl: arquivo.url,
        fileName: arquivo.nome,
        fileType: arquivo.tipo
      }
    });

    if (error) {
      throw error;
    }

    // Atualizar arquivo com resultado da IA
    await supabase
      .from('arquivos_universal')
      .update({ 
        ia_processado: true,
        ia_resultado: data
      })
      .eq('id', arquivoId);

    return data;
  } catch (error: unknown) {
    console.error('Erro ao processar com IA:', error);
    throw new Error(`Erro ao processar: ${formatError(error)}`);
  }
}
