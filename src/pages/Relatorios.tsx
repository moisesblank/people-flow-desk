import { motion } from "framer-motion";
import { FileText, Sparkles, Download, BarChart3, PieChart, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Relatorios() {
  const reports = [
    { title: "Relatório Financeiro", description: "Resumo de entradas e saídas", icon: BarChart3 },
    { title: "Relatório de Funcionários", description: "Lista completa da equipe", icon: PieChart },
    { title: "Relatório de Vendas", description: "Vendas e comissões de afiliados", icon: TrendingUp },
  ];

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="space-y-2">
            <motion.div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium tracking-wide uppercase">Exportação</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              Relatórios
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Exporte relatórios e análises do seu negócio.
            </p>
          </div>
        </motion.header>

        {/* Reports Grid */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report, index) => (
            <motion.div
              key={report.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-2xl p-6 hover:border-primary/50 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <report.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{report.title}</h3>
              <p className="text-sm text-muted-foreground mb-6">{report.description}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2 flex-1">
                  <Download className="h-4 w-4" /> PDF
                </Button>
                <Button variant="outline" size="sm" className="gap-2 flex-1">
                  <FileText className="h-4 w-4" /> Excel
                </Button>
              </div>
            </motion.div>
          ))}
        </section>

        {/* Coming Soon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-10 glass-card rounded-3xl p-8 text-center"
        >
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Mais relatórios em breve
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Estamos trabalhando em novos relatórios personalizados com gráficos interativos e exportação automática.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
