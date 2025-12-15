import { ReactNode, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Command } from "lucide-react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { GlobalSearch } from "@/components/GlobalSearch";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

  useKeyboardShortcuts(openSearch, closeSearch);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="h-14 flex items-center gap-4 px-4 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
            <SidebarTrigger className="-ml-1" />
            
            {/* Search Button */}
            <Button
              variant="ghost"
              onClick={openSearch}
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
            
            <div className="flex-1" />
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
    </SidebarProvider>
  );
}
