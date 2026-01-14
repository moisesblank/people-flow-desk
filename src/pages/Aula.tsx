// ============================================
// MOISÉS MEDEIROS v9.0 - AULA PAGE
// Página de visualização de aula com YouTube Player
// Protegida pelo BetaLessonGuard (PARTE 4 - v5.0)
// + Sistema de Abas Educacionais (LessonTabs)
// ============================================

import { useParams, useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, FileText, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VideoChapter } from '@/components/lms/YouTubePlayer';
import { OmegaFortressPlayer } from '@/components/video';
import { LessonComments } from '@/components/forum/LessonComments';
import { BetaLessonGuard } from '@/components/lms/BetaLessonGuard';
import { usePublishEvent } from '@/hooks/usePublishEvent';
import { LessonTabs } from '@/components/player/LessonTabs';
import { LessonProgressWidget } from '@/components/player/LessonProgressWidget';

function AulaContent() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("video");
  const { publishLessonCompleted, publishEvent } = usePublishEvent();

  // Exemplo de capítulos para a aula
  const sampleChapters: VideoChapter[] = [
    { id: "1", title: "Tempo de espera", startTime: 0 },
    { id: "2", title: "Trailers sessão Enem", startTime: 581 },
    { id: "3", title: "Boas-vindas + avisos", startTime: 918 },
    { id: "4", title: "Pressão/Altitude e mudanças de estado físico", startTime: 1143 },
    { id: "5", title: "Doping natural e Altitude", startTime: 2536 },
    { id: "6", title: "Teorema de Stevin", startTime: 3263 },
    { id: "7", title: "Diagrama de Fases", startTime: 4408 },
    { id: "8", title: "Intervalo", startTime: 8986 },
    { id: "9", title: "Experimento do café na seringa", startTime: 10310 },
    { id: "10", title: "Fluido supercrítico", startTime: 10423 },
    { id: "11", title: "Substância (Propriedades + Gráficos)", startTime: 10748 },
    { id: "12", title: "Mistura (Propriedades + Gráficos)", startTime: 12936 },
  ];

  // Exemplo de materiais da aula
  const materiais = [
    { id: "1", nome: "Apostila - Diagrama de Fases", tipo: "PDF", tamanho: "2.4 MB", url: "#" },
    { id: "2", nome: "Exercícios - Lista 01", tipo: "PDF", tamanho: "890 KB", url: "#" },
    { id: "3", nome: "Gabarito - Lista 01", tipo: "PDF", tamanho: "450 KB", url: "#" },
  ];

  // ID do vídeo YouTube de exemplo (substitua pelo real)
  const youtubeVideoId = "dQw4w9WgXcQ";

  // Handler para progresso do vídeo (publicar evento quando completar 90%)
  const handleProgress = useCallback((progress: number) => {
    console.log("Progresso:", progress);
    // Publicar evento de progresso significativo
    if (progress >= 90 && lessonId) {
      publishLessonCompleted(lessonId, progress);
    }
  }, [lessonId, publishLessonCompleted]);

  // Handler para aula concluída
  const handleComplete = useCallback(() => {
    console.log("Aula concluída!");
    if (lessonId) {
      publishLessonCompleted(lessonId, 100);
    }
  }, [lessonId, publishLessonCompleted]);

  return (
    <div className="container mx-auto py-6 px-4 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(`/cursos/${courseId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para o Curso
        </Button>
        <Badge variant="outline" className="text-primary border-primary/30">
          <BookOpen className="h-4 w-4 mr-1" />
          Aula 2
        </Badge>
      </div>

      {/* Título da Aula */}
      <div>
        <h1 className="text-2xl font-bold">Introdução Inorgânica PT2-2025</h1>
        <p className="text-muted-foreground">Módulo: Química Geral • Duração: 3h 57min</p>
      </div>

      {/* Layout Principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 xl:grid-cols-4 gap-6"
      >
        {/* Coluna Principal - Player + Abas Educacionais */}
        <div className="xl:col-span-3 space-y-6">
          {/* Player de Vídeo */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="video">🎬 Vídeo</TabsTrigger>
              <TabsTrigger value="materiais">📚 Materiais</TabsTrigger>
              <TabsTrigger value="discussao">💬 Discussão</TabsTrigger>
            </TabsList>

            <TabsContent value="video" className="mt-4">
              {/* 🛡️ OmegaFortressPlayer - 7 Camadas de Proteção */}
              <OmegaFortressPlayer
                videoId={youtubeVideoId}
                type="youtube"
                title="Aula 2: Introdução Inorgânica PT2-2025"
                showSecurityBadge={false}
                showWatermark
                autoplay={false}
                onProgress={handleProgress}
                onComplete={handleComplete}
              />
            </TabsContent>

            <TabsContent value="materiais" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Materiais de Apoio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {materiais.map((material) => (
                      <div
                        key={material.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-red-500" />
                          </div>
                          <div>
                            <p className="font-medium">{material.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {material.tipo} • {material.tamanho}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="discussao" className="mt-4">
              <LessonComments
                lessonId={lessonId || ""}
                lessonTitle="Introdução Inorgânica PT2-2025"
                comments={[]}
              />
            </TabsContent>
          </Tabs>

          {/* ========================================
              SISTEMA DE ABAS EDUCACIONAIS v9.0
              Resumo IA | Quiz | Flashcards | Transcrição
              Mapa Mental | Anotações | TRAMON
              
              TEMPORARIAMENTE DESATIVADO
          ======================================== */}
          {/*
          <LessonTabs
            lessonId={lessonId || "demo-lesson"}
            lessonTitle="Introdução Inorgânica PT2-2025 - Diagramas de Fases"
            className="animate-fade-in"
          />
          */}
        </div>

        {/* Sidebar - Info da Aula */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sobre esta aula</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Instrutor</p>
                <p className="font-medium">Prof. Moisés Medeiros</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duração</p>
                <p className="font-medium">3h 57min 15s</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Capítulos</p>
                <p className="font-medium">{sampleChapters.length} capítulos</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Materiais</p>
                <p className="font-medium">{materiais.length} arquivos</p>
              </div>
            </CardContent>
          </Card>

          {/* Card de Gamificação */}
          <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold">Complete esta aula</h3>
                <p className="text-sm text-muted-foreground">
                  Assista pelo menos 90% do vídeo para marcar como concluída e ganhar XP!
                </p>
                <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
                  +50 XP ao concluir
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Widget de Progresso */}
          <LessonProgressWidget lessonId={lessonId || "demo-lesson"} />

          {/* Card de Recursos IA */}
          <Card className="border-primary/20 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                    <span className="text-white text-sm">🤖</span>
                  </div>
                  <h4 className="font-semibold">Recursos IA</h4>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>✨ Resumo gerado por IA</p>
                  <p>🧠 Mapa mental automático</p>
                  <p>❓ Quiz personalizado</p>
                  <p>🃏 Flashcards inteligentes</p>
                  <p>💬 Tutor TRAMON 24/7</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}

// Página principal com proteção BETA
export default function Aula() {
  const { lessonId } = useParams();
  
  return (
    <BetaLessonGuard 
      lessonId={lessonId}
      lessonTitle="Introdução Inorgânica PT2-2025"
    >
      <AulaContent />
    </BetaLessonGuard>
  );
}
