// ============================================
// 🏛️ CONSTITUIÇÃO SYNAPSE - LazyMotion
// Framer Motion lazy load - Animações só quando necessárias
// LEI I: Framer Motion adiciona ~123KB - carregar sob demanda
// ============================================

import React, { Suspense, lazy, memo, ComponentType, ReactNode } from "react";
import { perfFlags } from "@/lib/performance/performanceFlags";

// ============================================
// TIPOS
// ============================================
type MotionValue = Record<string, unknown> | boolean | string | number | undefined;
type LazyMotionComponent = ComponentType<Record<string, unknown>>;

interface MotionProps {
  children: ReactNode;
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
    default: mod.motion.div as unknown as LazyMotionComponent,
  }))
);

const LazyMotionSpan = lazy(() =>
  import("framer-motion").then(mod => ({
    default: mod.motion.span as unknown as LazyMotionComponent,
  }))
);

const LazyMotionButton = lazy(() =>
  import("framer-motion").then(mod => ({
    default: mod.motion.button as unknown as LazyMotionComponent,
  }))
);

const LazyMotionSection = lazy(() =>
  import("framer-motion").then(mod => ({
    default: mod.motion.section as unknown as LazyMotionComponent,
  }))
);

const LazyMotionArticle = lazy(() =>
  import("framer-motion").then(mod => ({
    default: mod.motion.article as unknown as LazyMotionComponent,
  }))
);

const LazyMotionLi = lazy(() =>
  import("framer-motion").then(mod => ({
    default: mod.motion.li as unknown as LazyMotionComponent,
  }))
);

const LazyMotionUl = lazy(() =>
  import("framer-motion").then(mod => ({
    default: mod.motion.ul as unknown as LazyMotionComponent,
  }))
);

const LazyMotionA = lazy(() =>
  import("framer-motion").then(mod => ({
    default: mod.motion.a as unknown as LazyMotionComponent,
  }))
);

const LazyAnimatePresence = lazy(() =>
  import("framer-motion").then(mod => ({
    default: mod.AnimatePresence as unknown as LazyMotionComponent,
  }))
);

// ============================================
// MAPEAMENTO DE COMPONENTES
// ============================================
const MOTION_COMPONENTS: Record<NonNullable<MotionProps['as']>, typeof LazyMotionDiv> = {
  div: LazyMotionDiv,
  span: LazyMotionSpan,
  button: LazyMotionButton,
  section: LazyMotionSection,
  article: LazyMotionArticle,
  a: LazyMotionA,
  li: LazyMotionLi,
  ul: LazyMotionUl,
};

// ============================================
// FALLBACK ESTÁTICO (SEM ANIMAÇÃO)
// ============================================
const StaticElement = memo(function StaticElement({ 
  children, 
  className, 
  style,
  onClick,
  onMouseEnter,
  onMouseLeave,
  as: Element = "div" 
}: Pick<MotionProps, 'children' | 'className' | 'style' | 'onClick' | 'onMouseEnter' | 'onMouseLeave' | 'as'>) {
  const Tag = Element as keyof JSX.IntrinsicElements;
  return (
    <Tag 
      className={className} 
      style={style}
      onClick={onClick as any}
      onMouseEnter={onMouseEnter as any}
      onMouseLeave={onMouseLeave as any}
    >
      {children}
    </Tag>
  );
});

StaticElement.displayName = "StaticElement";

// ============================================
// COMPONENTE PRINCIPAL — MOTION WRAPPER
// ============================================
export const Motion = memo(function Motion({
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
}: MotionProps) {
  // Selecionar componente
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
        <StaticElement className={className} style={style} as={as}>
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
interface AnimatePresenceWrapperProps {
  children: ReactNode;
  mode?: "wait" | "sync" | "popLayout";
  initial?: boolean;
  onExitComplete?: () => void;
}

export const AnimatePresenceWrapper = memo(function AnimatePresenceWrapper({ 
  children,
  mode = "wait",
  initial = true,
  onExitComplete,
}: AnimatePresenceWrapperProps) {
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
// PRESETS DE ANIMAÇÃO
// ============================================
export const motionPresets = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },
  fadeInUp: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
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
  slideInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
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
  hover: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.15 },
  },
} as const;

// Named exports for presets
export const { fadeIn, fadeInUp, slideUp, slideIn, slideInRight, scaleIn, staggerChildren, hover } = motionPresets;

export default Motion;
