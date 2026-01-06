// ============================================
// 🔐 deviceFingerprint — ATIVADO
// Gera fingerprint CONSISTENTE para o mesmo dispositivo
// Usa localStorage para persistir entre sessões
// ============================================

const FINGERPRINT_KEY = "matriz_device_fingerprint";
const FINGERPRINT_EXPIRY_KEY = "matriz_device_fingerprint_expiry";
const FINGERPRINT_TTL = 30 * 24 * 60 * 60 * 1000; // 30 dias

/**
 * Gera um fingerprint baseado em características do navegador
 * que são consistentes para o mesmo dispositivo
 */
async function generateBrowserFingerprint(): Promise<string> {
  const components: string[] = [];

  // User Agent
  components.push(navigator.userAgent);

  // Idioma
  components.push(navigator.language);

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Resolução de tela
  components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);

  // Plataforma
  components.push(navigator.platform);

  // Número de cores
  components.push(String(screen.colorDepth));

  // Pixel ratio
  components.push(String(window.devicePixelRatio || 1));

  // Plugins (quantidade)
  components.push(String(navigator.plugins?.length || 0));

  // Cores disponíveis
  components.push(String(screen.availWidth) + "x" + String(screen.availHeight));

  // Concatenar e gerar hash
  const fingerprint = components.join("|");

  // Usar SubtleCrypto para gerar hash SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprint);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return hashHex;
}

/**
 * Gera fingerprint do dispositivo
 * - Usa cache do localStorage se disponível e válido
 * - Gera novo fingerprint se não houver cache
 */
export async function generateDeviceFingerprint(): Promise<string> {
  try {
    // Verificar cache no localStorage
    const cachedFingerprint = localStorage.getItem(FINGERPRINT_KEY);
    const cachedExpiry = localStorage.getItem(FINGERPRINT_EXPIRY_KEY);

    if (cachedFingerprint && cachedExpiry) {
      const expiryTime = parseInt(cachedExpiry, 10);
      if (Date.now() < expiryTime) {
        console.log("[deviceFingerprint] ✅ Usando fingerprint do cache:", cachedFingerprint.slice(0, 8) + "...");
        return cachedFingerprint;
      }
    }

    // Gerar novo fingerprint
    const fingerprint = await generateBrowserFingerprint();

    // Salvar no localStorage
    localStorage.setItem(FINGERPRINT_KEY, fingerprint);
    localStorage.setItem(FINGERPRINT_EXPIRY_KEY, String(Date.now() + FINGERPRINT_TTL));

    console.log("[deviceFingerprint] 🔐 Novo fingerprint gerado:", fingerprint.slice(0, 8) + "...");

    return fingerprint;
  } catch (error) {
    console.error("[deviceFingerprint] Erro ao gerar fingerprint:", error);

    // Fallback: usar fingerprint salvo ou gerar um novo persistente
    let fallbackFingerprint = localStorage.getItem(FINGERPRINT_KEY);

    if (!fallbackFingerprint) {
      // Gerar um UUID e salvar para manter consistência
      fallbackFingerprint = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
      localStorage.setItem(FINGERPRINT_KEY, fallbackFingerprint);
      localStorage.setItem(FINGERPRINT_EXPIRY_KEY, String(Date.now() + FINGERPRINT_TTL));
    }

    console.log("[deviceFingerprint] ⚠️ Usando fallback fingerprint:", fallbackFingerprint.slice(0, 8) + "...");
    return fallbackFingerprint;
  }
}

/**
 * Gera nome legível do dispositivo (metadata apenas, não identificação)
 */
export function generateDeviceName(): string {
  const ua = navigator.userAgent;

  let os = "Unknown OS";
  if (ua.includes("Windows NT 10.0")) os = "Windows 10/11";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("iPhone")) os = "iPhone";
  else if (ua.includes("iPad")) os = "iPad";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("Linux")) os = "Linux";

  let browser = "Unknown Browser";
  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari")) browser = "Safari";

  return `${os} • ${browser}`;
}

/**
 * Detecta tipo de dispositivo (metadata apenas)
 */
export function detectDeviceType(): "desktop" | "mobile" | "tablet" {
  const ua = navigator.userAgent;

  // iPad / explicit tablet
  if (/iPad|Tablet/i.test(ua)) return "tablet";

  // Android tablets normalmente NÃO possuem "Mobile" no UA
  if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return "tablet";

  // Phones
  if (/Mobi|iPhone/i.test(ua)) return "mobile";

  // Fallback por capacidade (touch + largura)
  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  if (isTouchDevice && window.screen.width < 1024) return "tablet";

  return "desktop";
}

/**
 * Limpar cache do fingerprint
 */
export function clearFingerprintCache(): void {
  localStorage.removeItem(FINGERPRINT_KEY);
  localStorage.removeItem(FINGERPRINT_EXPIRY_KEY);
  console.log("[deviceFingerprint] 🗑️ Cache de fingerprint limpo");
}

/**
 * Verifica se há fingerprint em cache
 */
export function isFingerprintCached(): boolean {
  const cachedFingerprint = localStorage.getItem(FINGERPRINT_KEY);
  const cachedExpiry = localStorage.getItem(FINGERPRINT_EXPIRY_KEY);

  if (cachedFingerprint && cachedExpiry) {
    const expiryTime = parseInt(cachedExpiry, 10);
    return Date.now() < expiryTime;
  }

  return false;
}
