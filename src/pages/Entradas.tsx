// ============================================
// MOISÉS MEDEIROS v7.0 - ENTRADAS
// Spider-Man Theme - Receitas e Impostos
// ============================================
// 
// REFATORADO: Usando useAsyncData para padrão de loading
// ============================================

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, TrendingUp, Sparkles, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/employees/StatCard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAsyncData } from "@/hooks/useAsyncData";

interface Income {
  id: number;
  fonte: string;
  banco: string;
  valor: number;
}

interface Tax {
  id: number;
  nome: string;
  valor: number;
  categoria: string;
}

import { formatCurrency } from "@/utils/format";

const FONTES = ["PJ 44", "PJ 53", "MEI", "Boletos", "Correios", "Hotmart", "Outros"];
const BANCOS = ["Bradesco", "Stone", "Nubank", "Outros"];

export default function Entradas() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"income" | "tax">("income");
  const [editingItem, setEditingItem] = useState<Income | Tax | null>(null);
  const [formData, setFormData] = useState({ nome: "", fonte: "", banco: "", valor: "", categoria: "" });

  // ✅ REFATORADO: Usando useAsyncData em vez de isLoading + fetchData manual
  const { 
    data: fetchedData, 
    isLoading, 
    refetch: fetchData 
  } = useAsyncData({
    fetcher: async () => {
      const [incomeRes, taxRes] = await Promise.all([
        supabase.from("income").select("id, fonte, banco, valor, created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("taxes").select("id, nome, categoria, valor").order("nome").limit(100),
      ]);

      if (incomeRes.error) throw incomeRes.error;
      if (taxRes.error) throw taxRes.error;

      return {
        incomes: incomeRes.data?.map(e => ({
          id: e.id,
          fonte: e.fonte,
          banco: e.banco || "",
          valor: e.valor,
        })) || [],
        taxes: taxRes.data?.map(e => ({
          id: e.id,
          nome: e.nome,
          valor: e.valor,
          categoria: e.categoria || "",
        })) || []
      };
    },
    errorMessage: "Erro ao carregar dados",
    initialData: { incomes: [], taxes: [] }
  });

  const incomes = fetchedData?.incomes || [];
  const taxes = fetchedData?.taxes || [];

  const stats = useMemo(() => {
    const totalIncome = incomes.reduce((acc, e) => acc + e.valor, 0);
    const totalTaxes = taxes.reduce((acc, e) => acc + e.valor, 0);
    return { totalIncome, totalTaxes, net: totalIncome - totalTaxes };
  }, [incomes, taxes]);

  const openModal = (type: "income" | "tax", item?: Income | Tax) => {
    setModalType(type);
    setEditingItem(item || null);
    if (type === "income" && item) {
      const inc = item as Income;
      setFormData({ nome: "", fonte: inc.fonte, banco: inc.banco, valor: String(inc.valor / 100), categoria: "" });
    } else if (type === "tax" && item) {
      const tax = item as Tax;
      setFormData({ nome: tax.nome, fonte: "", banco: "", valor: String(tax.valor / 100), categoria: tax.categoria });
    } else {
      setFormData({ nome: "", fonte: "", banco: "", valor: "", categoria: "" });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const valorCents = Math.round(parseFloat(formData.valor.replace(",", ".")) * 100);

    try {
      if (modalType === "income") {
        if (!formData.fonte || !formData.valor) {
          toast.error("Preencha fonte e valor");
          return;
        }

        if (editingItem) {
          const { error } = await supabase
            .from("income")
            .update({ fonte: formData.fonte, banco: formData.banco, valor: valorCents })
            .eq("id", editingItem.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("income").insert({
            fonte: formData.fonte,
            banco: formData.banco,
            valor: valorCents,
            created_by: user?.id,
          });
          if (error) throw error;
        }
      } else {
        if (!formData.nome || !formData.valor) {
          toast.error("Preencha nome e valor");
          return;
        }

        if (editingItem) {
          const { error } = await supabase
            .from("taxes")
            .update({ nome: formData.nome, valor: valorCents, categoria: formData.categoria })
            .eq("id", editingItem.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("taxes").insert({
            nome: formData.nome,
            valor: valorCents,
            categoria: formData.categoria,
            created_by: user?.id,
          });
          if (error) throw error;
        }
      }

      toast.success(editingItem ? "Atualizado!" : "Adicionado!");
      await fetchData();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Error saving:", error);
      toast.error(error.message || "Erro ao salvar");
    }
  };

  const handleDelete = async (type: "income" | "tax", id: number) => {
    const table = type === "income" ? "income" : "taxes";
    
    try {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      toast.success("Removido!");
      await fetchData();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Erro ao remover");
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
              <span className="text-sm font-medium tracking-wide uppercase">Receitas</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              Entradas
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Controle suas receitas e impostos.
            </p>
          </div>
        </motion.header>

        {/* Stats */}
        <section className="mb-10 grid gap-4 sm:grid-cols-3">
          <StatCard title="Total Entradas" value={stats.totalIncome} formatFn={formatCurrency} icon={TrendingUp} variant="green" delay={0} />
          <StatCard title="Total Impostos" value={stats.totalTaxes} formatFn={formatCurrency} icon={TrendingUp} variant="red" delay={1} />
          <StatCard title="Líquido" value={stats.net} formatFn={formatCurrency} icon={TrendingUp} variant="blue" delay={2} />
        </section>

        {/* Incomes */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Receitas</h2>
            <Button onClick={() => openModal("income")} size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Fonte</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Banco</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Valor</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {incomes.map((item) => (
                  <tr key={item.id} className="border-t border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="p-4 text-foreground">{item.fonte}</td>
                    <td className="p-4 text-muted-foreground">{item.banco || "-"}</td>
                    <td className="p-4 text-right text-status-active font-medium">{formatCurrency(item.valor)}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openModal("income", item)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete("income", item.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {incomes.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Nenhuma receita cadastrada</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Taxes */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Impostos</h2>
            <Button onClick={() => openModal("tax")} size="sm" className="gap-2">
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
                {taxes.map((item) => (
                  <tr key={item.id} className="border-t border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="p-4 text-foreground">{item.nome}</td>
                    <td className="p-4 text-muted-foreground">{item.categoria || "-"}</td>
                    <td className="p-4 text-right text-destructive font-medium">{formatCurrency(item.valor)}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openModal("tax", item)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete("tax", item.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {taxes.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Nenhum imposto cadastrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Editar" : "Nova"} {modalType === "income" ? "Receita" : "Imposto"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {modalType === "income" ? (
                <>
                  <div>
                    <Label>Fonte</Label>
                    <Select value={formData.fonte} onValueChange={(v) => setFormData(prev => ({ ...prev, fonte: v }))}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {FONTES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Banco</Label>
                    <Select value={formData.banco} onValueChange={(v) => setFormData(prev => ({ ...prev, banco: v }))}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {BANCOS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label>Nome</Label>
                    <Input value={formData.nome} onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))} placeholder="Ex: DAS PJ44" className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Categoria</Label>
                    <Input value={formData.categoria} onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))} placeholder="Ex: Impostos MEI" className="mt-1.5" />
                  </div>
                </>
              )}
              <div>
                <Label>Valor (R$)</Label>
                <Input value={formData.valor} onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))} placeholder="Ex: 1000,00" className="mt-1.5" />
              </div>
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
