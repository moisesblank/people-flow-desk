// ============================================
// TIPOS DE SEGURANÇA
// Centralizados por domínio
// ============================================

// Sessão ativa
export interface ActiveSession {
  id: string;
  user_id: string;
  session_token: string;
  device_hash: string;
  device_name?: string;
  device_type?: 'desktop' | 'mobile' | 'tablet';
  ip_address: string;
  ip_hash?: string;
  city?: string;
  country_code?: string;
  user_agent?: string;
  status: 'active' | 'expired' | 'revoked';
  is_current?: boolean;
  mfa_verified?: boolean;
  risk_score?: number;
  validation_attempts?: number;
  last_activity_at: string;
  last_validation_ip?: string;
  created_at: string;
  expires_at: string;
  revoked_at?: string;
  revoked_reason?: string;
}

// Dispositivo registrado
export interface RegisteredDevice {
  id: string;
  user_id: string;
  device_hash: string;
  device_name: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  is_trusted: boolean;
  last_used_at: string;
  created_at: string;
}

// Log de auditoria
export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  table_name?: string;
  record_id?: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// Log de acesso a conteúdo
export interface ContentAccessLog {
  id: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  user_cpf?: string;
  user_role?: string;
  content_type: 'video' | 'book' | 'material' | 'lesson';
  content_id: string;
  content_title?: string;
  event_type: 'view' | 'download' | 'print_attempt' | 'screenshot_attempt' | 'devtools_open';
  event_description?: string;
  is_violation: boolean;
  violation_type?: string;
  threat_score?: number;
  device_fingerprint?: string;
  ip_hash?: string;
  session_id?: string;
  city?: string;
  country_code?: string;
  region?: string;
  created_at: string;
}

// Dados de watermark
export interface WatermarkData {
  name: string;
  cpf?: string;
  email: string;
  timestamp?: string;
  sessionId?: string;
}

// URL assinada
export interface SignedUrl {
  id: string;
  token: string;
  expires_at: string;
  video_id?: string;
  book_id?: string;
  page_number?: number;
}

// Resultado de validação de URL
export interface SignedUrlValidation {
  valid: boolean;
  expired: boolean;
  used: boolean;
  remaining_uses?: number;
}

// Threat score
export interface ThreatAssessment {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: Array<{
    type: string;
    weight: number;
    description: string;
  }>;
  recommendation: 'allow' | 'warn' | 'challenge' | 'block';
  timestamp: string;
}

// Rate limit info
export interface RateLimitInfo {
  remaining: number;
  limit: number;
  reset_at: string;
  blocked: boolean;
  block_reason?: string;
}

// IP bloqueado
export interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  violation_count: number;
  is_permanent: boolean;
  blocked_by?: string;
  blocked_at: string;
  expires_at?: string;
  metadata?: Record<string, unknown>;
}

// Fingerprint de dispositivo
export interface DeviceFingerprint {
  hash: string;
  components: {
    userAgent: string;
    language: string;
    colorDepth: number;
    screenResolution: string;
    timezone: string;
    plugins: string[];
    canvas?: string;
    webgl?: string;
    fonts?: string[];
  };
  confidence: number;
  created_at: string;
}

// Requisitos de senha
export interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
  met?: boolean;
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: "Mínimo 12 caracteres", test: (p) => p.length >= 12 },
  { label: "Letra maiúscula", test: (p) => /[A-Z]/.test(p) },
  { label: "Letra minúscula", test: (p) => /[a-z]/.test(p) },
  { label: "Número", test: (p) => /\d/.test(p) },
  { label: "Caractere especial (!@#$%...)", test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];
