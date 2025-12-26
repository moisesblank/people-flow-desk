// ============================================
// TIPOS DE UI E COMPONENTES
// Centralizados por domínio
// ============================================

import { ReactNode, ErrorInfo } from 'react';

// Props de ErrorBoundary
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

// State de ErrorBoundary
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Opção de exportação
export interface ExportOption {
  label: string;
  action: () => void;
  icon?: ReactNode;
  disabled?: boolean;
}

// Props de botão de exportação
export interface ExportButtonProps {
  options?: ExportOption[];
  onExport?: () => void;
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

// Opção de select genérica
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

// Breakpoints responsivos
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export const BREAKPOINTS: Record<Breakpoint, number> = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// Props de modal genérico
export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children?: ReactNode;
}

// Estado de loading
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// Resultado de paginação
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Parâmetros de paginação
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Toast notification
export interface ToastData {
  id?: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

// Navegação de menu
export interface MenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  children?: MenuItem[];
  badge?: string | number;
  disabled?: boolean;
}

// Tiers de performance
export type PerformanceTier = 'low' | 'medium' | 'high' | 'ultra';

// Configurações de performance
export interface PerformanceConfig {
  tier: PerformanceTier;
  disableAnimations: boolean;
  reduceMotion: boolean;
  lazyLoadImages: boolean;
  prefetchEnabled: boolean;
}
