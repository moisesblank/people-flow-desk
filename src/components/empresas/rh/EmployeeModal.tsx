import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ResizableDialog,
  ResizableDialogBody,
  ResizableDialogContent,
  ResizableDialogFooter,
  ResizableDialogHeader,
  ResizableDialogTitle,
} from "@/components/ui/resizable-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Check, RefreshCw, Send, Shield } from "lucide-react";

export type StaffRole =
  | "owner"
  | "admin"
  | "coordenacao"
  | "contabilidade"
  | "suporte"
  | "monitoria"
  | "marketing"
  | "afiliado";

export interface EmployeeModalEmployee {
  id: number;
  nome: string;
  email: string;
  funcao: string;
  user_id?: string | null;
}

export type RHSetorOption = { id: string; label: string; icon: any };
export type RHStatusOption = { value: string; label: string; icon: any };
export type StaffRoleOption = { value: StaffRole; label: string; description: string };

export type EmployeeModalFormData = {
  nome: string;
  email: string;
  telefone: string;
  funcao: string;
  nivel_acesso: StaffRole;
  setor: string;
  status: string;
  data_admissao: string;
  salario: string;
  horario_trabalho: string;
  senha: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEmployee: EmployeeModalEmployee | null;
  formData: EmployeeModalFormData;
  setFormData: (next: EmployeeModalFormData) => void;
  staffRoleOptions: StaffRoleOption[];
  setores: RHSetorOption[];
  statusOptions: RHStatusOption[];
  isSaving: boolean;
  onSave: () => void;
};

export function EmployeeModal({
  open,
  onOpenChange,
  editingEmployee,
  formData,
  setFormData,
  staffRoleOptions,
  setores,
  statusOptions,
  isSaving,
  onSave,
}: Props) {
  return (
    <ResizableDialog open={open} onOpenChange={onOpenChange}>
      <ResizableDialogContent className="max-w-2xl">
        <ResizableDialogHeader>
          <ResizableDialogTitle>
            {editingEmployee ? "Editar Funcionário" : "Novo Funcionário"}
          </ResizableDialogTitle>
        </ResizableDialogHeader>

        <ResizableDialogBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do funcionário"
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@empresa.com"
              />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone/WhatsApp</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <Label htmlFor="funcao">Cargo/Função</Label>
              <Input
                id="funcao"
                value={formData.funcao}
                onChange={(e) => setFormData({ ...formData, funcao: e.target.value })}
                placeholder="Ex: Desenvolvedor Sênior, Atendente"
              />
              <p className="text-xs text-muted-foreground mt-1">Descrição do cargo (aparece no perfil)</p>
            </div>

            <div>
              <Label htmlFor="nivel_acesso" className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Nível de Acesso *
              </Label>
              <Select
                value={formData.nivel_acesso}
                onValueChange={(v) => setFormData({ ...formData, nivel_acesso: v as StaffRole })}
              >
                <SelectTrigger className="border-primary/30">
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  {staffRoleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{role.label}</span>
                        <span className="text-xs text-muted-foreground">{role.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Define as permissões do funcionário no sistema</p>
            </div>

            <div>
              <Label htmlFor="setor">Setor</Label>
              <Select value={formData.setor} onValueChange={(v) => setFormData({ ...formData, setor: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  {setores
                    .filter((s) => s.id !== "todos")
                    .map((setor) => (
                      <SelectItem key={setor.id} value={setor.id}>
                        <div className="flex items-center gap-2">
                          <setor.icon className="h-4 w-4" />
                          {setor.label}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="salario">Salário (R$)</Label>
              <Input
                id="salario"
                type="number"
                step="0.01"
                value={formData.salario}
                onChange={(e) => setFormData({ ...formData, salario: e.target.value })}
                placeholder="3000.00"
              />
            </div>

            <div>
              <Label htmlFor="data_admissao">Data de Admissão</Label>
              <Input
                id="data_admissao"
                type="date"
                value={formData.data_admissao}
                onChange={(e) => setFormData({ ...formData, data_admissao: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <status.icon className="h-4 w-4" />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="horario">Horário de Trabalho</Label>
              <Input
                id="horario"
                value={formData.horario_trabalho}
                onChange={(e) => setFormData({ ...formData, horario_trabalho: e.target.value })}
                placeholder="08:00 - 17:00"
              />
            </div>

            {(!editingEmployee || (editingEmployee && !editingEmployee.user_id)) && (
              <div className="md:col-span-2">
                <Separator className="my-4" />
                <Label htmlFor="senha">
                  Senha de Acesso ao Sistema
                  <span className="text-muted-foreground ml-1">(opcional, será gerada automaticamente)</span>
                </Label>
                <Input
                  id="senha"
                  type="text"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  placeholder="Mínimo 6 caracteres (ou deixe em branco)"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Se deixar em branco, uma senha automática será gerada e enviada por email.
                </p>
              </div>
            )}

            <div className="md:col-span-2">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Send className="h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">
                  {editingEmployee
                    ? editingEmployee.user_id
                      ? "Este funcionário já tem acesso ao sistema."
                      : "Ao salvar, o funcionário receberá acesso ao sistema por email."
                    : "Ao cadastrar, o funcionário receberá automaticamente acesso ao sistema por email."}
                </p>
              </div>
            </div>
          </div>
        </ResizableDialogBody>

        <ResizableDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                {editingEmployee ? "Atualizar" : "Cadastrar"}
              </>
            )}
          </Button>
        </ResizableDialogFooter>
      </ResizableDialogContent>
    </ResizableDialog>
  );
}
