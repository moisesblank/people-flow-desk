import { PlatformEducationHub } from "@/components/education/PlatformEducationHub";
import { Helmet } from "react-helmet";

export default function GuiaDaPlataforma() {
  return (
    <>
      <Helmet>
        <title>Guia da Plataforma | PRO Moisés Medeiros</title>
        <meta name="description" content="Aprenda a usar todas as funcionalidades da plataforma PRO. Segurança, Portal do Aluno, Gestão, IA e Integrações." />
      </Helmet>
      <PlatformEducationHub />
    </>
  );
}
