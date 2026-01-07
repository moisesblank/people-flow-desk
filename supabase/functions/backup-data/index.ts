// ============================================
// SYNAPSE v14.0 - SISTEMA DE BACKUP COMPLETO
// Backup Automatizado de Dados
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

interface BackupResult {
  table: string;
  records: number;
  data: any[];
}

serve(async (req) => {
  // LEI VI: CORS dinâmico via allowlist centralizado
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin/owner access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid authentication');
    }

    // Check if user is admin or owner
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || !['owner', 'admin'].includes(roleData.role)) {
      throw new Error('Insufficient permissions');
    }

    const body = await req.json().catch(() => ({}));
    const { tables = 'all', format = 'json' } = body;

    // Define tables to backup - SYNAPSE v14.0 COMPLETE LIST
    const tablesToBackup = tables === 'all' 
      ? [
          // Core Data
          'profiles',
          'user_roles',
          'employees',
          'employee_compensation',
          'employee_documents',
          // Students & LMS
          'students',
          'courses',
          'modules',
          'lessons',
          'enrollments',
          'lesson_progress',
          'lesson_notes',
          'certificates',
          // Gamification
          'badges',
          'achievements',
          'user_gamification',
          'user_badges',
          'xp_history',
          // Quizzes
          'quizzes',
          'quiz_questions',
          'quiz_attempts',
          'quiz_answers',
          // Finance
          'affiliates',
          'sales',
          'income',
          'company_fixed_expenses',
          'company_extra_expenses',
          'personal_fixed_expenses',
          'personal_extra_expenses',
          'payments',
          'payment_transactions',
          'financial_goals',
          'contabilidade',
          'metricas_marketing',
          // Operations
          'calendar_tasks',
          'time_clock_entries',
          'notifications',
          // Integration
          'integration_events',
          'branding_settings',
          // Content
          'editable_content',
          'content_history',
          // Security
          'user_sessions',
          'user_mfa_settings',
          'activity_log',
          'audit_logs',
          'permission_audit_logs',
        ]
      : Array.isArray(tables) ? tables : [tables];

    const backupResults: BackupResult[] = [];
    const backupDate = new Date().toISOString();
    const startTime = Date.now();

    // Backup each table
    for (const table of tablesToBackup) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10000);

        if (error) {
          console.error(`Error backing up ${table}:`, error);
          continue;
        }

        backupResults.push({
          table,
          records: data?.length || 0,
          data: data || [],
        });
      } catch (err) {
        console.error(`Error processing ${table}:`, err);
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Calculate totals
    const totalRecords = backupResults.reduce((sum, r) => sum + r.records, 0);

    // Log the backup action
    await supabase.from('audit_logs').insert({
      action: 'data_backup',
      user_id: user.id,
      metadata: {
        tables_count: tablesToBackup.length,
        tables_backed_up: backupResults.length,
        total_records: totalRecords,
        backup_date: backupDate,
        duration_ms: duration,
        format,
        version: 'SYNAPSE v14.0',
      },
    });

    // Format response based on requested format
    if (format === 'csv') {
      // Generate CSV for each table
      const csvData: Record<string, string> = {};
      
      for (const result of backupResults) {
        if (result.data.length > 0) {
          const headers = Object.keys(result.data[0]).join(',');
          const rows = result.data.map(row => 
            Object.values(row).map(v => 
              typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v
            ).join(',')
          );
          csvData[result.table] = [headers, ...rows].join('\n');
        }
      }

      return new Response(JSON.stringify({
        success: true,
        backup_date: backupDate,
        format: 'csv',
        total_tables: backupResults.length,
        total_records: totalRecords,
        duration_ms: duration,
        csv_data: csvData,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Default JSON format
    return new Response(JSON.stringify({
      success: true,
      backup_date: backupDate,
      format: 'json',
      total_tables: backupResults.length,
      total_records: totalRecords,
      duration_ms: duration,
      tables: backupResults,
      metadata: {
        generated_by: 'SYNAPSE v14.0 - Sistema de Backup Completo',
        user_id: user.id,
        user_email: user.email,
        version: '14.0',
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Backup error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
