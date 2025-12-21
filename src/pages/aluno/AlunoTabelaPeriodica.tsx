// ============================================
// CENTRAL DO ALUNO - TABELA PERIÓDICA INTERATIVA
// Química ENEM - Prof. Moisés Medeiros
// ============================================

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, Info, AtomIcon, Zap, Thermometer, Flame
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Elemento {
  numero: number;
  simbolo: string;
  nome: string;
  massaAtomica: number;
  categoria: string;
  grupo: number;
  periodo: number;
  configuracaoEletronica: string;
  eletronegatividade?: number;
  pontoFusao?: number;
  pontoEbulicao?: number;
}

const elementosDemo: Elemento[] = [
  { numero: 1, simbolo: "H", nome: "Hidrogênio", massaAtomica: 1.008, categoria: "nao-metal", grupo: 1, periodo: 1, configuracaoEletronica: "1s¹", eletronegatividade: 2.2, pontoFusao: -259, pontoEbulicao: -253 },
  { numero: 2, simbolo: "He", nome: "Hélio", massaAtomica: 4.003, categoria: "gas-nobre", grupo: 18, periodo: 1, configuracaoEletronica: "1s²", pontoFusao: -272, pontoEbulicao: -269 },
  { numero: 6, simbolo: "C", nome: "Carbono", massaAtomica: 12.011, categoria: "nao-metal", grupo: 14, periodo: 2, configuracaoEletronica: "1s² 2s² 2p²", eletronegatividade: 2.55, pontoFusao: 3550, pontoEbulicao: 4827 },
  { numero: 8, simbolo: "O", nome: "Oxigênio", massaAtomica: 15.999, categoria: "nao-metal", grupo: 16, periodo: 2, configuracaoEletronica: "1s² 2s² 2p⁴", eletronegatividade: 3.44, pontoFusao: -218, pontoEbulicao: -183 },
  { numero: 11, simbolo: "Na", nome: "Sódio", massaAtomica: 22.990, categoria: "metal-alcalino", grupo: 1, periodo: 3, configuracaoEletronica: "1s² 2s² 2p⁶ 3s¹", eletronegatividade: 0.93, pontoFusao: 98, pontoEbulicao: 883 },
  { numero: 17, simbolo: "Cl", nome: "Cloro", massaAtomica: 35.45, categoria: "halogenio", grupo: 17, periodo: 3, configuracaoEletronica: "1s² 2s² 2p⁶ 3s² 3p⁵", eletronegatividade: 3.16, pontoFusao: -101, pontoEbulicao: -34 },
  { numero: 26, simbolo: "Fe", nome: "Ferro", massaAtomica: 55.845, categoria: "metal-transicao", grupo: 8, periodo: 4, configuracaoEletronica: "[Ar] 3d⁶ 4s²", eletronegatividade: 1.83, pontoFusao: 1538, pontoEbulicao: 2862 },
  { numero: 79, simbolo: "Au", nome: "Ouro", massaAtomica: 196.97, categoria: "metal-transicao", grupo: 11, periodo: 6, configuracaoEletronica: "[Xe] 4f¹⁴ 5d¹⁰ 6s¹", eletronegatividade: 2.54, pontoFusao: 1064, pontoEbulicao: 2856 },
];

const categoriaCores: Record<string, string> = {
  "metal-alcalino": "bg-red-500",
  "metal-alcalino-terroso": "bg-orange-500",
  "metal-transicao": "bg-yellow-500",
  "nao-metal": "bg-green-500",
  "halogenio": "bg-teal-500",
  "gas-nobre": "bg-purple-500",
  "lantanideos": "bg-pink-500",
  "actinideos": "bg-rose-500",
};

export default function AlunoTabelaPeriodica() {
  const [busca, setBusca] = useState("");
  const [elementoSelecionado, setElementoSelecionado] = useState<Elemento | null>(null);

  const elementosFiltrados = elementosDemo.filter(e =>
    e.nome.toLowerCase().includes(busca.toLowerCase()) ||
    e.simbolo.toLowerCase().includes(busca.toLowerCase()) ||
    e.numero.toString().includes(busca)
  );

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <AtomIcon className="w-8 h-8 text-primary" />
            Tabela Periódica Interativa
          </h1>
          <p className="text-muted-foreground">Explore os elementos e suas propriedades</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar elemento..." 
            className="pl-10"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      {/* Grid de Elementos */}
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2">
        {elementosFiltrados.map((elemento) => (
          <motion.div
            key={elemento.numero}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setElementoSelecionado(elemento)}
            className={`cursor-pointer p-2 rounded-lg text-center ${
              categoriaCores[elemento.categoria] || "bg-gray-500"
            } text-white shadow-lg hover:shadow-xl transition-shadow`}
          >
            <div className="text-xs opacity-75">{elemento.numero}</div>
            <div className="text-2xl font-bold">{elemento.simbolo}</div>
            <div className="text-xs truncate">{elemento.nome}</div>
          </motion.div>
        ))}
      </div>

      {/* Legenda de Categorias */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(categoriaCores).map(([categoria, cor]) => (
              <Badge key={categoria} className={`${cor} text-white`}>
                {categoria.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Elemento */}
      <AnimatePresence>
        {elementoSelecionado && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setElementoSelecionado(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="w-full max-w-md">
                <CardHeader className={`${categoriaCores[elementoSelecionado.categoria]} text-white rounded-t-lg`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm opacity-75">Número atômico: {elementoSelecionado.numero}</span>
                      <CardTitle className="text-4xl">{elementoSelecionado.simbolo}</CardTitle>
                      <CardDescription className="text-white/80">{elementoSelecionado.nome}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-sm opacity-75">Massa atômica</div>
                      <div className="text-2xl font-bold">{elementoSelecionado.massaAtomica}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h4 className="font-semibold mb-1 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      Configuração Eletrônica
                    </h4>
                    <code className="bg-muted px-2 py-1 rounded text-sm">
                      {elementoSelecionado.configuracaoEletronica}
                    </code>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {elementoSelecionado.eletronegatividade && (
                      <div>
                        <span className="text-sm text-muted-foreground">Eletronegatividade</span>
                        <p className="font-semibold">{elementoSelecionado.eletronegatividade}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-muted-foreground">Grupo / Período</span>
                      <p className="font-semibold">{elementoSelecionado.grupo} / {elementoSelecionado.periodo}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {elementoSelecionado.pontoFusao && (
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-blue-500" />
                        <div>
                          <span className="text-xs text-muted-foreground">Ponto de Fusão</span>
                          <p className="font-semibold">{elementoSelecionado.pontoFusao}°C</p>
                        </div>
                      </div>
                    )}
                    {elementoSelecionado.pontoEbulicao && (
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-red-500" />
                        <div>
                          <span className="text-xs text-muted-foreground">Ponto de Ebulição</span>
                          <p className="font-semibold">{elementoSelecionado.pontoEbulicao}°C</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button className="w-full" onClick={() => setElementoSelecionado(null)}>
                    Fechar
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
