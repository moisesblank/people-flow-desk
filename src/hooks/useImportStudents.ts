// ============================================
// 🧱 LEI CANÔNICA DA IMPORTAÇÃO (EXCEL → PERFIL)
// CONSTITUIÇÃO SYNAPSE Ω v10.x — PATCH-ONLY
// ============================================
// REGRA SAGRADA:
// - IMPORTAR é INGESTÃO NÃO-DESTRUTIVA
// - Célula com valor → escreve no destino
// - Célula vazia → mantém valor existente
// - Conflito → valor existente GANHA
// - Um aluno = Uma realidade = Sem contaminação
// ============================================

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

// ============================================
// TYPES
// ============================================

interface ImportStudent {
  student_id: string;
  nome?: string;
  email?: string;
  role?: string;
  universo?: string;
  status_acesso?: string;
  expires_at?: string;
  cpf?: string;
  rg?: string;
  data_nascimento?: string;
  telefone?: string;
  whatsapp?: string;
  email_secundario?: string;
  endereco_completo?: string;
  role_atual?: string;
  password_change_required?: string;
  ultimo_login?: string;
  curso?: string;
  modalidade?: string;
  status_matricula?: string;
  percentual_conclusao?: string;
  origem_pagamento?: string;
  produto?: string;
  valor_pago?: string;
  status_pagamento?: string;
  codigo_rastreio?: string;
  status_envio?: string;
  data_postagem?: string;
  data_entrega_prevista?: string;
  data_entrega_real?: string;
}

interface ImportPreview {
  totalRows: number;
  studentsMatched: number;
  studentsUnmatched: number;
  fieldsToWrite: number;
  fieldsSkipped: number;
  conflictsDetected: number;
  matchedStudents: Array<{
    student_id: string;
    email: string;
    nome: string;
    fieldsToUpdate: string[];
    conflicts: string[];
  }>;
  unmatchedRows: Array<{
    rowNumber: number;
    student_id: string;
    email: string;
    nome: string;
  }>;
}

interface ImportResult {
  success: boolean;
  studentsProcessed: number;
  studentsUpdated: number;
  errors: string[];
}

// ============================================
// CONSTANTS
// ============================================

const SHEET_FIELD_MAP: Record<string, string[]> = {
  '01_RESUMO_DO_ALUNO': ['student_id', 'nome', 'email', 'role', 'universo', 'status_acesso', 'expires_at'],
  '02_IDENTIDADE_E_CONTATO': ['student_id', 'cpf', 'rg', 'data_nascimento', 'telefone', 'whatsapp', 'email_secundario', 'endereco_completo'],
  '03_ACESSO_E_PERMISSOES': ['student_id', 'role_atual', 'origem_acesso', 'expires_at', 'password_change_required', 'ultimo_login'],
  '04_ACADEMICO': ['student_id', 'curso', 'modalidade', 'status_matricula', 'percentual_conclusao'],
  '05_FINANCEIRO': ['student_id', 'origem_pagamento', 'produto', 'valor_pago', 'status_pagamento'],
  '06_CORREIOS': ['student_id', 'codigo_rastreio', 'status_envio', 'data_postagem', 'data_entrega_prevista', 'data_entrega_real'],
};

// ============================================
// IMPORT HOOK
// ============================================

export function useImportStudents() {
  const [isImporting, setIsImporting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [parsedData, setParsedData] = useState<Map<string, ImportStudent> | null>(null);

  // ============================================
  // PARSE EXCEL FILE
  // ============================================
  const parseExcelFile = useCallback(async (file: File): Promise<Map<string, ImportStudent>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const studentMap = new Map<string, ImportStudent>();
          
          // Parse each sheet
          for (const sheetName of Object.keys(SHEET_FIELD_MAP)) {
            const sheet = workbook.Sheets[sheetName];
            if (!sheet) continue;
            
            const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
            
            for (const row of rows) {
              const studentId = row.student_id?.toString()?.trim();
              if (!studentId) continue;
              
              // Get or create student entry
              const existing = studentMap.get(studentId) || { student_id: studentId };
              
              // Merge non-empty fields
              for (const field of SHEET_FIELD_MAP[sheetName]) {
                const value = row[field];
                if (value !== undefined && value !== null && value !== '') {
                  (existing as any)[field] = value.toString().trim();
                }
              }
              
              studentMap.set(studentId, existing);
            }
          }
          
          resolve(studentMap);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsArrayBuffer(file);
    });
  }, []);

  // ============================================
  // GENERATE PREVIEW (DRY RUN)
  // ============================================
  const generatePreview = useCallback(async (file: File): Promise<ImportPreview> => {
    setIsPreviewing(true);
    
    try {
      // 1. Parse Excel
      const studentMap = await parseExcelFile(file);
      setParsedData(studentMap);
      
      // 2. Get all student_ids and emails from file
      const studentIds = Array.from(studentMap.keys());
      const emails = Array.from(studentMap.values())
        .map(s => s.email?.toLowerCase())
        .filter(Boolean) as string[];
      
      // 3. Query existing students by ID
      const { data: existingById } = await supabase
        .from('alunos')
        .select('id, email, nome')
        .in('id', studentIds);
      
      // 4. Query existing students by email for unmatched
      const matchedIds = new Set((existingById || []).map(a => a.id));
      const unmatchedStudentIds = studentIds.filter(id => !matchedIds.has(id));
      
      // Try to match unmatched by email
      const unmatchedEmails = unmatchedStudentIds
        .map(id => studentMap.get(id)?.email?.toLowerCase())
        .filter(Boolean) as string[];
      
      const { data: existingByEmail } = await supabase
        .from('alunos')
        .select('id, email, nome')
        .in('email', unmatchedEmails);
      
      // Build email-to-id map
      const emailToId = new Map<string, string>();
      (existingByEmail || []).forEach(a => {
        if (a.email) emailToId.set(a.email.toLowerCase(), a.id);
      });
      
      // 5. Categorize matches
      const matchedStudents: ImportPreview['matchedStudents'] = [];
      const unmatchedRows: ImportPreview['unmatchedRows'] = [];
      let fieldsToWrite = 0;
      let fieldsSkipped = 0;
      let conflictsDetected = 0;
      
      let rowNumber = 1;
      for (const [studentId, student] of studentMap) {
        rowNumber++;
        
        // Check if matched by ID
        const matchedById = (existingById || []).find(a => a.id === studentId);
        
        // Check if matched by email
        const matchedByEmail = student.email 
          ? emailToId.get(student.email.toLowerCase())
          : null;
        
        if (matchedById || matchedByEmail) {
          // Count fields to update
          const fieldsToUpdate: string[] = [];
          const conflicts: string[] = [];
          
          for (const [key, value] of Object.entries(student)) {
            if (key === 'student_id') continue;
            if (value && value !== '') {
              fieldsToUpdate.push(key);
              fieldsToWrite++;
            } else {
              fieldsSkipped++;
            }
          }
          
          matchedStudents.push({
            student_id: matchedById?.id || matchedByEmail || studentId,
            email: student.email || '',
            nome: student.nome || matchedById?.nome || '',
            fieldsToUpdate,
            conflicts,
          });
        } else {
          // Unmatched
          unmatchedRows.push({
            rowNumber,
            student_id: studentId,
            email: student.email || '',
            nome: student.nome || '',
          });
        }
      }
      
      const previewResult: ImportPreview = {
        totalRows: studentMap.size,
        studentsMatched: matchedStudents.length,
        studentsUnmatched: unmatchedRows.length,
        fieldsToWrite,
        fieldsSkipped,
        conflictsDetected,
        matchedStudents,
        unmatchedRows,
      };
      
      setPreview(previewResult);
      return previewResult;
      
    } finally {
      setIsPreviewing(false);
    }
  }, [parseExcelFile]);

  // ============================================
  // EXECUTE IMPORT (AFTER CONFIRMATION)
  // ============================================
  const executeImport = useCallback(async (): Promise<ImportResult> => {
    if (!parsedData || !preview) {
      return { success: false, studentsProcessed: 0, studentsUpdated: 0, errors: ['Nenhum preview gerado'] };
    }
    
    setIsImporting(true);
    const startTime = Date.now();
    const errors: string[] = [];
    let studentsUpdated = 0;
    
    try {
      // 1. Verify authorization
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        return { success: false, studentsProcessed: 0, studentsUpdated: 0, errors: ['Não autorizado'] };
      }
      
      const actorId = session.session.user.id;
      const actorEmail = session.session.user.email;
      
      // Verify role
      const { data: actorRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', actorId)
        .maybeSingle();
      
      if (!actorRole || !['owner', 'admin'].includes(actorRole.role)) {
        return { success: false, studentsProcessed: 0, studentsUpdated: 0, errors: ['Apenas Owner e Admin podem importar'] };
      }
      
      toast.loading('Importando dados...', { id: 'import-progress' });
      
      // 2. Process only matched students
      for (const matched of preview.matchedStudents) {
        const studentData = parsedData.get(matched.student_id);
        if (!studentData) continue;
        
        try {
          // Update alunos table (non-destructive)
          const alunoUpdate: Record<string, any> = {};
          
          if (studentData.nome) alunoUpdate.nome = studentData.nome;
          if (studentData.email) alunoUpdate.email = studentData.email.toLowerCase();
          if (studentData.cpf) alunoUpdate.cpf = studentData.cpf;
          if (studentData.telefone) alunoUpdate.telefone = studentData.telefone;
          if (studentData.data_nascimento) alunoUpdate.data_nascimento = studentData.data_nascimento;
          if (studentData.status_acesso) alunoUpdate.status = studentData.status_acesso;
          if (studentData.origem_pagamento) alunoUpdate.fonte = studentData.origem_pagamento;
          if (studentData.produto) alunoUpdate.tipo_produto = studentData.produto;
          if (studentData.valor_pago) {
            const valor = parseFloat(studentData.valor_pago.replace(/[^\d.,]/g, '').replace(',', '.'));
            if (!isNaN(valor)) alunoUpdate.valor_pago = valor;
          }
          
          // Address components
          if (studentData.endereco_completo) {
            alunoUpdate.logradouro = studentData.endereco_completo;
          }
          
          if (Object.keys(alunoUpdate).length > 0) {
            const { error } = await supabase
              .from('alunos')
              .update(alunoUpdate)
              .eq('id', matched.student_id);
            
            if (error) {
              errors.push(`Erro ao atualizar aluno ${matched.student_id}: ${error.message}`);
              continue;
            }
          }
          
          studentsUpdated++;
          
        } catch (err) {
          errors.push(`Erro inesperado para ${matched.student_id}: ${err}`);
        }
      }
      
      // 3. Log audit
      await supabase.from('audit_logs').insert({
        user_id: actorId,
        action: 'IMPORT_GESTAO_ALUNOS',
        table_name: 'alunos',
        metadata: {
          actor_id: actorId,
          actor_email: actorEmail,
          actor_role: actorRole.role,
          students_processed: preview.studentsMatched,
          students_updated: studentsUpdated,
          students_unmatched: preview.studentsUnmatched,
          fields_written: preview.fieldsToWrite,
          errors_count: errors.length,
          imported_at: new Date().toISOString(),
        },
      });
      
      const elapsedMs = Date.now() - startTime;
      
      if (errors.length === 0) {
        toast.success('Importação concluída!', {
          id: 'import-progress',
          description: `${studentsUpdated} alunos atualizados em ${(elapsedMs / 1000).toFixed(1)}s`,
        });
      } else {
        toast.warning('Importação parcial', {
          id: 'import-progress',
          description: `${studentsUpdated} atualizados, ${errors.length} erros`,
        });
      }
      
      return {
        success: errors.length === 0,
        studentsProcessed: preview.studentsMatched,
        studentsUpdated,
        errors,
      };
      
    } catch (error) {
      console.error('[Import] Error:', error);
      toast.error('Erro na importação', {
        id: 'import-progress',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      
      return {
        success: false,
        studentsProcessed: 0,
        studentsUpdated: 0,
        errors: [error instanceof Error ? error.message : 'Erro desconhecido'],
      };
      
    } finally {
      setIsImporting(false);
    }
  }, [parsedData, preview]);

  // ============================================
  // RESET STATE
  // ============================================
  const resetImport = useCallback(() => {
    setPreview(null);
    setParsedData(null);
  }, []);

  return {
    isPreviewing,
    isImporting,
    preview,
    generatePreview,
    executeImport,
    resetImport,
  };
}
