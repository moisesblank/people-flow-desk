// ============================================
// EMPRESARIAL 2.0 - GESTÃO MULTI-CNPJ
// Sistema completo para múltiplas empresas
// Conforme documento AJUDA5
// ============================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
import {
  Building2,
  Plus,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Settings,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  FileText,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  PieChart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  cnpj: string;
  type: "mei" | "me" | "epp" | "ltda" | "sa";
  status: "ativo" | "suspenso" | "inativo";
  revenue: number;
  expenses: number;
  profit: number;
  employees: number;
  taxDue: number;
  taxPaid: number;
  lastUpdate: Date;
  color: string;
}

// Dados mockados - seriam do banco de dados
const mockCompanies: Company[] = [
  {
    id: "1",
    name: "Moisés Medeiros Química",
    cnpj: "12.345.678/0001-90",
    type: "mei",
    status: "ativo",
    revenue: 8500000, // centavos
    expenses: 3200000,
    profit: 5300000,
    employees: 0,
    taxDue: 85000,
    taxPaid: 65000,
    lastUpdate: new Date(),
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "2",
    name: "Química Digital LTDA",
    cnpj: "98.765.432/0001-12",
    type: "ltda",
    status: "ativo",
    revenue: 25000000,
    expenses: 18000000,
    profit: 7000000,
    employees: 5,
    taxDue: 450000,
    taxPaid: 450000,
    lastUpdate: new Date(),
    color: "from-purple-500 to-pink-500",
  },
];

const companyTypes = {
  mei: { label: "MEI", limit: "R$ 81.000/ano" },
  me: { label: "ME", limit: "R$ 360.000/ano" },
  epp: { label: "EPP", limit: "R$ 4.8 milhões/ano" },
  ltda: { label: "LTDA", limit: "Sem limite" },
  sa: { label: "S.A.", limit: "Sem limite" },
};

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function MultiCNPJManager() {
  const { gpuAnimationProps } = useQuantumReactivity();

  const [companies, setCompanies] = useState<Company[]>(mockCompanies);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showValues, setShowValues] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeView, setActiveView] = useState("overview");

  const totalRevenue = companies.reduce((sum, c) => sum + c.revenue, 0);
  const totalExpenses = companies.reduce((sum, c) => sum + c.expenses, 0);
  const totalProfit = companies.reduce((sum, c) => sum + c.profit, 0);
  const totalTaxDue = companies.reduce((sum, c) => sum + c.taxDue, 0);
  const totalTaxPaid = companies.reduce((sum, c) => sum + c.taxPaid, 0);

  const handleAddCompany = (data: any) => {
    const newCompany: Company = {
      id: String(companies.length + 1),
      name: data.name,
      cnpj: data.cnpj,
      type: data.type,
      status: "ativo",
      revenue: 0,
      expenses: 0,
      profit: 0,
      employees: 0,
      taxDue: 0,
      taxPaid: 0,
      lastUpdate: new Date(),
      color: "from-green-500 to-emerald-500",
    };
    setCompanies([...companies, newCompany]);
    setIsAddDialogOpen(false);
    toast.success("Empresa adicionada com sucesso!");
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              <Building2 className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Gestão Multi-CNPJ</CardTitle>
              <p className="text-xs text-muted-foreground">
                {companies.length} empresa(s) cadastrada(s)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowValues(!showValues)}
            >
              {showValues ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8">
                  <Plus className="h-3 w-3 mr-1" />
                  Empresa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Empresa</DialogTitle>
                </DialogHeader>
                <AddCompanyForm onSubmit={handleAddCompany} onClose={() => setIsAddDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Consolidated Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-[hsl(var(--stats-green))]/10 border border-[hsl(var(--stats-green))]/30">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-[hsl(var(--stats-green))]" />
              <span className="text-xs text-muted-foreground">Receita Total</span>
            </div>
            <p className="text-lg font-bold text-[hsl(var(--stats-green))]">
              {showValues ? formatCurrency(totalRevenue) : "R$ ••••••"}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Despesa Total</span>
            </div>
            <p className="text-lg font-bold text-destructive">
              {showValues ? formatCurrency(totalExpenses) : "R$ ••••••"}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[hsl(var(--stats-blue))]/10 border border-[hsl(var(--stats-blue))]/30">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-[hsl(var(--stats-blue))]" />
              <span className="text-xs text-muted-foreground">Lucro Líquido</span>
            </div>
            <p className="text-lg font-bold text-[hsl(var(--stats-blue))]">
              {showValues ? formatCurrency(totalProfit) : "R$ ••••••"}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[hsl(var(--stats-gold))]/10 border border-[hsl(var(--stats-gold))]/30">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-[hsl(var(--stats-gold))]" />
              <span className="text-xs text-muted-foreground">Impostos</span>
            </div>
            <p className="text-lg font-bold text-[hsl(var(--stats-gold))]">
              {showValues ? formatCurrency(totalTaxDue - totalTaxPaid) : "R$ ••••••"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {((totalTaxPaid / totalTaxDue) * 100).toFixed(0)}% pago
            </p>
          </div>
        </div>

        {/* Companies List */}
        <ScrollArea className="h-[300px]">
          <div className="space-y-3 pr-2">
            <AnimatePresence>
              {companies.map((company, index) => (
                <motion.div
                  key={company.id}
                  {...gpuAnimationProps.fadeUp}
                  transition={{ ...(gpuAnimationProps.fadeUp.transition ?? {}), delay: index * 0.1 }}
                  className="p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer will-change-transform transform-gpu"
                  onClick={() => setSelectedCompany(company)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${company.color}`}>
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm">{company.name}</h4>
                          <Badge variant="outline" className="text-[10px] h-5">
                            {companyTypes[company.type].label}
                          </Badge>
                          <Badge
                            className={`text-[10px] h-5 ${
                              company.status === "ativo"
                                ? "bg-[hsl(var(--stats-green))]/20 text-[hsl(var(--stats-green))]"
                                : "bg-destructive/20 text-destructive"
                            }`}
                          >
                            {company.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          CNPJ: {company.cnpj}
                        </p>

                        <div className="grid grid-cols-3 gap-4 mt-3">
                          <div>
                            <p className="text-[10px] text-muted-foreground">Receita</p>
                            <p className="text-sm font-medium text-[hsl(var(--stats-green))]">
                              {showValues ? formatCurrency(company.revenue) : "••••"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Despesas</p>
                            <p className="text-sm font-medium text-destructive">
                              {showValues ? formatCurrency(company.expenses) : "••••"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Lucro</p>
                            <p className={`text-sm font-medium ${
                              company.profit >= 0 
                                ? "text-[hsl(var(--stats-blue))]" 
                                : "text-destructive"
                            }`}>
                              {showValues ? formatCurrency(company.profit) : "••••"}
                            </p>
                          </div>
                        </div>

                        {/* MEI Limit Warning */}
                        {company.type === "mei" && company.revenue > 6750000 && (
                          <div className="mt-2 p-2 rounded-lg bg-[hsl(var(--stats-gold))]/10 border border-[hsl(var(--stats-gold))]/30">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-3 w-3 text-[hsl(var(--stats-gold))]" />
                              <span className="text-[10px] text-[hsl(var(--stats-gold))]">
                                Atenção: {((company.revenue / 8100000) * 100).toFixed(0)}% do limite MEI
                              </span>
                            </div>
                            <Progress 
                              value={(company.revenue / 8100000) * 100} 
                              className="h-1 mt-1" 
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2">
          <Button variant="outline" size="sm" className="h-9 text-xs flex flex-col items-center gap-0.5 p-1">
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Relatório</span>
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs flex flex-col items-center gap-0.5 p-1">
            <PieChart className="h-3.5 w-3.5" />
            <span>Comparar</span>
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs flex flex-col items-center gap-0.5 p-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>Impostos</span>
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs flex flex-col items-center gap-0.5 p-1">
            <Settings className="h-3.5 w-3.5" />
            <span>Config</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AddCompanyForm({ onSubmit, onClose }: { onSubmit: (data: any) => void; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    cnpj: "",
    type: "mei",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.cnpj) {
      toast.error("Preencha todos os campos");
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nome da Empresa</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Minha Empresa LTDA"
        />
      </div>

      <div className="space-y-2">
        <Label>CNPJ</Label>
        <Input
          value={formData.cnpj}
          onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
          placeholder="00.000.000/0001-00"
        />
      </div>

      <div className="space-y-2">
        <Label>Tipo de Empresa</Label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full p-2 rounded-lg border border-border bg-background"
        >
          {Object.entries(companyTypes).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label} - {value.limit}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">Adicionar</Button>
      </div>
    </form>
  );
}
