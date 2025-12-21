// ============================================
// CENTRAL DO ALUNO - VIDEOAULAS
// Química ENEM - Prof. Moisés Medeiros
// ============================================

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PlayCircle, Search, Clock, BookOpen, Filter, 
  ChevronRight, Lock, CheckCircle2, Star
} from "lucide-react";
import { motion } from "framer-motion";

interface Modulo {
  id: string;
  titulo: string;
  descricao: string;
  aulas: number;
  duracao: string;
  progresso: number;
  bloqueado: boolean;
  destaque: boolean;
}

const modulos: Modulo[] = [
  { id: "1", titulo: "Introdução à Química", descricao: "Fundamentos e conceitos básicos", aulas: 8, duracao: "3h 20min", progresso: 100, bloqueado: false, destaque: false },
  { id: "2", titulo: "Estrutura Atômica", descricao: "Modelos atômicos e distribuição eletrônica", aulas: 12, duracao: "5h 45min", progresso: 85, bloqueado: false, destaque: false },
  { id: "3", titulo: "Tabela Periódica", descricao: "Propriedades periódicas e classificação", aulas: 10, duracao: "4h 30min", progresso: 60, bloqueado: false, destaque: true },
  { id: "4", titulo: "Ligações Químicas", descricao: "Iônica, covalente e metálica", aulas: 15, duracao: "6h 15min", progresso: 25, bloqueado: false, destaque: false },
  { id: "5", titulo: "Estequiometria", descricao: "Cálculos químicos e balanceamento", aulas: 18, duracao: "7h 40min", progresso: 0, bloqueado: false, destaque: true },
  { id: "6", titulo: "Soluções", descricao: "Concentração e diluição", aulas: 10, duracao: "4h 20min", progresso: 0, bloqueado: true, destaque: false },
  { id: "7", titulo: "Termoquímica", descricao: "Energia nas reações químicas", aulas: 12, duracao: "5h 10min", progresso: 0, bloqueado: true, destaque: false },
  { id: "8", titulo: "Cinética Química", descricao: "Velocidade das reações", aulas: 8, duracao: "3h 50min", progresso: 0, bloqueado: true, destaque: false },
];

export default function AlunoVideoaulas() {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");

  const modulosFiltrados = modulos.filter(m => 
    m.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    m.descricao.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Videoaulas</h1>
          <p className="text-muted-foreground">Assista às aulas e domine a Química</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-primary border-primary">
            <PlayCircle className="w-3 h-3 mr-1" />
            128 aulas disponíveis
          </Badge>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por módulo ou assunto..." 
            className="pl-10"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <Tabs value={filtro} onValueChange={setFiltro} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="em-andamento">Em andamento</TabsTrigger>
            <TabsTrigger value="concluidos">Concluídos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Grid de Módulos */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modulosFiltrados.map((modulo, index) => (
          <motion.div
            key={modulo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={`relative overflow-hidden transition-all hover:shadow-lg ${
              modulo.bloqueado ? "opacity-60" : ""
            } ${modulo.destaque ? "ring-2 ring-primary" : ""}`}>
              {modulo.destaque && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-primary">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Recomendado
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {modulo.progresso === 100 ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : modulo.bloqueado ? (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <PlayCircle className="w-5 h-5 text-primary" />
                    )}
                    <CardTitle className="text-lg">{modulo.titulo}</CardTitle>
                  </div>
                </div>
                <CardDescription>{modulo.descricao}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {modulo.aulas} aulas
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {modulo.duracao}
                  </span>
                </div>

                {!modulo.bloqueado && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Progresso</span>
                      <span className="font-medium">{modulo.progresso}%</span>
                    </div>
                    <Progress value={modulo.progresso} className="h-2" />
                  </div>
                )}

                <Button 
                  className="w-full" 
                  variant={modulo.bloqueado ? "secondary" : "default"}
                  disabled={modulo.bloqueado}
                >
                  {modulo.bloqueado ? (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Bloqueado
                    </>
                  ) : modulo.progresso === 100 ? (
                    <>
                      Revisar módulo
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  ) : modulo.progresso > 0 ? (
                    <>
                      Continuar
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Começar agora
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
