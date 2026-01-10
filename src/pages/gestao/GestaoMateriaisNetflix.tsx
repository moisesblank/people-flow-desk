// ============================================
// 📚 GESTÃO MATERIAIS — MINIMALISTA
// FLUXO: Gestão = Funcional | Alunos = Estético
// Usa GestaoMateriais original (tabela + upload)
// ============================================

import { memo, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet';
import { Loader2 } from 'lucide-react';

// Lazy load do componente original de gestão
const GestaoMateriais = lazy(() => import('./GestaoMateriais'));

const GestaoMateriaisMinimalista = memo(function GestaoMateriaisMinimalista() {
  return (
    <>
      <Helmet>
        <title>Gestão de Materiais | Gestão</title>
      </Helmet>

      <Suspense fallback={
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Carregando materiais...</p>
          </div>
        </div>
      }>
        <GestaoMateriais />
      </Suspense>
    </>
  );
});

export default GestaoMateriaisMinimalista;
