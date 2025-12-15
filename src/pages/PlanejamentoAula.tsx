import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  PenTool, 
  Calendar, 
  Clock,
  BookOpen,
  Video,
  FileText,
  Plus,
  ChevronRight,
  CheckCircle2,
  Circle,
  Target
} from "lucide-react";
import { motion } from "framer-motion";
import professorImage from "@/assets/professor-moises.jpg";

const weekPlans = [
  {
    id: 1,
    week: "Semana 1 - Dez 2024",
    status: "em_andamento",
    topics: [
      { id: 1, title: "Introdução à Química Orgânica", completed: true, type: "video" },
      { id: 2, title: "Hidrocarbonetos - Parte 1", completed: true, type: "video" },
      { id: 3, title: "Hidrocarbonetos - Parte 2", completed: false, type: "video" },
      { id: 4, title: "Lista de Exercícios - Orgânica", completed: false, type: "exercise" },
    ]
  },
  {
    id: 2,
    week: "Semana 2 - Dez 2024",
    status: "planejado",
    topics: [
      { id: 1, title: "Funções Orgânicas - Álcoois", completed: false, type: "video" },
      { id: 2, title: "Funções Orgânicas - Aldeídos", completed: false, type: "video" },
      { id: 3, title: "Exercícios de Fixação", completed: false, type: "exercise" },
    ]
  },
  {
    id: 3,
    week: "Semana 3 - Dez 2024",
    status: "planejado",
    topics: [
      { id: 1, title: "Isomeria - Conceitos", completed: false, type: "video" },
      { id: 2, title: "Isomeria Plana", completed: false, type: "video" },
      { id: 3, title: "Isomeria Espacial", completed: false, type: "video" },
      { id: 4, title: "Revisão e Exercícios", completed: false, type: "exercise" },
    ]
  },
];

const upcomingClasses = [
  { id: 1, title: "Live - Dúvidas Orgânica", date: "Hoje, 19h", platform: "YouTube", students: 145 },
  { id: 2, title: "Aula Gravada - Aldeídos", date: "Amanhã, 10h", platform: "Plataforma", students: null },
  { id: 3, title: "Monitoria Online", date: "Quarta, 20h", platform: "Zoom", students: 32 },
];

export default function PlanejamentoAula() {
  const [selectedWeek, setSelectedWeek] = useState(weekPlans[0]);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-pink-500/10 border border-border/50"
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative flex items-center justify-between p-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                <PenTool className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Planejamento de Aulas</h1>
                <p className="text-muted-foreground">Organize suas aulas e conteúdos</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Nova Aula
              </Button>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Ver Calendário
              </Button>
            </div>
          </div>
          <div className="hidden lg:block">
            <img 
              src={professorImage} 
              alt="Prof. Moisés Medeiros" 
              className="w-32 h-32 rounded-full object-cover border-4 border-indigo-500/30 shadow-xl"
            />
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Aulas Planejadas", value: "24", icon: BookOpen, color: "text-indigo-500" },
          { label: "Aulas Gravadas", value: "18", icon: Video, color: "text-emerald-500" },
          { label: "Exercícios", value: "56", icon: FileText, color: "text-amber-500" },
          { label: "Horas de Conteúdo", value: "42h", icon: Clock, color: "text-purple-500" },
        ].map((stat, index) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Week Plans */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Planejamento Semanal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {weekPlans.map((week) => (
              <motion.div
                key={week.id}
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelectedWeek(week)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedWeek.id === week.id 
                    ? "border-primary bg-primary/5" 
                    : "border-border/50 hover:border-primary/30"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{week.week}</span>
                    <Badge variant={week.status === "em_andamento" ? "default" : "secondary"}>
                      {week.status === "em_andamento" ? "Em Andamento" : "Planejado"}
                    </Badge>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  {week.topics.map((topic) => (
                    <div key={topic.id} className="flex items-center gap-3">
                      {topic.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={topic.completed ? "text-muted-foreground line-through" : ""}>
                        {topic.title}
                      </span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {topic.type === "video" ? "Vídeo" : "Exercício"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Próximas Aulas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingClasses.map((classItem, index) => (
              <motion.div
                key={classItem.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium">{classItem.title}</span>
                  <Badge variant="outline" className="text-xs">{classItem.platform}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{classItem.date}</span>
                  {classItem.students && (
                    <>
                      <span>•</span>
                      <span>{classItem.students} alunos</span>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
