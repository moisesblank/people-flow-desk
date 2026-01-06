import { ReactNode } from 'react';

export function SessionGuard({ children }: { children: ReactNode }) {
  // BYPASS TOTAL - P0 EMERGENCY
  return <>{children}</>;
}

export default SessionGuard;
