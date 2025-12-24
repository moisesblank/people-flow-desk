// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ SANCTUM INTEGRATED HOOK v2.0 - LEI VII COMPLIANCE
// ═══════════════════════════════════════════════════════════════════════════════
// Integra TODOS os sistemas de segurança em um único hook poderoso
// Compatível com 5000+ usuários simultâneos
// Otimizado para 3G (LEI I) + Mobile-First (LEI II) + Segurança NASA (LEI III)
// ═══════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSanctumCore, SanctumContext } from '@/hooks/useSanctumCore';
import { useSanctumThreat } from '@/hooks/useSanctumThreat';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { collectEnhancedFingerprint } from '@/lib/enhancedFingerprint';
import { 
  isOwner as isOwnerCheck, 
  THREAT_THRESHOLDS, 
  EVENT_SEVERITIES,
  BLOCKED_SHORTCUTS,
  WATERMARK_REQUIREMENTS,
  type ThreatLevel,
  type ViolationType,
} from '@/lib/constitution/LEI_VII_PROTECAO_CONTEUDO';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

export interface SanctumIntegratedConfig extends SanctumContext {
  enableWatermark?: boolean;
  enableAntiDevTools?: boolean;
  enableAntiScreenshot?: boolean;
  enableAntiAutomation?: boolean;
  enableAntiExtensions?: boolean;
  enableThreatScore?: boolean;
  enableFingerprint?: boolean;
  sanctumLevel?: 'OMEGA' | 'ALPHA' | 'BETA' | 'GAMMA';
  onViolation?: (type: ViolationType, severity: number) => void;
  onThreatLevelChange?: (level: ThreatLevel) => void;
  onBlockAccess?: () => void;
}

export interface SanctumIntegratedReturn {
  // Estado
  isReady: boolean;
  isBlocked: boolean;
  isOwner: boolean;
  isImmune: boolean;
  threatLevel: ThreatLevel;
  threatScore: number;
  riskScore: number;
  sessionId: string;
  fingerprint: string | null;
  
  // Funções
  recordViolation: (type: string, metadata?: Record<string, unknown>) => void;
  checkExtensions: () => Promise<boolean>;
  checkAutomation: () => boolean;
  getWatermarkText: () => string;
  resetThreatState: () => void;
  
  // Stats
  stats: {
    violationsBlocked: number;
    protectionTime: number;
    extensionsDetected: number;
    automationAttempts: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTES LEI VII
// ═══════════════════════════════════════════════════════════════════════════════

const MALICIOUS_EXTENSIONS = [
  'video-download',
  'screen-capture',
  'screenshot',
  'recorder',
  'video-saver',
  'save-video',
  'download-helper',
  'screen-recorder',
  'nimbus-screenshot',
  'lightshot',
  'awesome-screenshot',
  'fireshot',
  'full-page-screen-capture',
];

const AUTOMATION_SIGNALS = [
  'navigator.webdriver',
  'window.callPhantom',
  'window._phantom',
  'window.__nightmare',
  'window.domAutomation',
  'window.domAutomationController',
  'window.Cypress',
  'window.__coverage__',
  'window.__selenium_unwrapped',
  'window.__webdriver_evaluate',
];

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export function useSanctumIntegrated(config: SanctumIntegratedConfig): SanctumIntegratedReturn {
  const {
    resourceId,
    resourceType,
    enableWatermark = true,
    enableAntiDevTools = true,
    enableAntiScreenshot = true,
    enableAntiAutomation = true,
    enableAntiExtensions = true,
    enableThreatScore = true,
    enableFingerprint = true,
    sanctumLevel = 'OMEGA',
    onViolation,
    onThreatLevelChange,
    onBlockAccess,
  } = config;

  // Hooks de segurança base
  const { user } = useAuth();
  const { isOwner: roleIsOwner, isFuncionarioOrAbove } = useRolePermissions();
  
  const sanctumCore = useSanctumCore({ resourceId, resourceType });
  const sanctumThreat = useSanctumThreat();

  // Estado
  const [isReady, setIsReady] = useState(false);
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [stats, setStats] = useState({
    violationsBlocked: 0,
    protectionTime: 0,
    extensionsDetected: 0,
    automationAttempts: 0,
  });

  // Refs
  const startTimeRef = useRef(Date.now());
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // VERIFICAÇÕES DE IMUNIDADE (LEI VII Art. 126)
  // ═══════════════════════════════════════════════════════════════════════════

  const isOwner = useMemo(() => {
    return isOwnerCheck(user?.email) || roleIsOwner || sanctumCore.isOwner;
  }, [user?.email, roleIsOwner, sanctumCore.isOwner]);

  const isImmune = useMemo(() => {
    if (isOwner) return true;
    if (isFuncionarioOrAbove && sanctumLevel !== 'OMEGA') return true;
    return false;
  }, [isOwner, isFuncionarioOrAbove, sanctumLevel]);

  // ═══════════════════════════════════════════════════════════════════════════
  // THREAT STATE (LEI VII Título X)
  // ═══════════════════════════════════════════════════════════════════════════

  const threatLevel = useMemo((): ThreatLevel => {
    if (isImmune) return 'NONE';
    
    const score = sanctumThreat.threatScore ?? sanctumCore.riskScore ?? 0;
    
    if (score >= THREAT_THRESHOLDS.L4_BLOCK) return 'L4_BLOCK';
    if (score >= THREAT_THRESHOLDS.L3_LOGOUT) return 'L3_LOGOUT';
    if (score >= THREAT_THRESHOLDS.L2_BLUR) return 'L2_BLUR';
    if (score >= THREAT_THRESHOLDS.L1_WARNING) return 'L1_WARNING';
    return 'NONE';
  }, [isImmune, sanctumThreat.threatScore, sanctumCore.riskScore]);

  const isBlocked = useMemo(() => {
    if (isImmune) return false;
    return !sanctumThreat.canAccess || sanctumCore.isLocked || threatLevel === 'L4_BLOCK';
  }, [isImmune, sanctumThreat.canAccess, sanctumCore.isLocked, threatLevel]);

  // ═══════════════════════════════════════════════════════════════════════════
  // DETECÇÃO DE EXTENSÕES MALICIOSAS (LEI VII Art. 116-120)
  // ═══════════════════════════════════════════════════════════════════════════

  const checkExtensions = useCallback(async (): Promise<boolean> => {
    if (isImmune) return false;

    try {
      // Método 1: Verificar elementos injetados por extensões
      const suspiciousSelectors = MALICIOUS_EXTENSIONS.map(ext => 
        `[id*="${ext}"], [class*="${ext}"], [data-extension*="${ext}"]`
      ).join(', ');
      
      const found = document.querySelectorAll(suspiciousSelectors);
      
      if (found.length > 0) {
        setStats(prev => ({ ...prev, extensionsDetected: prev.extensionsDetected + 1 }));
        onViolation?.('EXTENSION_DETECTED', EVENT_SEVERITIES.extension_detected);
        return true;
      }

      // Método 2: Verificar iframes suspeitos
      const iframes = document.querySelectorAll('iframe:not([data-sanctum-allowed])');
      for (const iframe of Array.from(iframes)) {
        const src = iframe.getAttribute('src') || '';
        if (MALICIOUS_EXTENSIONS.some(ext => src.includes(ext))) {
          setStats(prev => ({ ...prev, extensionsDetected: prev.extensionsDetected + 1 }));
          return true;
        }
      }

      // Método 3: Verificar scripts injetados
      const scripts = document.querySelectorAll('script:not([data-sanctum-allowed])');
      for (const script of Array.from(scripts)) {
        const src = script.getAttribute('src') || '';
        if (MALICIOUS_EXTENSIONS.some(ext => src.includes(ext))) {
          setStats(prev => ({ ...prev, extensionsDetected: prev.extensionsDetected + 1 }));
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }, [isImmune, onViolation]);

  // ═══════════════════════════════════════════════════════════════════════════
  // DETECÇÃO DE AUTOMAÇÃO (LEI VII Art. 116-120)
  // ═══════════════════════════════════════════════════════════════════════════

  const checkAutomation = useCallback((): boolean => {
    if (isImmune) return false;

    try {
      const nav = navigator as unknown as Record<string, unknown>;
      const win = window as unknown as Record<string, unknown>;

      // Verificar sinais de automação
      if (nav.webdriver === true) {
        setStats(prev => ({ ...prev, automationAttempts: prev.automationAttempts + 1 }));
        onViolation?.('AUTOMATION_DETECTED', EVENT_SEVERITIES.automation_detected);
        return true;
      }

      // PhantomJS
      if (win.callPhantom || win._phantom) {
        setStats(prev => ({ ...prev, automationAttempts: prev.automationAttempts + 1 }));
        return true;
      }

      // Nightmare
      if (win.__nightmare) {
        setStats(prev => ({ ...prev, automationAttempts: prev.automationAttempts + 1 }));
        return true;
      }

      // Selenium
      if (win.domAutomation || win.domAutomationController) {
        setStats(prev => ({ ...prev, automationAttempts: prev.automationAttempts + 1 }));
        return true;
      }

      // Cypress
      if (win.Cypress) {
        setStats(prev => ({ ...prev, automationAttempts: prev.automationAttempts + 1 }));
        return true;
      }

      // Headless browser
      if (navigator.plugins?.length === 0 && !navigator.languages?.length) {
        setStats(prev => ({ ...prev, automationAttempts: prev.automationAttempts + 1 }));
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }, [isImmune, onViolation]);

  // ═══════════════════════════════════════════════════════════════════════════
  // REGISTRO DE VIOLAÇÃO INTEGRADO
  // ═══════════════════════════════════════════════════════════════════════════

  const recordViolation = useCallback((type: string, metadata?: Record<string, unknown>) => {
    if (isImmune) return;

    setStats(prev => ({ ...prev, violationsBlocked: prev.violationsBlocked + 1 }));

    // Registrar no threat score
    sanctumThreat.recordEvent?.(type, metadata);

    // Registrar no sanctum core
    const severity = EVENT_SEVERITIES[type] ?? 5;
    sanctumCore.reportViolation?.({
      type: type as any,
      severity,
      meta: metadata,
    });

    // Callback externo
    onViolation?.(type as ViolationType, severity);
  }, [isImmune, sanctumThreat, sanctumCore, onViolation]);

  // ═══════════════════════════════════════════════════════════════════════════
  // GERAÇÃO DE WATERMARK (LEI VII Art. 66-78)
  // ═══════════════════════════════════════════════════════════════════════════

  const getWatermarkText = useCallback((): string => {
    if (!user) return '';

    const timestamp = new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const shortId = user.id?.substring(0, 8) || '';
    const sessionShort = sanctumCore.sessionId?.substring(0, 6) || '';
    const name = user.user_metadata?.name || user.email?.split('@')[0] || '';

    return `${name} • ${shortId} • ${sessionShort} • ${timestamp}`;
  }, [user, sanctumCore.sessionId]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RESET DE ESTADO (APENAS OWNER - LEI VII Art. 126)
  // ═══════════════════════════════════════════════════════════════════════════

  const resetThreatState = useCallback(() => {
    if (!isOwner) {
      toast.error('Apenas o OWNER pode resetar o estado de segurança.');
      return;
    }

    sanctumThreat.resetState?.();
    setStats({
      violationsBlocked: 0,
      protectionTime: 0,
      extensionsDetected: 0,
      automationAttempts: 0,
    });
    toast.success('Estado de segurança resetado.');
  }, [isOwner, sanctumThreat]);

  // ═══════════════════════════════════════════════════════════════════════════
  // INICIALIZAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const initialize = async () => {
      // Coletar fingerprint
      if (enableFingerprint && !isImmune) {
        try {
          const fp = await collectEnhancedFingerprint();
          setFingerprint(fp.hash);
        } catch {
          setFingerprint(null);
        }
      }

      // Verificar automação
      if (enableAntiAutomation && !isImmune) {
        const isAutomated = checkAutomation();
        if (isAutomated) {
          toast.error('Automação detectada. Acesso bloqueado.');
          onBlockAccess?.();
        }
      }

      // Verificar extensões
      if (enableAntiExtensions && !isImmune) {
        const hasExtensions = await checkExtensions();
        if (hasExtensions) {
          toast.warning('Extensões suspeitas detectadas.');
        }
      }

      // Registrar superfície protegida
      sanctumCore.registerProtectedSurface();

      setIsReady(true);
    };

    initialize();
  }, [
    enableFingerprint,
    enableAntiAutomation,
    enableAntiExtensions,
    isImmune,
    checkAutomation,
    checkExtensions,
    sanctumCore,
    onBlockAccess,
  ]);

  // Atualizar stats de tempo
  useEffect(() => {
    statsIntervalRef.current = setInterval(() => {
      setStats(prev => ({
        ...prev,
        protectionTime: Math.floor((Date.now() - startTimeRef.current) / 1000),
      }));
    }, 1000);

    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, []);

  // Notificar mudança de threat level
  useEffect(() => {
    onThreatLevelChange?.(threatLevel);
  }, [threatLevel, onThreatLevelChange]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RETORNO
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    isReady,
    isBlocked,
    isOwner,
    isImmune,
    threatLevel,
    threatScore: sanctumThreat.threatScore ?? 0,
    riskScore: sanctumCore.riskScore ?? 0,
    sessionId: sanctumCore.sessionId ?? '',
    fingerprint,
    recordViolation,
    checkExtensions,
    checkAutomation,
    getWatermarkText,
    resetThreatState,
    stats,
  };
}

export default useSanctumIntegrated;
