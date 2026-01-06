// ============================================
// 🛡️ DOGMA XI v2.0: Modal de Limite de Dispositivos
// Estilo inspirado no JusBrasil - Clean e profissional
// ✅ forwardRef para compatibilidade com Radix UI
// ============================================

import { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Smartphone, Tablet, AlertTriangle, Loader2, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Device } from '@/hooks/useDeviceLimit';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DeviceLimitModalProps {
  isOpen: boolean;
  devices: Device[];
  onDeactivate: (deviceId: string) => Promise<boolean>;
  onClose?: () => void;
  maxDevices?: number;
}

export const DeviceLimitModal = forwardRef<HTMLDivElement, DeviceLimitModalProps>(({ 
  isOpen, 
  devices, 
  onDeactivate, 
  onClose,
  maxDevices = 3 
}, ref) => {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="w-6 h-6" />;
      case 'tablet': return <Tablet className="w-6 h-6" />;
      default: return <Monitor className="w-6 h-6" />;
    }
  };

  const getDeviceTypeName = (type: string) => {
    switch (type) {
      case 'mobile': return 'Celular';
      case 'tablet': return 'Tablet';
      default: return 'Computador';
    }
  };

  const handleDeactivate = async () => {
    if (!selectedDevice) return;
    
    setIsDeactivating(true);
    const success = await onDeactivate(selectedDevice);
    setIsDeactivating(false);
    
    if (success && onClose) {
      onClose();
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { 
        addSuffix: true, 
        locale: ptBR 
      });
    } catch {
      return 'Data desconhecida';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      >
        {/* Backdrop escuro */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        
        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header com ícone de alerta */}
          <div className="bg-destructive/10 border-b border-destructive/20 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-destructive" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">
                  Limite de Dispositivos Atingido
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Você já possui <span className="font-semibold text-foreground">{devices.length}</span> dispositivos ativos.
                  O limite máximo é de <span className="font-semibold text-foreground">{maxDevices}</span> dispositivos.
                </p>
              </div>
            </div>
          </div>

          {/* Corpo do modal */}
          <div className="p-6">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Escolha um dispositivo para desconectar e liberar acesso
              </p>
            </div>

            {/* Lista de dispositivos */}
            <RadioGroup
              value={selectedDevice || ''}
              onValueChange={setSelectedDevice}
              className="space-y-3"
            >
              {devices.map((device) => (
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.01 }}
                  className={`relative rounded-xl border-2 transition-all cursor-pointer ${
                    selectedDevice === device.id 
                      ? 'border-primary bg-primary/5 shadow-lg' 
                      : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50'
                  }`}
                >
                  <Label
                    htmlFor={device.id}
                    className="flex items-center gap-4 p-4 cursor-pointer"
                  >
                    <RadioGroupItem value={device.id} id={device.id} className="sr-only" />
                    
                    {/* Ícone do dispositivo */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      selectedDevice === device.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {getDeviceIcon(device.device_type)}
                    </div>
                    
                    {/* Informações do dispositivo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground truncate">
                          {device.device_name}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {getDeviceTypeName(device.device_type)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{device.browser}</span>
                        <span>•</span>
                        <span>{device.os}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>Último acesso {formatDate(device.last_seen_at)}</span>
                      </div>
                    </div>
                    
                    {/* Indicador de seleção */}
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selectedDevice === device.id 
                        ? 'border-primary bg-primary' 
                        : 'border-muted-foreground/30'
                    }`}>
                      {selectedDevice === device.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 bg-primary-foreground rounded-full"
                        />
                      )}
                    </div>
                  </Label>
                </motion.div>
              ))}
            </RadioGroup>
          </div>

          {/* Footer */}
          <div className="p-6 pt-0">
            <Button
              onClick={handleDeactivate}
              disabled={!selectedDevice || isDeactivating}
              className="w-full h-12 text-base font-semibold"
              variant="destructive"
            >
              {isDeactivating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Desconectando...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Desconectar Dispositivo Selecionado
                </>
              )}
            </Button>
            
            <p className="text-center text-xs text-muted-foreground mt-4">
              Ao desconectar, o dispositivo será removido e você poderá fazer login neste novo aparelho.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

DeviceLimitModal.displayName = "DeviceLimitModal";
