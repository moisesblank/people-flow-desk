// ============================================
// 🌐 COMUNIDADE - MEMBROS
// /comunidade/membros
// Acesso: NÃO PAGANTE + BETA + OWNER
// ============================================

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useQuantumReactivity } from '@/hooks/useQuantumReactivity';
import { Users, Star, Award, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useOptimizedAnimations } from '@/hooks/usePerformance';

const ComunidadeMembros = memo(function ComunidadeMembros() {
  const { skipAnimations, duration } = useOptimizedAnimations();
  
  const animationProps = skipAnimations ? {} : {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration }
  };

  const members = [
    { id: 1, name: 'Maria Santos', level: 'Beta', xp: 2500, avatar: null, badge: 'Mestre' },
    { id: 2, name: 'João Silva', level: 'Beta', xp: 2100, avatar: null, badge: 'Dedicado' },
    { id: 3, name: 'Ana Paula', level: 'Comunidade', xp: 800, avatar: null, badge: null },
    { id: 4, name: 'Carlos Lima', level: 'Beta', xp: 1900, avatar: null, badge: 'Estudioso' },
    { id: 5, name: 'Fernanda Costa', level: 'Comunidade', xp: 600, avatar: null, badge: null },
    { id: 6, name: 'Pedro Henrique', level: 'Beta', xp: 3200, avatar: null, badge: 'Lenda' },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <motion.div {...animationProps} className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              Membros da Comunidade
            </h1>
            <p className="text-muted-foreground mt-2">
              Conheça outros estudantes de química
            </p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar membro..." className="pl-10" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member, index) => (
            <motion.div
              key={member.id}
              {...(skipAnimations ? {} : {
                initial: { opacity: 0, scale: 0.95 },
                animate: { opacity: 1, scale: 1 },
                transition: { duration, delay: index * 0.05 }
              })}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.avatar || undefined} />
                      <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{member.name}</span>
                        {member.badge && (
                          <Badge variant="secondary" className="text-xs">
                            <Award className="h-3 w-3 mr-1" />
                            {member.badge}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={member.level === 'Beta' ? 'default' : 'outline'}>
                          {member.level === 'Beta' && <Star className="h-3 w-3 mr-1" />}
                          {member.level}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{member.xp} XP</span>
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

ComunidadeMembros.displayName = 'ComunidadeMembros';

export default ComunidadeMembros;
