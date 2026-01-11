// ============================================
// CENTRAL DO ALUNO - PÁGINAS PLACEHOLDER 2300
// Química ENEM - Prof. Moisés Medeiros
// FUTURISTA | GAMIFICADO | JOVEM
// ============================================

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DateLock } from "@/components/ui/chronolock";
import { 
  Construction, Rocket, Sparkles, Zap, Brain, 
  Calendar, FileText, Map, PenLine, Trophy, 
  MessageCircle, Video, HelpCircle, RefreshCw,
  FlaskConical, Calculator, CreditCard, Target,
  Award, User, Clock, ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";

interface PlaceholderProps {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  features?: string[];
  comingSoon?: string;
}

const FuturisticPlaceholder = ({ 
  title, 
  description, 
  icon: Icon, 
  color,
  features = [],
  comingSoon = "Em breve"
}: PlaceholderProps) => (
  <div className="container mx-auto p-4 md:p-6 space-y-6">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden"
    >
      {/* Hero Section */}
      <Card className="spider-card overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-20`} />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <CardContent className="relative p-8 md:p-12 text-center">
          <motion.div 
            className={`w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 shadow-lg`}
            animate={{ 
              boxShadow: ['0 0 20px rgba(0,0,0,0.2)', '0 0 40px rgba(0,0,0,0.3)', '0 0 20px rgba(0,0,0,0.2)']
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Icon className="w-12 h-12 text-white" />
          </motion.div>
          
          <Badge className="mb-4 bg-primary/20 text-primary border-0">
            <Sparkles className="w-3 h-3 mr-1" />
            {comingSoon}
          </Badge>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            {title}
          </h1>
          
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
            {description}
          </p>

          {/* Progress Animation */}
          <div className="max-w-md mx-auto mb-8">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground flex items-center gap-2">
                <Construction className="w-4 h-4" />
                Desenvolvimento em progresso
              </span>
              <span className="font-medium text-primary">85%</span>
            </div>
            <div className="relative">
              <Progress value={85} className="h-3" />
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" className="gap-2">
              <Rocket className="w-4 h-4" />
              Me avise quando lançar
            </Button>
            <Button size="lg" variant="outline" className="gap-2">
              <ArrowRight className="w-4 h-4" />
              Explorar outras áreas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Features Preview */}
      {features.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <Card className="spider-card">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                O que você poderá fazer
              </CardTitle>
              <CardDescription>Funcionalidades incríveis que estamos preparando para você</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm font-medium">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  </div>
);

// ============================================
// PÁGINAS EXPORTADAS
// ============================================

export const AlunoCronograma = () => (
  <FuturisticPlaceholder 
    title="Meu Cronograma de Estudos"
    description="IA que monta seu cronograma perfeito baseado no ENEM, suas metas e tempo disponível."
    icon={Calendar}
    color="from-blue-500 to-cyan-500"
    comingSoon="Lançamento: Janeiro 2025"
    features={[
      "Cronograma personalizado por IA",
      "Sincronização com Google Calendar",
      "Lembretes automáticos",
      "Adaptação baseada no seu progresso",
      "Metas diárias e semanais",
      "Análise de produtividade"
    ]}
  />
);

export const AlunoMateriais = () => (
  <FuturisticPlaceholder 
    title="Materiais"
    description="Biblioteca completa com resumos, apostilas, imagens e exercícios."
    icon={FileText}
    color="from-purple-500 to-pink-500"
    comingSoon="Lançamento: Janeiro 2025"
    features={[
      "Apostilas exclusivas do Prof. Moisés",
      "Resumos visuais de cada tema",
      "Exercícios comentados",
      "Fórmulas e tabelas essenciais",
      "Material para revisão final",
      "Atualizações constantes"
    ]}
  />
);

export const AlunoResumos = () => (
  <FuturisticPlaceholder 
    title="Resumos Inteligentes"
    description="Resumos gerados por IA adaptados ao seu nível de conhecimento."
    icon={FileText}
    color="from-emerald-500 to-green-500"
    comingSoon="Lançamento: Fevereiro 2025"
    features={[
      "Resumos personalizados por IA",
      "Destaque de conceitos-chave",
      "Exemplos práticos",
      "Quiz de verificação",
      "Versão para impressão",
      "Áudio para escutar"
    ]}
  />
);

export const AlunoMapasMentais = () => (
  <FuturisticPlaceholder 
    title="Mapas Mentais Interativos"
    description="Visualize conexões entre conceitos de forma dinâmica e memorável."
    icon={Map}
    color="from-orange-500 to-amber-500"
    comingSoon="Lançamento: Fevereiro 2025"
    features={[
      "Mapas interativos 3D",
      "Conexões entre temas",
      "Zoom em conceitos específicos",
      "Modo de revisão rápida",
      "Crie seus próprios mapas",
      "Compartilhe com colegas"
    ]}
  />
);

export const AlunoRedacao = () => (
  <FuturisticPlaceholder 
    title="Redação Científica"
    description="Pratique argumentação usando conhecimentos de Química no ENEM."
    icon={PenLine}
    color="from-red-500 to-rose-500"
    comingSoon="Lançamento: Março 2025"
    features={[
      "Temas relacionados à Química",
      "Correção por IA avançada",
      "Sugestões de melhoria",
      "Repertório científico",
      "Exemplos de redações nota 1000",
      "Estatísticas de evolução"
    ]}
  />
);

export const AlunoDesempenho = () => (
  <FuturisticPlaceholder 
    title="Meu Desempenho"
    description="Dashboard completo com análises detalhadas da sua evolução."
    icon={Trophy}
    color="from-yellow-500 to-orange-500"
    comingSoon="Lançamento: Janeiro 2025"
    features={[
      "Gráficos de evolução",
      "Pontos fortes e fracos",
      "Comparativo com outros alunos",
      "Previsão de nota no ENEM",
      "Recomendações personalizadas",
      "Histórico completo"
    ]}
  />
);

export const AlunoConquistas = () => (
  <FuturisticPlaceholder 
    title="Minhas Conquistas"
    description="Sistema de gamificação com medalhas, títulos e recompensas."
    icon={Award}
    color="from-amber-500 to-yellow-500"
    comingSoon="Lançamento: Janeiro 2025"
    features={[
      "50+ conquistas para desbloquear",
      "Títulos exclusivos",
      "Recompensas em XP",
      "Ranking de conquistas",
      "Desafios semanais",
      "Conquistas secretas"
    ]}
  />
);

export const AlunoTutoria = () => (
  <FuturisticPlaceholder 
    title="Tutoria ao Vivo"
    description="Sessões ao vivo com o Prof. Moisés para tirar dúvidas."
    icon={Video}
    color="from-teal-500 to-cyan-500"
    comingSoon="Lançamento: Março 2025"
    features={[
      "Sessões semanais ao vivo",
      "Tire dúvidas em tempo real",
      "Gravações disponíveis",
      "Agendamento prévio",
      "Chat interativo",
      "Convidados especiais"
    ]}
  />
);

export const AlunoForum = () => (
  <FuturisticPlaceholder 
    title="Fórum de Dúvidas"
    description="Comunidade de alunos para trocar conhecimento e resolver dúvidas."
    icon={MessageCircle}
    color="from-indigo-500 to-purple-500"
    comingSoon="Lançamento: Fevereiro 2025"
    features={[
      "Pergunte à comunidade",
      "Respostas verificadas",
      "Sistema de reputação",
      "Busca inteligente",
      "Categorias por tema",
      "Notificações de respostas"
    ]}
  />
);

export const AlunoLives = () => (
  <DateLock releaseDate="31/01" variant="danger">
    <FuturisticPlaceholder 
      title="Lives Exclusivas"
      description="Transmissões ao vivo com conteúdo exclusivo para assinantes."
      icon={Video}
      color="from-pink-500 to-rose-500"
      comingSoon="Lançamento: Abril 2025"
      features={[
        "Lives semanais",
        "Resolução de provas antigas",
        "Dicas de prova",
        "Interação ao vivo",
        "Sorteios e prêmios",
        "Replays disponíveis"
      ]}
    />
  </DateLock>
);

export const AlunoDuvidas = () => (
  <FuturisticPlaceholder 
    title="Tire suas Dúvidas"
    description="Assistente de IA para responder suas perguntas de Química 24/7."
    icon={HelpCircle}
    color="from-cyan-500 to-blue-500"
    comingSoon="Lançamento: Janeiro 2025"
    features={[
      "IA treinada em Química ENEM",
      "Respostas instantâneas",
      "Explicações passo a passo",
      "Exemplos práticos",
      "Histórico de perguntas",
      "Escale para tutor humano"
    ]}
  />
);

export const AlunoRevisao = () => (
  <FuturisticPlaceholder 
    title="Revisão Inteligente"
    description="Sistema de repetição espaçada para memorização eficiente."
    icon={RefreshCw}
    color="from-violet-500 to-purple-500"
    comingSoon="Lançamento: Janeiro 2025"
    features={[
      "Algoritmo de repetição espaçada",
      "Cards de revisão personalizados",
      "Identificação de gaps",
      "Lembretes inteligentes",
      "Estatísticas de retenção",
      "Modo de revisão rápida"
    ]}
  />
);

export const AlunoLaboratorio = () => (
  <FuturisticPlaceholder 
    title="Laboratório Virtual"
    description="Simule experimentos químicos de forma segura e interativa."
    icon={FlaskConical}
    color="from-green-500 to-teal-500"
    comingSoon="Lançamento: Maio 2025"
    features={[
      "Experimentos em 3D",
      "Simulações realistas",
      "Sem riscos de acidentes",
      "Biblioteca de experimentos",
      "Relatórios automáticos",
      "Desafios de laboratório"
    ]}
  />
);

export const AlunoCalculadora = () => (
  <FuturisticPlaceholder 
    title="Calculadora Química"
    description="Ferramentas de cálculo para estequiometria, soluções e mais."
    icon={Calculator}
    color="from-slate-500 to-gray-600"
    comingSoon="Lançamento: Janeiro 2025"
    features={[
      "Cálculos estequiométricos",
      "Balanceamento de equações",
      "Concentração de soluções",
      "Diluições",
      "Conversão de unidades",
      "Histórico de cálculos"
    ]}
  />
);

export const AlunoFlashcards = () => (
  <FuturisticPlaceholder 
    title="Flashcards Inteligentes"
    description="Cards de memorização com sistema de repetição espaçada."
    icon={CreditCard}
    color="from-fuchsia-500 to-pink-500"
    comingSoon="Lançamento: Janeiro 2025"
    features={[
      "Decks por assunto",
      "Repetição espaçada automática",
      "Crie seus próprios cards",
      "Modo desafio",
      "Estatísticas de memorização",
      "Compartilhe com amigos"
    ]}
  />
);

export const AlunoMetas = () => (
  <FuturisticPlaceholder 
    title="Metas de Estudo"
    description="Defina objetivos e acompanhe seu progresso para o ENEM."
    icon={Target}
    color="from-lime-500 to-green-500"
    comingSoon="Lançamento: Janeiro 2025"
    features={[
      "Metas diárias e semanais",
      "Lembretes motivacionais",
      "Streaks de estudo",
      "Recompensas por meta cumprida",
      "Análise de produtividade",
      "Meta final: ENEM"
    ]}
  />
);

export const AlunoAgenda = () => (
  <FuturisticPlaceholder 
    title="Minha Agenda"
    description="Organize seus estudos e compromissos em um só lugar."
    icon={Calendar}
    color="from-sky-500 to-blue-500"
    comingSoon="Lançamento: Janeiro 2025"
    features={[
      "Calendário integrado",
      "Eventos e lembretes",
      "Sincronização com celular",
      "Blocos de estudo",
      "Contador para o ENEM",
      "Visão semanal e mensal"
    ]}
  />
);

export const AlunoCertificados = () => (
  <FuturisticPlaceholder 
    title="Meus Certificados"
    description="Certificados de conclusão para adicionar ao seu currículo."
    icon={Award}
    color="from-yellow-500 to-amber-500"
    comingSoon="Lançamento: Junho 2025"
    features={[
      "Certificados por módulo",
      "Download em PDF",
      "Verificação online",
      "Compartilhe no LinkedIn",
      "Horas complementares",
      "Selo de excelência"
    ]}
  />
);

export const AlunoPerfil = () => (
  <FuturisticPlaceholder 
    title="Meu Perfil"
    description="Personalize sua experiência e gerencie sua conta."
    icon={User}
    color="from-gray-500 to-slate-600"
    comingSoon="Lançamento: Janeiro 2025"
    features={[
      "Foto e informações",
      "Preferências de estudo",
      "Notificações personalizadas",
      "Tema claro/escuro",
      "Histórico de atividades",
      "Segurança da conta"
    ]}
  />
);
