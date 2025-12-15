// ============================================
// MOISÉS MEDEIROS v7.0 - MARKETING
// Spider-Man Theme - Métricas e Campanhas
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
  Calendar
} from "lucide-react";
import { motion } from "framer-motion";
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
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 border border-border/50"
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative flex items-center justify-between p-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/20">
                <Megaphone className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Central de Marketing</h1>
                <p className="text-muted-foreground">Moisés Medeiros - Curso de Química</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Button className="brand-gradient">
                <Plus className="h-4 w-4 mr-2" />
                Nova Campanha
              </Button>
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Relatório Completo
              </Button>
            </div>
          </div>
          <div className="hidden lg:block">
            <img 
              src={professorImage} 
              alt="Prof. Moisés Medeiros" 
              className="w-32 h-32 rounded-full object-cover border-4 border-primary/30 shadow-xl"
            />
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

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Redes Sociais</CardTitle>
              <CardDescription>Agende e gerencie suas publicações</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Calendário de publicações em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>E-mail Marketing</CardTitle>
              <CardDescription>Campanhas e automações de e-mail</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Integração com plataforma de e-mail em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
