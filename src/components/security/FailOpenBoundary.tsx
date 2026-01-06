import { ReactNode } from 'react';

export function FailOpenBoundary({ children, name }: { children: ReactNode; name?: string }) {
  // BYPASS TOTAL - P0 EMERGENCY
  return <>{children}</>;
}

export default FailOpenBoundary;
