import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Building2, Sparkles, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatCard } from "@/components/employees/StatCard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Expense {
  id: number;
  nome: string;
  valor: number;
  categoria: string;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export default function FinancasEmpresa() {
  const { user } = useAuth();
  const [fixedExpenses, setFixedExpenses] = useState<Expense[]>([]);
  const [extraExpenses, setExtraExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"fixed" | "extra">("fixed");
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({ nome: "", valor: "", categoria: "" });

  const fetchExpenses = async () => {
    try {
      const [fixedRes, extraRes] = await Promise.all([
        supabase.from("company_fixed_expenses").select("*").order("nome"),
        supabase.from("company_extra_expenses").select("*").order("created_at", { ascending: false }),
      ]);

      if (fixedRes.error) throw fixedRes.error;
      if (extraRes.error) throw extraRes.error;

      setFixedExpenses(fixedRes.data?.map(e => ({
        id: e.id,
        nome: e.nome,
        valor: e.valor,
        categoria: e.categoria || "",
      })) || []);

      setExtraExpenses(extraRes.data?.map(e => ({
        id: e.id,
        nome: e.nome,
        valor: e.valor,
        categoria: e.categoria || "",
      })) || []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Erro ao carregar gastos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const stats = useMemo(() => {
    const totalFixed = fixedExpenses.reduce((acc, e) => acc + e.valor, 0);
    const totalExtra = extraExpenses.reduce((acc, e) => acc + e.valor, 0);
    return { totalFixed, totalExtra, total: totalFixed + totalExtra };
  }, [fixedExpenses, extraExpenses]);

  const openModal = (type: "fixed" | "extra", expense?: Expense) => {
    setModalType(type);
    setEditingExpense(expense || null);
    setFormData(expense 
      ? { nome: expense.nome, valor: String(expense.valor / 100), categoria: expense.categoria }
      : { nome: "", valor: "", categoria: "" }
    );
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim() || !formData.valor) {
      toast.error("Preencha todos os campos");
      return;
    }

    const valorCents = Math.round(parseFloat(formData.valor.replace(",", ".")) * 100);
    const table = modalType === "fixed" ? "company_fixed_expenses" : "company_extra_expenses";

    try {
      if (editingExpense) {
        const { error } = await supabase
          .from(table)
          .update({ nome: formData.nome, valor: valorCents, categoria: formData.categoria })
          .eq("id", editingExpense.id);
        if (error) throw error;
        toast.success("Gasto atualizado!");
      } else {
        const { error } = await supabase.from(table).insert({
          nome: formData.nome,
          valor: valorCents,
          categoria: formData.categoria,
          created_by: user?.id,
        });
        if (error) throw error;
        toast.success("Gasto adicionado!");
      }

      await fetchExpenses();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Error saving expense:", error);
      toast.error(error.message || "Erro ao salvar gasto");
    }
  };

  const handleDelete = async (type: "fixed" | "extra", id: number) => {
    const table = type === "fixed" ? "company_fixed_expenses" : "company_extra_expenses";
    
    try {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      toast.success("Gasto removido!");
      await fetchExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Erro ao remover gasto");
    }
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
              <span className="text-sm font-medium tracking-wide uppercase">Controle Empresarial</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              Finanças Empresa
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Gerencie os gastos fixos e extras da empresa.
            </p>
          </div>
        </motion.header>

        {/* Stats */}
        <section className="mb-10 grid gap-4 sm:grid-cols-3">
          <StatCard title="Gastos Fixos" value={stats.totalFixed} formatFn={formatCurrency} icon={Building2} variant="red" delay={0} />
          <StatCard title="Gastos Extras" value={stats.totalExtra} formatFn={formatCurrency} icon={Building2} variant="purple" delay={1} />
          <StatCard title="Total Mensal" value={stats.total} formatFn={formatCurrency} icon={Building2} variant="blue" delay={2} />
        </section>

        {/* Fixed Expenses */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Gastos Fixos (Funcionários + Serviços)</h2>
            <Button onClick={() => openModal("fixed")} size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Nome</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Categoria</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Valor</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {fixedExpenses.map((expense) => (
                  <tr key={expense.id} className="border-t border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="p-4 text-foreground">{expense.nome}</td>
                    <td className="p-4 text-muted-foreground">{expense.categoria || "-"}</td>
                    <td className="p-4 text-right text-foreground font-medium">{formatCurrency(expense.valor)}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openModal("fixed", expense)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete("fixed", expense.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {fixedExpenses.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Nenhum gasto fixo cadastrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Extra Expenses */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Gastos Extras</h2>
            <Button onClick={() => openModal("extra")} size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Nome</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Categoria</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Valor</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {extraExpenses.map((expense) => (
                  <tr key={expense.id} className="border-t border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="p-4 text-foreground">{expense.nome}</td>
                    <td className="p-4 text-muted-foreground">{expense.categoria || "-"}</td>
                    <td className="p-4 text-right text-foreground font-medium">{formatCurrency(expense.valor)}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openModal("extra", expense)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete("extra", expense.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {extraExpenses.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Nenhum gasto extra cadastrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingExpense ? "Editar" : "Novo"} Gasto {modalType === "fixed" ? "Fixo" : "Extra"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Nome</Label>
                <Input 
                  value={formData.nome} 
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Manychat"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input 
                  value={formData.valor} 
                  onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                  placeholder="Ex: 750,00"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Input 
                  value={formData.categoria} 
                  onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                  placeholder="Ex: Serviços Externos"
                  className="mt-1.5"
                />
              </div>
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
