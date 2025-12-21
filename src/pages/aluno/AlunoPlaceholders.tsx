// Páginas placeholder para área do aluno
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="container mx-auto p-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Construction className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Esta funcionalidade está sendo desenvolvida.</p>
      </CardContent>
    </Card>
  </div>
);

export const AlunoCronograma = () => <PlaceholderPage title="Meu Cronograma de Estudos" />;
export const AlunoMateriais = () => <PlaceholderPage title="Materiais PDF" />;
export const AlunoResumos = () => <PlaceholderPage title="Resumos" />;
export const AlunoMapasMentais = () => <PlaceholderPage title="Mapas Mentais" />;
export const AlunoRedacao = () => <PlaceholderPage title="Redação Química" />;
export const AlunoDesempenho = () => <PlaceholderPage title="Meu Desempenho" />;
export const AlunoConquistas = () => <PlaceholderPage title="Minhas Conquistas" />;
export const AlunoTutoria = () => <PlaceholderPage title="Tutoria ao Vivo" />;
export const AlunoForum = () => <PlaceholderPage title="Fórum de Dúvidas" />;
export const AlunoLives = () => <PlaceholderPage title="Lives Exclusivas" />;
export const AlunoDuvidas = () => <PlaceholderPage title="Tire suas Dúvidas" />;
export const AlunoRevisao = () => <PlaceholderPage title="Revisão Inteligente" />;
export const AlunoLaboratorio = () => <PlaceholderPage title="Laboratório Virtual" />;
export const AlunoCalculadora = () => <PlaceholderPage title="Calculadora Química" />;
export const AlunoFlashcards = () => <PlaceholderPage title="Flashcards" />;
export const AlunoMetas = () => <PlaceholderPage title="Metas de Estudo" />;
export const AlunoAgenda = () => <PlaceholderPage title="Minha Agenda" />;
export const AlunoCertificados = () => <PlaceholderPage title="Meus Certificados" />;
export const AlunoPerfil = () => <PlaceholderPage title="Meu Perfil" />;
