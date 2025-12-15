import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Rocket, 
  Calendar, 
  Target,
  Users,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";
import professorImage from "@/assets/professor-moises.jpg";

const launches = [
  {
    id: 1,
    name: "ENEM 2025 - Turma Completa",
    status: "em_andamento",
    startDate: "2025-01-15",
    endDate: "2025-01-22",
    goal: 500,
    current: 342,
    revenue: 856000,
    phases: [
      { name: "Pré-Lançamento", status: "completed" },
      { name: "CPL 1", status: "completed" },
      { name: "CPL 2", status: "current" },
      { name: "CPL 3", status: "pending" },
      { name: "Abertura Carrinho", status: "pending" },
    ]
  },
  {
    id: 2,
    name: "Intensivão Química - Férias",
    status: "planejado",
    startDate: "2025-02-10",
    endDate: "2025-02-17",
    goal: 200,
    current: 0,
    revenue: 0,
    phases: [
      { name: "Pré-Lançamento", status: "pending" },
      { name: "Conteúdo 1", status: "pending" },
      { name: "Abertura", status: "pending" },
    ]
  },
];

const checklistItems = [
  { id: 1, task: "Definir oferta e bônus", completed: true },
  { id: 2, task: "Criar página de captura", completed: true },
  { id: 3, task: "Gravar vídeos de conteúdo", completed: true },
  { id: 4, task: "Configurar e-mails de sequência", completed: false },
  { id: 5, task: "Preparar página de vendas", completed: false },
  { id: 6, task: "Testar checkout", completed: false },
  { id: 7, task: "Configurar remarketing", completed: false },
];

export default function Lancamento() {
  const [selectedLaunch, setSelectedLaunch] = useState(launches[0]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "em_andamento":
        return <Badge className="bg-emerald-500">Em Andamento</Badge>;
      case "planejado":
        return <Badge variant="secondary">Planejado</Badge>;
      case "concluido":
        return <Badge className="bg-blue-500">Concluído</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPhaseIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "current":
        return <Clock className="h-5 w-5 text-amber-500 animate-pulse" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-orange-500/10 via-red-500/5 to-pink-500/10 border border-border/50"
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative flex items-center justify-between p-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                <Rocket className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Central de Lançamentos</h1>
                <p className="text-muted-foreground">Gerencie seus lançamentos digitais</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                <Plus className="h-4 w-4 mr-2" />
                Novo Lançamento
              </Button>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Calendário
              </Button>
            </div>
          </div>
          <div className="hidden lg:block">
            <img 
              src={professorImage} 
              alt="Prof. Moisés Medeiros" 
              className="w-32 h-32 rounded-full object-cover border-4 border-orange-500/30 shadow-xl"
            />
          </div>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Lançamentos Ativos", value: "1", icon: Rocket, color: "text-orange-500" },
          { label: "Leads Captados", value: "2.847", icon: Users, color: "text-blue-500" },
          { label: "Meta de Vendas", value: "500", icon: Target, color: "text-emerald-500" },
          { label: "Faturamento", value: "R$ 856K", icon: DollarSign, color: "text-amber-500" },
        ].map((kpi, index) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{kpi.label}</p>
                    <p className="text-2xl font-bold mt-1">{kpi.value}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Launch List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Seus Lançamentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {launches.map((launch) => (
              <motion.div
                key={launch.id}
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelectedLaunch(launch)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedLaunch.id === launch.id 
                    ? "border-primary bg-primary/5" 
                    : "border-border/50 hover:border-primary/30"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{launch.name}</span>
                    {getStatusBadge(launch.status)}
                  </div>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Vendas</span>
                    <p className="font-bold">{launch.current}/{launch.goal}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Faturamento</span>
                    <p className="font-bold">R$ {(launch.revenue / 1000).toFixed(0)}K</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Período</span>
                    <p className="font-medium text-xs">{launch.startDate}</p>
                  </div>
                </div>
                <Progress value={(launch.current / launch.goal) * 100} className="mt-3 h-2" />
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Launch Phases */}
        <Card>
          <CardHeader>
            <CardTitle>Fases do Lançamento</CardTitle>
            <CardDescription>{selectedLaunch.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedLaunch.phases.map((phase, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    phase.status === "current" ? "bg-amber-500/10 border border-amber-500/30" : ""
                  }`}
                >
                  {getPhaseIcon(phase.status)}
                  <span className={phase.status === "completed" ? "line-through text-muted-foreground" : ""}>
                    {phase.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Checklist do Lançamento</CardTitle>
          <CardDescription>Tarefas para {selectedLaunch.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {checklistItems.map((item) => (
              <div 
                key={item.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  item.completed ? "bg-emerald-500/5 border-emerald-500/20" : "border-border/50"
                }`}
              >
                <CheckCircle2 className={`h-5 w-5 ${item.completed ? "text-emerald-500" : "text-muted-foreground"}`} />
                <span className={item.completed ? "line-through text-muted-foreground" : ""}>{item.task}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
