// ============================================
// MOISÉS MEDEIROS v8.0 - AULA PAGE
// Página de visualização de aula com player avançado
// ============================================

import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoPlayerAdvanced, VideoChapter } from '@/components/lms/VideoPlayerAdvanced';
import { LessonComments } from '@/components/forum/LessonComments';

export default function Aula() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  // Exemplo de capítulos para teste
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

  return (
    <div className="container mx-auto py-6 px-4 space-y-8 max-w-6xl">
      <Button variant="ghost" onClick={() => navigate(`/cursos/${courseId}`)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar para o Curso
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Video Player com Capítulos */}
        <VideoPlayerAdvanced
          src=""
          title="Aula 2: Introdução Inorgânica PT2-2025"
          duration="3:57:15"
          chapters={sampleChapters}
          showChaptersBelow={true}
        />

        {/* Seção de Comentários/Fórum */}
        <LessonComments
          lessonId={lessonId || ""}
          lessonTitle="Introdução Inorgânica PT2-2025"
          comments={[]}
        />
      </motion.div>
    </div>
  );
}
