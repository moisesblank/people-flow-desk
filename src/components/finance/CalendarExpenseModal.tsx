// ============================================
// MODAL PARA ADICIONAR GASTO VIA CALENDÁRIO
// Adiciona gasto no mês selecionado
// ============================================

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Plus, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const EXPENSE_CATEGORIES = [
  { value: "feira", label: "🛒 Feira" },
  { value: "compras_casa", label: "🏠 Compras para Casa" },
  { value: "compras_bruna", label: "👩 Compras Bruna" },
  { value: "compras_moises", label: "👨 Compras Moisés" },
  { value: "cachorro", label: "🐕 Cachorro" },
  { value: "carro", label: "🚗 Carro" },
  { value: "gasolina", label: "⛽ Gasolina" },
  { value: "lanches", label: "🍔 Lanches" },
  { value: "comida", label: "🍽️ Comida" },
  { value: "casa", label: "🏡 Casa" },
  { value: "pessoal", label: "👤 Pessoal" },
  { value: "transporte", label: "🚌 Transporte" },
  { value: "lazer", label: "🎮 Lazer" },
  { value: "outros", label: "📦 Outros" },
];

interface CalendarExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  onSuccess?: () => void;
}

export function CalendarExpenseModal({
  isOpen,
  onClose,
  selectedDate,
  onSuccess,
}: CalendarExpenseModalProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    valor: "",
    categoria: "outros",
  });

  const handleSave = async () => {
    if (!formData.nome.trim() || !formData.valor) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    setIsLoading(true);

    try {
      const valorCents = Math.round(parseFloat(formData.valor.replace(",", ".")) * 100);
      const dataFormatada = selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");

      const { error } = await supabase.from("personal_extra_expenses").insert([{
        nome: formData.nome,
        valor: valorCents,
        categoria: formData.categoria as any,
        data: dataFormatada,
        user_id: user.id,
      }]);

      if (error) throw error;

      toast.success(`Gasto adicionado para ${format(selectedDate || new Date(), "MMMM yyyy", { locale: ptBR })}!`);
      
      setFormData({ nome: "", valor: "", categoria: "outros" });
      onClose();
      onSuccess?.();
    } catch (error: any) {
      console.error("Error saving expense:", error);
      toast.error(error.message || "Erro ao salvar gasto");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Adicionar Gasto
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pt-4"
        >
          {/* Data Selecionada */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Data do Gasto</p>
              <p className="font-medium">
                {selectedDate 
                  ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  : format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                }
              </p>
            </div>
          </div>

          {/* Nome */}
          <div>
            <Label>Nome do Gasto</Label>
            <Input
              value={formData.nome}
              onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Mercado, Farmácia..."
              className="mt-1.5"
            />
          </div>

          {/* Valor */}
          <div>
            <Label>Valor (R$)</Label>
            <Input
              value={formData.valor}
              onChange={(e) => setFormData((prev) => ({ ...prev, valor: e.target.value }))}
              placeholder="Ex: 150,00"
              className="mt-1.5"
            />
          </div>

          {/* Categoria */}
          <div>
            <Label>Categoria</Label>
            <Select
              value={formData.categoria}
              onValueChange={(v) => setFormData((prev) => ({ ...prev, categoria: v }))}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botão Salvar */}
          <Button onClick={handleSave} disabled={isLoading} className="w-full gap-2">
            <Wallet className="h-4 w-4" />
            {isLoading ? "Salvando..." : "Salvar Gasto"}
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
