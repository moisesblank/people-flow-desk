// ============================================
// COMPONENTE UNIVERSAL DE ANEXOS
// Upload, visualização, download, extração AI
// ============================================

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Paperclip,
  Upload,
  File,
  FileText,
  Image,
  FileSpreadsheet,
  Presentation,
  Trash2,
  Download,
  Eye,
  Loader2,
  Check,
  X,
  Brain,
  Sparkles,
  FolderOpen,
  MoreVertical,
  Edit2,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useUniversalAttachments, EntityType, Attachment } from '@/hooks/useUniversalAttachments';
import { cn } from '@/lib/utils';

export interface UniversalAttachmentsProps {
  entityType: EntityType;
  entityId: string;
  title?: string;
  maxFiles?: number;
  showAIExtraction?: boolean;
  compact?: boolean;
  className?: string;
  onAttachmentChange?: (count: number) => void;
  onUpdate?: () => void;
}

// Ícones por tipo de arquivo
const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return Image;
  if (type.includes('pdf')) return FileText;
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return FileSpreadsheet;
  if (type.includes('presentation') || type.includes('powerpoint')) return Presentation;
  return File;
};

// Cor por tipo de arquivo
const getFileColor = (type: string) => {
  if (type.startsWith('image/')) return 'text-green-500';
  if (type.includes('pdf')) return 'text-red-500';
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return 'text-emerald-500';
  if (type.includes('presentation') || type.includes('powerpoint')) return 'text-orange-500';
  if (type.includes('word') || type.includes('document')) return 'text-blue-500';
  return 'text-muted-foreground';
};

// Formatar tamanho
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export function UniversalAttachments({
  entityType,
  entityId,
  title = 'Anexos',
  maxFiles = 50,
  showAIExtraction = true,
  compact = false,
  className,
  onAttachmentChange,
  onUpdate
}: UniversalAttachmentsProps) {
  const {
    attachments,
    isLoading,
    isUploading,
    uploadProgress,
    fetchAttachments,
    uploadFile,
    uploadMultiple,
    deleteAttachment,
    updateAttachment,
    triggerAIExtraction,
    getDownloadUrl
  } = useUniversalAttachments(entityType, entityId);

  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', category: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar anexos ao montar
  useEffect(() => {
    if (entityId) {
      fetchAttachments();
    }
  }, [entityId, fetchAttachments]);

  // Notificar mudanças
  useEffect(() => {
    onAttachmentChange?.(attachments.length);
  }, [attachments.length, onAttachmentChange]);

  // Handlers
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    if (attachments.length + files.length > maxFiles) {
      toast.error(`Máximo de ${maxFiles} anexos permitido`);
      return;
    }

    await uploadMultiple(files, { triggerAIExtraction: showAIExtraction });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleView = async (attachment: Attachment) => {
    setSelectedAttachment(attachment);
    setViewDialogOpen(true);
  };

  const handleDownload = async (attachment: Attachment) => {
    const url = await getDownloadUrl(attachment);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleEdit = (attachment: Attachment) => {
    setSelectedAttachment(attachment);
    setEditForm({
      title: attachment.title || attachment.file_name,
      description: attachment.description || '',
      category: attachment.category || 'general'
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedAttachment) return;
    await updateAttachment(selectedAttachment.id, editForm);
    setEditDialogOpen(false);
  };

  const handleDelete = async (attachment: Attachment) => {
    if (confirm('Remover este anexo?')) {
      await deleteAttachment(attachment.id);
    }
  };

  // Render compacto (apenas botão e contador)
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="gap-2"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Paperclip className="h-4 w-4" />
          )}
          Anexar
          {attachments.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {attachments.length}
            </Badge>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">{title}</h3>
          {attachments.length > 0 && (
            <Badge variant="secondary">{attachments.length}</Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || attachments.length >= maxFiles}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Anexar
        </Button>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
          isDragOver 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary/50 hover:bg-muted/30",
          isUploading && "pointer-events-none opacity-50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          accept="*/*"
        />

        {isUploading ? (
          <div className="space-y-3">
            <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Enviando arquivos...</p>
            <Progress value={uploadProgress} className="w-48 mx-auto" />
          </div>
        ) : (
          <>
            <FolderOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">
              Arraste arquivos ou clique para selecionar
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Aceita <span className="text-primary font-medium">QUALQUER</span> tipo de arquivo • Máximo <span className="text-primary font-medium">2GB</span>
            </p>
          </>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Lista de anexos */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {attachments.map((attachment, index) => {
              const FileIcon = getFileIcon(attachment.file_type);
              const fileColor = getFileColor(attachment.file_type);

              return (
                <motion.div
                  key={attachment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors group"
                >
                  {/* Ícone ou Thumbnail para imagens */}
                  <div className={cn(
                    "w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 bg-background",
                    fileColor
                  )}>
                    {attachment.file_type.startsWith('image/') ? (
                      <img 
                        src={attachment.file_url} 
                        alt={attachment.file_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <FileIcon className={cn("h-5 w-5", attachment.file_type.startsWith('image/') ? 'hidden' : '')} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {attachment.title || attachment.file_name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(attachment.file_size)}</span>
                      {attachment.category && attachment.category !== 'general' && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs py-0">
                            {attachment.category}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>

                  {/* AI Status */}
                  {showAIExtraction && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={cn(
                          "p-1.5 rounded-full",
                          attachment.extraction_status === 'completed' && "bg-green-500/20 text-green-500",
                          attachment.extraction_status === 'processing' && "bg-yellow-500/20 text-yellow-500",
                          attachment.extraction_status === 'failed' && "bg-red-500/20 text-red-500",
                          attachment.extraction_status === 'pending' && "bg-muted text-muted-foreground"
                        )}>
                          {attachment.extraction_status === 'processing' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : attachment.extraction_status === 'completed' ? (
                            <Sparkles className="h-4 w-4" />
                          ) : attachment.extraction_status === 'failed' ? (
                            <X className="h-4 w-4" />
                          ) : (
                            <Brain className="h-4 w-4" />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {attachment.extraction_status === 'completed' && 'Conteúdo extraído pela IA'}
                        {attachment.extraction_status === 'processing' && 'Extraindo conteúdo...'}
                        {attachment.extraction_status === 'failed' && 'Falha na extração'}
                        {attachment.extraction_status === 'pending' && 'Clique para extrair com IA'}
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Ações */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleView(attachment)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Visualizar</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDownload(attachment)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Baixar</TooltipContent>
                    </Tooltip>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(attachment)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        {showAIExtraction && attachment.extraction_status !== 'processing' && (
                          <DropdownMenuItem onClick={() => triggerAIExtraction(attachment.id)}>
                            <Brain className="h-4 w-4 mr-2" />
                            Extrair com IA
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDelete(attachment)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!isLoading && attachments.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          Nenhum anexo
        </p>
      )}

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAttachment && (
                <>
                  {(() => {
                    const Icon = getFileIcon(selectedAttachment.file_type);
                    return <Icon className={cn("h-5 w-5", getFileColor(selectedAttachment.file_type))} />;
                  })()}
                  {selectedAttachment.title || selectedAttachment.file_name}
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedAttachment && (
            <div className="space-y-4">
              {/* Preview de imagem */}
              {selectedAttachment.file_type.startsWith('image/') && (
                <div className="rounded-lg overflow-hidden border border-border">
                  <img 
                    src={selectedAttachment.file_url} 
                    alt={selectedAttachment.file_name}
                    className="w-full max-h-[500px] object-contain"
                  />
                </div>
              )}

              {/* Preview de PDF */}
              {selectedAttachment.file_type.includes('pdf') && (
                <iframe
                  src={selectedAttachment.file_url}
                  className="w-full h-[500px] rounded-lg border border-border"
                  title={selectedAttachment.file_name}
                />
              )}

              {/* Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Tamanho:</span>
                  <span className="ml-2 font-medium">{formatFileSize(selectedAttachment.file_size)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="ml-2 font-medium">{selectedAttachment.file_type}</span>
                </div>
              </div>

              {/* Conteúdo extraído */}
              {selectedAttachment.extraction_status === 'completed' && selectedAttachment.extracted_content && (
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2 text-primary">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-medium text-sm">Conteúdo Extraído pela IA</span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {selectedAttachment.extracted_content}
                  </p>
                </div>
              )}

              {/* Ações */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Fechar
                </Button>
                <Button onClick={() => handleDownload(selectedAttachment)}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Anexo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Título do arquivo"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição opcional"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Botão compacto para usar em forms/cards
export function AttachmentButton({
  entityType,
  entityId,
  onCountChange
}: {
  entityType: EntityType;
  entityId: string;
  onCountChange?: (count: number) => void;
}) {
  return (
    <UniversalAttachments
      entityType={entityType}
      entityId={entityId}
      compact
      onAttachmentChange={onCountChange}
    />
  );
}
