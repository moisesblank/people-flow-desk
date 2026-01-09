// ============================================
// MOISÉS MEDEIROS v9.0 - MATERIALS TAB
// Exibição de materiais complementares (PDF)
// ============================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  File,
  Loader2,
  FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MaterialsTabProps {
  lessonId: string;
}

export function MaterialsTab({ lessonId }: MaterialsTabProps) {
  // Fetch lesson material info
  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson-materials', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('id, title, material_url, material_nome')
        .eq('id', lessonId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!lessonId
  });

  // Get public URL for PDF
  const getPdfUrl = (path: string) => {
    const { data: { publicUrl } } = supabase.storage
      .from('materiais')
      .getPublicUrl(path);
    return publicUrl;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando materiais...</p>
        </div>
      </div>
    );
  }

  const hasMaterial = lesson?.material_url;

  if (!hasMaterial) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="p-4 rounded-full bg-muted/50 mb-4">
          <FolderOpen className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Nenhum material disponível
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Esta aula ainda não possui material complementar anexado.
        </p>
      </div>
    );
  }

  const pdfUrl = getPdfUrl(lesson.material_url);
  const fileName = lesson.material_nome || 'material.pdf';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-red-400" />
        <h3 className="text-lg font-semibold">Material Complementar</h3>
      </div>

      <Card className={cn(
        "border-2 border-red-500/30 bg-gradient-to-r from-red-500/10 via-card to-orange-500/10",
        "hover:border-red-500/50 transition-all duration-300",
        "shadow-lg hover:shadow-red-500/10"
      )}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {/* PDF Icon */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30">
              <File className="h-10 w-10 text-red-400" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-lg truncate">{fileName}</h4>
              <p className="text-sm text-muted-foreground">
                Documento PDF • Material de apoio
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-400"
                onClick={() => window.open(pdfUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">Visualizar</span>
              </Button>
              
              <Button
                size="sm"
                className="gap-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                onClick={() => {
                  // Create download link
                  const link = document.createElement('a');
                  link.href = pdfUrl;
                  link.download = fileName;
                  link.target = '_blank';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Baixar</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional info */}
      <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Dica:</strong> Baixe o material complementar para estudar offline ou imprimir. 
          O PDF contém conteúdo adicional relacionado a esta videoaula.
        </p>
      </div>
    </div>
  );
}

export default MaterialsTab;
