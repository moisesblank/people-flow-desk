// ============================================
// 🌐 COMUNIDADE - POSTS
// /comunidade/posts
// Acesso: NÃO PAGANTE + BETA + OWNER
// ============================================

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useQuantumReactivity } from '@/hooks/useQuantumReactivity';
import { FileText, Heart, MessageCircle, Share2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useOptimizedAnimations } from '@/hooks/usePerformance';

const ComunidadePosts = memo(function ComunidadePosts() {
  const { skipAnimations, duration } = useOptimizedAnimations();
  
  const animationProps = skipAnimations ? {} : {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration }
  };

  const posts = [
    { 
      id: 1, 
      author: 'Prof. Moisés', 
      avatar: null,
      content: 'Dica do dia: Lembre-se que em reações de oxirredução, quem perde elétrons OXIDA e quem ganha elétrons REDUZ!', 
      likes: 156, 
      comments: 23,
      time: '2h atrás'
    },
    { 
      id: 2, 
      author: 'Maria Santos', 
      avatar: null,
      content: 'Acabei de acertar 90% no simulado de química orgânica! As videoaulas do curso são incríveis! 🎉', 
      likes: 89, 
      comments: 15,
      time: '4h atrás'
    },
    { 
      id: 3, 
      author: 'Carlos Oliveira', 
      avatar: null,
      content: 'Alguém mais está estudando para o ENEM? Vamos criar um grupo de estudos?', 
      likes: 45, 
      comments: 32,
      time: '6h atrás'
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <motion.div {...animationProps} className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Posts da Comunidade
          </h1>
          <p className="text-muted-foreground mt-2">
            Veja o que está acontecendo na comunidade
          </p>
        </div>

        <div className="space-y-6">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              {...(skipAnimations ? {} : {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration, delay: index * 0.1 }
              })}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Avatar>
                      <AvatarImage src={post.avatar || undefined} />
                      <AvatarFallback>{post.author.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{post.author}</span>
                        <span className="text-sm text-muted-foreground">• {post.time}</span>
                      </div>
                      <p className="mt-2 text-foreground">{post.content}</p>
                      <div className="flex gap-4 mt-4">
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500">
                          <Heart className="mr-1 h-4 w-4" />
                          {post.likes}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                          <MessageCircle className="mr-1 h-4 w-4" />
                          {post.comments}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                          <Share2 className="mr-1 h-4 w-4" />
                          Compartilhar
                        </Button>
                      </div>
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

ComunidadePosts.displayName = 'ComunidadePosts';

export default ComunidadePosts;
