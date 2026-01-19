// ============================================
// 📦 BULK ORGANIZATION IMPORT DIALOG
// Import CSV/JSON with full hierarchy: Course → Module → Lesson
// Creates courses/modules automatically, preserves exact ordering
// ============================================

import { useState, useCallback, useRef, forwardRef } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Upload, FileJson, FileSpreadsheet, AlertCircle, 
  CheckCircle2, XCircle, Loader2, FolderTree, Download,
  Layers, BookOpen, Video
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatError } from "@/lib/utils/formatError";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ImportRecord {
  legacy_qr_id: number;
  title: string;
  provider: string;
  youtube_id?: string;
  panda_id?: string;
  youtube_url?: string;
  thumbnail_url?: string;
  description?: string;
  course_name: string;
  module_name: string;
  module_order: number;
  lesson_order: number;
}

interface ImportResult {
  success: boolean;
  legacy_qr_id: number;
  title: string;
  course_name?: string;
  module_name?: string;
  error?: string;
}

interface HierarchyStats {
  courses: Map<string, { count: number; modules: Set<string> }>;
  totalModules: number;
  totalLessons: number;
}

interface BulkOrganizationImportDialogProps {
  open: boolean;
  onClose: () => void;
}

export const BulkOrganizationImportDialog = forwardRef<HTMLDivElement, BulkOrganizationImportDialogProps>(
  function BulkOrganizationImportDialog({ open, onClose }, _ref) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ImportRecord[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState<string>('');
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [hierarchyStats, setHierarchyStats] = useState<HierarchyStats | null>(null);

  // Cache for created/found courses and modules
  const [courseCache] = useState(new Map<string, string>());
  const [moduleCache] = useState(new Map<string, string>());

  // AbortController for cancellation - CRITICAL for stopping imports
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);

  const analyzeHierarchy = (records: ImportRecord[]): HierarchyStats => {
    const courses = new Map<string, { count: number; modules: Set<string> }>();
    
    for (const record of records) {
      const courseName = record.course_name;
      const moduleName = record.module_name;
      
      if (!courses.has(courseName)) {
        courses.set(courseName, { count: 0, modules: new Set() });
      }
      
      const courseData = courses.get(courseName)!;
      courseData.count++;
      courseData.modules.add(moduleName);
    }

    let totalModules = 0;
    courses.forEach(data => {
      totalModules += data.modules.size;
    });

    return {
      courses,
      totalModules,
      totalLessons: records.length
    };
  };

  const parseCSV = (text: string): ImportRecord[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error("CSV deve ter cabeçalho e pelo menos uma linha de dados");

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const records: ImportRecord[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Handle CSV with quoted fields
      const values = parseCSVLine(lines[i]);
      const record: any = {};

      headers.forEach((header, idx) => {
        record[header] = values[idx]?.trim() || '';
      });

      // Validate required fields
      const legacyQrId = parseInt(record.legacy_qr_id || record.v || record.qr_id);
      if (isNaN(legacyQrId)) {
        errors.push(`Linha ${i + 1}: legacy_qr_id inválido ou ausente`);
        continue;
      }

      if (!record.title) {
        errors.push(`Linha ${i + 1}: título ausente`);
        continue;
      }

      if (!record.course_name) {
        errors.push(`Linha ${i + 1}: course_name ausente`);
        continue;
      }

      if (!record.module_name) {
        errors.push(`Linha ${i + 1}: module_name ausente`);
        continue;
      }

      const provider = (record.provider || 'youtube').toLowerCase();
      const youtubeId = record.youtube_id || record.youtube_video_id || '';
      const pandaId = record.panda_id || record.panda_video_id || '';

      if (provider === 'youtube' && !youtubeId) {
        errors.push(`Linha ${i + 1}: youtube_id ausente para provider youtube`);
        continue;
      }

      if (provider === 'panda' && !pandaId) {
        errors.push(`Linha ${i + 1}: panda_id ausente para provider panda`);
        continue;
      }

      records.push({
        legacy_qr_id: legacyQrId,
        title: record.title,
        provider,
        youtube_id: youtubeId,
        panda_id: pandaId,
        youtube_url: record.youtube_url || '',
        thumbnail_url: record.thumbnail_url || '',
        description: record.description || '',
        course_name: record.course_name.trim(),
        module_name: record.module_name.trim(),
        module_order: parseInt(record.module_order) || 1,
        lesson_order: parseInt(record.lesson_order) || 1
      });
    }

    setParseErrors(errors);
    return records;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.replace(/^["']|["']$/g, ''));
    return result;
  };

  const parseJSON = (text: string): ImportRecord[] => {
    const data = JSON.parse(text);
    const records: ImportRecord[] = [];
    const errors: string[] = [];

    const items = Array.isArray(data) ? data : data.records || data.items || data.videos || [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      const legacyQrId = parseInt(item.legacy_qr_id || item.v || item.qr_id);
      if (isNaN(legacyQrId)) {
        errors.push(`Item ${i + 1}: legacy_qr_id inválido ou ausente`);
        continue;
      }

      if (!item.title) {
        errors.push(`Item ${i + 1}: título ausente`);
        continue;
      }

      if (!item.course_name) {
        errors.push(`Item ${i + 1}: course_name ausente`);
        continue;
      }

      if (!item.module_name) {
        errors.push(`Item ${i + 1}: module_name ausente`);
        continue;
      }

      const provider = (item.provider || 'youtube').toLowerCase();
      
      records.push({
        legacy_qr_id: legacyQrId,
        title: item.title,
        provider,
        youtube_id: item.youtube_id || item.youtube_video_id || '',
        panda_id: item.panda_id || item.panda_video_id || '',
        youtube_url: item.youtube_url || '',
        thumbnail_url: item.thumbnail_url || '',
        description: item.description || '',
        course_name: (item.course_name || '').trim(),
        module_name: (item.module_name || '').trim(),
        module_order: parseInt(item.module_order) || 1,
        lesson_order: parseInt(item.lesson_order) || 1
      });
    }

    setParseErrors(errors);
    return records;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        let records: ImportRecord[];

        if (uploadedFile.name.endsWith('.json')) {
          records = parseJSON(text);
        } else {
          records = parseCSV(text);
        }

        setParsedData(records);
        setHierarchyStats(analyzeHierarchy(records));
        setStep('preview');
      } catch (error: any) {
        toast.error(`Erro ao processar arquivo: ${formatError(error)}`);
        setParseErrors([formatError(error)]);
      }
    };
    reader.readAsText(uploadedFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json']
    },
    maxFiles: 1
  });

  // Get or create course by name
  const getOrCreateCourse = async (courseName: string): Promise<string> => {
    // Check cache first
    if (courseCache.has(courseName)) {
      return courseCache.get(courseName)!;
    }

    // Try to find existing course
    const { data: existing } = await supabase
      .from('courses')
      .select('id')
      .eq('title', courseName)
      .maybeSingle();

    if (existing) {
      courseCache.set(courseName, existing.id);
      return existing.id;
    }

    // Create new course
    const { data: created, error } = await supabase
      .from('courses')
      .insert({
        title: courseName,
        status: 'active',
        is_published: true
      })
      .select('id')
      .single();

    if (error) throw new Error(`Erro ao criar curso "${courseName}": ${error.message}`);

    courseCache.set(courseName, created.id);
    console.log(`[BULK-IMPORT] ✅ Curso criado: "${courseName}" (${created.id})`);
    return created.id;
  };

  // Get or create module by name and course
  // CRITICAL: Uses 'modules' table (FK of lessons.module_id), NOT 'areas' table
  const getOrCreateModule = async (
    moduleName: string, 
    courseId: string, 
    moduleOrder: number
  ): Promise<string> => {
    const cacheKey = `${courseId}::${moduleName}`;
    
    // Check cache first
    if (moduleCache.has(cacheKey)) {
      return moduleCache.get(cacheKey)!;
    }

    // Try to find existing module in 'modules' table (has 'title', not 'name')
    const { data: existing } = await supabase
      .from('modules')
      .select('id')
      .eq('title', moduleName)
      .eq('course_id', courseId)
      .maybeSingle();

    if (existing) {
      moduleCache.set(cacheKey, existing.id);
      return existing.id;
    }

    // Create new module in 'modules' table
    const { data: created, error } = await supabase
      .from('modules')
      .insert({
        title: moduleName,
        course_id: courseId,
        position: moduleOrder,
        is_published: true,
        status: 'active'
      })
      .select('id')
      .single();

    if (error) throw new Error(`Erro ao criar módulo "${moduleName}": ${error.message}`);

    moduleCache.set(cacheKey, created.id);
    console.log(`[BULK-IMPORT] ✅ Módulo criado: "${moduleName}" (${created.id})`);
    return created.id;
  };

  const importRecords = async () => {
    if (parsedData.length === 0) return;

    // Create new AbortController for this import session
    abortControllerRef.current = new AbortController();
    setIsCancelled(false);
    setIsImporting(true);
    setStep('importing');
    setImportResults([]);
    setImportProgress(0);
    courseCache.clear();
    moduleCache.clear();

    const results: ImportResult[] = [];

    // Group by course for progress tracking
    const courseGroups = new Map<string, ImportRecord[]>();
    for (const record of parsedData) {
      if (!courseGroups.has(record.course_name)) {
        courseGroups.set(record.course_name, []);
      }
      courseGroups.get(record.course_name)!.push(record);
    }

    console.log(`[BULK-IMPORT] 🚀 Iniciando importação: ${parsedData.length} aulas em ${courseGroups.size} cursos`);

    for (let i = 0; i < parsedData.length; i++) {
      // CHECK ABORT SIGNAL - CRITICAL: Stop immediately if cancelled
      if (abortControllerRef.current?.signal.aborted) {
        console.log(`[BULK-IMPORT] 🛑 IMPORTAÇÃO CANCELADA pelo usuário após ${i} registros`);
        toast.warning(`Importação cancelada após ${i} registros processados`);
        break;
      }

      const record = parsedData[i];

      try {
        setCurrentOperation(`Processando: ${record.title.substring(0, 50)}...`);

        // 1. Get or create course
        const courseId = await getOrCreateCourse(record.course_name);

        // 2. Get or create module
        const moduleId = await getOrCreateModule(
          record.module_name, 
          courseId, 
          record.module_order
        );

        // 3. Check if legacy_qr_id already exists
        const { data: existing } = await supabase
          .from('lessons')
          .select('id, legacy_qr_id')
          .eq('legacy_qr_id', record.legacy_qr_id)
          .maybeSingle();

        if (existing) {
          // Update existing lesson with correct module and order
          const { error: updateError } = await supabase
            .from('lessons')
            .update({
              module_id: moduleId,
              position: record.lesson_order,
              title: record.title,
              description: record.description || null,
              video_provider: record.provider,
              youtube_video_id: record.youtube_id || null,
              panda_video_id: record.panda_id || null,
              video_url: record.youtube_url || null,
              thumbnail_url: record.thumbnail_url || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);

          if (updateError) throw updateError;

          results.push({
            success: true,
            legacy_qr_id: record.legacy_qr_id,
            title: record.title,
            course_name: record.course_name,
            module_name: record.module_name
          });
        } else {
          // Insert new lesson
          const { error: insertError } = await supabase
            .from('lessons')
            .insert({
              legacy_qr_id: record.legacy_qr_id,
              title: record.title,
              description: record.description || null,
              video_provider: record.provider,
              youtube_video_id: record.youtube_id || null,
              panda_video_id: record.panda_id || null,
              video_url: record.youtube_url || null,
              thumbnail_url: record.thumbnail_url || null,
              module_id: moduleId,
              is_published: true,
              is_free: false,
              position: record.lesson_order
            });

          if (insertError) throw insertError;

          results.push({
            success: true,
            legacy_qr_id: record.legacy_qr_id,
            title: record.title,
            course_name: record.course_name,
            module_name: record.module_name
          });
        }
      } catch (error: any) {
        console.error(`[BULK-IMPORT] ❌ Erro em ${record.legacy_qr_id}:`, error);
        results.push({
          success: false,
          legacy_qr_id: record.legacy_qr_id,
          title: record.title,
          course_name: record.course_name,
          module_name: record.module_name,
          error: error.message
        });
      }

      setImportProgress(Math.round(((i + 1) / parsedData.length) * 100));
      setImportResults([...results]);
    }

    setIsImporting(false);
    setStep('complete');
    setCurrentOperation('');

    // Invalidate caches
    queryClient.invalidateQueries({ queryKey: ['lessons'] });
    queryClient.invalidateQueries({ queryKey: ['areas'] });
    queryClient.invalidateQueries({ queryKey: ['courses'] });
    queryClient.invalidateQueries({ queryKey: ['videoaulas'] });

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`[BULK-IMPORT] ✅ Concluído: ${successCount} sucesso, ${failCount} falhas`);

    if (failCount === 0) {
      toast.success(`Importação concluída: ${successCount} aulas organizadas com sucesso!`);
    } else {
      toast.warning(`Importação concluída: ${successCount} sucesso, ${failCount} falhas`);
    }
  };

  // CANCEL IMPORT - FORCE STOP ALL OPERATIONS
  const cancelImport = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsCancelled(true);
      console.log('[BULK-IMPORT] 🛑 Sinal de ABORT enviado - parando todas as operações');
      toast.error('Cancelando importação... aguarde.');
    }
  }, []);

  const resetDialog = () => {
    // Abort any ongoing import
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = null;
    setIsCancelled(false);
    setFile(null);
    setParsedData([]);
    setParseErrors([]);
    setImportResults([]);
    setImportProgress(0);
    setCurrentOperation('');
    setStep('upload');
    setHierarchyStats(null);
    courseCache.clear();
    moduleCache.clear();
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  const successCount = importResults.filter(r => r.success).length;
  const failCount = importResults.filter(r => !r.success).length;

  const downloadTemplate = () => {
    const template = `legacy_qr_id,title,provider,youtube_id,panda_id,course_name,module_name,module_order,lesson_order
15019,"Aula 01 - Introdução",youtube,9Zr70n-KH6Y,,QUÍMICA GERAL,Propriedades da Matéria,1,1
15020,"Aula 02 - Conceitos Básicos",youtube,ABC123xyz,,QUÍMICA GERAL,Propriedades da Matéria,1,2
15021,"Aula 01 - Funções",youtube,DEF456uvw,,QUÍMICA ORGÂNICA,Funções Orgânicas,1,1`;
    
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_bulk_organization.csv';
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-primary" />
            Importar com Organização Completa
          </DialogTitle>
          <DialogDescription>
            Importe aulas com hierarquia completa: Curso → Módulo → Aula. 
            Cursos e módulos são criados automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                  transition-colors duration-200
                  ${isDragActive 
                    ? 'border-primary bg-primary/10' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                  }
                `}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">
                  {isDragActive ? 'Solte o arquivo aqui' : 'Arraste ou clique para selecionar'}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Aceita CSV ou JSON com hierarquia completa
                </p>
                <div className="flex justify-center gap-4 mt-4">
                  <Badge variant="outline" className="gap-1">
                    <FileSpreadsheet className="h-3 w-3" /> CSV
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <FileJson className="h-3 w-3" /> JSON
                  </Badge>
                </div>
              </div>

              <Button variant="outline" onClick={downloadTemplate} className="w-full gap-2">
                <Download className="h-4 w-4" />
                Baixar Template CSV
              </Button>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Colunas obrigatórias</AlertTitle>
                <AlertDescription className="text-xs">
                  <code>legacy_qr_id, title, provider, youtube_id/panda_id, course_name, module_name, module_order, lesson_order</code>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {step === 'preview' && hierarchyStats && (
            <div className="space-y-4">
              {/* Hierarchy Stats Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      Cursos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{hierarchyStats.courses.size}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Layers className="h-4 w-4 text-purple-500" />
                      Módulos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{hierarchyStats.totalModules}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Video className="h-4 w-4 text-green-500" />
                      Aulas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{hierarchyStats.totalLessons}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Course breakdown */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Estrutura por Curso</h4>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {Array.from(hierarchyStats.courses.entries()).map(([courseName, data]) => (
                      <div key={courseName} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="font-medium truncate flex-1">{courseName}</span>
                        <div className="flex gap-2">
                          <Badge variant="secondary">{data.modules.size} módulos</Badge>
                          <Badge variant="outline">{data.count} aulas</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {parseErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{parseErrors.length} avisos no arquivo</AlertTitle>
                  <AlertDescription>
                    <ScrollArea className="h-[100px] mt-2">
                      {parseErrors.map((err, i) => (
                        <div key={i} className="text-xs">{err}</div>
                      ))}
                    </ScrollArea>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {step === 'importing' && (
            <div className="space-y-4 py-8">
              <div className="flex items-center justify-center gap-3">
                {isCancelled ? (
                  <>
                    <XCircle className="h-8 w-8 text-destructive" />
                    <span className="text-lg font-medium text-destructive">Cancelando...</span>
                  </>
                ) : (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-lg font-medium">Importando...</span>
                  </>
                )}
              </div>
              <Progress value={importProgress} className="h-3" />
              <p className="text-center text-muted-foreground">
                {importProgress}% - {currentOperation}
              </p>
              <div className="text-center text-sm text-muted-foreground">
                {successCount} sucesso / {failCount} falhas
              </div>
              
              {/* CANCEL BUTTON - CRITICAL */}
              <div className="flex justify-center">
                <Button 
                  variant="destructive" 
                  onClick={cancelImport}
                  disabled={isCancelled}
                  className="gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  {isCancelled ? 'Parando...' : 'PARAR IMPORTAÇÃO'}
                </Button>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
                <h3 className="text-xl font-semibold">Importação concluída!</h3>
                <div className="flex justify-center gap-4 mt-4">
                  <Badge variant="default" className="text-lg px-4 py-2">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {successCount} sucesso
                  </Badge>
                  {failCount > 0 && (
                    <Badge variant="destructive" className="text-lg px-4 py-2">
                      <XCircle className="h-4 w-4 mr-2" />
                      {failCount} falhas
                    </Badge>
                  )}
                </div>
              </div>

              {failCount > 0 && (
                <ScrollArea className="h-[300px] border rounded-lg p-2">
                  <div className="space-y-1">
                    {importResults.filter(r => !r.success).map((result, i) => (
                      <div 
                        key={i} 
                        className="flex items-start gap-2 p-2 rounded bg-destructive/10 text-sm"
                      >
                        <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium">#{result.legacy_qr_id}</span>
                          <span className="text-muted-foreground ml-2">{result.title}</span>
                          <div className="text-xs text-destructive">{result.error}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={resetDialog}>
                Escolher outro arquivo
              </Button>
              <Button 
                onClick={importRecords} 
                disabled={parsedData.length === 0}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Importar {parsedData.length} aulas
              </Button>
            </>
          )}

          {step === 'complete' && (
            <>
              <Button variant="outline" onClick={resetDialog}>
                Nova Importação
              </Button>
              <Button onClick={handleClose}>
                Concluir
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

BulkOrganizationImportDialog.displayName = "BulkOrganizationImportDialog";
