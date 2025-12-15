import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  GraduationCap, 
  Search, 
  BookOpen, 
  Users, 
  TrendingUp,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Download,
  Eye,
  UserPlus
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Student {
  id: number;
  nome: string;
  email: string | null;
  curso: string | null;
  status: string | null;
  wordpress_id: string | null;
  created_at: string | null;
}

export default function PortalAluno() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      toast.error('Erro ao carregar alunos');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    const matchesCourse = courseFilter === "all" || student.curso === courseFilter;
    
    return matchesSearch && matchesStatus && matchesCourse;
  });

  const courses = [...new Set(students.map(s => s.curso).filter(Boolean))];
  const statuses = [...new Set(students.map(s => s.status).filter(Boolean))];

  const stats = {
    total: students.length,
    active: students.filter(s => s.status === 'ativo').length,
    inactive: students.filter(s => s.status === 'inativo').length,
    pending: students.filter(s => s.status === 'pendente').length
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'ativo': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'inativo': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'pendente': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'ativo': return <CheckCircle className="h-4 w-4" />;
      case 'inativo': return <XCircle className="h-4 w-4" />;
      case 'pendente': return <Clock className="h-4 w-4" />;
      default: return null;
    }
  };

  const exportToCSV = () => {
    const headers = ['Nome', 'Email', 'Curso', 'Status', 'Data de Cadastro'];
    const rows = filteredStudents.map(s => [
      s.nome,
      s.email || '',
      s.curso || '',
      s.status || '',
      s.created_at ? format(new Date(s.created_at), 'dd/MM/yyyy') : ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `alunos_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    
    toast.success('Relatório exportado com sucesso!');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-primary" />
              Portal do Aluno
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todos os alunos matriculados nos cursos
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Aluno
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total de Alunos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.active}</p>
                    <p className="text-xs text-muted-foreground">Ativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.pending}</p>
                    <p className="text-xs text-muted-foreground">Pendentes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.inactive}</p>
                    <p className="text-xs text-muted-foreground">Inativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-background text-sm"
                >
                  <option value="all">Todos os Status</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                
                <select 
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-background text-sm"
                >
                  <option value="all">Todos os Cursos</option>
                  {courses.map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Alunos</CardTitle>
            <CardDescription>
              {filteredStudents.length} aluno(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-4">Carregando alunos...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-12 text-center">
                <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum aluno encontrado</h3>
                <p className="text-muted-foreground">
                  Ajuste os filtros ou adicione novos alunos
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredStudents.map((student, index) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {student.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{student.nome}</h4>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {student.email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3" />
                            {student.email}
                          </span>
                        )}
                        {student.curso && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {student.curso}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <Badge className={getStatusColor(student.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(student.status)}
                        {student.status || 'N/A'}
                      </span>
                    </Badge>
                    
                    <div className="text-sm text-muted-foreground">
                      {student.created_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(student.created_at), 'dd/MM/yy', { locale: ptBR })}
                        </span>
                      )}
                    </div>
                    
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Course Distribution */}
        {courses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Curso</CardTitle>
              <CardDescription>Quantidade de alunos em cada curso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.map(course => {
                  const count = students.filter(s => s.curso === course).length;
                  const percentage = (count / students.length) * 100;
                  
                  return (
                    <div key={course} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{course}</span>
                        <span className="text-muted-foreground">{count} alunos ({percentage.toFixed(0)}%)</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
