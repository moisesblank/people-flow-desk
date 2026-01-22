/* ============================================
   🕷️ AUTH PAGE - SPIDER-MAN CINEMATIC 2300
   Estética: Vermelho/Azul Profundo • Cinematográfico • Adulto
   Performance: CSS-only GPU-accelerated (5000+ usuários)
   ============================================ */

/* ============================================
   🎨 SPIDER-MAN COLOR PALETTE
   ============================================ */
:root {
  --spider-red: 0 85% 45%;        /* Vermelho profundo heroico */
  --spider-red-glow: 0 90% 55%;   /* Vermelho luminoso */
  --spider-blue: 220 80% 25%;     /* Azul noturno profundo */
  --spider-blue-glow: 210 100% 50%; /* Azul energia */
  --spider-dark: 230 40% 4%;      /* Preto espacial */
  --spider-web: 0 0% 95%;         /* Teia prata */
}

/* ============================================
   🌌 DEEP SPACE BACKGROUND
   ============================================ */
.auth-spider-bg {
  background: 
    radial-gradient(ellipse at 20% 30%, hsl(var(--spider-red) / 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 70%, hsl(var(--spider-blue-glow) / 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, hsl(var(--spider-dark)) 0%, hsl(230 40% 2%) 100%);
}

/* ============================================
   🕸️ WEB PATTERN - Geometric Spider Web
   ============================================ */
@keyframes spider-web-pulse {
  0%, 100% { opacity: 0.03; }
  50% { opacity: 0.08; }
}

.spider-web-layer {
  background-image: 
    /* Radial web lines */
    repeating-conic-gradient(
      from 0deg at 50% 50%,
      transparent 0deg,
      hsl(var(--spider-web) / 0.03) 1deg,
      transparent 2deg,
      transparent 15deg
    ),
    /* Concentric circles */
    repeating-radial-gradient(
      circle at 50% 50%,
      transparent 0px,
      transparent 60px,
      hsl(var(--spider-web) / 0.02) 61px,
      transparent 62px
    );
  animation: spider-web-pulse 8s ease-in-out infinite;
}

/* ============================================
   ⚡ ENERGY VEINS - Red/Blue Power Lines
   ============================================ */
@keyframes spider-vein-flow-red {
  0% { 
    transform: translateX(-100%) scaleY(1);
    opacity: 0;
  }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { 
    transform: translateX(200%) scaleY(1);
    opacity: 0;
  }
}

@keyframes spider-vein-flow-blue {
  0% { 
    transform: translateX(200%) scaleY(1);
    opacity: 0;
  }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { 
    transform: translateX(-100%) scaleY(1);
    opacity: 0;
  }
}

.spider-vein-red {
  background: linear-gradient(90deg, 
    transparent 0%,
    hsl(var(--spider-red) / 0.3) 20%,
    hsl(var(--spider-red-glow)) 50%,
    hsl(var(--spider-red) / 0.3) 80%,
    transparent 100%
  );
  box-shadow: 0 0 30px hsl(var(--spider-red-glow) / 0.6),
              0 0 60px hsl(var(--spider-red) / 0.3);
  animation: spider-vein-flow-red 5s ease-in-out infinite;
}

.spider-vein-blue {
  background: linear-gradient(90deg, 
    transparent 0%,
    hsl(var(--spider-blue-glow) / 0.3) 20%,
    hsl(var(--spider-blue-glow)) 50%,
    hsl(var(--spider-blue-glow) / 0.3) 80%,
    transparent 100%
  );
  box-shadow: 0 0 30px hsl(var(--spider-blue-glow) / 0.6),
              0 0 60px hsl(var(--spider-blue-glow) / 0.3);
  animation: spider-vein-flow-blue 7s ease-in-out infinite;
}

/* ============================================
   🔴 SPIDER EYES - Vigilant Orbs
   ============================================ */
@keyframes spider-eye-glow {
  0%, 100% { 
    opacity: 0.4;
    transform: scale(1);
    filter: blur(40px);
  }
  50% { 
    opacity: 0.7;
    transform: scale(1.1);
    filter: blur(50px);
  }
}

@keyframes spider-eye-scan {
  0%, 100% { transform: translateX(-5%); }
  50% { transform: translateX(5%); }
}

.spider-eye-left,
.spider-eye-right {
  animation: 
    spider-eye-glow 4s ease-in-out infinite,
    spider-eye-scan 8s ease-in-out infinite;
  will-change: opacity, transform, filter;
}

.spider-eye-left {
  animation-delay: 0s;
}

.spider-eye-right {
  animation-delay: 2s;
}

/* ============================================
   ⭐ CITY STARS - New York Night Sky
   ============================================ */
@keyframes spider-star-twinkle {
  0%, 100% { 
    opacity: 0.2;
    transform: scale(0.8);
  }
  50% { 
    opacity: 1;
    transform: scale(1.2);
  }
}

.spider-star {
  animation: spider-star-twinkle ease-in-out infinite;
  will-change: opacity, transform;
}

/* ============================================
   🏙️ CITYSCAPE SILHOUETTE
   ============================================ */
.spider-cityscape {
  background: linear-gradient(180deg,
    transparent 0%,
    transparent 70%,
    hsl(var(--spider-dark) / 0.95) 100%
  );
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 200'%3E%3Cpath d='M0,200 L0,150 L30,150 L30,100 L50,100 L50,120 L80,120 L80,60 L100,60 L100,80 L120,80 L120,40 L150,40 L150,90 L180,90 L180,70 L200,70 L200,130 L230,130 L230,50 L260,50 L260,100 L290,100 L290,30 L320,30 L320,80 L350,80 L350,110 L380,110 L380,60 L410,60 L410,140 L450,140 L450,45 L480,45 L480,95 L510,95 L510,55 L540,55 L540,120 L580,120 L580,35 L610,35 L610,75 L640,75 L640,105 L680,105 L680,25 L720,25 L720,85 L750,85 L750,65 L780,65 L780,130 L820,130 L820,50 L850,50 L850,90 L880,90 L880,40 L920,40 L920,110 L950,110 L950,70 L980,70 L980,150 L1000,150 L1000,200 Z' fill='white'/%3E%3C/svg%3E");
  mask-size: cover;
  mask-position: bottom;
}

/* ============================================
   💠 CARD FRAME - Spider Tech Interface
   ============================================ */
@keyframes spider-corner-energy {
  0%, 100% { 
    opacity: 0.5;
    box-shadow: 0 0 5px currentColor;
  }
  50% { 
    opacity: 1;
    box-shadow: 0 0 20px currentColor, 0 0 40px currentColor;
  }
}

.spider-corner {
  animation: spider-corner-energy 2.5s ease-in-out infinite;
}

.spider-corner-red {
  border-color: hsl(var(--spider-red-glow));
  color: hsl(var(--spider-red-glow));
}

.spider-corner-blue {
  border-color: hsl(var(--spider-blue-glow));
  color: hsl(var(--spider-blue-glow));
}

/* Card scan beam */
@keyframes spider-card-scan {
  0% { 
    top: -5%;
    opacity: 0;
  }
  10%, 90% { opacity: 0.9; }
  100% { 
    top: 105%;
    opacity: 0;
  }
}

.spider-card-scan {
  animation: spider-card-scan 4s ease-in-out infinite;
  background: linear-gradient(90deg, 
    transparent 0%,
    hsl(var(--spider-red-glow) / 0.5) 30%,
    hsl(var(--spider-blue-glow) / 0.5) 70%,
    transparent 100%
  );
  box-shadow: 0 0 30px hsl(var(--spider-red-glow) / 0.4),
              0 0 30px hsl(var(--spider-blue-glow) / 0.4);
}

/* Card glow effect */
@keyframes spider-card-glow {
  0%, 100% {
    box-shadow: 
      0 0 20px hsl(var(--spider-red) / 0.2),
      0 0 40px hsl(var(--spider-blue) / 0.1),
      inset 0 1px 0 hsl(var(--spider-web) / 0.1);
  }
  50% {
    box-shadow: 
      0 0 40px hsl(var(--spider-red) / 0.3),
      0 0 80px hsl(var(--spider-blue-glow) / 0.2),
      inset 0 1px 0 hsl(var(--spider-web) / 0.15);
  }
}

.spider-card {
  animation: spider-card-glow 4s ease-in-out infinite;
  background: linear-gradient(145deg,
    hsl(var(--spider-dark) / 0.95) 0%,
    hsl(230 35% 8% / 0.98) 50%,
    hsl(var(--spider-dark) / 0.95) 100%
  );
  border: 1px solid hsl(var(--spider-red) / 0.2);
  backdrop-filter: blur(20px);
}

/* ============================================
   📊 STATS CARDS - Hero Metrics
   ============================================ */
@keyframes spider-stat-reveal {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.spider-stat-card {
  animation: spider-stat-reveal 0.6s ease-out forwards;
  background: linear-gradient(135deg,
    hsl(var(--spider-red) / 0.08) 0%,
    hsl(var(--spider-blue) / 0.08) 100%
  );
  border: 1px solid hsl(var(--spider-red) / 0.2);
  transition: all 0.3s ease;
}

.spider-stat-card:hover {
  border-color: hsl(var(--spider-red-glow) / 0.5);
  box-shadow: 0 0 30px hsl(var(--spider-red) / 0.2),
              0 0 60px hsl(var(--spider-blue-glow) / 0.1);
  transform: translateY(-2px);
}

/* ============================================
   🖼️ PROFESSOR FRAME - Legendary Border
   ============================================ */
@keyframes spider-frame-pulse {
  0%, 100% {
    box-shadow: 
      0 0 0 2px hsl(var(--spider-red) / 0.3),
      0 0 30px hsl(var(--spider-red) / 0.2),
      0 0 60px hsl(var(--spider-blue-glow) / 0.1);
  }
  50% {
    box-shadow: 
      0 0 0 3px hsl(var(--spider-red-glow) / 0.5),
      0 0 50px hsl(var(--spider-red-glow) / 0.3),
      0 0 100px hsl(var(--spider-blue-glow) / 0.2);
  }
}

.spider-professor-frame {
  animation: spider-frame-pulse 3s ease-in-out infinite;
  border: 2px solid hsl(var(--spider-red) / 0.4);
}

/* ============================================
   🎯 TITLE GLOW - Heroic Typography
   ============================================ */
@keyframes spider-title-glow {
  0%, 100% {
    text-shadow: 
      0 0 10px hsl(var(--spider-red-glow) / 0.5),
      0 0 20px hsl(var(--spider-red) / 0.3);
  }
  50% {
    text-shadow: 
      0 0 20px hsl(var(--spider-red-glow) / 0.7),
      0 0 40px hsl(var(--spider-red) / 0.4),
      0 0 60px hsl(var(--spider-blue-glow) / 0.2);
  }
}

.spider-title {
  animation: spider-title-glow 3s ease-in-out infinite;
  background: linear-gradient(135deg,
    hsl(var(--spider-red-glow)) 0%,
    hsl(0 85% 60%) 30%,
    hsl(var(--spider-web)) 50%,
    hsl(210 90% 65%) 70%,
    hsl(var(--spider-blue-glow)) 100%
  );
  background-size: 200% 200%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* ============================================
   🔌 INPUT FIELDS - Tech Interface
   ============================================ */
.spider-input {
  background: hsl(var(--spider-dark) / 0.8) !important;
  border: 1px solid hsl(var(--spider-red) / 0.2) !important;
  transition: all 0.3s ease !important;
}

.spider-input:focus {
  border-color: hsl(var(--spider-red-glow) / 0.5) !important;
  box-shadow: 0 0 20px hsl(var(--spider-red) / 0.2),
              0 0 40px hsl(var(--spider-blue-glow) / 0.1) !important;
}

/* ============================================
   🚀 BUTTON - Hero Action
   ============================================ */
.spider-button {
  background: linear-gradient(135deg,
    hsl(var(--spider-red)) 0%,
    hsl(var(--spider-red-glow)) 50%,
    hsl(var(--spider-red)) 100%
  ) !important;
  box-shadow: 0 0 20px hsl(var(--spider-red) / 0.3),
              0 4px 15px hsl(0 0% 0% / 0.4) !important;
  transition: all 0.3s ease !important;
}

.spider-button:hover {
  box-shadow: 0 0 40px hsl(var(--spider-red-glow) / 0.5),
              0 0 60px hsl(var(--spider-blue-glow) / 0.2),
              0 6px 20px hsl(0 0% 0% / 0.5) !important;
  transform: translateY(-2px) !important;
}

/* ============================================
   🎬 ENTRANCE ANIMATIONS
   ============================================ */
@keyframes spider-hero-entrance {
  0% {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.spider-entrance {
  animation: spider-hero-entrance 0.8s ease-out forwards;
}

.spider-entrance-delay-1 { animation-delay: 0.1s; opacity: 0; }
.spider-entrance-delay-2 { animation-delay: 0.2s; opacity: 0; }
.spider-entrance-delay-3 { animation-delay: 0.3s; opacity: 0; }

/* ============================================
   ⚡ PERFORMANCE OPTIMIZATIONS
   ============================================ */
.spider-web-layer,
.spider-vein-red,
.spider-vein-blue,
.spider-eye-left,
.spider-eye-right,
.spider-star,
.spider-corner,
.spider-card-scan,
.spider-card,
.spider-stat-card,
.spider-professor-frame,
.spider-title {
  will-change: transform, opacity;
  backface-visibility: hidden;
  transform: translateZ(0);
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .spider-web-layer,
  .spider-vein-red,
  .spider-vein-blue,
  .spider-eye-left,
  .spider-eye-right,
  .spider-star,
  .spider-corner,
  .spider-card-scan,
  .spider-card,
  .spider-stat-card,
  .spider-professor-frame,
  .spider-title,
  .spider-entrance,
  .spider-entrance-delay-1,
  .spider-entrance-delay-2,
  .spider-entrance-delay-3 {
    animation: none !important;
    opacity: 1 !important;
  }
}

/* ============================================
   📱 MOBILE OPTIMIZATIONS
   ============================================ */
@media (max-width: 768px) {
  .spider-vein-red,
  .spider-vein-blue {
    display: none; /* Hide on mobile for perf */
  }
  
  .spider-eye-left,
  .spider-eye-right {
    opacity: 0.3;
  }
}

/* ============================================
   🎬 HERO TEXT - CINEMATIC ANIMATIONS
   GPU-accelerated, Performance Tiered
   ============================================ */

/* Glow Background - Breathing pulse */
@keyframes auth-glow-bg-pulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}

.auth-hero-glow-bg {
  animation: auth-glow-bg-pulse 4s ease-in-out infinite;
  will-change: opacity, transform;
}

/* Title Reveal - Cinematic entry */
@keyframes auth-hero-reveal {
  0% { 
    opacity: 0; 
    transform: translateY(30px) scale(0.95); 
  }
  100% { 
    opacity: 1; 
    transform: translateY(0) scale(1); 
  }
}

.auth-hero-title-animated {
  animation: auth-hero-reveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  will-change: opacity, transform;
}

.auth-hero-highlight-animated {
  animation: auth-hero-reveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
  opacity: 0;
  will-change: opacity, transform;
}

.auth-hero-subtitle-animated {
  animation: auth-hero-reveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards;
  opacity: 0;
  will-change: opacity, transform;
}

.auth-hero-desc-animated {
  animation: auth-hero-reveal 1s cubic-bezier(0.16, 1, 0.3, 1) 0.7s forwards;
  opacity: 0;
  will-change: opacity, transform;
}

.auth-hero-line-animated {
  animation: auth-hero-reveal 1s cubic-bezier(0.16, 1, 0.3, 1) 0.9s forwards;
  opacity: 0;
}

/* Glow Layer - Breathing effect */
@keyframes auth-glow-breathe {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.auth-glow-layer {
  animation: auth-glow-breathe 3s ease-in-out infinite;
  will-change: opacity;
}

/* Orb Pulse */
@keyframes auth-orb-pulse {
  0%, 100% { 
    transform: scale(1); 
    box-shadow: 0 0 15px hsl(320 90% 55% / 0.8), 0 0 30px hsl(320 90% 55% / 0.4); 
  }
  50% { 
    transform: scale(1.3); 
    box-shadow: 0 0 25px hsl(320 90% 55% / 1), 0 0 50px hsl(320 90% 55% / 0.6); 
  }
}

.auth-orb-animated {
  animation: auth-orb-pulse 2s ease-in-out infinite;
  will-change: transform, box-shadow;
}

/* Ring Spin */
@keyframes auth-ring-spin {
  from { transform: scale(2.5) rotate(0deg); }
  to { transform: scale(2.5) rotate(360deg); }
}

.auth-ring-animated {
  animation: auth-ring-spin 8s linear infinite;
  will-change: transform;
}
