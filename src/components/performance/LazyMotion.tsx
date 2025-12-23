// ============================================
// 🌌🔥 LAZY MOTION — FRAMER MOTION LAZY LOAD NÍVEL NASA 🔥🌌
// ANO 2300 — ANIMAÇÕES SÓ QUANDO NECESSÁRIAS
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================
//
// PROBLEMA: Framer Motion adiciona ~123KB ao bundle
// SOLUÇÃO: Carregar sob demanda e respeitar reduced-motion
//
// ============================================

import React, { Suspense, lazy, memo, ComponentType } from "react";
import { perfFlags } from "@/lib/performance/performanceFlags";

// ============================================
// TIPOS
// ============================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MotionValue = Record<string, unknown> | boolean | string | number | undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LazyMotionComponent = ComponentType<Record<string, unknown>>;

interface MotionProps {
  children: React.ReactNode;
  className?: string;
  
  // Animação
  initial?: MotionValue;
  animate?: MotionValue;
  exit?: MotionValue;
  transition?: MotionValue;
  variants?: Record<string, MotionValue>;
  
  // Hover/Tap
  whileHover?: MotionValue;
  whileTap?: MotionValue;
  whileFocus?: MotionValue;
  whileInView?: MotionValue;
  
  // Layout
  layout?: boolean | "position" | "size";
  layoutId?: string;
  
  // Callbacks
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
  
  // HTML Props
  onClick?: React.MouseEventHandler;
  onMouseEnter?: React.MouseEventHandler;
  onMouseLeave?: React.MouseEventHandler;
  style?: React.CSSProperties;
  
  // Elemento
  as?: "div" | "span" | "section" | "article" | "button" | "a" | "li" | "ul";
}

// ============================================
// LAZY IMPORTS
// ============================================
const LazyMotionDiv = lazy(() =>
  import("framer-motion").then(mod => ({
    default: mod.motion.div as LazyMotionComponent,
  }))
);

const LazyMotionSpan = lazy(() =>
  import("framer-motion").then(mod => ({
    default: mod.motion.span as LazyMotionComponent,
  }))
);

const LazyMotionButton = lazy(() =>
  import("framer-motion").then(mod => ({
    default: mod.motion.button as LazyMotionComponent,
  }))
);

const LazyAnimatePresence = lazy(() =>
  import("framer-motion").then(mod => ({
    default: mod.AnimatePresence as LazyMotionComponent,
  }))
);

// ============================================
// MAPEAMENTO DE COMPONENTES
// ============================================
const MOTION_COMPONENTS: Record<string, typeof LazyMotionDiv> = {
  div: LazyMotionDiv,
  span: LazyMotionSpan,
  button: LazyMotionButton,
  section: LazyMotionDiv,
  article: LazyMotionDiv,
  a: LazyMotionDiv,
  li: LazyMotionDiv,
  ul: LazyMotionDiv,
};

// ============================================
// FALLBACK ESTÁTICO (SEM ANIMAÇÃO)
// ============================================
const StaticElement = memo(({ 
  children, 
  className, 
  style,
  onClick,
  onMouseEnter,
  onMouseLeave,
  as: Element = "div" 
}: MotionProps) => {
  const Tag = Element as keyof JSX.IntrinsicElements;
  return (
    <Tag 
      className={className} 
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </Tag>
  );
});

StaticElement.displayName = "StaticElement";

// ============================================
// COMPONENTE PRINCIPAL — MOTION WRAPPER
// ============================================
export const Motion = memo(({
  children,
  className,
  initial,
  animate,
  exit,
  transition,
  variants,
  whileHover,
  whileTap,
  whileFocus,
  whileInView,
  layout,
  layoutId,
  onAnimationStart,
  onAnimationComplete,
  onClick,
  onMouseEnter,
  onMouseLeave,
  style,
  as = "div",
}: MotionProps) => {
  // Selecionar componente ANTES de qualquer early return
  const MotionComponent = MOTION_COMPONENTS[as] || LazyMotionDiv;

  // Checar se motion está habilitado
  const motionEnabled = perfFlags.shouldLoadHeavyFeature("motion");

  // Se motion desabilitado, render estático
  if (!motionEnabled) {
    return (
      <StaticElement 
        className={className} 
        style={style} 
        as={as}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {children}
      </StaticElement>
    );
  }

  // Props de animação
  const motionProps = {
    className,
    style,
    initial,
    animate,
    exit,
    transition,
    variants,
    whileHover,
    whileTap,
    whileFocus,
    whileInView,
    layout,
    layoutId,
    onAnimationStart,
    onAnimationComplete,
    onClick,
    onMouseEnter,
    onMouseLeave,
  };

  return (
    <Suspense 
      fallback={
        <StaticElement 
          className={className} 
          style={style} 
          as={as}
        >
          {children}
        </StaticElement>
      }
    >
      <MotionComponent {...motionProps}>
        {children}
      </MotionComponent>
    </Suspense>
  );
});

Motion.displayName = "Motion";

// ============================================
// ANIMATE PRESENCE WRAPPER
// ============================================
export const AnimatePresenceWrapper = memo(({ 
  children,
  mode = "wait",
  initial = true,
  onExitComplete,
}: {
  children: React.ReactNode;
  mode?: "wait" | "sync" | "popLayout";
  initial?: boolean;
  onExitComplete?: () => void;
}) => {
  const motionEnabled = perfFlags.shouldLoadHeavyFeature("motion");

  if (!motionEnabled) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={<>{children}</>}>
      <LazyAnimatePresence mode={mode} initial={initial} onExitComplete={onExitComplete}>
        {children}
      </LazyAnimatePresence>
    </Suspense>
  );
});

AnimatePresenceWrapper.displayName = "AnimatePresenceWrapper";

// ============================================
// PRESETS DE ANIMAÇÃO (arquivo separado recomendado)
// ============================================
export const motionPresets = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 },
  },
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.3 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2 },
  },
  staggerChildren: {
    animate: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  },
};

// Named exports for presets
export const { fadeIn, slideUp, slideIn, scaleIn, staggerChildren } = motionPresets;

export default Motion;
