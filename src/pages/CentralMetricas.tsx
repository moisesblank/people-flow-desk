// ============================================
// MOISÉS MEDEIROS v10.0 - Central de Métricas
// Página principal de métricas integradas
// ============================================

import { Helmet } from "react-helmet";
import { IntegratedMetricsDashboard } from "@/components/dashboard/IntegratedMetricsDashboard";

export default function CentralMetricas() {
  return (
    <>
      <Helmet>
        <title>Central de Métricas | Curso de Química - Moisés Medeiros</title>
        <meta 
          name="description" 
          content="Monitoramento integrado em tempo real de todas as plataformas: YouTube, Instagram, TikTok, Facebook Ads e Hotmart." 
        />
      </Helmet>
      
      <IntegratedMetricsDashboard />
    </>
  );
}
