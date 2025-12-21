// ============================================
// 🛡️ DOGMA XI: Página de Gestão de Dispositivos
// Owner Only - Monitoramento em tempo real
// ============================================

import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Navigate } from "react-router-dom";
import { DeviceManagementPanel } from "@/components/admin/DeviceManagementPanel";
import { Helmet } from "react-helmet";

export default function GestaoDispositivos() {
  const { isOwner, isLoading } = useAdminCheck();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isOwner) {
    return <Navigate to="/app" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Gestão de Dispositivos | Matriz Digital</title>
      </Helmet>
      <DeviceManagementPanel />
    </>
  );
}
