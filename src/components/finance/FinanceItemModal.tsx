// ============================================
// FINANCE ITEM MODAL - Componente extraído de FinancasEmpresa
// Modal para criar/editar gastos e pagamentos
// ============================================

import { Building2, Receipt, CreditCard, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ResizableDialog,
  ResizableDialogContent,
  ResizableDialogHeader,
  ResizableDialogBody,
  ResizableDialogFooter,
  ResizableDialogTitle,
} from "@/components/ui/resizable-dialog";
import { MinimizableSection } from "@/components/ui/minimizable-section";
import { UniversalAttachments } from "@/components/attachments/UniversalAttachments";
import type { PaymentStatus } from "@/hooks/useCompanyFinanceHistory";

export type ItemType = "gasto_fixo" | "gasto_extra" | "pagamento";

export interface FinanceFormData {
  nome: string;
  descricao: string;
  valor: string;
  categoria: string;
  data: string;
  data_vencimento: string;
  status_pagamento: PaymentStatus;
  tipo: string;
  metodo_pagamento: string;
  observacoes: string;
  recorrente: boolean;
}

const CATEGORIAS = [
  "Folha de Pagamento", "Aluguel", "Energia", "Internet", "Telefone",
  "Marketing", "Software/SaaS", "Impostos", "Contador", "Material de Escritório",
  "Equipamentos", "Manutenção", "Viagens", "Alimentação", "Transporte",
  "Funcionário", "Site", "NOTA FISCAL", "Outros"
];

interface FinanceItemModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: ItemType;
  editingItem: any | null;
  formData: FinanceFormData;
  onFormDataChange: (data: Partial<FinanceFormData>) => void;
  onSave: () => void;
}

export function FinanceItemModal({
  isOpen,
  onOpenChange,
  itemType,
  editingItem,
  formData,
  onFormDataChange,
  onSave,
}: FinanceItemModalProps) {
  const getIcon = () => {
    switch (itemType) {
      case "gasto_fixo": return <Building2 className="h-5 w-5 text-red-500" />;
      case "gasto_extra": return <Receipt className="h-5 w-5 text-blue-500" />;
      default: return <CreditCard className="h-5 w-5 text-purple-500" />;
    }
  };

  const getTitle = () => {
    const prefix = editingItem ? "Editar" : "Novo";
    switch (itemType) {
      case "gasto_fixo": return `${prefix} Gasto Fixo`;
      case "gasto_extra": return `${prefix} Gasto Extra`;
      default: return `${prefix} Pagamento`;
    }
  };

  const getEntityType = () => {
    switch (itemType) {
      case "gasto_fixo": return "company_expense_fixed";
      case "gasto_extra": return "company_expense_extra";
      default: return "payment";
    }
  };

  return (
    <ResizableDialog open={isOpen} onOpenChange={onOpenChange}>
      <ResizableDialogContent className="sm:max-w-[600px]">
        <ResizableDialogHeader>
          <ResizableDialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </ResizableDialogTitle>
        </ResizableDialogHeader>
        <ResizableDialogBody>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>{itemType === "pagamento" ? "Descrição" : "Nome"}</Label>
                <Input
                  value={itemType === "pagamento" ? formData.descricao : formData.nome}
                  onChange={(e) => onFormDataChange(
                    itemType === "pagamento" 
                      ? { descricao: e.target.value }
                      : { nome: e.target.value }
                  )}
                  placeholder={itemType === "pagamento" ? "Descrição do pagamento..." : "Nome do gasto..."}
                />
              </div>

              <div>
                <Label>Valor (R$)</Label>
                <Input
                  type="text"
                  value={formData.valor}
                  onChange={(e) => onFormDataChange({ valor: e.target.value })}
                  placeholder="0,00"
                />
              </div>

              <div>
                <Label>Categoria</Label>
                <Select value={formData.categoria} onValueChange={(v) => onFormDataChange({ categoria: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={formData.data}
                  onChange={(e) => onFormDataChange({ data: e.target.value })}
                />
              </div>

              <div>
                <Label>Vencimento</Label>
                <Input
                  type="date"
                  value={formData.data_vencimento}
                  onChange={(e) => onFormDataChange({ data_vencimento: e.target.value })}
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select 
                  value={formData.status_pagamento} 
                  onValueChange={(v) => onFormDataChange({ status_pagamento: v as PaymentStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="atrasado">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {itemType === "pagamento" && (
                <div>
                  <Label>Método de Pagamento</Label>
                  <Select 
                    value={formData.metodo_pagamento} 
                    onValueChange={(v) => onFormDataChange({ metodo_pagamento: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">Pix</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <MinimizableSection 
              title="Observações"
              storageKey="modal-observacoes"
            >
              <Textarea
                value={formData.observacoes}
                onChange={(e) => onFormDataChange({ observacoes: e.target.value })}
                placeholder="Observações adicionais..."
                rows={3}
              />
            </MinimizableSection>

            {editingItem && (
              <MinimizableSection
                title="Comprovantes e Anexos"
                storageKey="modal-anexos"
              >
                <UniversalAttachments
                  entityType={getEntityType()}
                  entityId={String(editingItem.id)}
                />
              </MinimizableSection>
            )}
          </div>
        </ResizableDialogBody>
        <ResizableDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave} className="gap-2">
            <Check className="h-4 w-4" />
            {editingItem ? "Salvar" : "Criar"}
          </Button>
        </ResizableDialogFooter>
      </ResizableDialogContent>
    </ResizableDialog>
  );
}
