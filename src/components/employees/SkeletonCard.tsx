import { motion } from "framer-motion";

export function SkeletonCard({ index = 0 }: { index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.1 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-start gap-4">
        {/* Avatar skeleton */}
        <div className="h-14 w-14 rounded-2xl shimmer shrink-0" />

        <div className="flex-1 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-5 w-36 rounded-lg shimmer" />
              <div className="h-4 w-24 rounded-lg shimmer" />
            </div>
            <div className="h-6 w-16 rounded-full shimmer" />
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="h-4 w-20 rounded shimmer" />
            <div className="h-4 w-24 rounded shimmer" />
            <div className="h-4 w-32 rounded shimmer col-span-2" />
          </div>

          {/* Salary */}
          <div className="pt-3 border-t border-border/30 flex justify-between items-center">
            <div className="h-3 w-12 rounded shimmer" />
            <div className="h-6 w-24 rounded-lg shimmer" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function StatsSkeletonCard() {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="h-4 w-24 rounded shimmer" />
          <div className="h-9 w-20 rounded-lg shimmer" />
        </div>
        <div className="h-14 w-14 rounded-2xl shimmer" />
      </div>
    </div>
  );
}
