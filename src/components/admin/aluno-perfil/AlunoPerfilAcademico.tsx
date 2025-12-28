// ============================================
// SEÇÃO: JORNADA ACADÊMICA COMPLETA
// ============================================

import { BookOpen, Play, Clock, Award, Target, CheckCircle } from "lucide-react";
import { FuturisticCard } from "@/components/ui/futuristic-card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AlunoAcademicoProps {
  userId: string | null;
  alunoId: string;
}

export function AlunoPerfilAcademico({ userId, alunoId }: AlunoAcademicoProps) {
  // Buscar matrículas em cursos
  const { data: enrollments } = useQuery({
    queryKey: ['aluno-enrollments', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('enrollments')
        .select('*, courses(title, description, thumbnail_url)')
        .eq('user_id', userId)
        .order('enrolled_at', { ascending: false });
      return data || [];
    },
    enabled: !!userId
  });

  // Buscar progresso nas aulas
  const { data: lessonProgress } = useQuery({
    queryKey: ['aluno-lesson-progress', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('lesson_progress')
        .select('*, lessons(title, duration_minutes, modules(title, courses(title)))')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!userId
  });

  // Buscar certificados
  const { data: certificates } = useQuery({
    queryKey: ['aluno-certificates', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', userId)
        .order('issued_at', { ascending: false });
      return data || [];
    },
    enabled: !!userId
  });

  // Buscar anotações de aulas
  const { data: lessonNotes } = useQuery({
    queryKey: ['aluno-lesson-notes', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('lesson_notes')
        .select('*, lessons(title)')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!userId
  });

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    try {
      return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const formatRelative = (date: string | null | undefined) => {
    if (!date) return '-';
    try {
      return formatDistanceToNow(new Date(date), { locale: ptBR, addSuffix: true });
    } catch {
      return '-';
    }
  };

  // Calcular estatísticas
  const aulasAssistidas = lessonProgress?.filter(lp => lp.completed).length || 0;
  const totalAulas = lessonProgress?.length || 0;
  const tempoTotal = lessonProgress?.reduce((acc, lp) => acc + (lp.watch_time_seconds || 0), 0) || 0;
  const tempoTotalMinutos = Math.round(tempoTotal / 60);
  const tempoTotalHoras = Math.round(tempoTotalMinutos / 60);

  // Última atividade
  const ultimaAtividade = lessonProgress?.[0];

  // Calcular progresso baseado em watch_time vs duration
  const calcProgress = (lp: any) => {
    if (lp.completed) return 100;
    const duration = (lp.lessons as any)?.duration_minutes || 0;
    if (duration <= 0) return 0;
    const watchedMinutes = (lp.watch_time_seconds || 0) / 60;
    return Math.min(100, Math.round((watchedMinutes / duration) * 100));
  };

  return (
    <FuturisticCard className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="h-5 w-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-foreground">Jornada Acadêmica</h3>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-muted-foreground">Cursos Matriculados</span>
          </div>
          <p className="text-2xl font-bold text-purple-400">{enrollments?.length || 0}</p>
        </div>

        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Play className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-muted-foreground">Aulas Assistidas</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{aulasAssistidas}/{totalAulas}</p>
        </div>

        <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-muted-foreground">Tempo de Estudo</span>
          </div>
          <p className="text-2xl font-bold text-cyan-400">{tempoTotalHoras}h</p>
        </div>

        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-yellow-400" />
            <span className="text-xs text-muted-foreground">Certificados</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400">{certificates?.length || 0}</p>
        </div>
      </div>

      {/* Última Atividade */}
      {ultimaAtividade && (
        <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Última Atividade</span>
            <span className="text-xs text-muted-foreground">{formatRelative(ultimaAtividade.updated_at)}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            📺 {(ultimaAtividade.lessons as any)?.title || 'Aula'} 
            {(ultimaAtividade.lessons as any)?.modules?.title && (
              <span className="text-xs"> • {(ultimaAtividade.lessons as any)?.modules?.title}</span>
            )}
          </p>
          <Progress value={calcProgress(ultimaAtividade)} className="mt-2 h-2" />
          <span className="text-xs text-muted-foreground">{calcProgress(ultimaAtividade)}% concluído</span>
        </div>
      )}

      {/* Cursos Matriculados */}
      {enrollments && enrollments.length > 0 && (
        <div className="border-t border-border/50 pt-6">
          <h4 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-400" />
            Cursos Matriculados
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {enrollments.map((e) => (
              <div key={e.id} className="p-4 rounded-lg bg-muted/20 border border-border/30">
                <div className="flex items-start gap-3">
                  {(e.courses as any)?.thumbnail_url && (
                    <img 
                      src={(e.courses as any).thumbnail_url} 
                      alt="" 
                      className="w-16 h-12 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-foreground">{(e.courses as any)?.title || 'Curso'}</h5>
                    <p className="text-xs text-muted-foreground mt-1">
                      Matriculado em {formatDate(e.enrolled_at)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={
                        e.status === 'active' ? 'border-green-500/50 text-green-400' :
                        e.status === 'completed' ? 'border-purple-500/50 text-purple-400' :
                        'border-gray-500/50 text-gray-400'
                      }>
                        {e.status === 'active' ? 'Ativo' : e.status === 'completed' ? 'Concluído' : e.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificados Emitidos */}
      {certificates && certificates.length > 0 && (
        <div className="border-t border-border/50 pt-6 mt-6">
          <h4 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-400" />
            Certificados Emitidos
          </h4>
          <div className="space-y-2">
            {certificates.map((cert) => (
              <div key={cert.id} className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-foreground">{cert.nome_curso || 'Certificado'}</span>
                  <span className="text-xs text-muted-foreground ml-2">{formatDate(cert.issued_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-500/20 text-yellow-400">
                    {cert.carga_horaria}h
                  </Badge>
                  <span className="text-xs font-mono text-muted-foreground">#{cert.certificate_number}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Últimas Aulas Assistidas */}
      {lessonProgress && lessonProgress.length > 0 && (
        <div className="border-t border-border/50 pt-6 mt-6">
          <h4 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Play className="h-4 w-4 text-blue-400" />
            Últimas Aulas Acessadas
          </h4>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {lessonProgress.slice(0, 10).map((lp) => (
              <div key={lp.id} className="p-3 rounded-lg bg-muted/20 border border-border/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {lp.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <Play className="h-4 w-4 text-blue-400" />
                  )}
                  <div>
                    <span className="text-sm text-foreground">{(lp.lessons as any)?.title || 'Aula'}</span>
                    <span className="text-xs text-muted-foreground ml-2">{formatRelative(lp.updated_at)}</span>
                  </div>
                </div>
                <Badge variant="outline" className={lp.completed ? 'border-green-500/50 text-green-400' : ''}>
                  {calcProgress(lp)}%
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anotações */}
      {lessonNotes && lessonNotes.length > 0 && (
        <div className="border-t border-border/50 pt-6 mt-6">
          <h4 className="text-sm font-medium text-foreground mb-4">📝 Anotações Recentes</h4>
          <div className="space-y-2">
            {lessonNotes.slice(0, 5).map((note) => (
              <div key={note.id} className="p-3 rounded-lg bg-muted/20 border border-border/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{(note.lessons as any)?.title}</span>
                  <span className="text-xs text-muted-foreground">{formatRelative(note.updated_at)}</span>
                </div>
                <p className="text-sm text-foreground line-clamp-2">{note.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sem dados */}
      {!userId && (
        <div className="text-center py-8 text-muted-foreground">
          <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Este aluno não possui perfil vinculado ao sistema</p>
          <p className="text-xs mt-1">Os dados acadêmicos estarão disponíveis quando o aluno criar uma conta</p>
        </div>
      )}
    </FuturisticCard>
  );
}
