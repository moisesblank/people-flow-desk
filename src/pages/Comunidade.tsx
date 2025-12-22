// ============================================
// 🌐 PÁGINA COMUNIDADE - Área Pública
// Acesso livre para NÃO PAGANTES
// pro.moisesmedeiros.com.br/comunidade
// ============================================

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Users, MessageSquare, Star, Zap, BookOpen, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

  const features = [
    {
      icon: Users,
      title: 'Comunidade Ativa',
      description: 'Conecte-se com milhares de estudantes de química',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: MessageSquare,
      title: 'Fórum de Discussões',
      description: 'Tire dúvidas e compartilhe conhecimento',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: BookOpen,
      title: 'Material Gratuito',
      description: 'Acesse resumos e conteúdos exclusivos',
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: TrendingUp,
      title: 'Ranking Semanal',
      description: 'Veja quem mais está estudando',
      color: 'from-green-500 to-emerald-500',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div {...animationProps}>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Bem-vindo à <span className="text-primary">Comunidade</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Um espaço gratuito para você aprender química, tirar dúvidas e evoluir junto com outros estudantes.
            </p>
            
            {!user ? (
              <div className="flex gap-4 justify-center">
                <Button size="lg" onClick={() => navigate('/auth')}>
                  <Zap className="mr-2 h-5 w-5" />
                  Criar Conta Grátis
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
                  Já tenho conta
                </Button>
              </div>
            ) : (
              <div className="flex gap-4 justify-center">
                <Button size="lg" onClick={() => navigate('/area-gratuita')}>
                  <Star className="mr-2 h-5 w-5" />
                  Acessar Conteúdo
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                {...(skipAnimations ? {} : {
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration, delay: index * 0.1 }
                })}
              >
                <Card className="h-full hover:shadow-lg transition-shadow border-border/50">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
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
