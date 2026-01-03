// ============================================
// PhoneInput v1 — Componente Reutilizável
// Formato: +55 83 9 9999-9999
// CONSTITUIÇÃO SYNAPSE Ω v10.x
// ============================================

import React, { forwardRef, useCallback } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';
import { Phone, CheckCircle } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  /** Valor do telefone */
  value: string;
  /** Callback quando o valor muda */
  onChange: (value: string) => void;
  /** Mostrar ícone de status quando completo */
  showStatusIcon?: boolean;
  /** Classe CSS adicional para o container */
  containerClassName?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/** 
 * Formata telefone para exibição (+55 83 9 9999-9999) 
 * Aceita entrada parcial e formata progressivamente
 */
export function formatPhone(phone: string): string {
  // Remove tudo que não é dígito
  let digits = phone.replace(/\D/g, '');
  
  // Se começa com 55 (código do Brasil), remove para evitar duplicação
  if (digits.startsWith('55') && digits.length > 2) {
    digits = digits.slice(2);
  }
  
  // Se não tem dígitos, retorna vazio (placeholder será mostrado)
  if (digits.length === 0) return '';
  
  // Construir formato progressivamente
  let formatted = '+55 ';
  
  // DDD (2 dígitos)
  if (digits.length > 0) {
    formatted += digits.slice(0, 2);
  }
  
  // Espaço + primeiro dígito (9)
  if (digits.length > 2) {
    formatted += ' ' + digits.slice(2, 3);
  }
  
  // Espaço + próximos 4 dígitos
  if (digits.length > 3) {
    formatted += ' ' + digits.slice(3, 7);
  }
  
  // Hífen + últimos 4 dígitos
  if (digits.length > 7) {
    formatted += '-' + digits.slice(7, 11);
  }
  
  return formatted;
}

/** Remove formatação e retorna apenas dígitos */
export function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/** Valida se o telefone está completo (11 dígitos) */
export function isPhoneComplete(phone: string): boolean {
  const digits = cleanPhone(phone);
  return digits.length === 11;
}

/** Valida formato básico do telefone brasileiro */
export function validatePhoneFormat(phone: string): boolean {
  const digits = cleanPhone(phone);
  // Deve ter 11 dígitos e começar com DDD válido (11-99) + 9
  if (digits.length !== 11) return false;
  const ddd = parseInt(digits.slice(0, 2));
  const firstDigit = digits[2];
  return ddd >= 11 && ddd <= 99 && firstDigit === '9';
}

// ============================================
// COMPONENT
// ============================================

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(({
  value = '',
  onChange,
  showStatusIcon = true,
  containerClassName,
  className,
  disabled,
  ...props
}, ref) => {
  
  // Formatar valor para exibição
  const displayValue = formatPhone(value);
  const isComplete = isPhoneComplete(value);
  const isValid = validatePhoneFormat(value);
  
  // Handler de mudança com máscara
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Extrair apenas dígitos
    let rawDigits = inputValue.replace(/\D/g, '');
    
    // Se começa com 55 (código do Brasil), remove para evitar duplicação
    if (rawDigits.startsWith('55') && rawDigits.length > 2) {
      rawDigits = rawDigits.slice(2);
    }
    
    // Limitar a 11 dígitos (DDD + 9 dígitos)
    const limitedDigits = rawDigits.slice(0, 11);
    
    // Retornar apenas os dígitos para o form
    onChange(limitedDigits);
  }, [onChange]);
  
  // Handler de foco - posicionar cursor no fim
  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // Mover cursor para o final
    setTimeout(() => {
      const len = e.target.value.length;
      e.target.setSelectionRange(len, len);
    }, 0);
  }, []);

  return (
    <div className={cn("relative", containerClassName)}>
      <Input
        ref={ref}
        type="tel"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        placeholder="+55 83 9 9892-0105"
        className={cn(
          "font-mono tracking-wide pr-10",
          isComplete && isValid && "border-emerald-500/50 focus-visible:ring-emerald-500/30",
          className
        )}
        disabled={disabled}
        maxLength={20}
        {...props}
      />
      
      {/* Ícone de status */}
      {showStatusIcon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isComplete && isValid ? (
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          ) : (
            <Phone className="h-4 w-4 text-muted-foreground/50" />
          )}
        </div>
      )}
    </div>
  );
});

PhoneInput.displayName = 'PhoneInput';
