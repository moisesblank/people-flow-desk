// ============================================
// RH FUNCIONÁRIOS - GESTÃO COMPLETA DE RH
// Funcionários, Cargos, Salários, Folha de Pagamento
// ============================================

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, UserPlus, DollarSign, Calendar, Clock, 
  Award, FileText, TrendingUp, Building2, Search,
  Download, Filter, MoreVertical, Mail, Phone
} from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Funcionario {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  funcao: string;
  setor: string;
  status: string;
  data_admissao: string;
  horario_trabalho: string;
}

const SETORES = [
  { id: "todos", label: "Todos", color: "bg-gray-500" },
  { id: "administrativo", label: "Administrativo", color: "bg-blue-500" },
  { id: "academico", label: "Acadêmico", color: "bg-green-500" },
  { id: "marketing", label: "Marketing", color: "bg-purple-500" },
  { id: "suporte", label: "Suporte", color: "bg-orange-500" },
];

export default function RHFuncionarios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [setorFiltro, setSetorFiltro] = useState("todos");
  const [tabAtiva, setTabAtiva] = useState("lista");

  const { data: funcionarios, isLoading } = useQuery({
    queryKey: ["rh-funcionarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("nome", { ascending: true });

      if (error) throw error;
      return data as Funcionario[];
    },
  });

  const { data: compensacoes } = useQuery({
    queryKey: ["rh-compensacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_compensation")
        .select("*");

      if (error) throw error;
      return data;
    },
  });

  const funcionariosFiltrados = funcionarios?.filter(f => {
    const matchSearch = f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       f.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSetor = setorFiltro === "todos" || f.setor === setorFiltro;
    return matchSearch && matchSetor;
  });

  const totalFuncionarios = funcionarios?.length || 0;
  const funcionariosAtivos = funcionarios?.filter(f => f.status === "ativo").length || 0;
  const totalFolha = compensacoes?.reduce((acc, c) => acc + (c.salario || 0), 0) || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativo": return "bg-green-500/10 text-green-500";
      case "ferias": return "bg-blue-500/10 text-blue-500";
      case "afastado": return "bg-yellow-500/10 text-yellow-500";
      case "desligado": return "bg-red-500/10 text-red-500";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Recursos Humanos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestão completa de funcionários e folha de pagamento
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Novo Funcionário
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Funcionários</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFuncionarios}</div>
            <p className="text-xs text-muted-foreground">{funcionariosAtivos} ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Folha Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalFolha)}</div>
            <p className="text-xs text-muted-foreground">Salários + benefícios</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">De Férias</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funcionarios?.filter(f => f.status === "ferias").length || 0}</div>
            <p className="text-xs text-muted-foreground">Funcionários</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Média Salarial</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalFolha / (totalFuncionarios || 1))}
            </div>
            <p className="text-xs text-muted-foreground">Por funcionário</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tabAtiva} onValueChange={setTabAtiva}>
        <TabsList>
          <TabsTrigger value="lista">Lista de Funcionários</TabsTrigger>
          <TabsTrigger value="folha">Folha de Pagamento</TabsTrigger>
          <TabsTrigger value="cargos">Cargos e Salários</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar funcionário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {SETORES.map((setor) => (
                <Button
                  key={setor.id}
                  variant={setorFiltro === setor.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSetorFiltro(setor.id)}
                >
                  {setor.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Lista */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Admissão</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : funcionariosFiltrados && funcionariosFiltrados.length > 0 ? (
                    funcionariosFiltrados.map((func) => (
                      <TableRow key={func.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(func.nome)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{func.nome}</p>
                              <p className="text-xs text-muted-foreground">{func.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{func.funcao}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {func.setor || "Não definido"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(func.status)}>
                            {func.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {func.data_admissao 
                            ? new Date(func.data_admissao).toLocaleDateString("pt-BR")
                            : "-"
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {func.email && (
                              <Button variant="ghost" size="icon" onClick={() => window.open(`mailto:${func.email}`)}>
                                <Mail className="h-4 w-4" />
                              </Button>
                            )}
                            {func.telefone && (
                              <Button variant="ghost" size="icon" onClick={() => window.open(`tel:${func.telefone}`)}>
                                <Phone className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum funcionário encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="folha">
          <Card>
            <CardHeader>
              <CardTitle>Folha de Pagamento</CardTitle>
              <CardDescription>Detalhamento da folha do mês atual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Folha de pagamento em desenvolvimento</p>
                <p className="text-sm">Em breve: cálculo automático de INSS, FGTS e IRRF</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cargos">
          <Card>
            <CardHeader>
              <CardTitle>Cargos e Salários</CardTitle>
              <CardDescription>Estrutura de cargos da empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Módulo de cargos em desenvolvimento</p>
                <p className="text-sm">Em breve: tabela salarial, promoções e avaliações</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
