import { ReactNode } from 'react';

export function DeviceGuard({ children }: { children: ReactNode }) {
  // BYPASS TOTAL - P0 EMERGENCY
  return <>{children}</>;
}

export default DeviceGuard;
