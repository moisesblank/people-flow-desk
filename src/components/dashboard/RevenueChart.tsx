import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

interface RevenueChartProps {
  data: {
    month: string;
    receitas: number;
    despesas: number;
  }[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value / 100);
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card rounded-2xl p-6"
    >
      <h3 className="text-lg font-semibold text-foreground mb-6">Evolução Mensal</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(152, 76%, 47%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(152, 76%, 47%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(348, 70%, 35%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(348, 70%, 35%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 6%, 15%)" />
            <XAxis 
              dataKey="month" 
              stroke="#ffffff" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#ffffff", fontWeight: "bold" }}
            />
            <YAxis 
              stroke="#ffffff" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCurrency(value)}
              tick={{ fill: "#ffffff", fontWeight: "bold" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(240, 6%, 8%)",
                border: "1px solid hsl(240, 6%, 15%)",
                borderRadius: "12px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
              }}
              itemStyle={{ color: "#ffffff", fontWeight: "bold" }}
              labelStyle={{ color: "#ffffff", fontWeight: "bold" }}
              formatter={(value: number) => [formatCurrency(value), ""]}
            />
            <Area
              type="monotone"
              dataKey="receitas"
              stroke="hsl(152, 76%, 47%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorReceitas)"
              name="Receitas"
            />
            <Area
              type="monotone"
              dataKey="despesas"
              stroke="hsl(348, 70%, 35%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorDespesas)"
              name="Despesas"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[hsl(152,76%,47%)]" />
          <span className="text-sm text-muted-foreground">Receitas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[hsl(348,70%,35%)]" />
          <span className="text-sm text-muted-foreground">Despesas</span>
        </div>
      </div>
    </motion.div>
  );
}
