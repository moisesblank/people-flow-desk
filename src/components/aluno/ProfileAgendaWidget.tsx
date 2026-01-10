// ============================================
// 📅 WIDGET DE AGENDA - INTEGRADO AO PERFIL
// Funcionalidades da /alunos/agenda em ProfilePage
// ============================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  Clock, 
  Target, 
  Bell, 
  CalendarDays,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Construction,
  Rocket
} from 'lucide-react';

const AGENDA_FEATURES = [
  "Calendário integrado",
  "Eventos e lembretes",
  "Sincronização com celular",
  "Blocos de estudo",
  "Contador para o ENEM",
  "Visão semanal e mensal"
];

export const ProfileAgendaWidget = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      id="agenda-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="relative overflow-hidden border-border/50">
        {/* Background decorativo */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-blue-500/10 opacity-50" />
        <div className="absolute top-4 right-4 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl" />
        
        <CardHeader className="relative pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center shadow-lg"
                animate={{ 
                  boxShadow: ['0 0 15px rgba(14, 165, 233, 0.3)', '0 0 25px rgba(14, 165, 233, 0.4)', '0 0 15px rgba(14, 165, 233, 0.3)']
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Calendar className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  Minha Agenda
                  <Badge variant="secondary" className="ml-2 bg-sky-500/20 text-sky-400 border-0">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Em breve
                  </Badge>
                </CardTitle>
                <CardDescription>Organize seus estudos e compromissos</CardDescription>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-muted-foreground hover:text-foreground"
            >
              {expanded ? 'Ver menos' : 'Ver mais'}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="relative space-y-4">
          {/* Preview de funcionalidades */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { icon: CalendarDays, label: 'Calendário', color: 'from-sky-500 to-blue-500' },
              { icon: Bell, label: 'Lembretes', color: 'from-amber-500 to-orange-500' },
              { icon: Target, label: 'Metas', color: 'from-green-500 to-emerald-500' },
              { icon: Clock, label: 'Blocos', color: 'from-purple-500 to-pink-500' },
              { icon: CheckCircle2, label: 'Tarefas', color: 'from-cyan-500 to-teal-500' },
              { icon: Sparkles, label: 'ENEM', color: 'from-red-500 to-rose-500' },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group cursor-not-allowed opacity-75"
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                  <item.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Progresso de desenvolvimento */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Construction className="w-4 h-4" />
                Desenvolvimento em progresso
              </span>
              <span className="font-medium text-sky-400">75%</span>
            </div>
            <div className="relative">
              <Progress value={75} className="h-2" />
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          </div>

          {/* Features expandidas */}
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-4 border-t border-border/50"
            >
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Rocket className="w-4 h-4 text-sky-400" />
                Funcionalidades que estão chegando
              </h4>
              <div className="grid md:grid-cols-2 gap-2">
                {AGENDA_FEATURES.map((feature, index) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </motion.div>
                ))}
              </div>

              <Button className="w-full mt-4 gap-2" disabled>
                <Bell className="w-4 h-4" />
                Me avise quando lançar
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProfileAgendaWidget;
