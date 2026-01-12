import { ReactNode, useState, useCallback, useEffect, memo, forwardRef } from "react";
// OTIMIZAÇÃO: Removido framer-motion (~50KB) - usar CSS puro
import { Search, Command, Crown, MessageSquare, RefreshCw } from "lucide-react";
import { AIAssistant, AIAssistantTrigger } from "@/components/ai/AIAssistant";
import { OwnerAIModelsPanel } from "@/components/ai/OwnerAIModelsPanel";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { RoleBasedSidebar } from "./RoleBasedSidebar";
import { ThemeToggle } from "./ThemeToggle";
import { GlobalSearch } from "@/components/GlobalSearch";
import { CalculatorButton } from "@/components/Calculator";
import { PeriodicTableButton } from "@/components/PeriodicTable";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationCenter } from "@/components/ui/notification-center";
import { useNotificationsDatabase } from "@/hooks/useNotificationsDatabase";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useAuth } from "@/hooks/useAuth";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { useCacheManager } from "@/hooks/useCacheManager";
import { useGestaoAccessLog } from "@/hooks/useGestaoAccessLog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SystemHealthIndicator } from "@/components/dashboard/SystemHealthIndicator";
import { TeamChat } from "@/components/chat/TeamChat";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

interface AppLayoutProps {
  children: ReactNode;
}

// ⚡ DOGMA VIII: Componentes memoizados para evitar re-renders
// ✅ forwardRef wrapper para compatibilidade com Radix UI (Tooltip, Popover triggers)
const MemoizedSidebar = memo(
  forwardRef<HTMLDivElement, Record<string, never>>((props, ref) => (
    <div ref={ref}>
      <RoleBasedSidebar />
    </div>
  )),
);
MemoizedSidebar.displayName = "MemoizedSidebar";

const MemoizedSystemHealth = memo(SystemHealthIndicator);
MemoizedSystemHealth.displayName = "MemoizedSystemHealth";

// ⚡ DOGMA I: Loader CSS-only ultra-leve
const PageLoader = memo(() => (
  <div className="min-h-screen bg-background flex items-center justify-center relative z-10">
    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
));
PageLoader.displayName = "PageLoader";

// ⚡ Header otimizado e memoizado + forwardRef para Radix UI
interface AppHeaderProps {
  openSearch: () => void;
  handleClearCache: () => void;
  isCacheClearing: boolean;
  setIsTeamChatOpen: (open: boolean) => void;
  notifications: any[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  user: any;
  roleLabel: string;
  roleColor: string;
  isGodMode: boolean;
  signOut: () => void;
  navigate: (path: string) => void;
  appVersion: string;
}

const AppHeader = memo(
  forwardRef<HTMLElement, AppHeaderProps>(
    (
      {
        openSearch,
        handleClearCache,
        isCacheClearing,
        setIsTeamChatOpen,
        notifications,
        onMarkAsRead,
        onMarkAllAsRead,
        onDelete,
        onClearAll,
        user,
        roleLabel,
        roleColor,
        isGodMode,
        signOut,
        navigate,
        appVersion,
      },
      ref,
    ) => {
      const getInitials = useCallback((name: string) => {
        return name
          .split(" ")
          .slice(0, 2)
          .map((n) => n[0])
          .join("")
          .toUpperCase();
      }, []);

      return (
        <header
          ref={ref}
          className="h-14 flex items-center gap-4 px-4 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40 header-2300"
        >
          <SidebarTrigger className="-ml-1" />

          <Button
            variant="ghost"
            onClick={openSearch}
            data-search-button
            className="flex-1 max-w-md justify-start gap-2 text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary"
          >
            <Search className="h-4 w-4" />
            <span className="text-sm">Buscar...</span>
          </Button>

          <CalculatorButton />
          <PeriodicTableButton />
          <MemoizedSystemHealth />

          {/* 🔒 Botão Refresh - APENAS OWNER (LEI VII) */}
          {isGodMode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearCache}
                  disabled={isCacheClearing}
                  className="header-btn-glow micro-hover"
                >
                  <RefreshCw className={`h-4 w-4 ${isCacheClearing ? "animate-spin text-primary" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <p className="font-medium">Limpar Cache (OWNER)</p>
                  <p className="text-xs text-muted-foreground">v{appVersion}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          )}

          {/* 🔒 Chat da Equipe - APENAS OWNER (CONSTITUIÇÃO v10.4) */}
          {isGodMode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsTeamChatOpen(true)}
                  className="header-btn-glow micro-hover"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Chat da Equipe (OWNER)</TooltipContent>
            </Tooltip>
          )}

          <div className="flex-1" />

          <ThemeToggle />

          <div data-notification-center>
            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={onMarkAsRead}
              onMarkAllAsRead={onMarkAllAsRead}
              onDelete={onDelete}
              onClearAll={onClearAll}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {user?.email ? getInitials(user.email.split("@")[0]) : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Minha Conta</span>
                  <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                  <Badge className={`${roleColor} text-[10px] px-2 py-0 w-fit mt-1`}>
                    {isGodMode && <Crown className="w-2 h-2 mr-1" />}
                    {roleLabel}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* Links só aparecem se está em /gestaofc */}
              {typeof window !== "undefined" && window.location.pathname.startsWith("/gestaofc") && (
                <>
                  <DropdownMenuItem onClick={() => navigate("/gestaofc/configuracoes")}>Configurações</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/gestaofc/permissoes")}>Permissões</DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive">
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
      );
    },
  ),
);
AppHeader.displayName = "AppHeader";

// ⚡ Main Content com animação CSS pura (sem framer-motion)
// 🛡️ ROOT LAYOUT FIX: min-h-0 permite scroll natural, overflow-y-auto garante scroll vertical
const MainContent = memo(({ children }: { children: ReactNode }) => (
  <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden animate-fade-in">{children}</main>
));
MainContent.displayName = "MainContent";

export const AppLayout = memo(
  forwardRef<HTMLDivElement, AppLayoutProps>(function AppLayout({ children }, ref) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
    const [isTeamChatOpen, setIsTeamChatOpen] = useState(false);
    const [isCacheClearing, setIsCacheClearing] = useState(false);
    const { user, signOut } = useAuth();
    const { roleLabel, roleColor, isGodMode } = useRolePermissions();
    const { clearAllCache, forceRefresh, appVersion } = useCacheManager();
    const navigate = useNavigate();

    // 🛡️ LOG DE ACESSO A /gestaofc (AUTOMÁTICO)
    // Loga todos os acessos, especialmente do owner
    const { isGestaoArea, isOwner, logAction } = useGestaoAccessLog({ enabled: true });

    const handleClearCache = useCallback(async () => {
      setIsCacheClearing(true);
      clearAllCache(true);
      await forceRefresh();
      setIsCacheClearing(false);
    }, [clearAllCache, forceRefresh]);

    const openSearch = useCallback(() => setIsSearchOpen(true), []);
    const closeSearch = useCallback(() => setIsSearchOpen(false), []);
    const openAI = useCallback(() => setIsAIAssistantOpen(true), []);
    const closeAI = useCallback(() => setIsAIAssistantOpen(false), []);
    const closeChat = useCallback(() => setIsTeamChatOpen(false), []);

    useKeyboardShortcuts(openSearch, closeSearch);

    const { notifications, addNotification, markAsRead, markAllAsRead, deleteNotification, clearAll } =
      useNotificationsDatabase();

    useRealtimeNotifications({ addNotification });

    // Welcome notification - só uma vez por sessão
    useEffect(() => {
      const hasSeenWelcome = sessionStorage.getItem("hasSeenWelcome");
      if (!hasSeenWelcome && user) {
        addNotification({
          type: "success",
          title: "Bem-vindo! 🚀",
          message: "Seu painel de gestão está pronto para uso.",
        });
        sessionStorage.setItem("hasSeenWelcome", "true");
      }
    }, [user, addNotification]);

    return (
      <div ref={ref} className="w-full">
        <SidebarProvider>
          <div className="min-h-screen flex w-full overflow-x-hidden">
            <MemoizedSidebar />
            <SidebarInset className="flex-1">
              <AppHeader
                openSearch={openSearch}
                handleClearCache={handleClearCache}
                isCacheClearing={isCacheClearing}
                setIsTeamChatOpen={setIsTeamChatOpen}
                notifications={notifications}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onDelete={deleteNotification}
                onClearAll={clearAll}
                user={user}
                roleLabel={roleLabel}
                roleColor={roleColor}
                isGodMode={isGodMode}
                signOut={signOut}
                navigate={navigate}
                appVersion={appVersion}
              />
              <MainContent>{children}</MainContent>
            </SidebarInset>
          </div>

          {/* Modais lazy-loaded */}
          {isSearchOpen && <GlobalSearch isOpen={isSearchOpen} onClose={closeSearch} />}

          {/* 🔒 AI Assistente e Painel de Modelos - APENAS OWNER */}
          {isGodMode && (
            <>
              <AIAssistantTrigger onClick={openAI} />
              <OwnerAIModelsPanel />
            </>
          )}
          {isAIAssistantOpen && <AIAssistant isOpen={isAIAssistantOpen} onClose={closeAI} context="dashboard" />}

          {isTeamChatOpen && <TeamChat isOpen={isTeamChatOpen} onClose={closeChat} />}
        </SidebarProvider>
      </div>
    );
  }),
);
AppLayout.displayName = "AppLayout";

// 🔴 P0 FIX: Export default garantido
export default AppLayout;
