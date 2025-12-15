// ============================================
// MOISES MEDEIROS v5.0 - VALIDATION SCHEMAS
// Pilar 1: Segurança Zero Confiança
// ============================================

import { z } from 'zod';

// ===== HELPERS DE SEGURANÇA =====

/** Remove tags HTML e espaços extras */
const sanitizeString = (str: string) => 
  str.trim().replace(/<[^>]*>/g, '');

/** Verifica tentativas de SQL Injection */
const noSQLInjection = (str: string) => 
  !/(\$where|\$gt|\$lt|\$ne|\$or|\$and|{|\})/i.test(str);

/** Verifica tentativas de XSS */
const noXSS = (str: string) =>
  !/<script|javascript:|on\w+\s*=|eval\(|expression\(/i.test(str);

/** Regex para senha forte: 12+ chars, maiúscula, minúscula, número, especial */
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{12,128}$/;

/** Regex para telefone brasileiro */
const brazilPhoneRegex = /^\+?55?\s?\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;

// ===== USER REGISTRATION (Cadastro Completo) =====
export const userRegistrationSchema = z.object({
  name: z.string()
    .min(2, "Nome muito curto (mínimo 2 caracteres)")
    .max(100, "Nome muito longo (máximo 100 caracteres)")
    .transform(sanitizeString)
    .refine(noSQLInjection, { message: "Caracteres inválidos" })
    .refine(noXSS, { message: "Conteúdo inválido" })
    .refine((val) => /^[a-zA-ZÀ-ÿ\s'-]+$/.test(val), { message: "Nome deve conter apenas letras" }),
  
  email: z.string()
    .trim()
    .toLowerCase()
    .email("Email inválido")
    .max(255, "Email muito longo"),
  
  password: z.string()
    .min(12, "Senha deve ter pelo menos 12 caracteres")
    .max(128, "Senha muito longa")
    .regex(strongPasswordRegex, "Senha deve conter: maiúscula, minúscula, número e caractere especial"),
  
  confirmPassword: z.string(),
  
  phone: z.string()
    .optional()
    .refine(val => !val || brazilPhoneRegex.test(val.replace(/\s/g, '')), {
      message: "Telefone inválido. Use formato: (11) 99999-9999"
    }),
  
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "Você deve aceitar os termos de uso" })
  }),
  
  acceptPrivacy: z.literal(true, {
    errorMap: () => ({ message: "Você deve aceitar a política de privacidade" })
  })
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"]
});

// ===== LOGIN SCHEMA =====
export const loginSchema = z.object({
  email: z.string()
    .trim()
    .toLowerCase()
    .email("Email inválido"),
  
  password: z.string()
    .min(1, "Senha obrigatória"),
  
  rememberMe: z.boolean().optional().default(false),
  
  totpCode: z.string()
    .length(6, "Código deve ter 6 dígitos")
    .regex(/^\d+$/, "Código deve conter apenas números")
    .optional()
});

// ===== SIMPLIFIED LOGIN (para uso atual) =====
export const simpleLoginSchema = z.object({
  email: z.string()
    .trim()
    .toLowerCase()
    .email("Email inválido")
    .max(255),
  
  password: z.string()
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .max(100),
});

// ===== SIMPLIFIED SIGNUP (para uso atual) =====
export const simpleSignupSchema = simpleLoginSchema.extend({
  nome: z.string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome muito longo")
    .transform(sanitizeString)
    .refine(noSQLInjection, { message: "Caracteres inválidos" })
    .refine(noXSS, { message: "Conteúdo inválido" }),
});

// ===== CONTACT FORM =====
export const contactFormSchema = z.object({
  name: z.string()
    .min(2, "Nome muito curto")
    .max(100, "Nome muito longo")
    .transform(sanitizeString)
    .refine(noSQLInjection, { message: "Caracteres inválidos" })
    .refine(noXSS, { message: "Conteúdo inválido" }),
  
  email: z.string()
    .trim()
    .email("Email inválido"),
  
  subject: z.enum(['suporte', 'duvidas', 'financeiro', 'parceria', 'outros'], {
    errorMap: () => ({ message: "Selecione um assunto" })
  }),
  
  message: z.string()
    .min(10, "Mensagem muito curta (mínimo 10 caracteres)")
    .max(2000, "Mensagem muito longa (máximo 2000 caracteres)")
    .transform(sanitizeString)
    .refine(noSQLInjection, { message: "Caracteres inválidos" })
    .refine(noXSS, { message: "Conteúdo inválido" }),
  
  captchaToken: z.string()
    .min(1, "Complete a verificação de segurança")
    .optional()
});

// ===== PASSWORD RESET =====
export const passwordResetSchema = z.object({
  email: z.string()
    .trim()
    .toLowerCase()
    .email("Email inválido")
});

// ===== NEW PASSWORD (após reset) =====
export const newPasswordSchema = z.object({
  password: z.string()
    .min(12, "Senha deve ter pelo menos 12 caracteres")
    .max(128, "Senha muito longa")
    .regex(strongPasswordRegex, "Senha deve conter: maiúscula, minúscula, número e caractere especial"),
  
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"]
});

// ===== PROFILE UPDATE =====
export const profileUpdateSchema = z.object({
  nome: z.string()
    .min(2, "Nome muito curto")
    .max(100, "Nome muito longo")
    .optional(),
  
  email: z.string()
    .trim()
    .toLowerCase()
    .email("Email inválido")
    .max(255)
    .optional(),
  
  telefone: z.string()
    .optional()
    .refine(val => !val || brazilPhoneRegex.test(val.replace(/\s/g, '')), {
      message: "Telefone inválido"
    }),
  
  avatar_url: z.string()
    .url("URL inválida")
    .optional()
    .nullable()
});

// ===== TYPES =====
export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SimpleLoginInput = z.infer<typeof simpleLoginSchema>;
export type SimpleSignupInput = z.infer<typeof simpleSignupSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// ===== HELPER: Calcular força da senha =====
export function calculatePasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
  if (!/(.)\1{2,}/.test(password)) score += 1; // Sem 3+ caracteres repetidos

  if (score <= 2) return { score, label: "Muito fraca", color: "bg-red-500" };
  if (score <= 4) return { score, label: "Fraca", color: "bg-orange-500" };
  if (score <= 6) return { score, label: "Moderada", color: "bg-yellow-500" };
  if (score <= 7) return { score, label: "Forte", color: "bg-green-500" };
  return { score, label: "Muito forte", color: "bg-emerald-500" };
}
