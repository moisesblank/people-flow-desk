// ============================================
// MOISES MEDEIROS v5.0 - PASSWORD STRENGTH METER
// Pilar 1: Segurança + Pilar 2: Acessibilidade
// ============================================

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { calculatePasswordStrength } from "@/lib/validations/schemas";

interface PasswordStrengthMeterProps {
  password: string;
  showRequirements?: boolean;
}

const requirements = [
  { label: "Mínimo 12 caracteres", test: (p: string) => p.length >= 12 },
  { label: "Letra maiúscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Letra minúscula", test: (p: string) => /[a-z]/.test(p) },
  { label: "Número", test: (p: string) => /\d/.test(p) },
  { label: "Caractere especial (!@#$%...)", test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

export function PasswordStrengthMeter({ password, showRequirements = true }: PasswordStrengthMeterProps) {
  const strength = useMemo(() => calculatePasswordStrength(password), [password]);
  const percentage = (strength.score / 8) * 100;

  if (!password) return null;

  return (
    <div className="space-y-3" role="status" aria-live="polite">
      {/* Barra de força */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Força da senha</span>
          <span className={`font-medium ${
            strength.score <= 2 ? "text-red-500" :
            strength.score <= 4 ? "text-orange-500" :
            strength.score <= 6 ? "text-yellow-500" :
            "text-green-500"
          }`}>
            {strength.label}
          </span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${strength.color}`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Requisitos */}
      {showRequirements && (
        <div className="grid grid-cols-1 gap-1.5">
          {requirements.map((req, index) => {
            const passed = req.test(password);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-2 text-xs ${
                  passed ? "text-green-500" : "text-muted-foreground"
                }`}
              >
                {passed ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{req.label}</span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
