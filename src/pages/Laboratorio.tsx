// ============================================
// UPGRADE v10 - MÓDULO LABORATÓRIO
// Gestão de Reagentes e Equipamentos
// ============================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FlaskConical,
  Beaker,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  Package,
  Wrench,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Edit,
  MoreVertical,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Reagent {
  id: string;
  name: string;
  formula: string | null;
  cas_number: string | null;
  quantity: number;
  unit: string;
  min_quantity: number;
  location: string | null;
  expiry_date: string | null;
  supplier: string | null;
  is_hazardous: boolean;
  safety_notes: string | null;
}

interface Equipment {
  id: string;
  name: string;
  model: string | null;
  serial_number: string | null;
  location: string | null;
  status: "available" | "in_use" | "maintenance" | "broken";
  last_maintenance: string | null;
  next_maintenance: string | null;
  notes: string | null;
}

export default function Laboratorio() {
  const [reagents, setReagents] = useState<Reagent[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isReagentModalOpen, setIsReagentModalOpen] = useState(false);
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [editingReagent, setEditingReagent] = useState<Reagent | null>(null);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  const [reagentForm, setReagentForm] = useState({
    name: "",
    formula: "",
    cas_number: "",
    quantity: 0,
    unit: "g",
    min_quantity: 0,
    location: "",
    expiry_date: "",
    supplier: "",
    is_hazardous: false,
    safety_notes: "",
  });

  const [equipmentForm, setEquipmentForm] = useState({
    name: "",
    model: "",
    serial_number: "",
    location: "",
    status: "available" as Equipment["status"],
    last_maintenance: "",
    next_maintenance: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reagentsRes, equipmentRes] = await Promise.all([
        supabase.from("reagents").select("*").order("name"),
        supabase.from("equipment").select("*").order("name"),
      ]);

      if (reagentsRes.data) setReagents(reagentsRes.data);
      if (equipmentRes.data) setEquipment(equipmentRes.data as Equipment[]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReagent = async () => {
    try {
      if (editingReagent) {
        const { error } = await supabase
          .from("reagents")
          .update(reagentForm)
          .eq("id", editingReagent.id);
        if (error) throw error;
        toast.success("Reagente atualizado!");
      } else {
        const { error } = await supabase.from("reagents").insert(reagentForm);
        if (error) throw error;
        toast.success("Reagente cadastrado!");
      }
      setIsReagentModalOpen(false);
      setEditingReagent(null);
      resetReagentForm();
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar reagente");
    }
  };

  const handleSaveEquipment = async () => {
    try {
      if (editingEquipment) {
        const { error } = await supabase
          .from("equipment")
          .update(equipmentForm)
          .eq("id", editingEquipment.id);
        if (error) throw error;
        toast.success("Equipamento atualizado!");
      } else {
        const { error } = await supabase.from("equipment").insert(equipmentForm);
        if (error) throw error;
        toast.success("Equipamento cadastrado!");
      }
      setIsEquipmentModalOpen(false);
      setEditingEquipment(null);
      resetEquipmentForm();
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar equipamento");
    }
  };

  const handleDeleteReagent = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este reagente?")) return;
    try {
      const { error } = await supabase.from("reagents").delete().eq("id", id);
      if (error) throw error;
      toast.success("Reagente excluído!");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir reagente");
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este equipamento?")) return;
    try {
      const { error } = await supabase.from("equipment").delete().eq("id", id);
      if (error) throw error;
      toast.success("Equipamento excluído!");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir equipamento");
    }
  };

  const resetReagentForm = () => {
    setReagentForm({
      name: "",
      formula: "",
      cas_number: "",
      quantity: 0,
      unit: "g",
      min_quantity: 0,
      location: "",
      expiry_date: "",
      supplier: "",
      is_hazardous: false,
      safety_notes: "",
    });
  };

  const resetEquipmentForm = () => {
    setEquipmentForm({
      name: "",
      model: "",
      serial_number: "",
      location: "",
      status: "available",
      last_maintenance: "",
      next_maintenance: "",
      notes: "",
    });
  };

  const openEditReagent = (reagent: Reagent) => {
    setEditingReagent(reagent);
    setReagentForm({
      name: reagent.name,
      formula: reagent.formula || "",
      cas_number: reagent.cas_number || "",
      quantity: reagent.quantity,
      unit: reagent.unit,
      min_quantity: reagent.min_quantity,
      location: reagent.location || "",
      expiry_date: reagent.expiry_date || "",
      supplier: reagent.supplier || "",
      is_hazardous: reagent.is_hazardous,
      safety_notes: reagent.safety_notes || "",
    });
    setIsReagentModalOpen(true);
  };

  const openEditEquipment = (equip: Equipment) => {
    setEditingEquipment(equip);
    setEquipmentForm({
      name: equip.name,
      model: equip.model || "",
      serial_number: equip.serial_number || "",
      location: equip.location || "",
      status: equip.status,
      last_maintenance: equip.last_maintenance || "",
      next_maintenance: equip.next_maintenance || "",
      notes: equip.notes || "",
    });
    setIsEquipmentModalOpen(true);
  };

  // Filter and alerts
  const filteredReagents = reagents.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.formula?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEquipment = equipment.filter((e) =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockReagents = reagents.filter((r) => r.quantity <= r.min_quantity);
  const expiringReagents = reagents.filter((r) => {
    if (!r.expiry_date) return false;
    const days = differenceInDays(new Date(r.expiry_date), new Date());
    return days >= 0 && days <= 30;
  });
  const maintenanceDue = equipment.filter((e) => {
    if (!e.next_maintenance) return false;
    const days = differenceInDays(new Date(e.next_maintenance), new Date());
    return days >= 0 && days <= 7;
  });

  const getStatusBadge = (status: Equipment["status"]) => {
    const styles = {
      available: "bg-green-500/20 text-green-400 border-green-500/30",
      in_use: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      maintenance: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      broken: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    const labels = {
      available: "Disponível",
      in_use: "Em Uso",
      maintenance: "Manutenção",
      broken: "Quebrado",
    };
    return (
      <Badge variant="outline" className={styles[status]}>
        {labels[status]}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FlaskConical className="h-8 w-8 text-primary" />
            Laboratório
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestão de reagentes químicos e equipamentos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(lowStockReagents.length > 0 || expiringReagents.length > 0 || maintenanceDue.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {lowStockReagents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-orange-500/30 bg-orange-500/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-400" />
                  <div>
                    <p className="font-medium text-orange-400">Estoque Baixo</p>
                    <p className="text-sm text-muted-foreground">
                      {lowStockReagents.length} reagente(s) abaixo do mínimo
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          {expiringReagents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-red-500/30 bg-red-500/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-red-400" />
                  <div>
                    <p className="font-medium text-red-400">Vencimento Próximo</p>
                    <p className="text-sm text-muted-foreground">
                      {expiringReagents.length} reagente(s) vencendo em 30 dias
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          {maintenanceDue.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-yellow-500/30 bg-yellow-500/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <Wrench className="h-5 w-5 text-yellow-400" />
                  <div>
                    <p className="font-medium text-yellow-400">Manutenção</p>
                    <p className="text-sm text-muted-foreground">
                      {maintenanceDue.length} equipamento(s) precisam de manutenção
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="reagents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reagents" className="flex items-center gap-2">
            <Beaker className="h-4 w-4" />
            Reagentes ({reagents.length})
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Equipamentos ({equipment.length})
          </TabsTrigger>
        </TabsList>

        {/* Reagents Tab */}
        <TabsContent value="reagents" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isReagentModalOpen} onOpenChange={setIsReagentModalOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingReagent(null);
                    resetReagentForm();
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Reagente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingReagent ? "Editar Reagente" : "Novo Reagente"}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome *</Label>
                      <Input
                        value={reagentForm.name}
                        onChange={(e) =>
                          setReagentForm({ ...reagentForm, name: e.target.value })
                        }
                        placeholder="Ex: Ácido Clorídrico"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fórmula</Label>
                      <Input
                        value={reagentForm.formula}
                        onChange={(e) =>
                          setReagentForm({ ...reagentForm, formula: e.target.value })
                        }
                        placeholder="Ex: HCl"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        value={reagentForm.quantity}
                        onChange={(e) =>
                          setReagentForm({
                            ...reagentForm,
                            quantity: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unidade</Label>
                      <Input
                        value={reagentForm.unit}
                        onChange={(e) =>
                          setReagentForm({ ...reagentForm, unit: e.target.value })
                        }
                        placeholder="g, mL, L"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Qtd. Mínima</Label>
                      <Input
                        type="number"
                        value={reagentForm.min_quantity}
                        onChange={(e) =>
                          setReagentForm({
                            ...reagentForm,
                            min_quantity: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>CAS Number</Label>
                      <Input
                        value={reagentForm.cas_number}
                        onChange={(e) =>
                          setReagentForm({ ...reagentForm, cas_number: e.target.value })
                        }
                        placeholder="Ex: 7647-01-0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data de Validade</Label>
                      <Input
                        type="date"
                        value={reagentForm.expiry_date}
                        onChange={(e) =>
                          setReagentForm({ ...reagentForm, expiry_date: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Localização</Label>
                      <Input
                        value={reagentForm.location}
                        onChange={(e) =>
                          setReagentForm({ ...reagentForm, location: e.target.value })
                        }
                        placeholder="Ex: Armário A, Prateleira 2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fornecedor</Label>
                      <Input
                        value={reagentForm.supplier}
                        onChange={(e) =>
                          setReagentForm({ ...reagentForm, supplier: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={reagentForm.is_hazardous}
                      onCheckedChange={(checked) =>
                        setReagentForm({ ...reagentForm, is_hazardous: checked })
                      }
                    />
                    <Label>Material Perigoso</Label>
                  </div>
                  {reagentForm.is_hazardous && (
                    <div className="space-y-2">
                      <Label>Notas de Segurança</Label>
                      <Textarea
                        value={reagentForm.safety_notes}
                        onChange={(e) =>
                          setReagentForm({ ...reagentForm, safety_notes: e.target.value })
                        }
                        placeholder="Precauções e instruções de manuseio..."
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsReagentModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveReagent}>Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {filteredReagents.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum reagente cadastrado</p>
                </CardContent>
              </Card>
            ) : (
              filteredReagents.map((reagent, index) => (
                <motion.div
                  key={reagent.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Beaker className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{reagent.name}</h3>
                              {reagent.formula && (
                                <span className="text-sm text-muted-foreground font-mono">
                                  ({reagent.formula})
                                </span>
                              )}
                              {reagent.is_hazardous && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Perigoso
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {reagent.quantity} {reagent.unit}
                                {reagent.quantity <= reagent.min_quantity && (
                                  <Badge variant="outline" className="ml-1 text-orange-400 border-orange-400">
                                    Baixo
                                  </Badge>
                                )}
                              </span>
                              {reagent.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {reagent.location}
                                </span>
                              )}
                              {reagent.expiry_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(reagent.expiry_date), "dd/MM/yyyy")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditReagent(reagent)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteReagent(reagent.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isEquipmentModalOpen} onOpenChange={setIsEquipmentModalOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingEquipment(null);
                    resetEquipmentForm();
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Equipamento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingEquipment ? "Editar Equipamento" : "Novo Equipamento"}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome *</Label>
                      <Input
                        value={equipmentForm.name}
                        onChange={(e) =>
                          setEquipmentForm({ ...equipmentForm, name: e.target.value })
                        }
                        placeholder="Ex: Microscópio"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Modelo</Label>
                      <Input
                        value={equipmentForm.model}
                        onChange={(e) =>
                          setEquipmentForm({ ...equipmentForm, model: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Número de Série</Label>
                      <Input
                        value={equipmentForm.serial_number}
                        onChange={(e) =>
                          setEquipmentForm({
                            ...equipmentForm,
                            serial_number: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Localização</Label>
                      <Input
                        value={equipmentForm.location}
                        onChange={(e) =>
                          setEquipmentForm({ ...equipmentForm, location: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <select
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={equipmentForm.status}
                        onChange={(e) =>
                          setEquipmentForm({
                            ...equipmentForm,
                            status: e.target.value as Equipment["status"],
                          })
                        }
                      >
                        <option value="available">Disponível</option>
                        <option value="in_use">Em Uso</option>
                        <option value="maintenance">Manutenção</option>
                        <option value="broken">Quebrado</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Última Manutenção</Label>
                      <Input
                        type="date"
                        value={equipmentForm.last_maintenance}
                        onChange={(e) =>
                          setEquipmentForm({
                            ...equipmentForm,
                            last_maintenance: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Próxima Manutenção</Label>
                      <Input
                        type="date"
                        value={equipmentForm.next_maintenance}
                        onChange={(e) =>
                          setEquipmentForm({
                            ...equipmentForm,
                            next_maintenance: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={equipmentForm.notes}
                      onChange={(e) =>
                        setEquipmentForm({ ...equipmentForm, notes: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEquipmentModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveEquipment}>Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEquipment.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum equipamento cadastrado</p>
                </CardContent>
              </Card>
            ) : (
              filteredEquipment.map((equip, index) => (
                <motion.div
                  key={equip.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                          <Wrench className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditEquipment(equip)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteEquipment(equip.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <h3 className="font-semibold mb-1">{equip.name}</h3>
                      {equip.model && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {equip.model}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        {getStatusBadge(equip.status)}
                        {equip.location && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {equip.location}
                          </span>
                        )}
                      </div>
                      {equip.next_maintenance && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-xs text-muted-foreground">
                            Próxima manutenção:{" "}
                            {format(new Date(equip.next_maintenance), "dd/MM/yyyy")}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
