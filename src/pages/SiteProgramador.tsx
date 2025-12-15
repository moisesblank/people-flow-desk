import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Code, 
  User,
  CheckCircle2,
  Circle,
  Plus,
  MessageSquare,
  Clock,
  AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  tasks: Task[];
  color: string;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: "alta" | "media" | "baixa";
  deadline?: string;
}

const teamMembers: TeamMember[] = [
  {
    id: "jean",
    name: "Jean",
    role: "Desenvolvedor",
    color: "from-blue-500 to-cyan-500",
    tasks: [
      { id: "1", title: "Atualizar página de vendas", completed: true, priority: "alta" },
      { id: "2", title: "Corrigir bug do checkout", completed: false, priority: "alta", deadline: "15/12" },
      { id: "3", title: "Implementar nova área do aluno", completed: false, priority: "media" },
      { id: "4", title: "Otimizar carregamento", completed: false, priority: "baixa" },
    ]
  },
  {
    id: "danilo",
    name: "Danilo",
    role: "Designer/Dev",
    color: "from-purple-500 to-pink-500",
    tasks: [
      { id: "1", title: "Redesign landing page", completed: true, priority: "alta" },
      { id: "2", title: "Criar banners ENEM 2025", completed: true, priority: "alta" },
      { id: "3", title: "Animações de transição", completed: false, priority: "media" },
      { id: "4", title: "Responsividade mobile", completed: false, priority: "media" },
    ]
  },
];

const studioChecklist = [
  { id: "1", task: "Verificar iluminação", completed: true, category: "Equipamento" },
  { id: "2", task: "Testar áudio", completed: true, category: "Equipamento" },
  { id: "3", task: "Backup das gravações", completed: false, category: "Pós-produção" },
  { id: "4", task: "Atualizar OBS", completed: true, category: "Software" },
  { id: "5", task: "Limpar lentes", completed: false, category: "Equipamento" },
  { id: "6", task: "Verificar espaço em disco", completed: false, category: "Software" },
  { id: "7", task: "Testar conexão internet", completed: true, category: "Infraestrutura" },
  { id: "8", task: "Preparar roteiro", completed: false, category: "Conteúdo" },
];

export default function SiteProgramador() {
  const [selectedMember, setSelectedMember] = useState<string>("jean");

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "alta":
        return <Badge className="bg-red-500">Alta</Badge>;
      case "media":
        return <Badge className="bg-amber-500">Média</Badge>;
      case "baixa":
        return <Badge variant="secondary">Baixa</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
          <Code className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Site & Programador</h1>
          <p className="text-muted-foreground">Gerencie a equipe de desenvolvimento</p>
        </div>
      </motion.div>

      <Tabs defaultValue="equipe" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="equipe">Equipe</TabsTrigger>
          <TabsTrigger value="jean">Jean</TabsTrigger>
          <TabsTrigger value="danilo">Danilo</TabsTrigger>
          <TabsTrigger value="studio">Checklist Studio</TabsTrigger>
        </TabsList>

        <TabsContent value="equipe" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teamMembers.map((member) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-border/50 hover:border-primary/30 transition-all">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center`}>
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle>{member.name}</CardTitle>
                        <CardDescription>{member.role}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {member.tasks.slice(0, 3).map((task) => (
                        <div key={task.id} className="flex items-center gap-3">
                          {task.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className={task.completed ? "line-through text-muted-foreground" : ""}>
                            {task.title}
                          </span>
                          {getPriorityBadge(task.priority)}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Mensagem
                      </Button>
                      <Button size="sm" className="flex-1">
                        Ver Todas
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {teamMembers.map((member) => (
          <TabsContent key={member.id} value={member.id} className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center`}>
                      <User className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{member.name}</CardTitle>
                      <CardDescription>{member.role}</CardDescription>
                    </div>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Tarefa
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {member.tasks.map((task) => (
                    <div 
                      key={task.id} 
                      className={`flex items-center justify-between p-4 rounded-xl border ${
                        task.completed ? "bg-emerald-500/5 border-emerald-500/20" : "border-border/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={task.completed} />
                        <span className={task.completed ? "line-through text-muted-foreground" : "font-medium"}>
                          {task.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {task.deadline && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {task.deadline}
                          </div>
                        )}
                        {getPriorityBadge(task.priority)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        <TabsContent value="studio" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Checklist do Studio
              </CardTitle>
              <CardDescription>Verificações antes de gravar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {studioChecklist.map((item) => (
                  <div 
                    key={item.id}
                    className={`flex items-center gap-3 p-4 rounded-xl border ${
                      item.completed ? "bg-emerald-500/5 border-emerald-500/20" : "border-border/50"
                    }`}
                  >
                    <Checkbox checked={item.completed} />
                    <div className="flex-1">
                      <span className={item.completed ? "line-through text-muted-foreground" : ""}>
                        {item.task}
                      </span>
                      <Badge variant="outline" className="ml-2 text-xs">{item.category}</Badge>
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
