// ============================================
// PÁGINA DE DOCUMENTOS GERAIS
// ============================================

import { Helmet } from "react-helmet";
import { GeneralDocumentsManager } from "@/components/documents/GeneralDocumentsManager";

export default function Documentos() {
  return (
    <>
      <Helmet>
        <title>Documentos | Sistema de Gestão</title>
        <meta name="description" content="Gerencie documentos, planilhas e arquivos do sistema" />
      </Helmet>
      
      <div className="container py-6 space-y-6">
        <GeneralDocumentsManager />
      </div>
    </>
  );
}
