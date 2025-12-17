// ============================================
// EMPRESARIAL 2090 - ACADEMIA QUANTUM
// Cyberpunk Edition - AJUDA15
// ============================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, GraduationCap, Sparkles, Trash2, Edit2, Users, Award, TrendingUp, FlaskConical, Atom, Paperclip, Brain, Target, BookOpen } from "lucide-react";
import { FuturisticPageHeader } from "@/components/ui/futuristic-page-header";
import { FuturisticCard } from "@/components/ui/futuristic-card";
import { CyberBackground } from "@/components/ui/cyber-background";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/employees/StatCard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AnimatedAtom, MiniPeriodicTable, ChemistryTip } from "@/components/chemistry/ChemistryVisuals";
import { StudentAnalytics } from "@/components/students/StudentAnalytics";
import { StudentProgressCard } from "@/components/students/StudentProgressCard";
import { AttachmentButton } from "@/components/attachments/AutoAttachmentWrapper";
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
    <div className="relative min-h-screen">
      <CyberBackground variant="matrix" />
      
      <div className="relative z-10 p-4 md:p-8 lg:p-12">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Futuristic Header */}
          <FuturisticPageHeader
            title="Academia Quantum"
            subtitle="Sistema Neural de Gestão de Alunos"
            icon={GraduationCap}
            badge="STUDENT MATRIX"
            accentColor="blue"
            stats={[
              { label: "Total", value: students.length, icon: Users },
              { label: "Ativos", value: ativos, icon: Brain },
              { label: "Concluídos", value: concluidos, icon: Award },
            ]}
            action={
              <Button 
                onClick={() => openModal()}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/25"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Aluno
              </Button>
            }
          />

          {/* Mobile Button */}
          <div className="lg:hidden">
            <Button 
              onClick={() => openModal()} 
              size="lg" 
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/25 gap-2 h-12 rounded-xl"
            >
              <Plus className="h-5 w-5" />
              Novo Aluno
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FuturisticCard accentColor="blue" className="p-4 text-center">
              <Users className="h-6 w-6 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-400">{students.length}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Alunos</div>
            </FuturisticCard>
            <FuturisticCard accentColor="green" className="p-4 text-center">
              <GraduationCap className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-emerald-400">{ativos}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Ativos</div>
            </FuturisticCard>
            <FuturisticCard accentColor="purple" className="p-4 text-center">
              <Award className="h-6 w-6 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-400">{concluidos}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Concluídos</div>
            </FuturisticCard>
            <FuturisticCard accentColor="cyan" className="p-4 text-center">
              <TrendingUp className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-cyan-400">
                {students.length > 0 ? Math.round((concluidos / students.length) * 100) : 0}%
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Taxa Aprovação</div>
            </FuturisticCard>
          </div>

          {/* Analytics */}
          <section className="mb-8">
            <StudentAnalytics 
              totalStudents={students.length}
              activeStudents={ativos}
              completedStudents={concluidos}
              averageProgress={students.length > 0 ? 65 : 0}
              averageXP={students.length > 0 ? 2450 : 0}
              topPerformers={students.slice(0, 5).map((s, i) => ({
                id: s.id.toString(),
                name: s.nome,
                xp: 3000 - (i * 200),
                progress: 90 - (i * 5)
              }))}
            />
          </section>

          {/* Table */}
          <section>
            <FuturisticCard accentColor="blue">
              <table className="w-full">
                <thead className="bg-blue-500/10">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-blue-400">Nome</th>
                    <th className="text-left p-4 text-sm font-medium text-blue-400">Email</th>
                    <th className="text-left p-4 text-sm font-medium text-blue-400">Curso</th>
                    <th className="text-left p-4 text-sm font-medium text-blue-400">Status</th>
                    <th className="text-right p-4 text-sm font-medium text-blue-400">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-t border-blue-500/20 hover:bg-blue-500/5 transition-colors">
                      <td className="p-4 text-foreground font-medium">{student.nome}</td>
                      <td className="p-4 text-muted-foreground">{student.email || "-"}</td>
                      <td className="p-4 text-muted-foreground">{student.curso || "-"}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          student.status === "Ativo" ? "bg-emerald-500/20 text-emerald-400" :
                          student.status === "Concluído" ? "bg-purple-500/20 text-purple-400" :
                          student.status === "Pendente" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-red-500/20 text-red-400"
                        }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <AttachmentButton
                            entityType="student"
                            entityId={student.id}
                            entityLabel={student.nome}
                            variant="ghost"
                            size="icon"
                          />
                          <Button variant="ghost" size="icon" onClick={() => openModal(student)}>
                            <Edit2 className="h-4 w-4 text-blue-400" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(student.id)} className="text-red-400 hover:text-red-300">
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
            </FuturisticCard>
          </section>

          {/* Modal */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-md border-blue-500/30">
              <DialogHeader>
                <DialogTitle className="text-blue-400">{editingItem ? "Editar" : "Novo"} Aluno</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Nome</Label>
                  <Input value={formData.nome} onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))} placeholder="Nome do aluno" className="mt-1.5 border-blue-500/30" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="email@exemplo.com" className="mt-1.5 border-blue-500/30" />
                </div>
                <div>
                  <Label>Curso</Label>
                  <Input value={formData.curso} onChange={(e) => setFormData(prev => ({ ...prev, curso: e.target.value }))} placeholder="Nome do curso" className="mt-1.5 border-blue-500/30" />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
                    <SelectTrigger className="mt-1.5 border-blue-500/30"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSave} className="w-full bg-gradient-to-r from-blue-500 to-cyan-600">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
