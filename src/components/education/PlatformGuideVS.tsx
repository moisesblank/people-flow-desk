import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { PlatformGuideCard } from "./PlatformGuideCard";

interface CardConfig {
  title: string;
  subtitle: string;
  variant: "law" | "idea" | "security" | "ai" | "student";
  badge?: string;
  items: { icon: LucideIcon; label: string; description?: string }[];
  footer?: string;
}

interface PlatformGuideVSProps {
  leftCard: CardConfig;
  rightCard: CardConfig;
  vsLabel?: string;
}

export function PlatformGuideVS({
  leftCard,
  rightCard,
  vsLabel = "VS",
}: PlatformGuideVSProps) {
  return (
    <div className="relative flex flex-col lg:flex-row items-stretch justify-center gap-4 lg:gap-8 py-6">
      {/* Left Card */}
      <div className="flex-1 max-w-md">
        <PlatformGuideCard {...leftCard} />
      </div>

      {/* VS Divider */}
      <div className="flex items-center justify-center lg:flex-col">
        {/* Mobile: horizontal divider */}
        <div className="lg:hidden flex items-center gap-4 w-full">
          <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-zinc-600 to-zinc-600" />
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", delay: 0.5 }}
            className="relative"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-b from-amber-600 to-amber-800 border-4 border-zinc-700 flex items-center justify-center shadow-2xl">
              <span className="font-black text-white text-lg">{vsLabel}</span>
            </div>
            {/* Lock decoration */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-4 bg-amber-700 rounded-b-lg border-2 border-zinc-600" />
          </motion.div>
          <div className="flex-1 h-0.5 bg-gradient-to-l from-transparent via-zinc-600 to-zinc-600" />
        </div>

        {/* Desktop: vertical divider */}
        <div className="hidden lg:flex flex-col items-center gap-4 h-full">
          <div className="flex-1 w-0.5 bg-gradient-to-b from-transparent via-zinc-600 to-zinc-600" />
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", delay: 0.5 }}
            className="relative"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-b from-amber-600 to-amber-800 border-4 border-zinc-700 flex items-center justify-center shadow-2xl">
              <span className="font-black text-white text-xl">{vsLabel}</span>
            </div>
            {/* Lock decoration */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-5 bg-amber-700 rounded-b-lg border-2 border-zinc-600" />
          </motion.div>
          <div className="flex-1 w-0.5 bg-gradient-to-t from-transparent via-zinc-600 to-zinc-600" />
        </div>
      </div>

      {/* Right Card */}
      <div className="flex-1 max-w-md">
        <PlatformGuideCard {...rightCard} />
      </div>
    </div>
  );
}
