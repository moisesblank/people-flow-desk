// ============================================
// CENTRAL DO ALUNO - BANCO DE QUESTÕES
// Química ENEM - Prof. Moisés Medeiros
// ============================================

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, Brain, Filter, Target, Clock, 
  CheckCircle2, XCircle, ChevronRight, Zap
} from "lucide-react";
import { motion } from "framer-motion";

interface Questao {
  id: string;
  enunciado: string;
  assunto: string;
  dificuldade: "facil" | "medio" | "dificil";
  fonte: string;
  ano: number;
  respondida: boolean;
  acertou?: boolean;
}

const questoesDemo: Questao[] = [
  { id: "1", enunciado: "Considere a reação de combustão do etanol...", assunto: "Termoquímica", dificuldade: "medio", fonte: "ENEM", ano: 2023, respondida: true, acertou: true },
  { id: "2", enunciado: "Um químico preparou uma solução aquosa...", assunto: "Soluções", dificuldade: "facil", fonte: "ENEM", ano: 2022, respondida: true, acertou: false },
  { id: "3", enunciado: "A tabela periódica organiza os elementos...", assunto: "Tabela Periódica", dificuldade: "facil", fonte: "ENEM", ano: 2023, respondida: false },
  { id: "4", enunciado: "Em uma reação de oxirredução...", assunto: "Eletroquímica", dificuldade: "dificil", fonte: "ENEM", ano: 2021, respondida: false },
  { id: "5", enunciado: "O modelo atômico de Bohr explica...", assunto: "Estrutura Atômica", dificuldade: "medio", fonte: "FUVEST", ano: 2022, respondida: true, acertou: true },
  { id: "6", enunciado: "A velocidade de uma reação química...", assunto: "Cinética", dificuldade: "dificil", fonte: "UNICAMP", ano: 2023, respondida: false },
];

const dificuldadeCores = {
  facil: "bg-green-500/10 text-green-600 border-green-500/20",
  medio: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  dificil: "bg-red-500/10 text-red-600 border-red-500/20",
};

const dificuldadeLabels = {
  facil: "Fácil",
  medio: "Médio",
  dificil: "Difícil",
};

export default function AlunoQuestoes() {
  const [busca, setBusca] = useState("");
  const [assunto, setAssunto] = useState("todos");
  const [dificuldade, setDificuldade] = useState("todas");

  const estatisticas = {
    total: 5432,
    resolvidas: 456,
    acertos: 78,
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header com Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="md:col-span-2 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Banco de Questões</h1>
                <p className="text-muted-foreground">+{estatisticas.total} questões comentadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{estatisticas.resolvidas}</p>
              <p className="text-xs text-muted-foreground">Resolvidas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Target className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{estatisticas.acertos}%</p>
              <p className="text-xs text-muted-foreground">Taxa de acerto</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por palavras-chave..." 
                className="pl-10"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            
            <Select value={assunto} onValueChange={setAssunto}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Assunto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os assuntos</SelectItem>
                <SelectItem value="termoquimica">Termoquímica</SelectItem>
                <SelectItem value="solucoes">Soluções</SelectItem>
                <SelectItem value="eletroquimica">Eletroquímica</SelectItem>
                <SelectItem value="organica">Química Orgânica</SelectItem>
                <SelectItem value="estequiometria">Estequiometria</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dificuldade} onValueChange={setDificuldade}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Dificuldade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="facil">Fácil</SelectItem>
                <SelectItem value="medio">Médio</SelectItem>
                <SelectItem value="dificil">Difícil</SelectItem>
              </SelectContent>
            </Select>

            <Button>
              <Zap className="w-4 h-4 mr-2" />
              Treino Rápido
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Questões */}
      <div className="space-y-4">
        {questoesDemo.map((questao, index) => (
          <motion.div
            key={questao.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={`transition-all hover:shadow-md ${
              questao.respondida 
                ? questao.acertou 
                  ? "border-l-4 border-l-green-500" 
                  : "border-l-4 border-l-red-500"
                : ""
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="outline">{questao.assunto}</Badge>
                      <Badge className={dificuldadeCores[questao.dificuldade]}>
                        {dificuldadeLabels[questao.dificuldade]}
                      </Badge>
                      <Badge variant="secondary">{questao.fonte} {questao.ano}</Badge>
                      {questao.respondida && (
                        <Badge variant={questao.acertou ? "default" : "destructive"}>
                          {questao.acertou ? (
                            <><CheckCircle2 className="w-3 h-3 mr-1" /> Acertou</>
                          ) : (
                            <><XCircle className="w-3 h-3 mr-1" /> Errou</>
                          )}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm line-clamp-2">{questao.enunciado}</p>
                  </div>
                  <Button variant={questao.respondida ? "outline" : "default"}>
                    {questao.respondida ? "Revisar" : "Resolver"}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Load More */}
      <div className="flex justify-center">
        <Button variant="outline" size="lg">
          Carregar mais questões
        </Button>
      </div>
    </div>
  );
}
