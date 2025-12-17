import { ReactNode, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Command, Crown, MessageSquare } from "lucide-react";
import { AIAssistant, AIAssistantTrigger } from "@/components/ai/AIAssistant";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { RoleBasedSidebar } from "./RoleBasedSidebar";
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

export function AppLayout({ children }: AppLayoutProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isTeamChatOpen, setIsTeamChatOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { roleLabel, roleColor, isGodMode } = useRolePermissions();
  const navigate = useNavigate();

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

  useKeyboardShortcuts(openSearch, closeSearch);

  // Use database-backed notifications
  const {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotificationsDatabase();

  // Enable realtime notifications from other tables
  useRealtimeNotifications({ addNotification });

  // Add welcome notification on first load
  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome && user) {
      addNotification({
        type: "success",
        title: "Bem-vindo! 🚀",
        message: "Seu painel de gestão está pronto para uso.",
      });
      sessionStorage.setItem('hasSeenWelcome', 'true');
    }
  }, [user, addNotification]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <RoleBasedSidebar />
        <SidebarInset className="flex-1">
          <header className="h-14 flex items-center gap-4 px-4 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
            <SidebarTrigger className="-ml-1" />
            
            {/* Search Button */}
            <Button
              variant="ghost"
              onClick={openSearch}
              data-search-button
              className="flex-1 max-w-md justify-start gap-2 text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary"
            >
              <Search className="h-4 w-4" />
              <span className="text-sm">Buscar...</span>
              <div className="ml-auto flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-[10px] bg-background/50 rounded border border-border">
                  <Command className="h-3 w-3 inline" />
                </kbd>
                <kbd className="px-1.5 py-0.5 text-[10px] bg-background/50 rounded border border-border">
                  K
                </kbd>
              </div>
            </Button>

            {/* Calculator */}
            <CalculatorButton />
            
            {/* Periodic Table */}
            <PeriodicTableButton />
            
            {/* System Health */}
            <SystemHealthIndicator />
            
            {/* Team Chat Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsTeamChatOpen(true)}
                  className="relative"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Chat da Equipe</TooltipContent>
            </Tooltip>
            
            <div className="flex-1" />

            {/* Notification Center */}
            <div data-notification-center>
              <NotificationCenter
                notifications={notifications}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onDelete={deleteNotification}
                onClearAll={clearAll}
              />
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {user?.email ? getInitials(user.email.split('@')[0]) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">Minha Conta</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </span>
                    <Badge className={`${roleColor} text-[10px] px-2 py-0 w-fit mt-1`}>
                      {isGodMode && <Crown className="w-2 h-2 mr-1" />}
                      {roleLabel}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/permissoes')}>
                  Permissões
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => signOut()}
                  className="text-destructive focus:text-destructive"
                >
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          
          <AnimatePresence mode="wait">
            <motion.main
              key="main-content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </SidebarInset>
      </div>

      {/* Global Search Modal */}
      <GlobalSearch isOpen={isSearchOpen} onClose={closeSearch} />

      {/* AI Assistant - Global */}
      <AIAssistantTrigger onClick={() => setIsAIAssistantOpen(true)} />
      <AIAssistant 
        isOpen={isAIAssistantOpen} 
        onClose={() => setIsAIAssistantOpen(false)} 
        context="dashboard"
      />

      {/* Team Chat */}
      <TeamChat isOpen={isTeamChatOpen} onClose={() => setIsTeamChatOpen(false)} />
    </SidebarProvider>
  );
}
