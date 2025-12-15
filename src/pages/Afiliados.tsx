// ============================================
// MOISÉS MEDEIROS v7.0 - AFILIADOS
// Spider-Man Theme - Gestão de Parceiros
// ============================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Handshake, Sparkles, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatCard } from "@/components/employees/StatCard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Affiliate {
  id: number;
  nome: string;
  email: string;
  hotmart_id: string;
  total_vendas: number;
  comissao_total: number;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export default function Afiliados() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Affiliate | null>(null);
  const [formData, setFormData] = useState({ nome: "", email: "", hotmart_id: "" });

  const fetchData = async () => {
    try {
      const { data, error } = await supabase.from("affiliates").select("*").order("nome");
      if (error) throw error;
      setAffiliates(data?.map(a => ({
        id: a.id,
        nome: a.nome,
        email: a.email || "",
        hotmart_id: a.hotmart_id || "",
        total_vendas: a.total_vendas || 0,
        comissao_total: a.comissao_total || 0,
      })) || []);
    } catch (error) {
      console.error("Error fetching affiliates:", error);
      toast.error("Erro ao carregar afiliados");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalVendas = affiliates.reduce((acc, a) => acc + a.total_vendas, 0);
  const totalComissoes = affiliates.reduce((acc, a) => acc + a.comissao_total, 0);

  const openModal = (affiliate?: Affiliate) => {
    setEditingItem(affiliate || null);
    setFormData(affiliate 
      ? { nome: affiliate.nome, email: affiliate.email, hotmart_id: affiliate.hotmart_id }
      : { nome: "", email: "", hotmart_id: "" }
    );
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error("Preencha o nome");
      return;
    }

    try {
      if (editingItem) {
        const { error } = await supabase
          .from("affiliates")
          .update({ nome: formData.nome, email: formData.email, hotmart_id: formData.hotmart_id })
          .eq("id", editingItem.id);
        if (error) throw error;
        toast.success("Afiliado atualizado!");
      } else {
        const { error } = await supabase.from("affiliates").insert({
          nome: formData.nome,
          email: formData.email,
          hotmart_id: formData.hotmart_id,
        });
        if (error) throw error;
        toast.success("Afiliado adicionado!");
      }

      await fetchData();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Error saving affiliate:", error);
      toast.error(error.message || "Erro ao salvar");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase.from("affiliates").delete().eq("id", id);
      if (error) throw error;
      toast.success("Afiliado removido!");
      await fetchData();
    } catch (error) {
      console.error("Error deleting affiliate:", error);
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
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <motion.div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-medium tracking-wide uppercase">Hotmart</span>
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                Afiliados
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Gerencie seus afiliados e acompanhe vendas em tempo real.
              </p>
            </div>
            <Button onClick={() => openModal()} size="lg" className="gap-2">
              <Plus className="h-5 w-5" /> Novo Afiliado
            </Button>
          </div>
        </motion.header>

        {/* Stats */}
        <section className="mb-10 grid gap-4 sm:grid-cols-3">
          <StatCard title="Total Afiliados" value={affiliates.length} icon={Handshake} variant="blue" delay={0} />
          <StatCard title="Total Vendas" value={totalVendas} icon={Handshake} variant="green" delay={1} />
          <StatCard title="Comissões Pagas" value={totalComissoes} formatFn={formatCurrency} icon={Handshake} variant="purple" delay={2} />
        </section>

        {/* Table */}
        <section>
          <div className="glass-card rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Nome</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Email</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">ID Hotmart</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Vendas</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Comissão</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {affiliates.map((affiliate) => (
                  <tr key={affiliate.id} className="border-t border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="p-4 text-foreground font-medium">{affiliate.nome}</td>
                    <td className="p-4 text-muted-foreground">{affiliate.email || "-"}</td>
                    <td className="p-4 text-muted-foreground font-mono text-sm">{affiliate.hotmart_id || "-"}</td>
                    <td className="p-4 text-right text-foreground">{affiliate.total_vendas}</td>
                    <td className="p-4 text-right text-status-active font-medium">{formatCurrency(affiliate.comissao_total)}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openModal(affiliate)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(affiliate.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {affiliates.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum afiliado cadastrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Editar" : "Novo"} Afiliado</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Nome</Label>
                <Input value={formData.nome} onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))} placeholder="Nome do afiliado" className="mt-1.5" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="email@exemplo.com" className="mt-1.5" />
              </div>
              <div>
                <Label>ID Hotmart</Label>
                <Input value={formData.hotmart_id} onChange={(e) => setFormData(prev => ({ ...prev, hotmart_id: e.target.value }))} placeholder="ID do afiliado na Hotmart" className="mt-1.5" />
              </div>
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
