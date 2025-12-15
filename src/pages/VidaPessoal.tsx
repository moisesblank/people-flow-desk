// ============================================
// UPGRADE v10 - MÓDULO VIDA PESSOAL
// Pets, Veículos e Despesas Pessoais (OWNER ONLY)
// ============================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  PawPrint,
  Car,
  Wallet,
  Plus,
  Calendar,
  Syringe,
  Wrench,
  Fuel,
  Heart,
  Edit,
  Trash2,
  MoreVertical,
  DollarSign,
  TrendingDown,
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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Pet {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  birth_date: string | null;
  weight: number | null;
  avatar_url: string | null;
  vet_name: string | null;
  vet_phone: string | null;
  notes: string | null;
}

interface PetVaccine {
  id: string;
  pet_id: string;
  name: string;
  applied_date: string | null;
  next_date: string | null;
  vet_name: string | null;
  notes: string | null;
}

interface Vehicle {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  plate: string | null;
  color: string | null;
  fuel_type: string | null;
  current_km: number;
  avatar_url: string | null;
}

interface VehicleMaintenance {
  id: string;
  vehicle_id: string;
  type: string;
  description: string | null;
  km_at_service: number | null;
  next_km: number | null;
  cost: number | null;
  service_date: string | null;
  next_service_date: string | null;
  notes: string | null;
}

interface PersonalExpense {
  id: string;
  description: string;
  amount: number;
  category: string | null;
  date: string;
  notes: string | null;
}

export default function VidaPessoal() {
  const navigate = useNavigate();
  const { isOwner, isLoading: checkingPermission } = useAdminCheck();
  
  const [pets, setPets] = useState<Pet[]>([]);
  const [vaccines, setVaccines] = useState<PetVaccine[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenances, setMaintenances] = useState<VehicleMaintenance[]>([]);
  const [expenses, setExpenses] = useState<PersonalExpense[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isVaccineModalOpen, setIsVaccineModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const [petForm, setPetForm] = useState({
    name: "",
    species: "",
    breed: "",
    birth_date: "",
    weight: 0,
    vet_name: "",
    vet_phone: "",
    notes: "",
  });

  const [vehicleForm, setVehicleForm] = useState({
    name: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    plate: "",
    color: "",
    fuel_type: "",
    current_km: 0,
  });

  const [expenseForm, setExpenseForm] = useState({
    description: "",
    amount: 0,
    category: "",
    date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  });

  const [vaccineForm, setVaccineForm] = useState({
    name: "",
    applied_date: "",
    next_date: "",
    vet_name: "",
    notes: "",
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    type: "",
    description: "",
    km_at_service: 0,
    next_km: 0,
    cost: 0,
    service_date: "",
    next_service_date: "",
    notes: "",
  });

  useEffect(() => {
    if (!checkingPermission && !isOwner) {
      toast.error("Acesso restrito ao proprietário");
      navigate("/");
    }
  }, [isOwner, checkingPermission, navigate]);

  useEffect(() => {
    if (isOwner) {
      fetchData();
    }
  }, [isOwner]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [petsRes, vaccinesRes, vehiclesRes, maintenancesRes, expensesRes] = await Promise.all([
        supabase.from("pets").select("*").order("name"),
        supabase.from("pet_vaccines").select("*").order("next_date"),
        supabase.from("vehicles").select("*").order("name"),
        supabase.from("vehicle_maintenance").select("*").order("service_date", { ascending: false }),
        supabase.from("personal_expenses_v2").select("*").order("date", { ascending: false }).limit(50),
      ]);

      if (petsRes.data) setPets(petsRes.data);
      if (vaccinesRes.data) setVaccines(vaccinesRes.data);
      if (vehiclesRes.data) setVehicles(vehiclesRes.data);
      if (maintenancesRes.data) setMaintenances(maintenancesRes.data as VehicleMaintenance[]);
      if (expensesRes.data) setExpenses(expensesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  // CRUD Functions
  const handleSavePet = async () => {
    try {
      if (selectedPet) {
        await supabase.from("pets").update(petForm).eq("id", selectedPet.id);
        toast.success("Pet atualizado!");
      } else {
        await supabase.from("pets").insert(petForm);
        toast.success("Pet cadastrado!");
      }
      setIsPetModalOpen(false);
      setSelectedPet(null);
      fetchData();
    } catch {
      toast.error("Erro ao salvar pet");
    }
  };

  const handleSaveVehicle = async () => {
    try {
      if (selectedVehicle) {
        await supabase.from("vehicles").update(vehicleForm).eq("id", selectedVehicle.id);
        toast.success("Veículo atualizado!");
      } else {
        await supabase.from("vehicles").insert(vehicleForm);
        toast.success("Veículo cadastrado!");
      }
      setIsVehicleModalOpen(false);
      setSelectedVehicle(null);
      fetchData();
    } catch {
      toast.error("Erro ao salvar veículo");
    }
  };

  const handleSaveExpense = async () => {
    try {
      await supabase.from("personal_expenses_v2").insert(expenseForm);
      toast.success("Despesa registrada!");
      setIsExpenseModalOpen(false);
      setExpenseForm({
        description: "",
        amount: 0,
        category: "",
        date: format(new Date(), "yyyy-MM-dd"),
        notes: "",
      });
      fetchData();
    } catch {
      toast.error("Erro ao salvar despesa");
    }
  };

  const handleSaveVaccine = async () => {
    if (!selectedPet) return;
    try {
      await supabase.from("pet_vaccines").insert({
        ...vaccineForm,
        pet_id: selectedPet.id,
      });
      toast.success("Vacina registrada!");
      setIsVaccineModalOpen(false);
      fetchData();
    } catch {
      toast.error("Erro ao salvar vacina");
    }
  };

  const handleSaveMaintenance = async () => {
    if (!selectedVehicle) return;
    try {
      await supabase.from("vehicle_maintenance").insert({
        ...maintenanceForm,
        vehicle_id: selectedVehicle.id,
      });
      toast.success("Manutenção registrada!");
      setIsMaintenanceModalOpen(false);
      fetchData();
    } catch {
      toast.error("Erro ao salvar manutenção");
    }
  };

  const handleDeletePet = async (id: string) => {
    if (!confirm("Excluir este pet?")) return;
    await supabase.from("pets").delete().eq("id", id);
    toast.success("Pet excluído!");
    fetchData();
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm("Excluir este veículo?")) return;
    await supabase.from("vehicles").delete().eq("id", id);
    toast.success("Veículo excluído!");
    fetchData();
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Excluir esta despesa?")) return;
    await supabase.from("personal_expenses_v2").delete().eq("id", id);
    toast.success("Despesa excluída!");
    fetchData();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Calculations
  const totalExpensesMonth = expenses
    .filter((e) => {
      const expenseDate = new Date(e.date);
      const now = new Date();
      return (
        expenseDate.getMonth() === now.getMonth() &&
        expenseDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const upcomingVaccines = vaccines.filter((v) => {
    if (!v.next_date) return false;
    const days = differenceInDays(new Date(v.next_date), new Date());
    return days >= 0 && days <= 30;
  });

  if (checkingPermission || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isOwner) return null;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Heart className="h-8 w-8 text-primary" />
            Vida Pessoal
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus pets, veículos e despesas pessoais
          </p>
        </div>
        <Badge variant="outline" className="border-primary/30 text-primary">
          Área Exclusiva - Owner
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <PawPrint className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pets.length}</p>
                <p className="text-xs text-muted-foreground">Pets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Car className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vehicles.length}</p>
                <p className="text-xs text-muted-foreground">Veículos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalExpensesMonth)}</p>
                <p className="text-xs text-muted-foreground">Gastos do Mês</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Syringe className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingVaccines.length}</p>
                <p className="text-xs text-muted-foreground">Vacinas Próximas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pets" className="flex items-center gap-2">
            <PawPrint className="h-4 w-4" />
            Pets
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Veículos
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Despesas
          </TabsTrigger>
        </TabsList>

        {/* PETS TAB */}
        <TabsContent value="pets" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isPetModalOpen} onOpenChange={setIsPetModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setSelectedPet(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Pet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{selectedPet ? "Editar Pet" : "Novo Pet"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome *</Label>
                      <Input
                        value={petForm.name}
                        onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Espécie</Label>
                      <Input
                        value={petForm.species}
                        onChange={(e) => setPetForm({ ...petForm, species: e.target.value })}
                        placeholder="Cachorro, Gato..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Raça</Label>
                      <Input
                        value={petForm.breed}
                        onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data de Nascimento</Label>
                      <Input
                        type="date"
                        value={petForm.birth_date}
                        onChange={(e) => setPetForm({ ...petForm, birth_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Peso (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={petForm.weight}
                        onChange={(e) => setPetForm({ ...petForm, weight: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Veterinário</Label>
                      <Input
                        value={petForm.vet_name}
                        onChange={(e) => setPetForm({ ...petForm, vet_name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone Veterinário</Label>
                    <Input
                      value={petForm.vet_phone}
                      onChange={(e) => setPetForm({ ...petForm, vet_phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={petForm.notes}
                      onChange={(e) => setPetForm({ ...petForm, notes: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsPetModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSavePet}>Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pets.map((pet) => {
              const petVaccines = vaccines.filter((v) => v.pet_id === pet.id);
              return (
                <motion.div
                  key={pet.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                          <PawPrint className="h-6 w-6 text-orange-400" />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedPet(pet);
                                setVaccineForm({ name: "", applied_date: "", next_date: "", vet_name: "", notes: "" });
                                setIsVaccineModalOpen(true);
                              }}
                            >
                              <Syringe className="h-4 w-4 mr-2" />
                              Registrar Vacina
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedPet(pet);
                                setPetForm({
                                  name: pet.name,
                                  species: pet.species || "",
                                  breed: pet.breed || "",
                                  birth_date: pet.birth_date || "",
                                  weight: pet.weight || 0,
                                  vet_name: pet.vet_name || "",
                                  vet_phone: pet.vet_phone || "",
                                  notes: pet.notes || "",
                                });
                                setIsPetModalOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeletePet(pet.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <h3 className="font-semibold text-lg">{pet.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {pet.species} {pet.breed && `• ${pet.breed}`}
                      </p>
                      {pet.weight && (
                        <p className="text-sm text-muted-foreground mt-1">{pet.weight} kg</p>
                      )}
                      {petVaccines.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-xs text-muted-foreground">
                            {petVaccines.length} vacina(s) registrada(s)
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* VEHICLES TAB */}
        <TabsContent value="vehicles" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isVehicleModalOpen} onOpenChange={setIsVehicleModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setSelectedVehicle(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Veículo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {selectedVehicle ? "Editar Veículo" : "Novo Veículo"}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome/Apelido *</Label>
                      <Input
                        value={vehicleForm.name}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })}
                        placeholder="Ex: Carro do trabalho"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Marca</Label>
                      <Input
                        value={vehicleForm.brand}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, brand: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Modelo</Label>
                      <Input
                        value={vehicleForm.model}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ano</Label>
                      <Input
                        type="number"
                        value={vehicleForm.year}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, year: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Placa</Label>
                      <Input
                        value={vehicleForm.plate}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, plate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Cor</Label>
                      <Input
                        value={vehicleForm.color}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, color: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Combustível</Label>
                      <Input
                        value={vehicleForm.fuel_type}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, fuel_type: e.target.value })}
                        placeholder="Flex, Gasolina..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Km Atual</Label>
                      <Input
                        type="number"
                        value={vehicleForm.current_km}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, current_km: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsVehicleModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveVehicle}>Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {vehicles.map((vehicle) => {
              const vehicleMaintenances = maintenances.filter((m) => m.vehicle_id === vehicle.id);
              return (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <Car className="h-6 w-6 text-blue-400" />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedVehicle(vehicle);
                                setMaintenanceForm({
                                  type: "",
                                  description: "",
                                  km_at_service: vehicle.current_km,
                                  next_km: 0,
                                  cost: 0,
                                  service_date: "",
                                  next_service_date: "",
                                  notes: "",
                                });
                                setIsMaintenanceModalOpen(true);
                              }}
                            >
                              <Wrench className="h-4 w-4 mr-2" />
                              Registrar Manutenção
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedVehicle(vehicle);
                                setVehicleForm({
                                  name: vehicle.name,
                                  brand: vehicle.brand || "",
                                  model: vehicle.model || "",
                                  year: vehicle.year || new Date().getFullYear(),
                                  plate: vehicle.plate || "",
                                  color: vehicle.color || "",
                                  fuel_type: vehicle.fuel_type || "",
                                  current_km: vehicle.current_km,
                                });
                                setIsVehicleModalOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteVehicle(vehicle.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <h3 className="font-semibold text-lg">{vehicle.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.brand} {vehicle.model} {vehicle.year}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {vehicle.plate && <span>{vehicle.plate}</span>}
                        <span>{vehicle.current_km.toLocaleString()} km</span>
                        {vehicle.fuel_type && (
                          <span className="flex items-center gap-1">
                            <Fuel className="h-3 w-3" />
                            {vehicle.fuel_type}
                          </span>
                        )}
                      </div>
                      {vehicleMaintenances.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-xs text-muted-foreground">
                            {vehicleMaintenances.length} manutenção(ões) registrada(s)
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* EXPENSES TAB */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Despesa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Despesa Pessoal</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Descrição *</Label>
                    <Input
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Valor *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data</Label>
                      <Input
                        type="date"
                        value={expenseForm.date}
                        onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Input
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                      placeholder="Alimentação, Transporte, Lazer..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={expenseForm.notes}
                      onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsExpenseModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveExpense}>Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {expenses.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma despesa registrada</p>
                  </div>
                ) : (
                  expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-red-400" />
                        </div>
                        <div>
                          <p className="font-medium">{expense.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {expense.category && `${expense.category} • `}
                            {format(new Date(expense.date), "dd/MM/yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-red-400">
                          -{formatCurrency(expense.amount)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Vaccine Modal */}
      <Dialog open={isVaccineModalOpen} onOpenChange={setIsVaccineModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Vacina - {selectedPet?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Vacina *</Label>
              <Input
                value={vaccineForm.name}
                onChange={(e) => setVaccineForm({ ...vaccineForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Aplicação</Label>
                <Input
                  type="date"
                  value={vaccineForm.applied_date}
                  onChange={(e) => setVaccineForm({ ...vaccineForm, applied_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Próxima Dose</Label>
                <Input
                  type="date"
                  value={vaccineForm.next_date}
                  onChange={(e) => setVaccineForm({ ...vaccineForm, next_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Veterinário</Label>
              <Input
                value={vaccineForm.vet_name}
                onChange={(e) => setVaccineForm({ ...vaccineForm, vet_name: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsVaccineModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveVaccine}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Maintenance Modal */}
      <Dialog open={isMaintenanceModalOpen} onOpenChange={setIsMaintenanceModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Manutenção - {selectedVehicle?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Serviço *</Label>
              <Input
                value={maintenanceForm.type}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, type: e.target.value })}
                placeholder="Troca de óleo, Revisão, Pneus..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Km no Serviço</Label>
                <Input
                  type="number"
                  value={maintenanceForm.km_at_service}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, km_at_service: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Próximo Km</Label>
                <Input
                  type="number"
                  value={maintenanceForm.next_km}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, next_km: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data do Serviço</Label>
                <Input
                  type="date"
                  value={maintenanceForm.service_date}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, service_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Custo (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={maintenanceForm.cost}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={maintenanceForm.description}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsMaintenanceModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveMaintenance}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
