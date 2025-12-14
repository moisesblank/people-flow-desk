import { useState, useMemo, useCallback, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { EmployeeStatus, Sector } from "@/types/employee";

interface Employee {
  id: number;
  nome: string;
  funcao: string;
  setor: Sector;
  email: string;
  salario: number;
  dataAdmissao: string;
  status: EmployeeStatus;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

const sectorMapping: Record<string, Sector> = {
  "Coordenação": "Coordenação",
  "Suporte": "Suporte",
  "Monitoria": "Monitoria",
  "Afiliados": "Afiliados",
  "Marketing": "Marketing",
  "Administrativo": "Administrativo",
  "Financeiro": "Administrativo",
  "Vendas": "Marketing",
  "Design": "Marketing",
  "Gestão": "Coordenação",
};

export default function Funcionarios() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | "all">("all");
  const [sectorFilter, setSectorFilter] = useState<Sector | "all">("all");

  const fetchEmployees = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("nome");

      if (error) throw error;

      const mappedEmployees: Employee[] = (data || []).map(emp => ({
        id: emp.id,
        nome: emp.nome,
        funcao: emp.funcao,
        setor: sectorMapping[emp.setor || ""] || "Administrativo",
        email: emp.email || "",
        salario: emp.salario,
        dataAdmissao: emp.data_admissao || "",
        status: (emp.status as EmployeeStatus) || "ativo",
      }));

      setEmployees(mappedEmployees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Erro ao carregar funcionários");
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

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

    try {
      const dbSetor = Object.entries(sectorMapping).find(([, v]) => v === data.setor)?.[0] || data.setor;

      if (data.id) {
        const { error } = await supabase
          .from("employees")
          .update({
            nome: data.nome,
            funcao: data.funcao,
            setor: dbSetor as any,
            email: data.email,
            salario: data.salario,
            data_admissao: data.dataAdmissao || null,
            status: data.status as any,
          })
          .eq("id", data.id);

        if (error) throw error;

        toast.success("Funcionário atualizado!", {
          description: `${data.nome} foi atualizado com sucesso.`,
        });
      } else {
        const { error } = await supabase
          .from("employees")
          .insert({
            nome: data.nome,
            funcao: data.funcao,
            setor: dbSetor as any,
            email: data.email,
            salario: data.salario,
            data_admissao: data.dataAdmissao || null,
            status: data.status as any,
            created_by: user?.id,
          });

        if (error) throw error;

        toast.success("Funcionário cadastrado!", {
          description: `${data.nome} foi adicionado à equipe.`,
        });
      }

      await fetchEmployees();
    } catch (error: any) {
      console.error("Error saving employee:", error);
      toast.error("Erro ao salvar funcionário");
    } finally {
      setIsLoading(false);
      setIsModalOpen(false);
      setSelectedEmployee(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedEmployee) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", selectedEmployee.id);

      if (error) throw error;

      toast.success("Funcionário excluído!", {
        description: `${selectedEmployee.nome} foi removido da equipe.`,
      });

      await fetchEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error("Erro ao excluir funcionário");
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
      setSelectedEmployee(null);
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
  );
}
