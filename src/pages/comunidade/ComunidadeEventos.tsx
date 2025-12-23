// ============================================
// 🌐 COMUNIDADE - EVENTOS
// /comunidade/eventos
// Acesso: NÃO PAGANTE + BETA + OWNER
// ============================================

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, Video } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOptimizedAnimations } from '@/hooks/usePerformance';

const ComunidadeEventos = memo(function ComunidadeEventos() {
  const { skipAnimations, duration } = useOptimizedAnimations();
  
  const animationProps = skipAnimations ? {} : {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration }
  };

  const events = [
    { 
      id: 1, 
      title: 'Live: Revisão Química Orgânica', 
      date: '28 Dez 2024', 
      time: '19:00',
      type: 'live',
      participants: 234,
      isUpcoming: true
    },
    { 
      id: 2, 
      title: 'Simuladão ENEM - Ciências da Natureza', 
      date: '02 Jan 2025', 
      time: '14:00',
      type: 'simulado',
      participants: 567,
      isUpcoming: true
    },
    { 
      id: 3, 
      title: 'Workshop: Técnicas de Memorização', 
      date: '05 Jan 2025', 
      time: '10:00',
      type: 'workshop',
      participants: 89,
      isUpcoming: true
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <motion.div {...animationProps} className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            Eventos da Comunidade
          </h1>
          <p className="text-muted-foreground mt-2">
            Participe de lives, workshops e simulados
          </p>
        </div>

        <div className="space-y-4">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              {...(skipAnimations ? {} : {
                initial: { opacity: 0, x: -20 },
                animate: { opacity: 1, x: 0 },
                transition: { duration, delay: index * 0.1 }
              })}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={event.type === 'live' ? 'destructive' : event.type === 'simulado' ? 'default' : 'secondary'}>
                          {event.type === 'live' && <Video className="h-3 w-3 mr-1" />}
                          {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                        </Badge>
                        {event.isUpcoming && (
                          <Badge variant="outline" className="text-green-500 border-green-500">
                            Em breve
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">{event.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {event.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {event.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {event.participants} inscritos
                        </span>
                      </div>
                    </div>
                    <Button>
                      Inscrever-se
                    </Button>
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

ComunidadeEventos.displayName = 'ComunidadeEventos';

export default ComunidadeEventos;
