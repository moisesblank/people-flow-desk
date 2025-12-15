// ============================================
// SYNAPSE v5.0 - Widget de Ponto Eletrônico
// ============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  MapPin,
  Coffee,
  LogIn,
  LogOut,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  useTodayEntries,
  useRegisterTimeClock,
  formatMinutesToHours,
  useWorkHoursCalculation,
  TimeClockEntry,
} from "@/hooks/useTimeClock";

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export function TimeClockWidget() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingEntryType, setPendingEntryType] = useState<TimeClockEntry['entry_type'] | null>(null);
  const [employeeId, setEmployeeId] = useState<number | null>(null);

  const { data: todayEntries = [], isLoading } = useTodayEntries();
  const registerMutation = useRegisterTimeClock();
  const workHours = useWorkHoursCalculation(todayEntries);

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Buscar employee_id
  useEffect(() => {
    async function fetchEmployeeId() {
      if (!user?.id) return;
      const { data } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setEmployeeId(data.id);
    }
    fetchEmployeeId();
  }, [user?.id]);

  // Determinar próximo tipo de registro
  const getNextEntryType = (): TimeClockEntry['entry_type'] | null => {
    if (!todayEntries.length) return "entrada";

    const lastEntry = todayEntries[todayEntries.length - 1];
    switch (lastEntry.entry_type) {
      case "entrada":
        return "inicio_almoco";
      case "inicio_almoco":
        return "fim_almoco";
      case "fim_almoco":
        return "saida";
      case "saida":
        return null; // Dia completo
      default:
        return "entrada";
    }
  };

  const nextEntryType = getNextEntryType();

  // Buscar localização
  const requestLocation = () => {
    setLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocalização não suportada");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const loc: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        // Tentar buscar endereço via API reversa
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${loc.latitude}&lon=${loc.longitude}&format=json`
          );
          const data = await response.json();
          if (data.display_name) {
            loc.address = data.display_name;
          }
        } catch {
          // Ignorar erro de geocodificação
        }

        setLocation(loc);
        setLocationLoading(false);
      },
      (error) => {
        setLocationError(
          error.code === 1
            ? "Permissão negada"
            : error.code === 2
            ? "Localização indisponível"
            : "Timeout na localização"
        );
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Registrar ponto
  const handleRegisterPoint = async () => {
    if (!pendingEntryType || !employeeId) return;

    await registerMutation.mutateAsync({
      employee_id: employeeId,
      entry_type: pendingEntryType,
      latitude: location?.latitude,
      longitude: location?.longitude,
      location_address: location?.address,
      notes: notes || undefined,
    });

    setShowConfirmDialog(false);
    setNotes("");
    setPendingEntryType(null);
  };

  // Iniciar processo de registro
  const initiateRegistration = (type: TimeClockEntry['entry_type']) => {
    setPendingEntryType(type);
    requestLocation();
    setShowConfirmDialog(true);
  };

  const entryTypeLabels = {
    entrada: { label: "Entrada", icon: LogIn, color: "bg-stats-green" },
    inicio_almoco: { label: "Início Almoço", icon: Coffee, color: "bg-stats-gold" },
    fim_almoco: { label: "Fim Almoço", icon: Coffee, color: "bg-stats-blue" },
    saida: { label: "Saída", icon: LogOut, color: "bg-primary" },
  };

  if (!employeeId) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 text-center text-muted-foreground">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p>Você não está vinculado como funcionário.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass-card overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Ponto Eletrônico
            </CardTitle>
            <Badge variant="outline" className="font-mono text-xs">
              {workHours.worked > 0 && formatMinutesToHours(workHours.worked)} trabalhadas
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Relógio Digital */}
          <motion.div
            className="text-center py-4"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
          >
            <div className="text-5xl font-mono font-bold text-foreground">
              {currentTime.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {currentTime.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </motion.div>

          {/* Registros do dia */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Registros de Hoje
            </p>
            <div className="flex flex-wrap gap-2">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : todayEntries.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                  Nenhum registro hoje
                </span>
              ) : (
                todayEntries.map((entry) => {
                  const config = entryTypeLabels[entry.entry_type];
                  const time = new Date(entry.registered_at);
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.color}/10 border border-${config.color}/20`}
                    >
                      <config.icon className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">{config.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {time.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* Botão de registro */}
          {nextEntryType ? (
            <Button
              onClick={() => initiateRegistration(nextEntryType)}
              disabled={registerMutation.isPending}
              className="w-full h-14 text-lg font-semibold relative overflow-hidden group"
              size="lg"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              />
              {registerMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <>
                  {(() => {
                    const IconComponent = entryTypeLabels[nextEntryType].icon;
                    return IconComponent ? <IconComponent className="h-5 w-5 mr-2" /> : null;
                  })()}
                </>
              )}
              Registrar {entryTypeLabels[nextEntryType].label}
            </Button>
          ) : (
            <div className="text-center py-4">
              <CheckCircle2 className="h-8 w-8 text-stats-green mx-auto mb-2" />
              <p className="text-sm font-medium text-stats-green">
                Jornada completa registrada!
              </p>
            </div>
          )}

          {/* Resumo de horas */}
          {workHours.worked > 0 && (
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">
                  {formatMinutesToHours(workHours.worked)}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase">Trabalhadas</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-stats-green">
                  {formatMinutesToHours(workHours.overtime)}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase">Extras</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-muted-foreground">
                  {formatMinutesToHours(Math.max(0, 480 - workHours.worked))}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase">Restantes</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmação */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Confirmar {pendingEntryType && entryTypeLabels[pendingEntryType].label}
            </DialogTitle>
            <DialogDescription>
              Confirme os dados do registro de ponto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Horário */}
            <div className="text-center py-4 bg-secondary/50 rounded-lg">
              <p className="text-3xl font-mono font-bold">
                {currentTime.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-sm text-muted-foreground">
                {currentTime.toLocaleDateString("pt-BR")}
              </p>
            </div>

            {/* Localização */}
            <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
              {locationLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
                  <span className="text-sm">Obtendo localização...</span>
                </>
              ) : locationError ? (
                <>
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                  <div>
                    <p className="text-sm text-destructive">{locationError}</p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={requestLocation}
                      className="p-0 h-auto"
                    >
                      Tentar novamente
                    </Button>
                  </div>
                </>
              ) : location ? (
                <>
                  <Navigation className="h-5 w-5 text-stats-green shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-stats-green">Localização obtida</p>
                    {location.address && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {location.address}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Localização não disponível
                  </span>
                </>
              )}
            </div>

            {/* Observações */}
            <div>
              <label className="text-sm font-medium">Observações (opcional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione uma observação..."
                className="mt-1.5"
                rows={2}
              />
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleRegisterPoint}
                disabled={registerMutation.isPending}
                className="flex-1"
              >
                {registerMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
