// ============================================
// 🌐 COMUNIDADE - PPS (Apresentações)
// /comunidade/pps
// Acesso: NÃO PAGANTE + BETA + OWNER
// ============================================

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Presentation, Download, Eye, FileText, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOptimizedAnimations } from '@/hooks/usePerformance';

const ComunidadePPS = memo(function ComunidadePPS() {
  const { skipAnimations, duration } = useOptimizedAnimations();
  
  const animationProps = skipAnimations ? {} : {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration }
  };

  const presentations = [
    { 
      id: 1, 
      title: 'Introdução à Química Orgânica', 
      slides: 45,
      downloads: 1234,
      views: 5678,
      author: 'Prof. Moisés',
      category: 'Química Orgânica',
      isFeatured: true
    },
    { 
      id: 2, 
      title: 'Tabela Periódica Completa', 
      slides: 32,
      downloads: 987,
      views: 4321,
      author: 'Prof. Moisés',
      category: 'Química Geral',
      isFeatured: true
    },
    { 
      id: 3, 
      title: 'Estequiometria - Do Básico ao Avançado', 
      slides: 58,
      downloads: 756,
      views: 3456,
      author: 'Prof. Moisés',
      category: 'Cálculos Químicos',
      isFeatured: false
    },
    { 
      id: 4, 
      title: 'Reações de Oxirredução', 
      slides: 41,
      downloads: 543,
      views: 2345,
      author: 'Prof. Moisés',
      category: 'Eletroquímica',
      isFeatured: false
    },
    { 
      id: 5, 
      title: 'Funções Orgânicas - Resumão ENEM', 
      slides: 67,
      downloads: 2100,
      views: 8900,
      author: 'Prof. Moisés',
      category: 'ENEM',
      isFeatured: true
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <motion.div {...animationProps} className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Presentation className="h-8 w-8 text-primary" />
              Apresentações (PPS)
            </h1>
            <p className="text-muted-foreground mt-2">
              Slides e apresentações para turbinar seus estudos
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            {presentations.length} apresentações
          </Badge>
        </div>

        {/* Grid de Apresentações */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presentations.map((pps, index) => (
            <motion.div
              key={pps.id}
              {...(skipAnimations ? {} : {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration, delay: index * 0.1 }
              })}
            >
              <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50 group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      {pps.isFeatured && (
                        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                          <Star className="h-3 w-3 mr-1" />
                          Destaque
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg mt-3 line-clamp-2">{pps.title}</CardTitle>
                  <Badge variant="secondary" className="w-fit text-xs">
                    {pps.category}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Por <span className="text-foreground font-medium">{pps.author}</span>
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{pps.slides} slides</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {pps.views.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="h-3.5 w-3.5" />
                          {pps.downloads.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-2">
                        <Eye className="h-4 w-4" />
                        Visualizar
                      </Button>
                      <Button size="sm" className="flex-1 gap-2">
                        <Download className="h-4 w-4" />
                        Baixar
                      </Button>
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

ComunidadePPS.displayName = 'ComunidadePPS';

export default ComunidadePPS;
