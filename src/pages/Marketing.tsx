// ============================================
// MOISÉS MEDEIROS v7.0 - MARKETING
// Spider-Man Theme - Métricas e Campanhas
// Elementos de Química Integrados
// ============================================

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Megaphone, 
  TrendingUp, 
  Users, 
  Eye, 
  MousePointer, 
  Target,
  Instagram,
  Youtube,
  Facebook,
  Mail,
  Plus,
  BarChart3,
  Calendar,
  FlaskConical,
  Atom,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedAtom, ChemistryTip, BubblingFlask } from "@/components/chemistry/ChemistryVisuals";
import marketingHeroImage from "@/assets/marketing-chemistry-hero.jpg";
import professorImage from "@/assets/professor-moises.jpg";

const campaignData = [
  { id: 1, name: "Lançamento ENEM 2025", status: "ativo", budget: 15000, spent: 8500, leads: 1250, conversions: 89 },
  { id: 2, name: "Black Friday Química", status: "planejado", budget: 8000, spent: 0, leads: 0, conversions: 0 },
  { id: 3, name: "Remarketing Carrinho", status: "ativo", budget: 3000, spent: 1800, leads: 320, conversions: 45 },
];

const socialMetrics = [
  { platform: "Instagram", icon: Instagram, followers: "125.4K", growth: "+12.5%", engagement: "4.8%", color: "from-pink-500 to-purple-600" },
  { platform: "YouTube", icon: Youtube, followers: "89.2K", growth: "+8.3%", engagement: "6.2%", color: "from-red-500 to-red-600" },
  { platform: "Facebook", icon: Facebook, followers: "45.1K", growth: "+3.1%", engagement: "2.1%", color: "from-blue-500 to-blue-700" },
];

export default function Marketing() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Hero Banner com Imagem */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden"
      >
        <img 
          src={marketingHeroImage} 
          alt="Marketing Digital - Química do Crescimento" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-between p-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/20">
                <Megaphone className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Central de Marketing</h1>
                <p className="text-muted-foreground">A fórmula do crescimento digital</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Button className="brand-gradient gap-2">
                <Plus className="h-4 w-4" />
                Nova Campanha
              </Button>
              <Button variant="outline" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Relatório Completo
              </Button>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-4">
            <img 
              src={professorImage} 
              alt="Prof. Moisés Medeiros" 
              className="w-24 h-24 rounded-full object-cover border-4 border-primary/30 shadow-xl"
            />
            <AnimatedAtom size={60} />
          </div>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Investimento Total", value: "R$ 26.000", icon: Target, trend: "+15%", color: "text-primary" },
          { label: "Leads Gerados", value: "1.570", icon: Users, trend: "+28%", color: "text-emerald-500" },
          { label: "Conversões", value: "134", icon: MousePointer, trend: "+22%", color: "text-blue-500" },
          { label: "ROI Médio", value: "340%", icon: TrendingUp, trend: "+45%", color: "text-amber-500" },
        ].map((kpi, index) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-border/50 hover:border-primary/30 transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{kpi.label}</p>
                    <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                    <Badge variant="secondary" className="mt-2 text-emerald-600 bg-emerald-500/10">
                      {kpi.trend}
                    </Badge>
                  </div>
                  <div className={`p-3 rounded-xl bg-muted ${kpi.color}`}>
                    <kpi.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="social">Redes Sociais</TabsTrigger>
          <TabsTrigger value="email">E-mail Marketing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Social Media Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {socialMetrics.map((social, index) => (
              <motion.div
                key={social.platform}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${social.color}`} />
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${social.color}`}>
                        <social.icon className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-semibold">{social.platform}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Seguidores</span>
                        <span className="font-bold">{social.followers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Crescimento</span>
                        <Badge variant="secondary" className="text-emerald-600 bg-emerald-500/10">
                          {social.growth}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Engajamento</span>
                        <span className="font-medium">{social.engagement}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          {campaignData.map((campaign) => (
            <Card key={campaign.id} className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{campaign.name}</span>
                    <Badge variant={campaign.status === "ativo" ? "default" : "secondary"}>
                      {campaign.status}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm">Ver Detalhes</Button>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Orçamento</span>
                    <p className="font-bold">R$ {campaign.budget.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gasto</span>
                    <p className="font-bold">R$ {campaign.spent.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Leads</span>
                    <p className="font-bold">{campaign.leads}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Conversões</span>
                    <p className="font-bold text-emerald-600">{campaign.conversions}</p>
                  </div>
                </div>
                <Progress value={(campaign.spent / campaign.budget) * 100} className="mt-4 h-2" />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          {/* Calendário de Publicações */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Calendário de Publicações
              </CardTitle>
              <CardDescription>Planeje e agende seu conteúdo nas redes sociais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {/* Semana Atual */}
                <div className="grid grid-cols-7 gap-2">
                  {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((dia, i) => (
                    <div key={dia} className="text-center">
                      <p className="text-xs text-muted-foreground mb-2">{dia}</p>
                      <div className={`p-3 rounded-lg border border-border/50 min-h-[100px] ${i === 2 ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted/50'} transition-colors`}>
                        {i === 0 && (
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-[10px] bg-pink-500/10 text-pink-600 border-pink-500/20">IG</Badge>
                            <p className="text-[10px] truncate">Dica Química</p>
                          </div>
                        )}
                        {i === 2 && (
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-600 border-red-500/20">YT</Badge>
                            <p className="text-[10px] truncate">Aula Orgânica</p>
                          </div>
                        )}
                        {i === 4 && (
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-[10px] bg-pink-500/10 text-pink-600 border-pink-500/20">IG</Badge>
                            <p className="text-[10px] truncate">Reels + Story</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Próximas Publicações */}
                <div className="space-y-3 mt-4">
                  <h4 className="font-medium text-sm">Próximas Publicações Agendadas</h4>
                  {[
                    { plataforma: "Instagram", tipo: "Carrossel", titulo: "5 Dicas de Química Orgânica", horario: "Hoje, 18:00", cor: "pink" },
                    { plataforma: "YouTube", tipo: "Vídeo", titulo: "Aula 15 - Reações de Substituição", horario: "Amanhã, 10:00", cor: "red" },
                    { plataforma: "Instagram", tipo: "Reels", titulo: "Macete: Tabela Periódica", horario: "Sexta, 14:00", cor: "pink" },
                  ].map((pub, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-${pub.cor}-500/10`}>
                          {pub.plataforma === "Instagram" ? <Instagram className={`h-4 w-4 text-${pub.cor}-500`} /> : <Youtube className="h-4 w-4 text-red-500" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{pub.titulo}</p>
                          <p className="text-xs text-muted-foreground">{pub.tipo} • {pub.horario}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">Editar</Button>
                    </div>
                  ))}
                </div>

                <Button className="w-full mt-4 brand-gradient">
                  <Plus className="h-4 w-4 mr-2" />
                  Agendar Nova Publicação
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Performance por Plataforma */}
          <div className="grid md:grid-cols-3 gap-4">
            {socialMetrics.map((social, idx) => (
              <Card key={idx} className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${social.color}`}>
                      <social.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-semibold">{social.platform}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Posts este mês</span>
                      <span className="font-bold">{12 + idx * 3}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Alcance total</span>
                      <span className="font-bold">{(45 + idx * 15).toLocaleString()}K</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Interações</span>
                      <span className="font-bold">{(3.2 + idx * 0.8).toFixed(1)}K</span>
                    </div>
                    <Progress value={70 + idx * 10} className="h-2 mt-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          {/* E-mail Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Lista Total", value: "8.542", icon: Users, trend: "+234 este mês" },
              { label: "Taxa de Abertura", value: "42.3%", icon: Eye, trend: "Média: 35%" },
              { label: "Taxa de Clique", value: "12.8%", icon: MousePointer, trend: "Acima da média" },
              { label: "Conversões", value: "156", icon: TrendingUp, trend: "+28% vs mês anterior" },
            ].map((stat, idx) => (
              <Card key={idx} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <stat.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-xl font-bold">{stat.value}</p>
                      <p className="text-[10px] text-emerald-600">{stat.trend}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Campanhas de E-mail */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Campanhas Recentes
              </CardTitle>
              <CardDescription>Histórico de e-mails enviados e seus resultados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { nome: "Lançamento ENEM 2025", enviados: 8234, abertos: 3890, cliques: 1245, conversoes: 89, data: "12/12/2024" },
                  { nome: "Black Friday - Última Chance", enviados: 7856, abertos: 4123, cliques: 1567, conversoes: 134, data: "29/11/2024" },
                  { nome: "Newsletter Semanal #45", enviados: 8012, abertos: 3245, cliques: 890, conversoes: 45, data: "08/12/2024" },
                  { nome: "Boas-vindas Novos Alunos", enviados: 234, abertos: 198, cliques: 156, conversoes: 23, data: "10/12/2024" },
                ].map((campanha, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{campanha.nome}</p>
                        <p className="text-xs text-muted-foreground">Enviado em {campanha.data}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-bold">{campanha.enviados.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">Enviados</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-blue-500">{((campanha.abertos / campanha.enviados) * 100).toFixed(1)}%</p>
                        <p className="text-[10px] text-muted-foreground">Abertos</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-amber-500">{((campanha.cliques / campanha.enviados) * 100).toFixed(1)}%</p>
                        <p className="text-[10px] text-muted-foreground">Cliques</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-emerald-500">{campanha.conversoes}</p>
                        <p className="text-[10px] text-muted-foreground">Conversões</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <Button className="flex-1 brand-gradient">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Campanha
                </Button>
                <Button variant="outline" className="flex-1">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Relatório Completo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Automações */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Automações Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { nome: "Boas-vindas", trigger: "Novo cadastro", emails: 3, taxa: "84%" },
                  { nome: "Carrinho Abandonado", trigger: "Checkout não finalizado", emails: 2, taxa: "12%" },
                  { nome: "Reengajamento", trigger: "30 dias sem acesso", emails: 4, taxa: "23%" },
                  { nome: "Aniversário", trigger: "Data de nascimento", emails: 1, taxa: "67%" },
                ].map((auto, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-muted/30 border border-border/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{auto.nome}</p>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Ativa</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{auto.trigger}</p>
                    <div className="flex justify-between text-xs">
                      <span>{auto.emails} emails na sequência</span>
                      <span className="font-medium text-primary">{auto.taxa} conversão</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
