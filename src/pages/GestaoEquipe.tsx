// ============================================
// MOISÉS MEDEIROS v7.0 - GESTÃO DE EQUIPE
// Spider-Man Theme - Ponto e Jornada
// ============================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Clock, 
  Sparkles, 
  Calendar,
  Timer,
  UserCheck,
  FileText,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  XCircle,
  PlayCircle,
  PauseCircle,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Employee {
  id: number;
  nome: string;
  funcao: string;
  status: string;
  data_admissao: string | null;
}

interface TimeRecord {
  id: string;
  employee_id: number;
  employee_name: string;
  date: Date;
  entry: string;
  lunch_start: string | null;
  lunch_end: string | null;
  exit: string | null;
}

export default function GestaoEquipe() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchEmployees();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("id, nome, funcao, status, data_admissao")
        .order("nome");
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockIn = (type: "entry" | "lunch_start" | "lunch_end" | "exit") => {
    if (!selectedEmployee) {
      toast({
        title: "Selecione um funcionário",
        description: "Escolha o funcionário para registrar o ponto.",
        variant: "destructive",
      });
      return;
    }

    const employee = employees.find(e => e.id.toString() === selectedEmployee);
    const now = format(new Date(), "HH:mm");
    
    toast({
      title: "Ponto registrado!",
      description: `${employee?.nome} - ${type === "entry" ? "Entrada" : type === "lunch_start" ? "Saída Almoço" : type === "lunch_end" ? "Volta Almoço" : "Saída"}: ${now}`,
    });
  };

  const statusCounts = {
    ativo: employees.filter(e => e.status === "ativo").length,
    ferias: employees.filter(e => e.status === "ferias").length,
    afastado: employees.filter(e => e.status === "afastado").length,
    inativo: employees.filter(e => e.status === "inativo").length,
  };

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="space-y-2">
            <motion.div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium tracking-wide uppercase">Recursos Humanos</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              Gestão de Equipe
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Controle de ponto, férias e documentos dos funcionários.
            </p>
          </div>
        </motion.header>

        {/* Status Overview */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[
            { label: "Ativos", value: statusCounts.ativo, icon: CheckCircle2, color: "text-[hsl(var(--stats-green))]", bg: "bg-[hsl(var(--stats-green))]/10" },
            { label: "Férias", value: statusCounts.ferias, icon: Calendar, color: "text-[hsl(var(--stats-blue))]", bg: "bg-[hsl(var(--stats-blue))]/10" },
            { label: "Afastados", value: statusCounts.afastado, icon: AlertCircle, color: "text-[hsl(var(--stats-gold))]", bg: "bg-[hsl(var(--stats-gold))]/10" },
            { label: "Inativos", value: statusCounts.inativo, icon: XCircle, color: "text-muted-foreground", bg: "bg-secondary" },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className={`inline-flex p-3 rounded-xl ${item.bg} mb-4`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <p className="text-3xl font-bold text-foreground">{item.value}</p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </motion.div>
          ))}
        </section>

        <Tabs defaultValue="ponto" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-secondary/50">
            <TabsTrigger value="ponto" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Controle de Ponto</span>
            </TabsTrigger>
            <TabsTrigger value="ferias" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Férias/Afastamentos</span>
            </TabsTrigger>
            <TabsTrigger value="documentos" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Documentos</span>
            </TabsTrigger>
          </TabsList>

          {/* Time Clock */}
          <TabsContent value="ponto">
            <div className="grid gap-6 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl p-6"
              >
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                  <Timer className="h-5 w-5 text-primary" />
                  Registrar Ponto
                </h3>

                <div className="text-center mb-6">
                  <p className="text-4xl font-bold text-foreground font-mono">
                    {format(currentTime, "HH:mm:ss")}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(currentTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Funcionário</Label>
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger className="bg-secondary/50 mt-1">
                        <SelectValue placeholder="Selecione o funcionário" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.nome} - {emp.funcao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={() => handleClockIn("entry")} 
                      className="h-16 flex-col gap-1"
                      variant="outline"
                    >
                      <PlayCircle className="h-5 w-5 text-[hsl(var(--stats-green))]" />
                      <span className="text-xs">Entrada</span>
                    </Button>
                    <Button 
                      onClick={() => handleClockIn("lunch_start")} 
                      className="h-16 flex-col gap-1"
                      variant="outline"
                    >
                      <PauseCircle className="h-5 w-5 text-[hsl(var(--stats-gold))]" />
                      <span className="text-xs">Saída Almoço</span>
                    </Button>
                    <Button 
                      onClick={() => handleClockIn("lunch_end")} 
                      className="h-16 flex-col gap-1"
                      variant="outline"
                    >
                      <PlayCircle className="h-5 w-5 text-[hsl(var(--stats-blue))]" />
                      <span className="text-xs">Volta Almoço</span>
                    </Button>
                    <Button 
                      onClick={() => handleClockIn("exit")} 
                      className="h-16 flex-col gap-1"
                      variant="outline"
                    >
                      <XCircle className="h-5 w-5 text-destructive" />
                      <span className="text-xs">Saída</span>
                    </Button>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-2xl p-6"
              >
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  Registros de Hoje
                </h3>

                <div className="space-y-3">
                  {employees.filter(e => e.status === "ativo").slice(0, 5).map((emp, index) => (
                    <motion.div
                      key={emp.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className="flex items-center justify-between p-3 rounded-xl bg-secondary/30"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{emp.nome}</p>
                        <p className="text-xs text-muted-foreground">{emp.funcao}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[hsl(var(--stats-green))]">--:--</p>
                        <p className="text-xs text-muted-foreground">Aguardando</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </TabsContent>

          {/* Vacation/Leave */}
          <TabsContent value="ferias">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Histórico de Férias e Afastamentos
                </h3>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Agendar
                </Button>
              </div>

              <div className="space-y-4">
                {employees.filter(e => e.status === "ferias" || e.status === "afastado").length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum funcionário em férias ou afastamento.</p>
                  </div>
                ) : (
                  employees.filter(e => e.status === "ferias" || e.status === "afastado").map((emp) => (
                    <div key={emp.id} className="p-4 rounded-xl bg-secondary/30 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{emp.nome}</p>
                        <p className="text-sm text-muted-foreground">{emp.funcao}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        emp.status === "ferias" 
                          ? "bg-[hsl(var(--stats-blue))]/20 text-[hsl(var(--stats-blue))]"
                          : "bg-[hsl(var(--stats-gold))]/20 text-[hsl(var(--stats-gold))]"
                      }`}>
                        {emp.status === "ferias" ? "Férias" : "Afastado"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documentos">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Documentos por Funcionário
                </h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {employees.slice(0, 6).map((emp, index) => (
                  <motion.div
                    key={emp.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * index }}
                    className="p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {emp.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{emp.nome}</p>
                        <p className="text-xs text-muted-foreground">{emp.funcao}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      <span>0 documentos</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
                <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-foreground font-medium">Upload de documentos em breve</p>
                <p className="text-xs text-muted-foreground">Contratos, atestados, certificados e mais.</p>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
