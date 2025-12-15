// ============================================
// SYNAPSE v5.0 - Página de Ponto Eletrônico
// ============================================

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Calendar,
  FileText,
  Users,
  TrendingUp,
  Download,
  Filter,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Coffee,
  LogIn,
  LogOut,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TimeClockWidget } from "@/components/time-clock/TimeClockWidget";
import { StatCard } from "@/components/employees/StatCard";
import { useAuth } from "@/hooks/useAuth";
import {
  useMyTimeClockEntries,
  useMyTimeClockReports,
  useMyAbsences,
  useAllTimeClockEntries,
  formatMinutesToHours,
} from "@/hooks/useTimeClock";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PontoEletronico() {
  const { role } = useAuth();
  const isAdmin = role === "owner" || role === "admin";
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");

  const dateRange = {
    start: startOfMonth(selectedMonth),
    end: endOfMonth(selectedMonth),
  };

  const { data: myEntries = [], isLoading: loadingEntries } = useMyTimeClockEntries(dateRange);
  const { data: myReports = [], isLoading: loadingReports } = useMyTimeClockReports(selectedMonth);
  const { data: myAbsences = [] } = useMyAbsences();
  const { data: allEntries = [], isLoading: loadingAll } = useAllTimeClockEntries(
    isAdmin ? { startDate: dateRange.start, endDate: dateRange.end } : undefined
  );

  // Calcular estatísticas do mês
  const monthStats = {
    totalDays: myReports.length,
    totalHours: myReports.reduce((acc, r) => acc + r.total_worked_minutes, 0),
    overtimeHours: myReports.reduce((acc, r) => acc + r.overtime_minutes, 0),
    lateCount: myReports.filter((r) => r.late_minutes > 0).length,
    absences: myAbsences.filter(
      (a) =>
        new Date(a.absence_date) >= dateRange.start &&
        new Date(a.absence_date) <= dateRange.end
    ).length,
  };

  const entryTypeConfig = {
    entrada: { label: "Entrada", icon: LogIn, color: "text-stats-green" },
    inicio_almoco: { label: "Almoço", icon: Coffee, color: "text-stats-gold" },
    fim_almoco: { label: "Retorno", icon: Coffee, color: "text-stats-blue" },
    saida: { label: "Saída", icon: LogOut, color: "text-primary" },
  };

  // Meses disponíveis para seleção
  const availableMonths = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), i));

  return (
    <div className="p-4 md:p-8 lg:p-12 space-y-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Ponto Eletrônico
          </h1>
          <p className="text-muted-foreground mt-1">
            Controle de jornada com geolocalização e relatórios
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={format(selectedMonth, "yyyy-MM")}
            onValueChange={(v) => setSelectedMonth(new Date(v + "-01"))}
          >
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((month) => (
                <SelectItem key={month.toISOString()} value={format(month, "yyyy-MM")}>
                  {format(month, "MMMM yyyy", { locale: ptBR })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </motion.header>

      {/* Widget e Stats */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <TimeClockWidget />
        </div>

        <div className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Dias Trabalhados"
              value={monthStats.totalDays}
              icon={Calendar}
              variant="blue"
              delay={0}
            />
            <StatCard
              title="Horas Totais"
              value={monthStats.totalHours}
              formatFn={(v) => formatMinutesToHours(v)}
              icon={Clock}
              variant="green"
              delay={1}
            />
            <StatCard
              title="Horas Extras"
              value={monthStats.overtimeHours}
              formatFn={(v) => formatMinutesToHours(v)}
              icon={TrendingUp}
              variant="purple"
              delay={2}
            />
            <StatCard
              title="Ausências"
              value={monthStats.absences}
              icon={AlertTriangle}
              variant="red"
              delay={3}
            />
          </div>
        </div>
      </div>

      {/* Tabs de conteúdo */}
      <Tabs defaultValue="registros" className="space-y-6">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="registros" className="gap-2">
            <Clock className="h-4 w-4" />
            Registros
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="gap-2">
            <FileText className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="equipe" className="gap-2">
              <Users className="h-4 w-4" />
              Equipe
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab Registros */}
        <TabsContent value="registros">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Meus Registros do Mês</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingEntries ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando...
                </div>
              ) : myEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum registro neste período
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myEntries.map((entry) => {
                      const config = entryTypeConfig[entry.entry_type];
                      const date = new Date(entry.registered_at);
                      return (
                        <TableRow key={entry.id}>
                          <TableCell>
                            {format(date, "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <div className={`flex items-center gap-2 ${config.color}`}>
                              <config.icon className="h-4 w-4" />
                              {config.label}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">
                            {format(date, "HH:mm:ss")}
                          </TableCell>
                          <TableCell>
                            {entry.location_address ? (
                              <span className="text-xs line-clamp-1 max-w-[200px]">
                                {entry.location_address}
                              </span>
                            ) : entry.latitude ? (
                              <Badge variant="outline" className="text-xs">
                                GPS registrado
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {entry.approved_at ? (
                              <Badge variant="default" className="bg-stats-green">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Aprovado
                              </Badge>
                            ) : entry.is_manual ? (
                              <Badge variant="secondary">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Pendente
                              </Badge>
                            ) : (
                              <Badge variant="outline">Automático</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Relatórios */}
        <TabsContent value="relatorios">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Relatórios Diários</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingReports ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando...
                </div>
              ) : myReports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum relatório neste período
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Trabalhadas</TableHead>
                      <TableHead>Extras</TableHead>
                      <TableHead>Atraso</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          {format(new Date(report.report_date), "dd/MM/yyyy (EEEE)", {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatMinutesToHours(report.total_worked_minutes)}
                        </TableCell>
                        <TableCell className="font-mono text-stats-green">
                          +{formatMinutesToHours(report.overtime_minutes)}
                        </TableCell>
                        <TableCell className="font-mono text-destructive">
                          {report.late_minutes > 0
                            ? `-${formatMinutesToHours(report.late_minutes)}`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {report.status === "aprovado" ? (
                            <Badge className="bg-stats-green">Aprovado</Badge>
                          ) : report.status === "rejeitado" ? (
                            <Badge variant="destructive">Rejeitado</Badge>
                          ) : (
                            <Badge variant="secondary">Pendente</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Equipe (Admin) */}
        {isAdmin && (
          <TabsContent value="equipe">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Registros da Equipe</CardTitle>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtrar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingAll ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </div>
                ) : allEntries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum registro neste período
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Funcionário</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Local</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allEntries.slice(0, 50).map((entry: any) => {
                        const config = entryTypeConfig[entry.entry_type as keyof typeof entryTypeConfig];
                        const date = new Date(entry.registered_at);
                        return (
                          <TableRow key={entry.id}>
                            <TableCell className="font-medium">
                              {entry.employees?.nome || "N/A"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {entry.employees?.funcao || "-"}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {format(date, "dd/MM/yyyy")}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono">
                                {format(date, "HH:mm:ss")}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className={`flex items-center gap-2 ${config?.color}`}>
                                {config?.icon && <config.icon className="h-4 w-4" />}
                                {config?.label || entry.entry_type}
                              </div>
                            </TableCell>
                            <TableCell>
                              {entry.latitude ? (
                                <Badge variant="outline" className="text-xs">
                                  GPS ✓
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
