import { useState, useMemo } from "react";
import { Plus, Users, UserCheck, DollarSign, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/employees/StatCard";
import { EmployeeCard } from "@/components/employees/EmployeeCard";
import { EmptyState } from "@/components/employees/EmptyState";
import { EmployeeModal } from "@/components/employees/EmployeeModal";
import { DeleteConfirmDialog } from "@/components/employees/DeleteConfirmDialog";
import { toast } from "sonner";
import type { Employee } from "@/types/employee";

// Mock initial data
const initialEmployees: Employee[] = [
  {
    id: 1,
    nome: "João Silva",
    funcao: "Desenvolvedor Sênior",
    setor: "Suporte",
    email: "joao.silva@empresa.com",
    salario: 850000,
    dataAdmissao: "2022-03-15",
    status: "ativo",
  },
  {
    id: 2,
    nome: "Maria Santos",
    funcao: "Coordenadora de Projetos",
    setor: "Coordenação",
    email: "maria.santos@empresa.com",
    salario: 1200000,
    dataAdmissao: "2021-08-01",
    status: "ativo",
  },
  {
    id: 3,
    nome: "Pedro Costa",
    funcao: "Analista de Marketing",
    setor: "Marketing",
    email: "pedro.costa@empresa.com",
    salario: 550000,
    dataAdmissao: "2023-01-10",
    status: "ferias",
  },
  {
    id: 4,
    nome: "Ana Oliveira",
    funcao: "Assistente Administrativo",
    setor: "Administrativo",
    email: "ana.oliveira@empresa.com",
    salario: 350000,
    dataAdmissao: "2023-06-20",
    status: "afastado",
  },
];

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

const Index = () => {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const stats = useMemo(() => {
    const total = employees.length;
    const ativos = employees.filter((e) => e.status === "ativo").length;
    const folhaPagamento = employees.reduce((acc, e) => acc + e.salario, 0);
    const salarioMedio = total > 0 ? folhaPagamento / total : 0;

    return { total, ativos, folhaPagamento, salarioMedio };
  }, [employees]);

  const handleNewEmployee = () => {
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleDelete = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async (data: Omit<Employee, "id"> & { id?: number }) => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (data.id) {
      // Update existing employee
      setEmployees((prev) =>
        prev.map((e) => (e.id === data.id ? { ...data, id: data.id } as Employee : e))
      );
      toast.success("Funcionário atualizado com sucesso!");
    } else {
      // Create new employee
      const newId = Math.max(...employees.map((e) => e.id), 0) + 1;
      setEmployees((prev) => [...prev, { ...data, id: newId } as Employee]);
      toast.success("Funcionário cadastrado com sucesso!");
    }

    setIsLoading(false);
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedEmployee) return;

    setIsLoading(true);
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    setEmployees((prev) => prev.filter((e) => e.id !== selectedEmployee.id));
    toast.success("Funcionário excluído com sucesso!");

    setIsLoading(false);
    setIsDeleteDialogOpen(false);
    setSelectedEmployee(null);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Gestão de Funcionários
              </h1>
              <p className="mt-1 text-muted-foreground">
                Gerencie sua equipe de forma simples e eficiente
              </p>
            </div>
            <Button
              onClick={handleNewEmployee}
              className="bg-primary hover:bg-primary/90 pulse-glow"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Funcionário
            </Button>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total de Funcionários"
            value={stats.total.toString()}
            icon={Users}
            variant="red"
          />
          <StatCard
            title="Funcionários Ativos"
            value={stats.ativos.toString()}
            icon={UserCheck}
            variant="green"
          />
          <StatCard
            title="Folha de Pagamento"
            value={formatCurrency(stats.folhaPagamento)}
            icon={DollarSign}
            variant="blue"
          />
          <StatCard
            title="Salário Médio"
            value={formatCurrency(stats.salarioMedio)}
            icon={TrendingUp}
            variant="purple"
          />
        </section>

        {/* Employee List */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Funcionários
          </h2>
          {employees.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {employees.map((employee) => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>

        {/* Modals */}
        <EmployeeModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          employee={selectedEmployee}
          onSave={handleSave}
          isLoading={isLoading}
        />

        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          employee={selectedEmployee}
          onConfirm={handleConfirmDelete}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default Index;
