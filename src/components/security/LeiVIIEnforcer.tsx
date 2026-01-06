import { ReactNode, memo } from 'react';

export const LeiVIIEnforcer = memo(({ children }: { children: ReactNode }) => {
  // BYPASS TOTAL - P0 EMERGENCY
  return <>{children}</>;
});

LeiVIIEnforcer.displayName = 'LeiVIIEnforcer';
export default LeiVIIEnforcer;
