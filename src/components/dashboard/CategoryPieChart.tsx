import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { motion } from "framer-motion";

interface CategoryPieChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
  title: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value / 100);
}

export function CategoryPieChart({ data, title }: CategoryPieChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card rounded-2xl p-6"
    >
      <h3 className="text-lg font-semibold text-foreground mb-6">{title}</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(240, 6%, 8%)",
                border: "1px solid hsl(240, 6%, 15%)",
                borderRadius: "12px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
              }}
              labelStyle={{ color: "hsl(0, 0%, 98%)" }}
              formatter={(value: number) => formatCurrency(value)}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground">{entry.name}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
