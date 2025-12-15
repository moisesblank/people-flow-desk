import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Monitor, 
  Users, 
  PlayCircle,
  Calendar,
  TrendingUp,
  Clock,
  Star,
  Plus,
  BarChart3
} from "lucide-react";
import { motion } from "framer-motion";
import professorImage from "@/assets/professor-moises.jpg";

const turmasOnline = [
  {
    id: 1,
    name: "Turma ENEM 2025 - Extensivo",
    students: 847,
    progress: 35,
    status: "ativo",
    rating: 4.9,
    completionRate: 78,
    nextClass: "Hoje, 19h",
  },
  {
    id: 2,
    name: "Intensivão Química - Janeiro",
    students: 234,
    progress: 0,
    status: "matriculas_abertas",
    rating: null,
    completionRate: null,
    nextClass: "15/01/2025",
  },
  {
    id: 3,
    name: "Turma ENEM 2024 - Revisão Final",
    students: 1250,
    progress: 100,
    status: "concluido",
    rating: 4.8,
    completionRate: 92,
    nextClass: null,
  },
];

const stats = [
  { label: "Total de Alunos", value: "2.331", icon: Users, color: "text-blue-500" },
  { label: "Turmas Ativas", value: "2", icon: Monitor, color: "text-emerald-500" },
  { label: "Aulas Ministradas", value: "156", icon: PlayCircle, color: "text-purple-500" },
  { label: "Taxa de Conclusão", value: "85%", icon: TrendingUp, color: "text-amber-500" },
];

export default function TurmasOnline() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativo":
        return <Badge className="bg-emerald-500">Ativo</Badge>;
      case "matriculas_abertas":
        return <Badge className="bg-blue-500">Matrículas Abertas</Badge>;
      case "concluido":
        return <Badge variant="secondary">Concluído</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-indigo-500/10 border border-border/50"
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative flex items-center justify-between p-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
                <Monitor className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Turmas Online</h1>
                <p className="text-muted-foreground">Gerencie suas turmas e alunos virtuais</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Nova Turma
              </Button>
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Relatórios
              </Button>
            </div>
          </div>
          <div className="hidden lg:block">
            <img 
              src={professorImage} 
              alt="Prof. Moisés Medeiros" 
              className="w-32 h-32 rounded-full object-cover border-4 border-cyan-500/30 shadow-xl"
            />
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-muted ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Turmas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {turmasOnline.map((turma, index) => (
          <motion.div
            key={turma.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-border/50 hover:border-primary/30 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {turma.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <Users className="h-4 w-4" />
                      {turma.students} alunos matriculados
                    </CardDescription>
                  </div>
                  {getStatusBadge(turma.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {turma.progress !== null && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progresso do curso</span>
                      <span className="font-medium">{turma.progress}%</span>
                    </div>
                    <Progress value={turma.progress} className="h-2" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {turma.rating && (
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <span>Avaliação: {turma.rating}</span>
                    </div>
                  )}
                  {turma.completionRate && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      <span>Conclusão: {turma.completionRate}%</span>
                    </div>
                  )}
                  {turma.nextClass && (
                    <div className="flex items-center gap-2 col-span-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>Próxima aula: {turma.nextClass}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1">
                    <Users className="h-4 w-4 mr-2" />
                    Ver Alunos
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Acessar Aulas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
