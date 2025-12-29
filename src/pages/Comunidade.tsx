// ============================================
// 🌐 PÁGINA COMUNIDADE - Hub de Navegação
// Acesso livre para TODOS
// pro.moisesmedeiros.com.br/comunidade
// ============================================

import { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  MessageSquare, 
  Star, 
  Zap, 
  FileText, 
  Calendar, 
  MessageCircle,
  Presentation,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOptimizedAnimations } from '@/hooks/usePerformance';

const Comunidade = memo(function Comunidade() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { skipAnimations, duration } = useOptimizedAnimations();
  
  const animationProps = skipAnimations ? {} : {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration }
  };

  // 🎯 Áreas da comunidade com navegação
  const communityAreas = [
    {
      id: 'forum',
      icon: MessageSquare,
      title: 'Fórum',
      description: 'Tire dúvidas e compartilhe conhecimento com outros estudantes',
      color: 'from-purple-500 to-pink-500',
      link: '/comunidade/forum',
      badge: 'Popular'
    },
    {
      id: 'posts',
      icon: FileText,
      title: 'Posts',
      description: 'Veja o que está acontecendo na comunidade',
      color: 'from-blue-500 to-cyan-500',
      link: '/comunidade/posts',
      badge: null
    },
    {
      id: 'pps',
      icon: Presentation,
      title: 'PPS',
      description: 'Slides e apresentações para turbinar seus estudos',
      color: 'from-amber-500 to-orange-500',
      link: '/comunidade/pps',
      badge: 'Novo'
    },
    {
      id: 'eventos',
      icon: Calendar,
      title: 'Eventos',
      description: 'Lives, simulados e workshops agendados',
      color: 'from-green-500 to-emerald-500',
      link: '/comunidade/eventos',
      badge: null
    },
    {
      id: 'chat',
      icon: MessageCircle,
      title: 'Bate-Papo',
      description: 'Converse em tempo real com outros estudantes',
      color: 'from-red-500 to-rose-500',
      link: '/comunidade/chat',
      badge: 'Ao Vivo'
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div {...animationProps}>
            <Badge variant="outline" className="mb-4">
              <Users className="h-3 w-3 mr-1" />
              Comunidade Ativa
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Bem-vindo à <span className="text-primary">Comunidade</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Um espaço para você aprender química, tirar dúvidas e evoluir junto com outros estudantes.
            </p>
            
            {!user ? (
              <div className="flex gap-4 justify-center flex-wrap">
                <Button size="lg" onClick={() => navigate('/auth')}>
                  <Zap className="mr-2 h-5 w-5" />
                  Criar Conta Grátis
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
                  Já tenho conta
                </Button>
              </div>
            ) : (
              <Badge variant="secondary" className="text-sm">
                Logado como {user.email}
              </Badge>
            )}
          </motion.div>
        </div>
      </section>

      {/* Grid de Áreas da Comunidade */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            {...animationProps}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Explore a Comunidade
            </h2>
            <p className="text-muted-foreground">
              Escolha uma área para começar
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communityAreas.map((area, index) => (
              <motion.div
                key={area.id}
                {...(skipAnimations ? {} : {
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration, delay: index * 0.1 }
                })}
              >
                <Card 
                  className="h-full hover:shadow-xl transition-all hover:border-primary/50 cursor-pointer group"
                  onClick={() => navigate(area.link)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${area.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <area.icon className="h-7 w-7 text-white" />
                      </div>
                      {area.badge && (
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            area.badge === 'Novo' ? 'bg-green-500/10 text-green-500 border-green-500/30' :
                            area.badge === 'Ao Vivo' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                            'bg-primary/10 text-primary border-primary/30'
                          }`}
                        >
                          {area.badge}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl mt-4">{area.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{area.description}</p>
                    <Button variant="outline" className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Acessar
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...animationProps}>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Quer acesso completo?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Desbloqueie todas as videoaulas, simulados, flashcards e muito mais com o plano BETA.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              onClick={() => window.open('https://www.moisesmedeiros.com.br', '_blank')}
            >
              <Star className="mr-2 h-5 w-5" />
              Quero ser Aluno BETA
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
});

Comunidade.displayName = 'Comunidade';

export default Comunidade;
