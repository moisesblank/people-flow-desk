// ============================================
// 🛡️ DOGMA XI: Modal de Limite de Dispositivos
// Estilo JusBrasil - Selecionar dispositivo para desativar
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Smartphone, Tablet, X, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Device } from '@/hooks/useDeviceLimit';

interface DeviceLimitModalProps {
  isOpen: boolean;
  devices: Device[];
  onDeactivate: (deviceId: string) => Promise<boolean>;
  onClose?: () => void;
}

export function DeviceLimitModal({ isOpen, devices, onDeactivate, onClose }: DeviceLimitModalProps) {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="w-5 h-5" />;
      case 'tablet': return <Tablet className="w-5 h-5" />;
      default: return <Monitor className="w-5 h-5" />;
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
      return format(new Date(dateStr), "dd/MM/yy 'às' HH:mm", { locale: ptBR });
    } catch {
      return 'Data desconhecida';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-border bg-destructive/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-destructive/10">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Limite de dispositivos atingido
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Desconecte um dispositivo para continuar
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-sm text-muted-foreground mb-4">
                Você já possui 3 dispositivos conectados. Selecione qual deseja desconectar:
              </p>

              <RadioGroup
                value={selectedDevice || ''}
                onValueChange={setSelectedDevice}
                className="space-y-3"
              >
                {devices.map((device) => (
                  <motion.div
                    key={device.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`
                      flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${selectedDevice === device.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50 bg-background'
                      }
                    `}
                    onClick={() => setSelectedDevice(device.id)}
                  >
                    <RadioGroupItem value={device.id} id={device.id} className="sr-only" />
                    
                    <div className="p-2 rounded-lg bg-muted">
                      {getDeviceIcon(device.device_type)}
                    </div>
                    
                    <Label htmlFor={device.id} className="flex-1 cursor-pointer">
                      <div className="font-medium text-foreground">
                        {device.device_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Último acesso em {formatDate(device.last_seen_at)}
                      </div>
                    </Label>
                    
                    <div className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                      ${selectedDevice === device.id 
                        ? 'border-primary bg-primary' 
                        : 'border-muted-foreground'
                      }
                    `}>
                      {selectedDevice === device.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 rounded-full bg-primary-foreground"
                        />
                      )}
                    </div>
                  </motion.div>
                ))}
              </RadioGroup>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border bg-muted/30">
              <Button
                onClick={handleDeactivate}
                disabled={!selectedDevice || isDeactivating}
                className="w-full h-12 text-base font-semibold"
                variant={selectedDevice ? 'default' : 'secondary'}
              >
                {isDeactivating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Desconectando...
                  </>
                ) : (
                  'Desconectar'
                )}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground mt-3">
                O dispositivo selecionado será desconectado imediatamente
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
