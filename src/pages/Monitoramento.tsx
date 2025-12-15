// ============================================
// SYNAPSE v14.0 - PÁGINA DE MONITORAMENTO
// Visualização de usuários e sessões - OWNER ONLY
// ============================================

import { useAdminCheck } from '@/hooks/useAdminCheck';
import { UserActivityDashboard } from '@/components/admin/UserActivityDashboard';
import { Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';

export default function Monitoramento() {
  const { isOwner, isLoading } = useAdminCheck();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isOwner) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Monitoramento | Moisés Medeiros</title>
      </Helmet>
      <div className="p-6">
        <UserActivityDashboard />
      </div>
    </>
  );
}
