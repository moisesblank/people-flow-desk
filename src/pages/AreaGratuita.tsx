// ============================================
// TESTAMENTO DA SINGULARIDADE v5.0
// ÁREA GRATUITA - Portal para usuários gratuitos
// Acesso restrito sem conteúdo premium
// ============================================

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, 
  Lock, 
  BookOpen, 
  Users, 
  Trophy,
  ArrowRight,
  Star,
  Zap,
  GraduationCap,
  MessageCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

export default function AreaGratuita() {
  const navigate = useNavigate();
  const { user } = useAuth();
  // 🎯 CONSTITUIÇÃO v10.x: Área Gratuita é PÚBLICA - qualquer um pode acessar
  // Removido redirect para dashboard - usuários Beta/Premium podem ver esta página também

  const freeContent = [
    {
      id: 1,
      title: "Introdução à Química",
      description: "Primeiros passos no mundo da química",
      icon: BookOpen,
      status: "free",
    },
    {
      id: 2,
      title: "Tabela Periódica Básica",
      description: "Conheça os elementos mais importantes",
      icon: GraduationCap,
      status: "free",
    },
    {
      id: 3,
      title: "Comunidade Gratuita",
      description: "Conecte-se com outros estudantes",
      icon: Users,
      status: "free",
    },
  ];

  const premiumFeatures = [
    "Acesso a todos os cursos",
    "Simulados ilimitados",
    "Correção detalhada",
    "Suporte prioritário",
    "Certificado de conclusão",
    "Gamificação completa",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto max-w-4xl relative z-10 text-center"
        >
          <Badge variant="outline" className="mb-4">
            Área Gratuita
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Bem-vindo à sua jornada! 🎓
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Explore nosso conteúdo gratuito e descubra por que milhares de estudantes 
            escolheram o Curso de Química para alcançar seus objetivos.
          </p>

          {user && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
              <span>Logado como:</span>
              <Badge variant="secondary">{user.email}</Badge>
            </div>
          )}
        </motion.div>
      </section>

      {/* Conteúdo Gratuito */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Conteúdo Disponível para Você
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {freeContent.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <item.icon className="h-6 w-6 text-primary" />
                      </div>
                      <Badge variant="secondary">Gratuito</Badge>
                    </div>
                    <CardTitle className="text-lg mt-4">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {item.description}
                    </p>
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      Acessar <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* CTA Upgrade */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-secondary/5 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-3xl" />
              
              <CardContent className="p-8 md:p-12 relative z-10">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <Badge className="mb-4 bg-primary/20 text-primary hover:bg-primary/30">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Acesso BETA
                    </Badge>
                    
                    <h3 className="text-2xl md:text-3xl font-bold mb-4">
                      Desbloqueie todo o potencial
                    </h3>
                    
                    <p className="text-muted-foreground mb-6">
                      Faça upgrade para BETA e tenha acesso completo a todos os recursos 
                      por 365 dias. Sua aprovação está a um passo de distância!
                    </p>

                    <div className="flex flex-wrap gap-3">
                      <Button size="lg" className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        Fazer Upgrade Agora
                      </Button>
                      <Button variant="outline" size="lg">
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Incluído no BETA:
                    </h4>
                    {premiumFeatures.map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        className="flex items-center gap-3 p-2 rounded-lg bg-background/50"
                      >
                        <div className="p-1 rounded-full bg-green-500/20">
                          <Zap className="h-3 w-3 text-green-500" />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Comunidade */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
            <MessageCircle className="h-8 w-8 text-primary" />
          </div>
          
          <h2 className="text-2xl font-bold mb-4">
            Comunidade Gratuita
          </h2>
          
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Participe da nossa comunidade de estudantes, tire dúvidas, 
            compartilhe conhecimento e cresça junto com milhares de colegas.
          </p>

          <Button variant="outline" size="lg" className="gap-2">
            <Users className="h-4 w-4" />
            Acessar Comunidade
          </Button>
        </div>
      </section>

      {/* Footer Stats */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "10k+", label: "Estudantes", icon: Users },
              { value: "500+", label: "Aulas", icon: BookOpen },
              { value: "95%", label: "Aprovação", icon: Trophy },
              { value: "4.9", label: "Avaliação", icon: Star },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="p-4"
              >
                <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
