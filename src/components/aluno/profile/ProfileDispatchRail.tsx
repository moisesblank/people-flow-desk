// ============================================
// 📦 PROFILE DISPATCH RAIL — LAZY v2300
// Envios & Endereço com lazy loading
// ============================================

import { memo, Suspense, lazy } from 'react';
import { useConstitutionPerformance } from '@/hooks/useConstitutionPerformance';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, MapPin } from 'lucide-react';

// Lazy load dos componentes pesados
const StudentDispatchSection = lazy(() => 
  import('@/components/aluno/StudentDispatchSection').then(m => ({ default: m.StudentDispatchSection }))
);

const StudentAddressSection = lazy(() => 
  import('@/components/aluno/StudentAddressSection').then(m => ({ default: m.StudentAddressSection }))
);

// Skeleton para loading
const SectionSkeleton = memo(function SectionSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
});

export const ProfileDispatchRail = memo(function ProfileDispatchRail() {
  const { shouldAnimate } = useConstitutionPerformance();

  return (
    <div className="profile-rail-2300">
      <div className="profile-rail-header-2300">
        <div className="profile-rail-title-2300">
          <div className="profile-rail-icon-2300">
            <Package className="w-5 h-5 text-white" />
          </div>
          Envios & Endereço
        </div>
      </div>

      <div className="profile-two-col-grid-2300">
        <Suspense fallback={<SectionSkeleton />}>
          <StudentDispatchSection />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          <StudentAddressSection />
        </Suspense>
      </div>
    </div>
  );
});
