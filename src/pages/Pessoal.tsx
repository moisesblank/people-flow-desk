import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Gamepad2,
  Car,
  ShoppingCart,
  Plus,
  Trash2,
  CheckCircle2,
  DollarSign,
  Calendar
} from "lucide-react";
import { motion } from "framer-motion";

interface TibiaItem {
  id: string;
  name: string;
  type: "hunt" | "quest" | "goal";
  completed: boolean;
  notes?: string;
}

interface CarItem {
  id: string;
  description: string;
  type: "manutencao" | "abastecimento" | "documento";
  date: string;
  value?: number;
  completed: boolean;
}

interface FeiraItem {
  id: string;
  name: string;
  quantity?: string;
  checked: boolean;
  category: string;
}

const tibiaItems: TibiaItem[] = [
  { id: "1", name: "Hunt Demon", type: "hunt", completed: false, notes: "Level 500+" },
  { id: "2", name: "Quest Ferumbras", type: "quest", completed: false },
  { id: "3", name: "Atingir ML 100", type: "goal", completed: false },
  { id: "4", name: "Fazer bestiary completo", type: "goal", completed: false },
  { id: "5", name: "Boss Soulwar", type: "hunt", completed: true },
];

const carItems: CarItem[] = [
  { id: "1", description: "Troca de óleo", type: "manutencao", date: "20/12/2024", value: 350, completed: false },
  { id: "2", description: "IPVA 2025", type: "documento", date: "15/01/2025", value: 1850, completed: false },
  { id: "3", description: "Abastecimento", type: "abastecimento", date: "10/12/2024", value: 250, completed: true },
  { id: "4", description: "Revisão 30.000km", type: "manutencao", date: "Janeiro", value: 800, completed: false },
];

const feiraItems: FeiraItem[] = [
  { id: "1", name: "Banana", quantity: "1 cacho", checked: false, category: "Frutas" },
  { id: "2", name: "Maçã", quantity: "6 unidades", checked: false, category: "Frutas" },
  { id: "3", name: "Alface", quantity: "2 pés", checked: false, category: "Verduras" },
  { id: "4", name: "Tomate", quantity: "1kg", checked: true, category: "Legumes" },
  { id: "5", name: "Cebola", quantity: "1kg", checked: false, category: "Legumes" },
  { id: "6", name: "Batata", quantity: "2kg", checked: false, category: "Legumes" },
  { id: "7", name: "Leite", quantity: "2L", checked: false, category: "Laticínios" },
  { id: "8", name: "Ovos", quantity: "1 dúzia", checked: true, category: "Outros" },
];

export default function Pessoal() {
  const [newItem, setNewItem] = useState("");

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "hunt": return <Badge className="bg-red-500">Hunt</Badge>;
      case "quest": return <Badge className="bg-purple-500">Quest</Badge>;
      case "goal": return <Badge className="bg-blue-500">Meta</Badge>;
      case "manutencao": return <Badge className="bg-amber-500">Manutenção</Badge>;
      case "abastecimento": return <Badge className="bg-emerald-500">Abastecimento</Badge>;
      case "documento": return <Badge className="bg-blue-500">Documento</Badge>;
      default: return null;
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
        <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
          <User className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Área Pessoal</h1>
          <p className="text-muted-foreground">Organize sua vida pessoal</p>
        </div>
      </motion.div>

      <Tabs defaultValue="tibia" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="tibia" className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4" />
            Tibia
          </TabsTrigger>
          <TabsTrigger value="carro" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Carro
          </TabsTrigger>
          <TabsTrigger value="feira" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Feira+
          </TabsTrigger>
        </TabsList>

        {/* Tibia Tab */}
        <TabsContent value="tibia" className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                    <Gamepad2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Tibia - Metas e Hunts</CardTitle>
                    <CardDescription>Organize suas metas no jogo</CardDescription>
                  </div>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tibiaItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center justify-between p-4 rounded-xl border ${
                      item.completed ? "bg-emerald-500/5 border-emerald-500/20" : "border-border/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className={`h-5 w-5 ${item.completed ? "text-emerald-500" : "text-muted-foreground"}`} />
                      <div>
                        <span className={item.completed ? "line-through text-muted-foreground" : "font-medium"}>
                          {item.name}
                        </span>
                        {item.notes && <p className="text-sm text-muted-foreground">{item.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTypeBadge(item.type)}
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Carro Tab */}
        <TabsContent value="carro" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { label: "Gastos do Mês", value: "R$ 600", icon: DollarSign, color: "text-amber-500" },
              { label: "Próxima Revisão", value: "Jan/25", icon: Calendar, color: "text-blue-500" },
              { label: "Km Atual", value: "28.500", icon: Car, color: "text-emerald-500" },
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

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Manutenções e Gastos
                </CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {carItems.map((item) => (
                  <div 
                    key={item.id}
                    className={`flex items-center justify-between p-4 rounded-xl border ${
                      item.completed ? "bg-emerald-500/5 border-emerald-500/20" : "border-border/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className={`h-5 w-5 ${item.completed ? "text-emerald-500" : "text-muted-foreground"}`} />
                      <div>
                        <span className={item.completed ? "line-through text-muted-foreground" : "font-medium"}>
                          {item.description}
                        </span>
                        <p className="text-sm text-muted-foreground">{item.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.value && (
                        <span className="font-bold text-primary">R$ {item.value}</span>
                      )}
                      {getTypeBadge(item.type)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feira Tab */}
        <TabsContent value="feira" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Lista de Feira
                </CardTitle>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Adicionar item..." 
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    className="w-48"
                  />
                  <Button>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {feiraItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`flex items-center justify-between p-4 rounded-xl border ${
                      item.checked ? "bg-emerald-500/5 border-emerald-500/20" : "border-border/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className={`h-5 w-5 ${item.checked ? "text-emerald-500" : "text-muted-foreground"}`} />
                      <div>
                        <span className={item.checked ? "line-through text-muted-foreground" : "font-medium"}>
                          {item.name}
                        </span>
                        {item.quantity && (
                          <span className="text-sm text-muted-foreground ml-2">({item.quantity})</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{item.category}</Badge>
                      <Button variant="ghost" size="icon" className="text-destructive h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
