import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, User, Briefcase, Building2, DollarSign, Mail, Loader2, Send, Lock, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SECTORS, STATUS_OPTIONS, type Employee, type Sector, type EmployeeStatus } from "@/types/employee";

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").min(3, "Mínimo 3 caracteres"),
  funcao: z.string().min(1, "Função é obrigatória"),
  setor: z.string().min(1, "Setor é obrigatório"),
  email: z.string().email("Email inválido").or(z.literal("")),
  senha: z.string().min(6, "Mínimo 6 caracteres").or(z.literal("")),
  salario: z.string().min(1, "Salário é obrigatório"),
  dataAdmissao: z.date().optional(),
  status: z.enum(["ativo", "ferias", "afastado", "inativo"]),
});

type FormData = z.infer<typeof formSchema>;

interface EmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onSave: (data: Omit<Employee, "id"> & { id?: number }) => void;
  isLoading?: boolean;
}

export function EmployeeModal({
  open,
  onOpenChange,
  employee,
  onSave,
  isLoading,
}: EmployeeModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [showPassword, setShowPassword] = useState(true); // Visível por padrão

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      funcao: "",
      setor: "",
      email: "",
      senha: "",
      salario: "",
      dataAdmissao: undefined,
      status: "ativo",
    },
  });

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (employee) {
      form.reset({
        nome: employee.nome,
        funcao: employee.funcao,
        setor: employee.setor,
        email: employee.email,
        senha: "",
        // Se salário é null (mascarado), mantém vazio para forçar preenchimento
        salario: employee.salario !== null 
          ? (employee.salario / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
          : "",
        dataAdmissao: employee.dataAdmissao ? new Date(employee.dataAdmissao) : undefined,
        status: employee.status,
      });
    } else {
      form.reset({
        nome: "",
        funcao: "",
        setor: "",
        email: "",
        senha: "",
        salario: "",
        dataAdmissao: new Date(),
        status: "ativo",
      });
    }
  }, [employee, form, open]);

  function onSubmit(data: FormData) {
    const salarioEmCentavos = Math.round(
      parseFloat(data.salario.replace(/\./g, "").replace(",", ".")) * 100
    );

    onSave({
      id: employee?.id,
      nome: data.nome,
      funcao: data.funcao,
      setor: data.setor as Sector,
      email: data.email,
      senha: data.senha, // 🔥 Passar senha para auto-vinculação
      salario: salarioEmCentavos,
      dataAdmissao: data.dataAdmissao
        ? format(data.dataAdmissao, "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
      status: data.status as EmployeeStatus,
    } as any);
  }

  async function handleSendInvite() {
    const email = form.getValues("email");
    const nome = form.getValues("nome");
    const senha = form.getValues("senha");
    
    if (!email) {
      toast.error("Email é obrigatório para enviar convite");
      return;
    }
    if (!nome) {
      toast.error("Nome é obrigatório para enviar convite");
      return;
    }
    if (!senha || senha.length < 6) {
      toast.error("Senha é obrigatória para criar acesso", {
        description: "Mínimo de 6 caracteres"
      });
      return;
    }

    setIsSendingInvite(true);
    
    try {
      const response = await supabase.functions.invoke("invite-employee", {
        body: {
          email,
          nome,
          senha,
          funcao: form.getValues("funcao"),
          employee_id: employee?.id,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success("Acesso criado com sucesso!", {
        description: `${nome} agora pode acessar o sistema com o email ${email}`
      });
      
      // Limpar o campo de senha após sucesso
      form.setValue("senha", "");
    } catch (error: any) {
      console.error("Error sending invite:", error);
      toast.error("Erro ao criar acesso", {
        description: error.message || "Tente novamente mais tarde"
      });
    } finally {
      setIsSendingInvite(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-xl border-border overflow-hidden p-0">
        {/* Header with gradient */}
        <div className="relative px-6 pt-6 pb-4 border-b border-border/50">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent" />
          <DialogHeader className="relative">
            <DialogTitle className="text-xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              {employee ? "Editar Funcionário" : "Novo Funcionário"}
            </DialogTitle>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      Nome Completo *
                    </FormLabel>
                    <FormControl>
                      <Input
                        ref={inputRef}
                        placeholder="Ex: João Silva Santos"
                        className="h-12 bg-secondary/30 border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="funcao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-muted-foreground">
                      <Briefcase className="h-3.5 w-3.5" />
                      Função *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Desenvolvedor"
                        className="h-12 bg-secondary/30 border-border/50 rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="setor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" />
                      Setor *
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 bg-secondary/30 border-border/50 rounded-xl">
                          <SelectValue placeholder="Selecione o setor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover/95 backdrop-blur-xl border-border">
                        {SECTORS.map((sector) => (
                          <SelectItem key={sector} value={sector}>
                            {sector}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-3.5 w-3.5" />
                      Salário (R$) *
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          R$
                        </span>
                        <Input
                          placeholder="0,00"
                          className="h-12 pl-10 bg-secondary/30 border-border/50 rounded-xl tabular-nums"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataAdmissao"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center gap-2 text-muted-foreground">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      Data de Admissão
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "h-12 w-full justify-start text-left font-normal bg-secondary/30 border-border/50 rounded-xl hover:bg-secondary/50",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-popover/95 backdrop-blur-xl border-border" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          locale={ptBR}
                          className="pointer-events-auto rounded-xl"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      Email (para acesso)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@exemplo.com"
                        className="h-12 bg-secondary/30 border-border/50 rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="senha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-muted-foreground">
                      <Lock className="h-3.5 w-3.5" />
                      Senha (para criar acesso)
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Mínimo 6 caracteres"
                          className="h-12 pr-10 bg-secondary/30 border-border/50 rounded-xl"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 bg-secondary/30 border-border/50 rounded-xl">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover/95 backdrop-blur-xl border-border">
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-border/50">
              <div className="flex gap-2">
                {form.watch("email") && form.watch("senha") && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendInvite}
                    disabled={isSendingInvite}
                    className="gap-2 rounded-xl border-[hsl(var(--stats-blue))]/50 text-[hsl(var(--stats-blue))] hover:bg-[hsl(var(--stats-blue))]/10"
                  >
                    {isSendingInvite ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Criar Acesso
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="px-6 rounded-xl hover:bg-secondary"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 gap-2"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isLoading ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
