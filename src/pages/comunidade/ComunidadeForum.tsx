// ============================================
// 🌐 COMUNIDADE - FÓRUM
// /comunidade/forum
// Acesso: NÃO PAGANTE + BETA + OWNER
// ============================================

import { memo } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Users, TrendingUp, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOptimizedAnimations } from '@/hooks/usePerformance';

const ComunidadeForum = memo(function ComunidadeForum() {
  const { skipAnimations, duration } = useOptimizedAnimations();
  
  const animationProps = skipAnimations ? {} : {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration }
  };

  const topics = [
    { id: 1, title: 'Dúvidas sobre Química Orgânica', replies: 23, author: 'Maria S.', hot: true },
    { id: 2, title: 'Como resolver questões de estequiometria?', replies: 15, author: 'João P.', hot: false },
    { id: 3, title: 'Tabela periódica - dicas de memorização', replies: 42, author: 'Ana L.', hot: true },
    { id: 4, title: 'ENEM 2024 - Previsões de química', replies: 67, author: 'Carlos M.', hot: true },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <motion.div {...animationProps} className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-primary" />
              Fórum da Comunidade
            </h1>
            <p className="text-muted-foreground mt-2">
              Tire dúvidas e compartilhe conhecimento com outros estudantes
            </p>
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Tópico
          </Button>
        </div>

        <div className="space-y-4">
          {topics.map((topic, index) => (
            <motion.div
              key={topic.id}
              {...(skipAnimations ? {} : {
                initial: { opacity: 0, x: -20 },
                animate: { opacity: 1, x: 0 },
                transition: { duration, delay: index * 0.1 }
              })}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">{topic.title}</h3>
                        {topic.hot && (
                          <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-xs rounded-full flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Em alta
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Por {topic.author}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-foreground">{topic.replies}</span>
                      <p className="text-xs text-muted-foreground">respostas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
});

ComunidadeForum.displayName = 'ComunidadeForum';

export default ComunidadeForum;
