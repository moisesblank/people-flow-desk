// ============================================
// THEME TOGGLE - Seletor de tema no header
// Permite trocar entre claro/escuro/sistema
// ✅ forwardRef para compatibilidade com Radix UI
// ============================================

import { forwardRef } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";

export const ThemeToggle = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function ThemeToggle(props, ref) {
    const { theme, setTheme } = useTheme();

    // "default" mapeia para classe "system" no CSS
    const isDefault = theme === "default";

    const getIcon = () => {
      if (theme === "light") return <Sun className="h-4 w-4" />;
      if (theme === "dark") return <Moon className="h-4 w-4" />;
      return <Monitor className="h-4 w-4" />;
    };

    return (
      <div ref={ref} {...props}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="header-btn-glow micro-hover" title="Alterar Tema">
              {getIcon()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2 cursor-pointer">
              <Sun className="h-4 w-4" />
              <span>Claro</span>
              {theme === "light" && <span className="ml-auto text-primary">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2 cursor-pointer">
              <Moon className="h-4 w-4" />
              <span>Escuro</span>
              {theme === "dark" && <span className="ml-auto text-primary">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("default")} className="gap-2 cursor-pointer">
              <Monitor className="h-4 w-4" />
              <span>Sistema</span>
              {isDefault && <span className="ml-auto text-primary">✓</span>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }
);
ThemeToggle.displayName = 'ThemeToggle';