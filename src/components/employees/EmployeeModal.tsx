import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

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
import { SECTORS, STATUS_OPTIONS, type Employee, type Sector, type EmployeeStatus } from "@/types/employee";

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  funcao: z.string().min(1, "Função é obrigatória"),
  setor: z.string().min(1, "Setor é obrigatório"),
  email: z.string().email("Email inválido").or(z.literal("")),
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
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      funcao: "",
      setor: "",
      email: "",
      salario: "",
      dataAdmissao: undefined,
      status: "ativo",
    },
  });

  useEffect(() => {
    if (employee) {
      form.reset({
        nome: employee.nome,
        funcao: employee.funcao,
        setor: employee.setor,
        email: employee.email,
        salario: (employee.salario / 100).toFixed(2).replace(".", ","),
        dataAdmissao: employee.dataAdmissao ? new Date(employee.dataAdmissao) : undefined,
        status: employee.status,
      });
    } else {
      form.reset({
        nome: "",
        funcao: "",
        setor: "",
        email: "",
        salario: "",
        dataAdmissao: undefined,
        status: "ativo",
      });
    }
  }, [employee, form, open]);

  function onSubmit(data: FormData) {
    const salarioEmCentavos = Math.round(
      parseFloat(data.salario.replace(",", ".")) * 100
    );

    onSave({
      id: employee?.id,
      nome: data.nome,
      funcao: data.funcao,
      setor: data.setor as Sector,
      email: data.email,
      salario: salarioEmCentavos,
      dataAdmissao: data.dataAdmissao
        ? format(data.dataAdmissao, "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
      status: data.status as EmployeeStatus,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {employee ? "Editar Funcionário" : "Novo Funcionário"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o nome completo"
                        className="bg-secondary/50 border-border"
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
                    <FormLabel>Função *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Desenvolvedor"
                        className="bg-secondary/50 border-border"
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
                    <FormLabel>Setor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-secondary/50 border-border">
                          <SelectValue placeholder="Selecione o setor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border-border">
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
                    <FormLabel>Salário (R$) *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0,00"
                        className="bg-secondary/50 border-border"
                        {...field}
                      />
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
                    <FormLabel>Data de Admissão</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-secondary/50 border-border",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          locale={ptBR}
                          className="pointer-events-auto"
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@exemplo.com"
                        className="bg-secondary/50 border-border"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-secondary/50 border-border">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border-border">
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

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-border hover:bg-secondary"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90"
              >
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
