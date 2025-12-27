import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CardItem {
  icon: LucideIcon;
  label: string;
  description?: string;
}

interface PlatformGuideCardProps {
  title: string;
  subtitle: string;
  variant: "law" | "idea" | "security" | "ai" | "student";
  badge?: string;
  items: CardItem[];
  footer?: string;
  className?: string;
}

const variantStyles = {
  law: {
    container: "bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950 border-zinc-600",
    header: "bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-zinc-900",
    itemBg: "bg-zinc-800/80 hover:bg-zinc-700/90",
    iconBg: "bg-zinc-700 text-orange-400",
    footerBg: "bg-red-600",
    accentBorder: "border-orange-500/30",
    glow: "shadow-orange-500/20",
  },
  idea: {
    container: "bg-gradient-to-b from-sky-800 via-blue-900 to-indigo-950 border-sky-500",
    header: "bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-zinc-900",
    itemBg: "bg-sky-800/60 hover:bg-sky-700/80",
    iconBg: "bg-sky-700 text-yellow-300",
    footerBg: "bg-emerald-500",
    accentBorder: "border-cyan-400/30",
    glow: "shadow-cyan-400/20",
  },
  security: {
    container: "bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border-emerald-500",
    header: "bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-zinc-900",
    itemBg: "bg-slate-800/80 hover:bg-slate-700/90",
    iconBg: "bg-slate-700 text-emerald-400",
    footerBg: "bg-emerald-600",
    accentBorder: "border-emerald-500/30",
    glow: "shadow-emerald-500/20",
  },
  ai: {
    container: "bg-gradient-to-b from-violet-800 via-purple-900 to-indigo-950 border-violet-500",
    header: "bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white",
    itemBg: "bg-violet-800/60 hover:bg-violet-700/80",
    iconBg: "bg-violet-700 text-fuchsia-300",
    footerBg: "bg-fuchsia-600",
    accentBorder: "border-violet-400/30",
    glow: "shadow-violet-500/20",
  },
  student: {
    container: "bg-gradient-to-b from-amber-800 via-orange-900 to-red-950 border-amber-500",
    header: "bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 text-zinc-900",
    itemBg: "bg-amber-800/60 hover:bg-amber-700/80",
    iconBg: "bg-amber-700 text-yellow-300",
    footerBg: "bg-amber-600",
    accentBorder: "border-amber-400/30",
    glow: "shadow-amber-500/20",
  },
};

export function PlatformGuideCard({
  title,
  subtitle,
  variant,
  badge,
  items,
  footer,
  className,
}: PlatformGuideCardProps) {
  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "relative rounded-xl border-4 overflow-hidden shadow-2xl",
        styles.container,
        styles.glow,
        "shadow-lg",
        className
      )}
    >
      {/* Decorative screws */}
      <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-zinc-500 shadow-inner" />
      <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-zinc-500 shadow-inner" />
      <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-zinc-500 shadow-inner" />
      <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-zinc-500 shadow-inner" />

      {/* Header */}
      <div className="relative">
        <div className={cn(
          "py-3 px-4 text-center font-black text-xl uppercase tracking-wide",
          styles.header
        )}>
          {title}
        </div>
        <div className={cn(
          "py-2 px-4 text-center text-sm font-medium text-zinc-300",
          styles.accentBorder,
          "border-t border-b"
        )}>
          {subtitle}
        </div>
      </div>

      {/* Badge */}
      {badge && (
        <div className="flex justify-center -mt-1 mb-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className={cn(
              "px-4 py-1.5 rounded-lg font-bold text-sm uppercase tracking-wider",
              styles.header,
              "shadow-lg"
            )}
          >
            {badge}
          </motion.div>
        </div>
      )}

      {/* Items Grid */}
      <div className="p-4 grid grid-cols-2 gap-3">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-200",
              styles.itemBg,
              "border border-white/5"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              styles.iconBg
            )}>
              <item.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-center text-white uppercase tracking-wide">
              {item.label}
            </span>
            {item.description && (
              <span className="text-[10px] text-zinc-400 text-center leading-tight">
                {item.description}
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      {footer && (
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.4 }}
          className={cn(
            "py-2 px-4 text-center font-black text-white uppercase tracking-widest text-sm",
            styles.footerBg
          )}
        >
          {footer}
        </motion.div>
      )}
    </motion.div>
  );
}
