// ============================================
// MOISÉS MEDEIROS v7.0 - ALUNOS
// Spider-Man Theme - Gestão de Estudantes
// Elementos de Química Integrados
// ============================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, GraduationCap, Sparkles, Trash2, Edit2, Users, Award, TrendingUp, FlaskConical, Atom } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/employees/StatCard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AnimatedAtom, MiniPeriodicTable, ChemistryTip } from "@/components/chemistry/ChemistryVisuals";
import studentsHeroImage from "@/assets/students-chemistry-hero.jpg";

interface Student {
  id: number;
  nome: string;
  email: string;
  curso: string;
  status: string;
}

const STATUS_OPTIONS = ["Ativo", "Concluído", "Pendente", "Cancelado"];

export default function Alunos() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Student | null>(null);
  const [formData, setFormData] = useState({ nome: "", email: "", curso: "", status: "Ativo" });

  const fetchData = async () => {
    try {
      const { data, error } = await supabase.from("students").select("*").order("nome");
      if (error) throw error;
      setStudents(data?.map(s => ({
        id: s.id,
        nome: s.nome,
        email: s.email || "",
        curso: s.curso || "",
        status: s.status || "Ativo",
      })) || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Erro ao carregar alunos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const ativos = students.filter(s => s.status === "Ativo").length;
  const concluidos = students.filter(s => s.status === "Concluído").length;

  const openModal = (student?: Student) => {
    setEditingItem(student || null);
    setFormData(student 
      ? { nome: student.nome, email: student.email, curso: student.curso, status: student.status }
      : { nome: "", email: "", curso: "", status: "Ativo" }
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
          .from("students")
          .update({ nome: formData.nome, email: formData.email, curso: formData.curso, status: formData.status })
          .eq("id", editingItem.id);
        if (error) throw error;
        toast.success("Aluno atualizado!");
      } else {
        const { error } = await supabase.from("students").insert({
          nome: formData.nome,
          email: formData.email,
          curso: formData.curso,
          status: formData.status,
        });
        if (error) throw error;
        toast.success("Aluno adicionado!");
      }

      await fetchData();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Error saving student:", error);
      toast.error(error.message || "Erro ao salvar");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
      toast.success("Aluno removido!");
      await fetchData();
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Erro ao remover");
    }
  };

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="mx-auto max-w-7xl">
        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full h-48 md:h-56 rounded-2xl overflow-hidden mb-8"
        >
          <img 
            src={studentsHeroImage} 
            alt="Alunos - Futuros Cientistas" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-between p-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FlaskConical className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary uppercase tracking-wider">Plataforma</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Alunos</h1>
              <p className="text-muted-foreground max-w-md">
                Formando os cientistas e médicos do futuro
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-4">
              <AnimatedAtom size={70} />
              <Button onClick={() => openModal()} size="lg" className="gap-2">
                <Plus className="h-5 w-5" /> Novo Aluno
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Mobile Button */}
        <div className="lg:hidden mb-6">
          <Button onClick={() => openModal()} size="lg" className="w-full gap-2">
            <Plus className="h-5 w-5" /> Novo Aluno
          </Button>
        </div>

        {/* Stats */}
        <section className="mb-10 grid gap-4 sm:grid-cols-4">
          <StatCard title="Total Alunos" value={students.length} icon={Users} variant="blue" delay={0} />
          <StatCard title="Ativos" value={ativos} icon={GraduationCap} variant="green" delay={1} />
          <StatCard title="Concluídos" value={concluidos} icon={Award} variant="purple" delay={2} />
          <StatCard title="Taxa Aprovação" value={students.length > 0 ? Math.round((concluidos / students.length) * 100) : 0} formatFn={(v) => `${v}%`} icon={TrendingUp} variant="red" delay={3} />
        </section>

        {/* Table */}
        <section>
          <div className="glass-card rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Nome</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Email</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Curso</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-t border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="p-4 text-foreground font-medium">{student.nome}</td>
                    <td className="p-4 text-muted-foreground">{student.email || "-"}</td>
                    <td className="p-4 text-muted-foreground">{student.curso || "-"}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        student.status === "Ativo" ? "bg-status-active/20 text-status-active" :
                        student.status === "Concluído" ? "bg-status-vacation/20 text-status-vacation" :
                        student.status === "Pendente" ? "bg-status-away/20 text-status-away" :
                        "bg-status-inactive/20 text-status-inactive"
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openModal(student)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(student.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum aluno cadastrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Editar" : "Novo"} Aluno</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Nome</Label>
                <Input value={formData.nome} onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))} placeholder="Nome do aluno" className="mt-1.5" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="email@exemplo.com" className="mt-1.5" />
              </div>
              <div>
                <Label>Curso</Label>
                <Input value={formData.curso} onChange={(e) => setFormData(prev => ({ ...prev, curso: e.target.value }))} placeholder="Nome do curso" className="mt-1.5" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
