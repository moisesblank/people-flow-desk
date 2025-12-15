// ============================================
// CURSO MOISÉS MEDEIROS v5.0 - SISTEMA DE BACKUP
// Backup Automatizado de Dados
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BackupResult {
  table: string;
  records: number;
  data: any[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    // Define tables to backup
    const tablesToBackup = tables === 'all' 
      ? [
          'profiles',
          'employees',
          'students',
          'affiliates',
          'sales',
          'income',
          'taxes',
          'company_fixed_expenses',
          'company_extra_expenses',
          'personal_fixed_expenses',
          'personal_extra_expenses',
          'payments',
          'calendar_tasks',
          'synapse_transactions',
          'synapse_integrations',
          'contabilidade',
          'metricas_marketing',
          'website_pendencias',
        ]
      : Array.isArray(tables) ? tables : [tables];

    const backupResults: BackupResult[] = [];
    const backupDate = new Date().toISOString();

    // Backup each table
    for (const table of tablesToBackup) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .order('created_at', { ascending: false });

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

    // Calculate totals
    const totalRecords = backupResults.reduce((sum, r) => sum + r.records, 0);

    // Log the backup action
    await supabase.from('audit_logs').insert({
      action: 'data_backup',
      user_id: user.id,
      metadata: {
        tables: tablesToBackup,
        total_records: totalRecords,
        backup_date: backupDate,
        format,
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
      tables: backupResults,
      metadata: {
        generated_by: 'Curso Moisés Medeiros - Backup v5.0',
        user_id: user.id,
        user_email: user.email,
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
