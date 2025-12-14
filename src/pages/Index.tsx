import { useState, useMemo, useCallback } from "react";
import { Plus, Users, UserCheck, DollarSign, TrendingUp, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/employees/StatCard";
import { EmployeeCard } from "@/components/employees/EmployeeCard";
import { EmptyState } from "@/components/employees/EmptyState";
import { EmployeeModal } from "@/components/employees/EmployeeModal";
import { DeleteConfirmDialog } from "@/components/employees/DeleteConfirmDialog";
import { SearchFilters } from "@/components/employees/SearchFilters";
import { SkeletonCard, StatsSkeletonCard } from "@/components/employees/SkeletonCard";
import { toast } from "sonner";
import type { Employee, EmployeeStatus, Sector } from "@/types/employee";

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
  {
    id: 5,
    nome: "Carlos Mendes",
    funcao: "Monitor de Qualidade",
    setor: "Monitoria",
    email: "carlos.mendes@empresa.com",
    salario: 420000,
    dataAdmissao: "2022-11-05",
    status: "ativo",
  },
  {
    id: 6,
    nome: "Fernanda Lima",
    funcao: "Gestora de Afiliados",
    setor: "Afiliados",
    email: "fernanda.lima@empresa.com",
    salario: 680000,
    dataAdmissao: "2021-04-18",
    status: "ativo",
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
  const [isInitialLoading, setIsInitialLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | "all">("all");
  const [sectorFilter, setSectorFilter] = useState<Sector | "all">("all");

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const matchesSearch =
        search === "" ||
        employee.nome.toLowerCase().includes(search.toLowerCase()) ||
        employee.funcao.toLowerCase().includes(search.toLowerCase()) ||
        employee.email.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "all" || employee.status === statusFilter;
      const matchesSector = sectorFilter === "all" || employee.setor === sectorFilter;

      return matchesSearch && matchesStatus && matchesSector;
    });
  }, [employees, search, statusFilter, sectorFilter]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search) count++;
    if (statusFilter !== "all") count++;
    if (sectorFilter !== "all") count++;
    return count;
  }, [search, statusFilter, sectorFilter]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("all");
    setSectorFilter("all");
  }, []);

  const stats = useMemo(() => {
    const total = employees.length;
    const ativos = employees.filter((e) => e.status === "ativo").length;
    const folhaPagamento = employees.reduce((acc, e) => acc + e.salario, 0);
    const salarioMedio = total > 0 ? Math.round(folhaPagamento / total) : 0;

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
    
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (data.id) {
      setEmployees((prev) =>
        prev.map((e) => (e.id === data.id ? { ...data, id: data.id } as Employee : e))
      );
      toast.success("Funcionário atualizado!", {
        description: `${data.nome} foi atualizado com sucesso.`,
      });
    } else {
      const newId = Math.max(...employees.map((e) => e.id), 0) + 1;
      setEmployees((prev) => [...prev, { ...data, id: newId } as Employee]);
      toast.success("Funcionário cadastrado!", {
        description: `${data.nome} foi adicionado à equipe.`,
      });
    }

    setIsLoading(false);
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedEmployee) return;

    setIsLoading(true);
    
    await new Promise((resolve) => setTimeout(resolve, 600));

    setEmployees((prev) => prev.filter((e) => e.id !== selectedEmployee.id));
    toast.success("Funcionário excluído!", {
      description: `${selectedEmployee.nome} foi removido da equipe.`,
    });

    setIsLoading(false);
    setIsDeleteDialogOpen(false);
    setSelectedEmployee(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-radial from-primary/5 via-transparent to-transparent opacity-50" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-radial from-stats-purple/5 via-transparent to-transparent opacity-50" />
      </div>

      <div className="relative z-10 p-4 md:p-8 lg:p-12">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-2 text-primary"
                >
                  <Sparkles className="h-5 w-5" />
                  <span className="text-sm font-medium tracking-wide uppercase">Painel de Gestão</span>
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                  Funcionários
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl">
                  Gerencie sua equipe de forma simples, rápida e eficiente.
                </p>
              </div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  onClick={handleNewEmployee}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 gap-2 px-6 h-12 rounded-xl pulse-ring"
                >
                  <Plus className="h-5 w-5" />
                  Novo Funcionário
                </Button>
              </motion.div>
            </div>
          </motion.header>

          {/* Stats Grid */}
          <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isInitialLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <StatsSkeletonCard key={i} />
              ))
            ) : (
              <>
                <StatCard
                  title="Total"
                  value={stats.total}
                  icon={Users}
                  variant="red"
                  delay={0}
                />
                <StatCard
                  title="Ativos"
                  value={stats.ativos}
                  icon={UserCheck}
                  variant="green"
                  delay={1}
                />
                <StatCard
                  title="Folha Mensal"
                  value={stats.folhaPagamento}
                  formatFn={(v) => formatCurrency(v)}
                  icon={DollarSign}
                  variant="blue"
                  delay={2}
                />
                <StatCard
                  title="Salário Médio"
                  value={stats.salarioMedio}
                  formatFn={(v) => formatCurrency(v)}
                  icon={TrendingUp}
                  variant="purple"
                  delay={3}
                />
              </>
            )}
          </section>

          {/* Search and Filters */}
          <section className="mb-6">
            <SearchFilters
              search={search}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              sectorFilter={sectorFilter}
              onSectorChange={setSectorFilter}
              activeFiltersCount={activeFiltersCount}
              onClearFilters={clearFilters}
            />
          </section>

          {/* Results count */}
          {employees.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 flex items-center justify-between"
            >
              <p className="text-sm text-muted-foreground">
                {filteredEmployees.length === employees.length
                  ? `${employees.length} funcionário${employees.length !== 1 ? "s" : ""}`
                  : `${filteredEmployees.length} de ${employees.length} funcionário${employees.length !== 1 ? "s" : ""}`}
              </p>
            </motion.div>
          )}

          {/* Employee List */}
          <section>
            {isInitialLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonCard key={i} index={i} />
                ))}
              </div>
            ) : employees.length === 0 ? (
              <EmptyState onAddEmployee={handleNewEmployee} />
            ) : filteredEmployees.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16 px-4 glass-card rounded-3xl"
              >
                <div className="rounded-full bg-secondary/50 p-6 mb-6">
                  <Users className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Nenhum resultado encontrado
                </h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Tente ajustar os filtros ou buscar por outros termos.
                </p>
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="rounded-xl border-border"
                >
                  Limpar filtros
                </Button>
              </motion.div>
            ) : (
              <motion.div 
                className="grid gap-4 md:grid-cols-2"
                layout
              >
                <AnimatePresence mode="popLayout">
                  {filteredEmployees.map((employee, index) => (
                    <EmployeeCard
                      key={employee.id}
                      employee={employee}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
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
    </div>
  );
};

export default Index;
