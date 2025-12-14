export type EmployeeStatus = "ativo" | "ferias" | "afastado" | "inativo";

export type Sector = 
  | "Coordenação" 
  | "Suporte" 
  | "Monitoria" 
  | "Afiliados" 
  | "Marketing" 
  | "Administrativo";

export interface Employee {
  id: number;
  nome: string;
  funcao: string;
  setor: Sector;
  email: string;
  salario: number; // em centavos
  dataAdmissao: string;
  status: EmployeeStatus;
}

export interface EmployeeFormData {
  nome: string;
  funcao: string;
  setor: Sector;
  email: string;
  salario: string;
  dataAdmissao: Date | undefined;
  status: EmployeeStatus;
}

export const SECTORS: Sector[] = [
  "Coordenação",
  "Suporte",
  "Monitoria",
  "Afiliados",
  "Marketing",
  "Administrativo",
];

export const STATUS_OPTIONS: { value: EmployeeStatus; label: string }[] = [
  { value: "ativo", label: "Ativo" },
  { value: "ferias", label: "Férias" },
  { value: "afastado", label: "Afastado" },
  { value: "inativo", label: "Inativo" },
];
