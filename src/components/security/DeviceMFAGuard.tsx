import { ReactNode } from 'react';

export function DeviceMFAGuard({ children }: { children: ReactNode }) {
  // BYPASS TOTAL - P0 EMERGENCY
  return <>{children}</>;
}

export default DeviceMFAGuard;
