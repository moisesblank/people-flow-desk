import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Users, 
  Calendar,
  Clock,
  Building,
  Plus,
  Phone,
  Mail,
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import professorImage from "@/assets/professor-moises.jpg";

const turmasPresenciais = [
  {
    id: 1,
    name: "Turma Presencial - Natal/RN",
    location: "Centro de Estudos Moisés Medeiros",
    address: "Av. Prudente de Morais, 1234 - Tirol, Natal/RN",
    students: 35,
    maxStudents: 40,
    schedule: "Sábados, 8h às 12h",
    status: "ativo",
    nextClass: "14/12/2024",
  },
  {
    id: 2,
    name: "Intensivão Presencial - João Pessoa/PB",
    location: "Colégio Parceiro XYZ",
    address: "Rua das Trincheiras, 456 - Centro, João Pessoa/PB",
    students: 28,
    maxStudents: 30,
    schedule: "Quartas e Sextas, 18h às 21h",
    status: "ativo",
    nextClass: "13/12/2024",
  },
  {
    id: 3,
    name: "Aulão ENEM - Recife/PE",
    location: "Centro de Convenções",
    address: "Av. Professor Andrade Bezerra, s/n - Salgadinho, Olinda/PE",
    students: 0,
    maxStudents: 500,
    schedule: "Evento único: 05/01/2025",
    status: "em_breve",
    nextClass: "05/01/2025",
  },
];

const presenceRecord = [
  { date: "07/12/2024", present: 32, absent: 3, turma: "Natal/RN" },
  { date: "30/11/2024", present: 34, absent: 1, turma: "Natal/RN" },
  { date: "23/11/2024", present: 31, absent: 4, turma: "Natal/RN" },
];

export default function TurmasPresenciais() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativo":
        return <Badge className="bg-emerald-500">Ativo</Badge>;
      case "em_breve":
        return <Badge className="bg-amber-500">Em Breve</Badge>;
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
        className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-rose-500/10 via-pink-500/5 to-fuchsia-500/10 border border-border/50"
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative flex items-center justify-between p-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Turmas Presenciais</h1>
                <p className="text-muted-foreground">Gerencie suas turmas e eventos presenciais</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Button className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700">
                <Plus className="h-4 w-4 mr-2" />
                Nova Turma
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
              className="w-32 h-32 rounded-full object-cover border-4 border-rose-500/30 shadow-xl"
            />
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Turmas Ativas", value: "2", icon: Building, color: "text-rose-500" },
          { label: "Alunos Presenciais", value: "63", icon: Users, color: "text-blue-500" },
          { label: "Próximo Evento", value: "2 dias", icon: Calendar, color: "text-emerald-500" },
          { label: "Taxa de Presença", value: "94%", icon: CheckCircle2, color: "text-amber-500" },
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

      {/* Turmas */}
      <div className="space-y-4">
        {turmasPresenciais.map((turma, index) => (
          <motion.div
            key={turma.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-border/50 hover:border-primary/30 transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold">{turma.name}</h3>
                      {getStatusBadge(turma.status)}
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span>{turma.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{turma.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{turma.schedule}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="font-semibold">{turma.students}/{turma.maxStudents} alunos</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Próxima aula: {turma.nextClass}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Users className="h-4 w-4 mr-2" />
                        Lista de Presença
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4 mr-2" />
                        Enviar Aviso
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Presence Record */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            Registro de Presença Recente
          </CardTitle>
          <CardDescription>Últimas chamadas realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {presenceRecord.map((record, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 rounded-xl border border-border/50"
              >
                <div className="flex items-center gap-4">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{record.date}</p>
                    <p className="text-sm text-muted-foreground">{record.turma}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-emerald-500 font-medium">{record.present} presentes</span>
                    <span className="text-muted-foreground mx-2">•</span>
                    <span className="text-red-500">{record.absent} faltas</span>
                  </div>
                  <Badge variant="secondary">
                    {Math.round((record.present / (record.present + record.absent)) * 100)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
