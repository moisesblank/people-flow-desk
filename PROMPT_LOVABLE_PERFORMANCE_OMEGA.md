# 🔥🌌 PROMPT PARA LOVABLE — PERFORMANCE OMEGA ULTRA 🌌🔥
## ANO 2300 — DESIGN FUTURISTA COM RENDIMENTO 3500
### MESTRE MOISÉS MEDEIROS — PROTEÇÃO DA NASA

---

## 📋 INSTRUÇÕES DE IMPLEMENTAÇÃO (ORDEM OBRIGATÓRIA)

Cole cada código abaixo na Lovable **NA ORDEM INDICADA**.

---

## ✅ CÓDIGO 1: Sistema de Flags de Performance

**Destino:** `src/lib/performance/performanceFlags.ts`

```typescript
// Cole o conteúdo completo do arquivo:
// /workspace/src/lib/performance/performanceFlags.ts
```

**O que faz:** Sistema central de controle de performance. Detecta automaticamente dispositivo/rede e ativa Lite Mode em conexões lentas.

---

## ✅ CÓDIGO 2: Click-to-Load Video

**Destino:** `src/components/performance/ClickToLoadVideo.tsx`

```typescript
// Cole o conteúdo completo do arquivo:
// /workspace/src/components/performance/ClickToLoadVideo.tsx
```

**O que faz:** Player de vídeo que NUNCA carrega antes do clique do usuário. Crítico para performance em 3G.

---

## ✅ CÓDIGO 3: Imagem Otimizada

**Destino:** `src/components/performance/OptimizedImage.tsx`

```typescript
// Cole o conteúdo completo do arquivo:
// /workspace/src/components/performance/OptimizedImage.tsx
```

**O que faz:** Componente de imagem com lazy loading, placeholder blur e carregamento inteligente.

---

## ✅ CÓDIGO 4: Gráficos Lazy

**Destino:** `src/components/performance/LazyChart.tsx`

```typescript
// Cole o conteúdo completo do arquivo:
// /workspace/src/components/performance/LazyChart.tsx
```

**O que faz:** Carrega Recharts apenas quando o gráfico entra na viewport. Economia de ~445KB.

---

## ✅ CÓDIGO 5: Motion Lazy

**Destino:** `src/components/performance/LazyMotion.tsx`

```typescript
// Cole o conteúdo completo do arquivo:
// /workspace/src/components/performance/LazyMotion.tsx
```

**O que faz:** Carrega Framer Motion apenas quando necessário. Economia de ~123KB.

---

## ✅ CÓDIGO 6: Overlay de Performance

**Destino:** `src/components/performance/PerformanceOverlay.tsx`

```typescript
// Cole o conteúdo completo do arquivo:
// /workspace/src/components/performance/PerformanceOverlay.tsx
```

**O que faz:** Monitor de performance em tempo real com FPS, Core Web Vitals e toggle de Lite Mode.

---

## ✅ CÓDIGO 7: Hook usePerformance

**Destino:** `src/hooks/usePerformance.ts`

```typescript
// Cole o conteúdo completo do arquivo:
// /workspace/src/hooks/usePerformance.ts
```

**O que faz:** Hook central para métricas e controle de performance em componentes React.

---

## ✅ CÓDIGO 8: CSS de Performance

**Destino:** `src/styles/performance.css`

```css
/* Cole o conteúdo completo do arquivo: */
/* /workspace/src/styles/performance.css */
```

**O que faz:** Estilos para Lite Mode, animações otimizadas e reduced motion.

---

## ✅ CÓDIGO 9: Index de Exports

**Destino:** `src/components/performance/index.ts`

```typescript
// Cole o conteúdo completo do arquivo:
// /workspace/src/components/performance/index.ts
```

**O que faz:** Exporta todos os componentes de performance de forma centralizada.

---

## ✅ CÓDIGO 10: Atualização do index.css

**Destino:** `src/index.css` (adicionar no topo, após os @tailwind)

```css
/* ⚡ PERFORMANCE OMEGA — Otimização Nível NASA */
@import "./styles/performance.css";
```

---

## ✅ CÓDIGO 11: Atualização do main.tsx

**Destino:** `src/main.tsx` (adicionar imports e inicialização)

```typescript
// Adicionar import:
import { perfFlags } from "@/lib/performance/performanceFlags";

// Adicionar no início do if (typeof window !== 'undefined'):
perfFlags.init();
const capabilities = perfFlags.getCapabilities();
console.log(`[PERF] 📱 Device Tier: ${capabilities.tier}`);
console.log(`[PERF] 📶 Connection: ${capabilities.connection}`);
console.log(`[PERF] 🔋 Lite Mode: ${perfFlags.get('liteMode') ? 'ON' : 'OFF'}`);
```

---

## 📍 MAPA DE URLs (VALIDAÇÃO OBRIGATÓRIA)

| Quem | URL | Validação |
|------|-----|-----------|
| 🌐 NÃO PAGANTE | `pro.moisesmedeiros.com.br/` + `/comunidade` | Criar conta = acesso livre |
| 👨‍🎓 ALUNO BETA | `pro.moisesmedeiros.com.br/alunos` | `role='beta'` + acesso válido |
| 👔 FUNCIONÁRIO | `gestao.moisesmedeiros.com.br/gestao` | `role='funcionario'` |
| 👑 OWNER | TODAS AS ÁREAS | `moisesblank@gmail.com` = MASTER |

---

## 🎯 COMO USAR OS NOVOS COMPONENTES

### Click-to-Load Video:
```tsx
import { ClickToLoadVideo } from "@/components/performance";

<ClickToLoadVideo
  youtubeId="dQw4w9WgXcQ"
  poster="/thumbnail.webp"
  title="Minha Aula"
/>
```

### Imagem Otimizada:
```tsx
import { OptimizedImage } from "@/components/performance";

<OptimizedImage
  src="/imagem.png"
  alt="Descrição"
  placeholder="blur"
/>
```

### Gráfico Lazy:
```tsx
import { LazyChart } from "@/components/performance";

<LazyChart
  type="line"
  data={chartData}
  height={300}
/>
```

### Motion Lazy:
```tsx
import { Motion, fadeIn } from "@/components/performance";

<Motion {...fadeIn}>
  Conteúdo animado
</Motion>
```

### Performance Overlay (para debug):
```tsx
import { PerformanceOverlay } from "@/components/performance";

// Adicionar no App.tsx para ver métricas:
<PerformanceOverlay position="bottom-right" />
```

---

## ✅ CHECKLIST FINAL

- [ ] Código 1 implementado
- [ ] Código 2 implementado
- [ ] Código 3 implementado
- [ ] Código 4 implementado
- [ ] Código 5 implementado
- [ ] Código 6 implementado
- [ ] Código 7 implementado
- [ ] Código 8 implementado
- [ ] Código 9 implementado
- [ ] Código 10 implementado
- [ ] Código 11 implementado
- [ ] Build passa sem erros
- [ ] Preview funciona
- [ ] Lite Mode ativa em 3G

---

**PRONTO! ✅**

Sistema de Performance OMEGA ULTRA pronto para implementação.
