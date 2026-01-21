// ============================================
// CPFInput v17 — Componente Reutilizável
// Lei III - Segurança de Dados | CONSTITUIÇÃO SYNAPSE
// ============================================

import React, { useState, useCallback, forwardRef, useEffect, useRef } from 'react';
import { Input } from './input';
import { Label } from './label';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, Loader2, CreditCard, Shield } from 'lucide-react';
import { useValidateCPFReal, validateCPFFormat } from '@/hooks/useValidateCPFReal';

// ============================================
// TYPES
// ============================================

export interface CPFInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  /** Valor do CPF (apenas números ou formatado) */
  value: string;
  /** Callback quando o valor muda (retorna apenas números) */
  onChange: (value: string) => void;
  /** Label do campo */
  label?: string;
  /** Valida na Receita Federal ao sair do campo */
  validateOnBlur?: boolean;
  /** Apenas valida formato (não consulta Receita) */
  formatOnly?: boolean;
  /** Callback quando a validação completa */
  onValidationComplete?: (isValid: boolean, nome?: string) => void;
  /** Mostrar ícone de status */
  showStatusIcon?: boolean;
  /** Mostrar ícone de segurança */
  showSecurityBadge?: boolean;
  /** Classe CSS adicional para o container */
  containerClassName?: string;
  /** Mensagem de erro customizada */
  errorMessage?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/** Formata CPF para exibição (000.000.000-00) */
export function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/** Remove formatação do CPF */
export function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '').slice(0, 11);
}

/** Mascara CPF para exibição segura */
export function maskCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return '***.***.**-**';
  return `${digits.slice(0, 3)}.***.**-${digits.slice(-2)}`;
}

// ============================================
// COMPONENT
// ============================================

export const CPFInput = forwardRef<HTMLInputElement, CPFInputProps>(({
  value,
  onChange,
  label = 'CPF',
  validateOnBlur = true,
  formatOnly = false,
  onValidationComplete,
  showStatusIcon = true,
  showSecurityBadge = false,
  containerClassName,
  errorMessage,
  className,
  disabled,
  ...props
}, ref) => {
  const [validationState, setValidationState] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [localError, setLocalError] = useState<string | null>(null);
  const lastValidatedCPF = useRef<string>('');
  
  const { validateCPF, isValidating } = useValidateCPFReal();

  // Auto-validação quando CPF atinge 11 dígitos (autofill, paste, etc)
  useEffect(() => {
    const cleanedValue = cleanCPF(value);
    
    // Se já validou esse CPF ou está validando, não repetir
    if (cleanedValue === lastValidatedCPF.current || isValidating) return;
    
    // Se CPF completo e ainda não validado
    if (cleanedValue.length === 11 && validationState === 'idle') {
      // Validação de formato local primeiro
      if (!validateCPFFormat(cleanedValue)) {
        setValidationState('invalid');
        setLocalError('CPF inválido (dígitos verificadores)');
        onValidationComplete?.(false);
        return;
      }
      
      // Se formatOnly, não consulta Receita Federal
      if (formatOnly) {
        setValidationState('valid');
        setLocalError(null);
        lastValidatedCPF.current = cleanedValue;
        onValidationComplete?.(true);
        return;
      }
      
      // Validação completa na Receita Federal
      if (validateOnBlur) {
        lastValidatedCPF.current = cleanedValue;
        validateCPF(cleanedValue).then(result => {
          if (result?.valid) {
            setValidationState('valid');
            setLocalError(null);
            onValidationComplete?.(true, result.nome);
          } else {
            setValidationState('invalid');
            const errorMsg = typeof result?.error === 'string' ? result.error : 'CPF não validado';
            setLocalError(errorMsg);
            onValidationComplete?.(false);
          }
        });
      }
    }
  }, [value, validationState, isValidating, formatOnly, validateOnBlur, validateCPF, onValidationComplete]);

  // Handler de mudança com formatação automática
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = cleanCPF(e.target.value);
    onChange(raw);
    
    // Reset validation quando usuário edita
    if (validationState !== 'idle') {
      setValidationState('idle');
      setLocalError(null);
      lastValidatedCPF.current = '';
    }
  }, [onChange, validationState]);

  // Handler de blur com validação
  const handleBlur = useCallback(async (e: React.FocusEvent<HTMLInputElement>) => {
    // Chama o onBlur original se existir
    props.onBlur?.(e);
    
    const cleanedValue = cleanCPF(value);
    
    // Não valida se vazio ou incompleto
    if (!cleanedValue || cleanedValue.length < 11) {
      if (cleanedValue.length > 0 && cleanedValue.length < 11) {
        setValidationState('invalid');
        setLocalError('CPF incompleto');
        onValidationComplete?.(false);
      }
      return;
    }
    
    // Validação de formato local primeiro
    if (!validateCPFFormat(cleanedValue)) {
      setValidationState('invalid');
      setLocalError('CPF inválido (dígitos verificadores)');
      onValidationComplete?.(false);
      return;
    }
    
    // Se formatOnly ou não valida no blur, já tratado pelo useEffect
    if (formatOnly || !validateOnBlur) {
      return;
    }
    
    // Se formatOnly, não consulta Receita Federal
    if (formatOnly) {
      setValidationState('valid');
      setLocalError(null);
      onValidationComplete?.(true);
      return;
    }
    
    // Validação completa na Receita Federal
    const result = await validateCPF(cleanedValue);
    
    if (result?.valid) {
      setValidationState('valid');
      setLocalError(null);
      onValidationComplete?.(true, result.nome);
    } else {
      setValidationState('invalid');
      const errorMsg = typeof result?.error === 'string' ? result.error : 'CPF não validado';
      setLocalError(errorMsg);
      onValidationComplete?.(false);
    }
  }, [value, validateOnBlur, formatOnly, validateCPF, onValidationComplete, props.onBlur]);

  // Determina a mensagem de erro a exibir
  const displayError = errorMessage || localError;

  return (
    <div className={cn('space-y-2', containerClassName)}>
      {label && (
        <Label htmlFor={props.id} className="flex items-center gap-2">
          {label}
        {showSecurityBadge && (
            <span title="Validado na Receita Federal">
              <Shield className="h-3.5 w-3.5 text-green-500" />
            </span>
          )}
          {showStatusIcon && (
            <>
              {isValidating && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
              {!isValidating && validationState === 'valid' && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {!isValidating && validationState === 'invalid' && (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
            </>
          )}
        </Label>
      )}
      
      <div className="relative">
        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={formatCPF(value)}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="000.000.000-00"
          maxLength={14}
          disabled={disabled || isValidating}
          className={cn(
            'pl-10',
            validationState === 'valid' && 'border-green-500 focus-visible:ring-green-500',
            validationState === 'invalid' && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          aria-invalid={validationState === 'invalid'}
          aria-describedby={displayError ? `${props.id}-error` : undefined}
          {...props}
        />
      </div>
      
      {displayError && (
        <p 
          id={`${props.id}-error`}
          className="text-sm text-destructive flex items-center gap-1"
        >
          <AlertCircle className="h-3.5 w-3.5" />
          {displayError}
        </p>
      )}
    </div>
  );
});

CPFInput.displayName = 'CPFInput';

export default CPFInput;
