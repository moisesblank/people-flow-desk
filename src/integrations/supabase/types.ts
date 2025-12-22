export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          requirement_type: string
          requirement_value: number | null
          xp_reward: number | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          requirement_type: string
          requirement_value?: number | null
          xp_reward?: number | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number | null
          xp_reward?: number | null
        }
        Relationships: []
      }
      active_sessions: {
        Row: {
          city: string | null
          country_code: string | null
          created_at: string
          device_hash: string
          device_name: string | null
          device_type: string | null
          expires_at: string
          id: string
          ip_address: unknown
          is_current: boolean | null
          last_activity_at: string
          mfa_verified: boolean | null
          revoked_at: string | null
          revoked_reason: string | null
          risk_score: number | null
          session_token: string
          status: Database["public"]["Enums"]["session_status"]
          user_agent: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          country_code?: string | null
          created_at?: string
          device_hash: string
          device_name?: string | null
          device_type?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          is_current?: boolean | null
          last_activity_at?: string
          mfa_verified?: boolean | null
          revoked_at?: string | null
          revoked_reason?: string | null
          risk_score?: number | null
          session_token?: string
          status?: Database["public"]["Enums"]["session_status"]
          user_agent?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          country_code?: string | null
          created_at?: string
          device_hash?: string
          device_name?: string | null
          device_type?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          is_current?: boolean | null
          last_activity_at?: string
          mfa_verified?: boolean | null
          revoked_at?: string | null
          revoked_reason?: string | null
          risk_score?: number | null
          session_token?: string
          status?: Database["public"]["Enums"]["session_status"]
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action_payload: Json | null
          action_type: string
          actor_name: string | null
          actor_phone: string
          created_at: string | null
          id: string
          ip_address: string | null
          result_message: string | null
          result_status: string | null
        }
        Insert: {
          action_payload?: Json | null
          action_type: string
          actor_name?: string | null
          actor_phone: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          result_message?: string | null
          result_status?: string | null
        }
        Update: {
          action_payload?: Json | null
          action_type?: string
          actor_name?: string | null
          actor_phone?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          result_message?: string | null
          result_status?: string | null
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          agencia: string | null
          banco: string | null
          comissao_total: number | null
          conta: string | null
          created_at: string | null
          cupom: string | null
          email: string | null
          hotmart_id: string | null
          id: number
          link_afiliado: string | null
          nome: string
          parceiro_aluno: boolean | null
          percentual_comissao: number | null
          pix: string | null
          status: string | null
          taxa_comissao: number | null
          telefone: string | null
          total_comissao: number | null
          total_vendas: number | null
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          agencia?: string | null
          banco?: string | null
          comissao_total?: number | null
          conta?: string | null
          created_at?: string | null
          cupom?: string | null
          email?: string | null
          hotmart_id?: string | null
          id?: number
          link_afiliado?: string | null
          nome: string
          parceiro_aluno?: boolean | null
          percentual_comissao?: number | null
          pix?: string | null
          status?: string | null
          taxa_comissao?: number | null
          telefone?: string | null
          total_comissao?: number | null
          total_vendas?: number | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          agencia?: string | null
          banco?: string | null
          comissao_total?: number | null
          conta?: string | null
          created_at?: string | null
          cupom?: string | null
          email?: string | null
          hotmart_id?: string | null
          id?: number
          link_afiliado?: string | null
          nome?: string
          parceiro_aluno?: boolean | null
          percentual_comissao?: number | null
          pix?: string | null
          status?: string | null
          taxa_comissao?: number | null
          telefone?: string | null
          total_comissao?: number | null
          total_vendas?: number | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      ai_generated_content: {
        Row: {
          content: Json
          content_type: Database["public"]["Enums"]["ai_content_type"]
          created_at: string
          id: string
          lesson_id: string
          model_used: string | null
          tokens_used: number | null
        }
        Insert: {
          content: Json
          content_type: Database["public"]["Enums"]["ai_content_type"]
          created_at?: string
          id?: string
          lesson_id: string
          model_used?: string | null
          tokens_used?: number | null
        }
        Update: {
          content?: Json
          content_type?: Database["public"]["Enums"]["ai_content_type"]
          created_at?: string
          id?: string
          lesson_id?: string
          model_used?: string | null
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_generated_content_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      alertas_sistema: {
        Row: {
          acao_sugerida: string | null
          created_at: string | null
          dados: Json | null
          data_leitura: string | null
          data_resolucao: string | null
          destinatarios: Json
          id: string
          link: string | null
          mensagem: string
          origem: string
          resolvido_por: string | null
          status: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          acao_sugerida?: string | null
          created_at?: string | null
          dados?: Json | null
          data_leitura?: string | null
          data_resolucao?: string | null
          destinatarios?: Json
          id?: string
          link?: string | null
          mensagem: string
          origem: string
          resolvido_por?: string | null
          status?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          acao_sugerida?: string | null
          created_at?: string | null
          dados?: Json | null
          data_leitura?: string | null
          data_resolucao?: string | null
          destinatarios?: Json
          id?: string
          link?: string | null
          mensagem?: string
          origem?: string
          resolvido_por?: string | null
          status?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      alunos: {
        Row: {
          cidade: string | null
          cpf: string | null
          created_at: string | null
          curso_id: string | null
          data_matricula: string | null
          data_nascimento: string | null
          email: string
          estado: string | null
          fonte: string | null
          foto_url: string | null
          hotmart_transaction_id: string | null
          id: string
          nome: string
          observacoes: string | null
          status: string | null
          telefone: string | null
          updated_at: string | null
          valor_pago: number | null
        }
        Insert: {
          cidade?: string | null
          cpf?: string | null
          created_at?: string | null
          curso_id?: string | null
          data_matricula?: string | null
          data_nascimento?: string | null
          email: string
          estado?: string | null
          fonte?: string | null
          foto_url?: string | null
          hotmart_transaction_id?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
          valor_pago?: number | null
        }
        Update: {
          cidade?: string | null
          cpf?: string | null
          created_at?: string | null
          curso_id?: string | null
          data_matricula?: string | null
          data_nascimento?: string | null
          email?: string
          estado?: string | null
          fonte?: string | null
          foto_url?: string | null
          hotmart_transaction_id?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
          valor_pago?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "alunos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_metrics: {
        Row: {
          browser: string | null
          country: string | null
          created_at: string
          device_type: string | null
          duration_ms: number | null
          id: string
          metadata: Json | null
          metric_type: string
          page_path: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_ms?: number | null
          id?: string
          metadata?: Json | null
          metric_type?: string
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_ms?: number | null
          id?: string
          metadata?: Json | null
          metric_type?: string
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      api_rate_limits: {
        Row: {
          client_id: string
          created_at: string | null
          endpoint: string
          id: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          endpoint: string
          id?: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      areas: {
        Row: {
          color: string | null
          course_id: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          position: number
          slug: string | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          position?: number
          slug?: string | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          position?: number
          slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "areas_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "areas_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      arquivos: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          modulo: string
          nome: string
          referencia_id: string | null
          tamanho: number | null
          tipo: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          modulo: string
          nome: string
          referencia_id?: string | null
          tamanho?: number | null
          tipo: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          modulo?: string
          nome?: string
          referencia_id?: string | null
          tamanho?: number | null
          tipo?: string
          url?: string
        }
        Relationships: []
      }
      arquivos_universal: {
        Row: {
          afiliado_id: number | null
          aluno_id: string | null
          ano: number
          ativo: boolean | null
          aula_id: string | null
          bucket: string | null
          categoria: string | null
          created_at: string | null
          curso_id: string | null
          data_upload: string | null
          descricao: string | null
          dia: number
          empresa_id: string | null
          extensao: string | null
          funcionario_id: string | null
          ia_ler: boolean | null
          ia_processado: boolean | null
          ia_resultado: Json | null
          id: string
          mes: number
          nome: string
          nome_storage: string
          pasta: string | null
          path: string
          semana: number
          tags: string[] | null
          tamanho: number
          tipo: string
          updated_at: string | null
          url: string
          usuario_id: string | null
        }
        Insert: {
          afiliado_id?: number | null
          aluno_id?: string | null
          ano: number
          ativo?: boolean | null
          aula_id?: string | null
          bucket?: string | null
          categoria?: string | null
          created_at?: string | null
          curso_id?: string | null
          data_upload?: string | null
          descricao?: string | null
          dia: number
          empresa_id?: string | null
          extensao?: string | null
          funcionario_id?: string | null
          ia_ler?: boolean | null
          ia_processado?: boolean | null
          ia_resultado?: Json | null
          id?: string
          mes: number
          nome: string
          nome_storage: string
          pasta?: string | null
          path: string
          semana: number
          tags?: string[] | null
          tamanho: number
          tipo: string
          updated_at?: string | null
          url: string
          usuario_id?: string | null
        }
        Update: {
          afiliado_id?: number | null
          aluno_id?: string | null
          ano?: number
          ativo?: boolean | null
          aula_id?: string | null
          bucket?: string | null
          categoria?: string | null
          created_at?: string | null
          curso_id?: string | null
          data_upload?: string | null
          descricao?: string | null
          dia?: number
          empresa_id?: string | null
          extensao?: string | null
          funcionario_id?: string | null
          ia_ler?: boolean | null
          ia_processado?: boolean | null
          ia_resultado?: Json | null
          id?: string
          mes?: number
          nome?: string
          nome_storage?: string
          pasta?: string | null
          path?: string
          semana?: number
          tags?: string[] | null
          tamanho?: number
          tipo?: string
          updated_at?: string | null
          url?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "arquivos_universal_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_access_mismatches: {
        Row: {
          acao_sugerida: string | null
          acao_tomada: string | null
          audit_type: string
          created_at: string
          email: string
          grupos_wordpress: Json | null
          hotmart_transaction_id: string | null
          id: string
          nome: string | null
          resolvido: boolean | null
          resolvido_at: string | null
          resolvido_por: string | null
          status_hotmart: string | null
          status_wordpress: string | null
          updated_at: string
          valor_pago: number | null
          wp_user_id: number | null
        }
        Insert: {
          acao_sugerida?: string | null
          acao_tomada?: string | null
          audit_type: string
          created_at?: string
          email: string
          grupos_wordpress?: Json | null
          hotmart_transaction_id?: string | null
          id?: string
          nome?: string | null
          resolvido?: boolean | null
          resolvido_at?: string | null
          resolvido_por?: string | null
          status_hotmart?: string | null
          status_wordpress?: string | null
          updated_at?: string
          valor_pago?: number | null
          wp_user_id?: number | null
        }
        Update: {
          acao_sugerida?: string | null
          acao_tomada?: string | null
          audit_type?: string
          created_at?: string
          email?: string
          grupos_wordpress?: Json | null
          hotmart_transaction_id?: string | null
          id?: string
          nome?: string | null
          resolvido?: boolean | null
          resolvido_at?: string | null
          resolvido_por?: string | null
          status_hotmart?: string | null
          status_wordpress?: string | null
          updated_at?: string
          valor_pago?: number | null
          wp_user_id?: number | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auditoria_grupo_beta: {
        Row: {
          acao_tomada: string | null
          antes_grupos: Json | null
          created_at: string
          data_acao: string | null
          data_deteccao: string
          depois_grupos: Json | null
          email: string
          erro_mensagem: string | null
          executado_por: string | null
          id: string
          ip_origem: string | null
          nome: string | null
          status_anterior: string | null
          status_novo: string | null
          sucesso: boolean | null
          tipo_discrepancia: string
          valor_transacao: number | null
          wp_user_id: number | null
        }
        Insert: {
          acao_tomada?: string | null
          antes_grupos?: Json | null
          created_at?: string
          data_acao?: string | null
          data_deteccao?: string
          depois_grupos?: Json | null
          email: string
          erro_mensagem?: string | null
          executado_por?: string | null
          id?: string
          ip_origem?: string | null
          nome?: string | null
          status_anterior?: string | null
          status_novo?: string | null
          sucesso?: boolean | null
          tipo_discrepancia: string
          valor_transacao?: number | null
          wp_user_id?: number | null
        }
        Update: {
          acao_tomada?: string | null
          antes_grupos?: Json | null
          created_at?: string
          data_acao?: string | null
          data_deteccao?: string
          depois_grupos?: Json | null
          email?: string
          erro_mensagem?: string | null
          executado_por?: string | null
          id?: string
          ip_origem?: string | null
          nome?: string | null
          status_anterior?: string | null
          status_novo?: string | null
          sucesso?: boolean | null
          tipo_discrepancia?: string
          valor_transacao?: number | null
          wp_user_id?: number | null
        }
        Relationships: []
      }
      auditoria_grupo_beta_completo: {
        Row: {
          acao: string
          antes_grupos: Json | null
          created_at: string | null
          depois_grupos: Json | null
          email: string
          executado_por: string
          id: string
          ip_origem: string | null
          mensagem_erro: string | null
          motivo: string
          sucesso: boolean
          transaction_id_hotmart: string | null
          user_id_wordpress: number
          valor_transacao: number | null
        }
        Insert: {
          acao: string
          antes_grupos?: Json | null
          created_at?: string | null
          depois_grupos?: Json | null
          email: string
          executado_por: string
          id?: string
          ip_origem?: string | null
          mensagem_erro?: string | null
          motivo: string
          sucesso?: boolean
          transaction_id_hotmart?: string | null
          user_id_wordpress: number
          valor_transacao?: number | null
        }
        Update: {
          acao?: string
          antes_grupos?: Json | null
          created_at?: string | null
          depois_grupos?: Json | null
          email?: string
          executado_por?: string
          id?: string
          ip_origem?: string | null
          mensagem_erro?: string | null
          motivo?: string
          sucesso?: boolean
          transaction_id_hotmart?: string | null
          user_id_wordpress?: number
          valor_transacao?: number | null
        }
        Relationships: []
      }
      automated_reports: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          last_sent_at: string | null
          next_send_at: string | null
          recipients: string[] | null
          report_type: string
          schedule: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          next_send_at?: string | null
          recipients?: string[] | null
          report_type: string
          schedule?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          next_send_at?: string | null
          recipients?: string[] | null
          report_type?: string
          schedule?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          rarity: string | null
          requirement_type: string
          requirement_value: number | null
          xp_reward: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          rarity?: string | null
          requirement_type: string
          requirement_value?: number | null
          xp_reward?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          rarity?: string | null
          requirement_type?: string
          requirement_value?: number | null
          xp_reward?: number | null
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_type: string | null
          bank_name: string | null
          color: string | null
          created_at: string | null
          created_by: string | null
          current_balance: number | null
          id: string
          initial_balance: number | null
          is_active: boolean | null
          is_personal: boolean | null
          name: string
        }
        Insert: {
          account_type?: string | null
          bank_name?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          current_balance?: number | null
          id?: string
          initial_balance?: number | null
          is_active?: boolean | null
          is_personal?: boolean | null
          name: string
        }
        Update: {
          account_type?: string | null
          bank_name?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          current_balance?: number | null
          id?: string
          initial_balance?: number | null
          is_active?: boolean | null
          is_personal?: boolean | null
          name?: string
        }
        Relationships: []
      }
      branding_settings: {
        Row: {
          company_name: string | null
          id: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_name?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_name?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      calendar_tasks: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_completed: boolean
          priority: string | null
          reminder_email: string | null
          reminder_enabled: boolean
          task_date: string
          task_time: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean
          priority?: string | null
          reminder_email?: string | null
          reminder_enabled?: boolean
          task_date: string
          task_time?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean
          priority?: string | null
          reminder_email?: string | null
          reminder_enabled?: boolean
          task_date?: string
          task_time?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          order_index: number | null
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          order_index?: number | null
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          order_index?: number | null
          slug?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          carga_horaria: number | null
          certificate_number: string
          course_id: string | null
          id: string
          issued_at: string | null
          nome_aluno: string | null
          nome_curso: string | null
          pdf_url: string | null
          user_id: string | null
          validado: boolean | null
        }
        Insert: {
          carga_horaria?: number | null
          certificate_number: string
          course_id?: string | null
          id?: string
          issued_at?: string | null
          nome_aluno?: string | null
          nome_curso?: string | null
          pdf_url?: string | null
          user_id?: string | null
          validado?: boolean | null
        }
        Update: {
          carga_horaria?: number | null
          certificate_number?: string
          course_id?: string | null
          id?: string
          issued_at?: string | null
          nome_aluno?: string | null
          nome_curso?: string | null
          pdf_url?: string | null
          user_id?: string | null
          validado?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      comandos_ia_central: {
        Row: {
          acao: string
          completed_at: string | null
          contexto_id: string | null
          created_at: string
          erro: string | null
          ia_destino: string
          ia_origem: string | null
          id: string
          parametros: Json
          prioridade: number | null
          resultado: Json | null
          started_at: string | null
          status: string
          tempo_execucao_ms: number | null
          webhook_trigger_id: string | null
        }
        Insert: {
          acao: string
          completed_at?: string | null
          contexto_id?: string | null
          created_at?: string
          erro?: string | null
          ia_destino: string
          ia_origem?: string | null
          id?: string
          parametros?: Json
          prioridade?: number | null
          resultado?: Json | null
          started_at?: string | null
          status?: string
          tempo_execucao_ms?: number | null
          webhook_trigger_id?: string | null
        }
        Update: {
          acao?: string
          completed_at?: string | null
          contexto_id?: string | null
          created_at?: string
          erro?: string | null
          ia_destino?: string
          ia_origem?: string | null
          id?: string
          parametros?: Json
          prioridade?: number | null
          resultado?: Json | null
          started_at?: string | null
          status?: string
          tempo_execucao_ms?: number | null
          webhook_trigger_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comandos_ia_central_webhook_trigger_id_fkey"
            columns: ["webhook_trigger_id"]
            isOneToOne: false
            referencedRelation: "webhooks_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      comissoes: {
        Row: {
          afiliado_id: number | null
          aluno_id: string | null
          created_at: string | null
          data: string | null
          descricao: string | null
          id: string
          pago_em: string | null
          status: string | null
          transaction_id: string | null
          valor: number
        }
        Insert: {
          afiliado_id?: number | null
          aluno_id?: string | null
          created_at?: string | null
          data?: string | null
          descricao?: string | null
          id?: string
          pago_em?: string | null
          status?: string | null
          transaction_id?: string | null
          valor: number
        }
        Update: {
          afiliado_id?: number | null
          aluno_id?: string | null
          created_at?: string | null
          data?: string | null
          descricao?: string | null
          id?: string
          pago_em?: string | null
          status?: string | null
          transaction_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_afiliado_id_fkey"
            columns: ["afiliado_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      comissoes_monthly_closures: {
        Row: {
          ano: number
          created_at: string | null
          fechado_por: string | null
          id: string
          mes: number
          observacoes: string | null
          por_afiliado: Json | null
          qtd_afiliados_ativos: number | null
          qtd_comissoes: number | null
          total_comissoes: number | null
          total_pago: number | null
          total_pendente: number | null
          updated_at: string | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          mes: number
          observacoes?: string | null
          por_afiliado?: Json | null
          qtd_afiliados_ativos?: number | null
          qtd_comissoes?: number | null
          total_comissoes?: number | null
          total_pago?: number | null
          total_pendente?: number | null
          updated_at?: string | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          mes?: number
          observacoes?: string | null
          por_afiliado?: Json | null
          qtd_afiliados_ativos?: number | null
          qtd_comissoes?: number | null
          total_comissoes?: number | null
          total_pago?: number | null
          total_pendente?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      comissoes_yearly_closures: {
        Row: {
          ano: number
          created_at: string | null
          fechado_por: string | null
          id: string
          melhor_afiliado_id: number | null
          meses_fechados: number | null
          observacoes: string | null
          total_comissoes: number | null
          total_pago: number | null
          updated_at: string | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          melhor_afiliado_id?: number | null
          meses_fechados?: number | null
          observacoes?: string | null
          total_comissoes?: number | null
          total_pago?: number | null
          updated_at?: string | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          melhor_afiliado_id?: number | null
          meses_fechados?: number | null
          observacoes?: string | null
          total_comissoes?: number | null
          total_pago?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      command_finance: {
        Row: {
          amount: number
          counterparty: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          date: string | null
          description: string | null
          id: string
          related_attachment_id: string | null
          related_conversation_id: string | null
          source: string | null
          status: string | null
          tags: Json | null
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          counterparty?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          date?: string | null
          description?: string | null
          id?: string
          related_attachment_id?: string | null
          related_conversation_id?: string | null
          source?: string | null
          status?: string | null
          tags?: Json | null
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          counterparty?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          date?: string | null
          description?: string | null
          id?: string
          related_attachment_id?: string | null
          related_conversation_id?: string | null
          source?: string | null
          status?: string | null
          tags?: Json | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "command_finance_related_attachment_id_fkey"
            columns: ["related_attachment_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "command_finance_related_conversation_id_fkey"
            columns: ["related_conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      command_tasks: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          owner: string | null
          priority: string | null
          related_attachment_id: string | null
          related_conversation_id: string | null
          source: string | null
          status: string | null
          tags: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          owner?: string | null
          priority?: string | null
          related_attachment_id?: string | null
          related_conversation_id?: string | null
          source?: string | null
          status?: string | null
          tags?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          owner?: string | null
          priority?: string | null
          related_attachment_id?: string | null
          related_conversation_id?: string | null
          source?: string | null
          status?: string | null
          tags?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "command_tasks_related_attachment_id_fkey"
            columns: ["related_attachment_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "command_tasks_related_conversation_id_fkey"
            columns: ["related_conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      company_extra_expenses: {
        Row: {
          ano: number | null
          categoria: string | null
          created_at: string | null
          created_by: string | null
          data: string | null
          data_fechamento: string | null
          data_pagamento: string | null
          data_vencimento: string | null
          dia: number | null
          fechado: boolean | null
          fechado_por: string | null
          id: number
          mes: number | null
          nome: string
          observacoes_pagamento: string | null
          semana: number | null
          status_pagamento: string | null
          updated_at: string | null
          valor: number
        }
        Insert: {
          ano?: number | null
          categoria?: string | null
          created_at?: string | null
          created_by?: string | null
          data?: string | null
          data_fechamento?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          dia?: number | null
          fechado?: boolean | null
          fechado_por?: string | null
          id?: number
          mes?: number | null
          nome: string
          observacoes_pagamento?: string | null
          semana?: number | null
          status_pagamento?: string | null
          updated_at?: string | null
          valor?: number
        }
        Update: {
          ano?: number | null
          categoria?: string | null
          created_at?: string | null
          created_by?: string | null
          data?: string | null
          data_fechamento?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          dia?: number | null
          fechado?: boolean | null
          fechado_por?: string | null
          id?: number
          mes?: number | null
          nome?: string
          observacoes_pagamento?: string | null
          semana?: number | null
          status_pagamento?: string | null
          updated_at?: string | null
          valor?: number
        }
        Relationships: []
      }
      company_fixed_expenses: {
        Row: {
          ano: number | null
          categoria: string | null
          created_at: string | null
          created_by: string | null
          data_fechamento: string | null
          data_fim_recorrencia: string | null
          data_inicio_recorrencia: string | null
          data_pagamento: string | null
          data_vencimento: string | null
          dia: number | null
          fechado: boolean | null
          fechado_por: string | null
          gasto_origem_id: number | null
          id: number
          is_projecao: boolean | null
          mes: number | null
          nome: string
          observacoes_pagamento: string | null
          recorrente: boolean | null
          semana: number | null
          status_pagamento: string | null
          updated_at: string | null
          valor: number
        }
        Insert: {
          ano?: number | null
          categoria?: string | null
          created_at?: string | null
          created_by?: string | null
          data_fechamento?: string | null
          data_fim_recorrencia?: string | null
          data_inicio_recorrencia?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          dia?: number | null
          fechado?: boolean | null
          fechado_por?: string | null
          gasto_origem_id?: number | null
          id?: number
          is_projecao?: boolean | null
          mes?: number | null
          nome: string
          observacoes_pagamento?: string | null
          recorrente?: boolean | null
          semana?: number | null
          status_pagamento?: string | null
          updated_at?: string | null
          valor?: number
        }
        Update: {
          ano?: number | null
          categoria?: string | null
          created_at?: string | null
          created_by?: string | null
          data_fechamento?: string | null
          data_fim_recorrencia?: string | null
          data_inicio_recorrencia?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          dia?: number | null
          fechado?: boolean | null
          fechado_por?: string | null
          gasto_origem_id?: number | null
          id?: number
          is_projecao?: boolean | null
          mes?: number | null
          nome?: string
          observacoes_pagamento?: string | null
          recorrente?: boolean | null
          semana?: number | null
          status_pagamento?: string | null
          updated_at?: string | null
          valor?: number
        }
        Relationships: []
      }
      company_monthly_closures: {
        Row: {
          ano: number
          created_at: string | null
          fechado_por: string | null
          id: string
          mes: number
          observacoes: string | null
          qtd_entradas: number | null
          qtd_gastos_extras: number | null
          qtd_gastos_fixos: number | null
          saldo_periodo: number | null
          total_gastos_extras: number | null
          total_gastos_fixos: number | null
          total_receitas: number | null
          updated_at: string | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          mes: number
          observacoes?: string | null
          qtd_entradas?: number | null
          qtd_gastos_extras?: number | null
          qtd_gastos_fixos?: number | null
          saldo_periodo?: number | null
          total_gastos_extras?: number | null
          total_gastos_fixos?: number | null
          total_receitas?: number | null
          updated_at?: string | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          mes?: number
          observacoes?: string | null
          qtd_entradas?: number | null
          qtd_gastos_extras?: number | null
          qtd_gastos_fixos?: number | null
          saldo_periodo?: number | null
          total_gastos_extras?: number | null
          total_gastos_fixos?: number | null
          total_receitas?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      company_yearly_closures: {
        Row: {
          ano: number
          created_at: string | null
          fechado_por: string | null
          id: string
          melhor_mes: number | null
          meses_fechados: number | null
          observacoes: string | null
          pior_mes: number | null
          qtd_total_entradas: number | null
          qtd_total_gastos: number | null
          saldo_ano: number | null
          total_gastos_extras: number | null
          total_gastos_fixos: number | null
          total_receitas: number | null
          updated_at: string | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          melhor_mes?: number | null
          meses_fechados?: number | null
          observacoes?: string | null
          pior_mes?: number | null
          qtd_total_entradas?: number | null
          qtd_total_gastos?: number | null
          saldo_ano?: number | null
          total_gastos_extras?: number | null
          total_gastos_fixos?: number | null
          total_receitas?: number | null
          updated_at?: string | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          melhor_mes?: number | null
          meses_fechados?: number | null
          observacoes?: string | null
          pior_mes?: number | null
          qtd_total_entradas?: number | null
          qtd_total_gastos?: number | null
          saldo_ano?: number | null
          total_gastos_extras?: number | null
          total_gastos_fixos?: number | null
          total_receitas?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      connection_pool_stats: {
        Row: {
          active_connections: number | null
          id: string
          measured_at: string | null
          peak_connections: number | null
          requests_per_second: number | null
        }
        Insert: {
          active_connections?: number | null
          id?: string
          measured_at?: string | null
          peak_connections?: number | null
          requests_per_second?: number | null
        }
        Update: {
          active_connections?: number | null
          id?: string
          measured_at?: string | null
          peak_connections?: number | null
          requests_per_second?: number | null
        }
        Relationships: []
      }
      contabilidade: {
        Row: {
          ano_referencia: number | null
          categoria: string | null
          created_at: string
          created_by: string | null
          data_referencia: string
          descricao: string
          documento_url: string | null
          id: string
          mes_referencia: string | null
          observacoes: string | null
          subtopico: string | null
          tipo: string
          topico: string
          valor: number
        }
        Insert: {
          ano_referencia?: number | null
          categoria?: string | null
          created_at?: string
          created_by?: string | null
          data_referencia?: string
          descricao: string
          documento_url?: string | null
          id?: string
          mes_referencia?: string | null
          observacoes?: string | null
          subtopico?: string | null
          tipo: string
          topico: string
          valor?: number
        }
        Update: {
          ano_referencia?: number | null
          categoria?: string | null
          created_at?: string
          created_by?: string | null
          data_referencia?: string
          descricao?: string
          documento_url?: string | null
          id?: string
          mes_referencia?: string | null
          observacoes?: string | null
          subtopico?: string | null
          tipo?: string
          topico?: string
          valor?: number
        }
        Relationships: []
      }
      contabilidade_monthly_closures: {
        Row: {
          ano: number
          cac: number | null
          created_at: string | null
          fechado_por: string | null
          id: string
          lucro_liquido: number | null
          margem_lucro: number | null
          mes: number
          observacoes: string | null
          por_topico: Json | null
          roi: number | null
          total_despesas: number | null
          total_impostos: number | null
          total_investimentos: number | null
          total_receitas: number | null
          updated_at: string | null
        }
        Insert: {
          ano: number
          cac?: number | null
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          lucro_liquido?: number | null
          margem_lucro?: number | null
          mes: number
          observacoes?: string | null
          por_topico?: Json | null
          roi?: number | null
          total_despesas?: number | null
          total_impostos?: number | null
          total_investimentos?: number | null
          total_receitas?: number | null
          updated_at?: string | null
        }
        Update: {
          ano?: number
          cac?: number | null
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          lucro_liquido?: number | null
          margem_lucro?: number | null
          mes?: number
          observacoes?: string | null
          por_topico?: Json | null
          roi?: number | null
          total_despesas?: number | null
          total_impostos?: number | null
          total_investimentos?: number | null
          total_receitas?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contabilidade_yearly_closures: {
        Row: {
          ano: number
          created_at: string | null
          fechado_por: string | null
          id: string
          lucro_liquido_ano: number | null
          margem_media: number | null
          meses_fechados: number | null
          observacoes: string | null
          total_despesas: number | null
          total_impostos: number | null
          total_investimentos: number | null
          total_receitas: number | null
          updated_at: string | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          lucro_liquido_ano?: number | null
          margem_media?: number | null
          meses_fechados?: number | null
          observacoes?: string | null
          total_despesas?: number | null
          total_impostos?: number | null
          total_investimentos?: number | null
          total_receitas?: number | null
          updated_at?: string | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          lucro_liquido_ano?: number | null
          margem_media?: number | null
          meses_fechados?: number | null
          observacoes?: string | null
          total_despesas?: number | null
          total_impostos?: number | null
          total_investimentos?: number | null
          total_receitas?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contas_pagar: {
        Row: {
          categoria: string | null
          centro_custo: string | null
          comprovante_url: string | null
          conta_bancaria_id: string | null
          created_at: string
          created_by: string | null
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          forma_pagamento: string | null
          fornecedor: string | null
          frequencia_recorrencia: string | null
          id: string
          numero_documento: string | null
          observacoes: string | null
          recorrente: boolean | null
          status: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          centro_custo?: string | null
          comprovante_url?: string | null
          conta_bancaria_id?: string | null
          created_at?: string
          created_by?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          forma_pagamento?: string | null
          fornecedor?: string | null
          frequencia_recorrencia?: string | null
          id?: string
          numero_documento?: string | null
          observacoes?: string | null
          recorrente?: boolean | null
          status?: string | null
          updated_at?: string
          valor: number
        }
        Update: {
          categoria?: string | null
          centro_custo?: string | null
          comprovante_url?: string | null
          conta_bancaria_id?: string | null
          created_at?: string
          created_by?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          forma_pagamento?: string | null
          fornecedor?: string | null
          frequencia_recorrencia?: string | null
          id?: string
          numero_documento?: string | null
          observacoes?: string | null
          recorrente?: boolean | null
          status?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_pagar_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_pagar_monthly_closures: {
        Row: {
          ano: number
          created_at: string | null
          fechado_por: string | null
          id: string
          mes: number
          observacoes: string | null
          por_categoria: Json | null
          por_fornecedor: Json | null
          qtd_contas: number | null
          total_atrasado: number | null
          total_pago: number | null
          total_pendente: number | null
          updated_at: string | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          mes: number
          observacoes?: string | null
          por_categoria?: Json | null
          por_fornecedor?: Json | null
          qtd_contas?: number | null
          total_atrasado?: number | null
          total_pago?: number | null
          total_pendente?: number | null
          updated_at?: string | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          mes?: number
          observacoes?: string | null
          por_categoria?: Json | null
          por_fornecedor?: Json | null
          qtd_contas?: number | null
          total_atrasado?: number | null
          total_pago?: number | null
          total_pendente?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contas_pagar_yearly_closures: {
        Row: {
          ano: number
          created_at: string | null
          fechado_por: string | null
          id: string
          meses_fechados: number | null
          observacoes: string | null
          total_pago: number | null
          total_pendente: number | null
          updated_at: string | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          meses_fechados?: number | null
          observacoes?: string | null
          total_pago?: number | null
          total_pendente?: number | null
          updated_at?: string | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          meses_fechados?: number | null
          observacoes?: string | null
          total_pago?: number | null
          total_pendente?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contas_receber: {
        Row: {
          categoria: string | null
          cliente: string | null
          comprovante_url: string | null
          conta_bancaria_id: string | null
          created_at: string
          created_by: string | null
          data_recebimento: string | null
          data_vencimento: string
          descricao: string
          forma_recebimento: string | null
          frequencia_recorrencia: string | null
          id: string
          numero_documento: string | null
          observacoes: string | null
          origem: string | null
          recorrente: boolean | null
          status: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          cliente?: string | null
          comprovante_url?: string | null
          conta_bancaria_id?: string | null
          created_at?: string
          created_by?: string | null
          data_recebimento?: string | null
          data_vencimento: string
          descricao: string
          forma_recebimento?: string | null
          frequencia_recorrencia?: string | null
          id?: string
          numero_documento?: string | null
          observacoes?: string | null
          origem?: string | null
          recorrente?: boolean | null
          status?: string | null
          updated_at?: string
          valor: number
        }
        Update: {
          categoria?: string | null
          cliente?: string | null
          comprovante_url?: string | null
          conta_bancaria_id?: string | null
          created_at?: string
          created_by?: string | null
          data_recebimento?: string | null
          data_vencimento?: string
          descricao?: string
          forma_recebimento?: string | null
          frequencia_recorrencia?: string | null
          id?: string
          numero_documento?: string | null
          observacoes?: string | null
          origem?: string | null
          recorrente?: boolean | null
          status?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_receber_monthly_closures: {
        Row: {
          ano: number
          created_at: string | null
          fechado_por: string | null
          id: string
          mes: number
          observacoes: string | null
          por_categoria: Json | null
          por_cliente: Json | null
          qtd_contas: number | null
          total_atrasado: number | null
          total_pendente: number | null
          total_recebido: number | null
          updated_at: string | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          mes: number
          observacoes?: string | null
          por_categoria?: Json | null
          por_cliente?: Json | null
          qtd_contas?: number | null
          total_atrasado?: number | null
          total_pendente?: number | null
          total_recebido?: number | null
          updated_at?: string | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          mes?: number
          observacoes?: string | null
          por_categoria?: Json | null
          por_cliente?: Json | null
          qtd_contas?: number | null
          total_atrasado?: number | null
          total_pendente?: number | null
          total_recebido?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contas_receber_yearly_closures: {
        Row: {
          ano: number
          created_at: string | null
          fechado_por: string | null
          id: string
          meses_fechados: number | null
          observacoes: string | null
          total_pendente: number | null
          total_recebido: number | null
          updated_at: string | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          meses_fechados?: number | null
          observacoes?: string | null
          total_pendente?: number | null
          total_recebido?: number | null
          updated_at?: string | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          meses_fechados?: number | null
          observacoes?: string | null
          total_pendente?: number | null
          total_recebido?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      content_access_log: {
        Row: {
          action: string
          blocked_reason: string | null
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          blocked_reason?: string | null
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          blocked_reason?: string | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      content_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          content_key: string
          id: string
          ip_address: string | null
          new_value: string
          old_value: string | null
          user_agent: string | null
          version: number
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          content_key: string
          id?: string
          ip_address?: string | null
          new_value: string
          old_value?: string | null
          user_agent?: string | null
          version?: number
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          content_key?: string
          id?: string
          ip_address?: string | null
          new_value?: string
          old_value?: string | null
          user_agent?: string | null
          version?: number
        }
        Relationships: []
      }
      contexto_compartilhado_ias: {
        Row: {
          ativo: boolean | null
          created_at: string
          dados: Json
          entidade_id: string | null
          expira_em: string | null
          ia_criadora: string
          ias_com_acesso: string[] | null
          id: string
          sessao_id: string
          tipo_contexto: string
          updated_at: string
          versao: number | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          dados?: Json
          entidade_id?: string | null
          expira_em?: string | null
          ia_criadora: string
          ias_com_acesso?: string[] | null
          id?: string
          sessao_id: string
          tipo_contexto: string
          updated_at?: string
          versao?: number | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          dados?: Json
          entidade_id?: string | null
          expira_em?: string | null
          ia_criadora?: string
          ias_com_acesso?: string[] | null
          id?: string
          sessao_id?: string
          tipo_contexto?: string
          updated_at?: string
          versao?: number | null
        }
        Relationships: []
      }
      conversas_tramon: {
        Row: {
          acoes_sugeridas: Json | null
          contexto: Json | null
          created_at: string | null
          feedback_usuario: string | null
          id: string
          intencao_detectada: string | null
          mensagem_usuario: string
          resposta_tramon: string
          user_id: string | null
        }
        Insert: {
          acoes_sugeridas?: Json | null
          contexto?: Json | null
          created_at?: string | null
          feedback_usuario?: string | null
          id?: string
          intencao_detectada?: string | null
          mensagem_usuario: string
          resposta_tramon: string
          user_id?: string | null
        }
        Update: {
          acoes_sugeridas?: Json | null
          contexto?: Json | null
          created_at?: string | null
          feedback_usuario?: string | null
          id?: string
          intencao_detectada?: string | null
          mensagem_usuario?: string
          resposta_tramon?: string
          user_id?: string | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          average_rating: number | null
          category: string | null
          category_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          destaque: boolean | null
          difficulty_level: string | null
          duration_hours: number | null
          estimated_hours: number | null
          id: string
          instructor_id: string | null
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          ordem: number | null
          preview_video_url: string | null
          price: number | null
          published_at: string | null
          short_description: string | null
          slug: string | null
          status: string | null
          thumbnail_url: string | null
          tipo: string | null
          title: string
          total_reviews: number | null
          total_students: number | null
          total_xp: number | null
          updated_at: string | null
        }
        Insert: {
          average_rating?: number | null
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          destaque?: boolean | null
          difficulty_level?: string | null
          duration_hours?: number | null
          estimated_hours?: number | null
          id?: string
          instructor_id?: string | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          ordem?: number | null
          preview_video_url?: string | null
          price?: number | null
          published_at?: string | null
          short_description?: string | null
          slug?: string | null
          status?: string | null
          thumbnail_url?: string | null
          tipo?: string | null
          title: string
          total_reviews?: number | null
          total_students?: number | null
          total_xp?: number | null
          updated_at?: string | null
        }
        Update: {
          average_rating?: number | null
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          destaque?: boolean | null
          difficulty_level?: string | null
          duration_hours?: number | null
          estimated_hours?: number | null
          id?: string
          instructor_id?: string | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          ordem?: number | null
          preview_video_url?: string | null
          price?: number | null
          published_at?: string | null
          short_description?: string | null
          slug?: string | null
          status?: string | null
          thumbnail_url?: string | null
          tipo?: string | null
          title?: string
          total_reviews?: number | null
          total_students?: number | null
          total_xp?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_rules: {
        Row: {
          actions: Json | null
          conditions: Json | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          priority: number | null
          rule_name: string
          rule_type: string
          trigger_event: string | null
          updated_at: string
        }
        Insert: {
          actions?: Json | null
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          priority?: number | null
          rule_name: string
          rule_type?: string
          trigger_event?: string | null
          updated_at?: string
        }
        Update: {
          actions?: Json | null
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          priority?: number | null
          rule_name?: string
          rule_type?: string
          trigger_event?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dead_letter_queue: {
        Row: {
          created_at: string
          error_history: Json[] | null
          event_type: string
          id: string
          last_error: string | null
          original_webhook_id: string | null
          payload: Json
          reprocessed: boolean | null
          reprocessed_at: string | null
          reprocessed_by: string | null
          retry_count: number | null
          source: string
        }
        Insert: {
          created_at?: string
          error_history?: Json[] | null
          event_type: string
          id?: string
          last_error?: string | null
          original_webhook_id?: string | null
          payload: Json
          reprocessed?: boolean | null
          reprocessed_at?: string | null
          reprocessed_by?: string | null
          retry_count?: number | null
          source: string
        }
        Update: {
          created_at?: string
          error_history?: Json[] | null
          event_type?: string
          id?: string
          last_error?: string | null
          original_webhook_id?: string | null
          payload?: Json
          reprocessed?: boolean | null
          reprocessed_at?: string | null
          reprocessed_by?: string | null
          retry_count?: number | null
          source?: string
        }
        Relationships: []
      }
      dev_tasks: {
        Row: {
          created_at: string
          created_by: string | null
          deadline: string | null
          description: string | null
          id: string
          member_name: string
          member_role: string | null
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          member_name: string
          member_role?: string | null
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          member_name?: string
          member_role?: string | null
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      device_access_attempts: {
        Row: {
          attempt_type: string
          blocked: boolean | null
          browser: string | null
          created_at: string | null
          device_fingerprint: string
          device_name: string | null
          device_type: string | null
          id: string
          ip_hint: string | null
          os: string | null
          resolved: boolean | null
          resolved_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          attempt_type: string
          blocked?: boolean | null
          browser?: string | null
          created_at?: string | null
          device_fingerprint: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          ip_hint?: string | null
          os?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          attempt_type?: string
          blocked?: boolean | null
          browser?: string | null
          created_at?: string | null
          device_fingerprint?: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          ip_hint?: string | null
          os?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      dynamic_menu_items: {
        Row: {
          area: string
          badge: string | null
          created_at: string
          created_by: string | null
          group_id: string
          icon: string
          id: string
          is_active: boolean
          order_index: number
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          area: string
          badge?: string | null
          created_at?: string
          created_by?: string | null
          group_id: string
          icon?: string
          id?: string
          is_active?: boolean
          order_index?: number
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          area?: string
          badge?: string | null
          created_at?: string
          created_by?: string | null
          group_id?: string
          icon?: string
          id?: string
          is_active?: boolean
          order_index?: number
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      editable_content: {
        Row: {
          content_key: string
          content_type: string
          content_value: string | null
          created_at: string
          id: string
          metadata: Json | null
          page_key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content_key: string
          content_type?: string
          content_value?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          page_key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content_key?: string
          content_type?: string
          content_value?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          page_key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      emails_rd_station: {
        Row: {
          assunto: string | null
          bounce_reason: string | null
          campanha_id: string | null
          corpo_html: string | null
          corpo_texto: string | null
          created_at: string | null
          data_abertura: string | null
          data_clique: string | null
          data_envio: string
          destinatario: string
          id: string
          link_clicado: string | null
          status: string
          tags: Json | null
          template_id: string | null
        }
        Insert: {
          assunto?: string | null
          bounce_reason?: string | null
          campanha_id?: string | null
          corpo_html?: string | null
          corpo_texto?: string | null
          created_at?: string | null
          data_abertura?: string | null
          data_clique?: string | null
          data_envio?: string
          destinatario: string
          id?: string
          link_clicado?: string | null
          status?: string
          tags?: Json | null
          template_id?: string | null
        }
        Update: {
          assunto?: string | null
          bounce_reason?: string | null
          campanha_id?: string | null
          corpo_html?: string | null
          corpo_texto?: string | null
          created_at?: string | null
          data_abertura?: string | null
          data_clique?: string | null
          data_envio?: string
          destinatario?: string
          id?: string
          link_clicado?: string | null
          status?: string
          tags?: Json | null
          template_id?: string | null
        }
        Relationships: []
      }
      employee_compensation: {
        Row: {
          created_at: string
          employee_id: number
          salario: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: number
          salario?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: number
          salario?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_compensation_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_compensation_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_compensation_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          categoria: string
          created_at: string | null
          created_by: string | null
          employee_id: number
          id: string
          mime_type: string | null
          nome: string
          observacoes: string | null
          path: string
          tamanho: number | null
          tipo: string
          url: string
        }
        Insert: {
          categoria?: string
          created_at?: string | null
          created_by?: string | null
          employee_id: number
          id?: string
          mime_type?: string | null
          nome: string
          observacoes?: string | null
          path: string
          tamanho?: number | null
          tipo?: string
          url: string
        }
        Update: {
          categoria?: string
          created_at?: string | null
          created_by?: string | null
          employee_id?: number
          id?: string
          mime_type?: string | null
          nome?: string
          observacoes?: string | null
          path?: string
          tamanho?: number | null
          tipo?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string | null
          created_by: string | null
          data_admissao: string | null
          email: string | null
          funcao: string
          horario_trabalho: string | null
          id: number
          nome: string
          responsabilidades: string | null
          setor: Database["public"]["Enums"]["sector_type"] | null
          status: Database["public"]["Enums"]["employee_status"] | null
          telefone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data_admissao?: string | null
          email?: string | null
          funcao: string
          horario_trabalho?: string | null
          id?: number
          nome: string
          responsabilidades?: string | null
          setor?: Database["public"]["Enums"]["sector_type"] | null
          status?: Database["public"]["Enums"]["employee_status"] | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data_admissao?: string | null
          email?: string | null
          funcao?: string
          horario_trabalho?: string | null
          id?: number
          nome?: string
          responsabilidades?: string | null
          setor?: Database["public"]["Enums"]["sector_type"] | null
          status?: Database["public"]["Enums"]["employee_status"] | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      empresas: {
        Row: {
          ativo: boolean
          cnpj: string
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cnpj: string
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cnpj?: string
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      encrypted_secrets: {
        Row: {
          created_at: string | null
          encrypted_value: string
          expires_at: string | null
          id: string
          nonce: string
          secret_name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          encrypted_value: string
          expires_at?: string | null
          id?: string
          nonce: string
          secret_name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          encrypted_value?: string
          expires_at?: string | null
          id?: string
          nonce?: string
          secret_name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          certificate_url: string | null
          completed_at: string | null
          course_id: string
          created_at: string | null
          enrolled_at: string | null
          forma_pagamento: string | null
          id: string
          observacoes: string | null
          origem: string | null
          progress_percentage: number | null
          status: string | null
          transaction_id: string | null
          user_id: string
          valor_pago: number | null
        }
        Insert: {
          certificate_url?: string | null
          completed_at?: string | null
          course_id: string
          created_at?: string | null
          enrolled_at?: string | null
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          origem?: string | null
          progress_percentage?: number | null
          status?: string | null
          transaction_id?: string | null
          user_id: string
          valor_pago?: number | null
        }
        Update: {
          certificate_url?: string | null
          completed_at?: string | null
          course_id?: string
          created_at?: string | null
          enrolled_at?: string | null
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          origem?: string | null
          progress_percentage?: number | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string
          valor_pago?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      entradas: {
        Row: {
          aluno_id: string | null
          categoria: string | null
          created_at: string | null
          created_by: string | null
          data: string | null
          descricao: string
          fonte: string | null
          id: string
          transaction_id: string | null
          updated_at: string | null
          valor: number
        }
        Insert: {
          aluno_id?: string | null
          categoria?: string | null
          created_at?: string | null
          created_by?: string | null
          data?: string | null
          descricao: string
          fonte?: string | null
          id?: string
          transaction_id?: string | null
          updated_at?: string | null
          valor: number
        }
        Update: {
          aluno_id?: string | null
          categoria?: string | null
          created_at?: string | null
          created_by?: string | null
          data?: string | null
          descricao?: string
          fonte?: string | null
          id?: string
          transaction_id?: string | null
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "entradas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entradas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      entradas_monthly_closures: {
        Row: {
          ano: number
          created_at: string | null
          fechado_por: string | null
          id: string
          liquido: number | null
          mes: number
          observacoes: string | null
          por_banco: Json | null
          por_fonte: Json | null
          qtd_entradas: number | null
          qtd_impostos: number | null
          total_impostos: number | null
          total_receitas: number | null
          updated_at: string | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          liquido?: number | null
          mes: number
          observacoes?: string | null
          por_banco?: Json | null
          por_fonte?: Json | null
          qtd_entradas?: number | null
          qtd_impostos?: number | null
          total_impostos?: number | null
          total_receitas?: number | null
          updated_at?: string | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          liquido?: number | null
          mes?: number
          observacoes?: string | null
          por_banco?: Json | null
          por_fonte?: Json | null
          qtd_entradas?: number | null
          qtd_impostos?: number | null
          total_impostos?: number | null
          total_receitas?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      entradas_yearly_closures: {
        Row: {
          ano: number
          created_at: string | null
          fechado_por: string | null
          id: string
          liquido_ano: number | null
          melhor_mes: number | null
          meses_fechados: number | null
          observacoes: string | null
          pior_mes: number | null
          total_impostos: number | null
          total_receitas: number | null
          updated_at: string | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          liquido_ano?: number | null
          melhor_mes?: number | null
          meses_fechados?: number | null
          observacoes?: string | null
          pior_mes?: number | null
          total_impostos?: number | null
          total_receitas?: number | null
          updated_at?: string | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          liquido_ano?: number | null
          melhor_mes?: number | null
          meses_fechados?: number | null
          observacoes?: string | null
          pior_mes?: number | null
          total_impostos?: number | null
          total_receitas?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      equipment: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          last_maintenance: string | null
          location: string | null
          model: string | null
          name: string
          next_maintenance: string | null
          notes: string | null
          serial_number: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_maintenance?: string | null
          location?: string | null
          model?: string | null
          name: string
          next_maintenance?: string | null
          notes?: string | null
          serial_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_maintenance?: string | null
          location?: string | null
          model?: string | null
          name?: string
          next_maintenance?: string | null
          notes?: string | null
          serial_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      error_notebook: {
        Row: {
          error_count: number | null
          last_error_at: string
          mastered: boolean | null
          mastered_at: string | null
          question_id: string
          user_id: string
        }
        Insert: {
          error_count?: number | null
          last_error_at?: string
          mastered?: boolean | null
          mastered_at?: string | null
          question_id: string
          user_id: string
        }
        Update: {
          error_count?: number | null
          last_error_at?: string
          mastered?: boolean | null
          mastered_at?: string | null
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "error_notebook_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "sanctuary_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "error_notebook_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "error_notebook_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      event_consumers: {
        Row: {
          config: Json | null
          consumer_name: string
          created_at: string | null
          error_count: number | null
          event_types: Database["public"]["Enums"]["event_name"][]
          id: string
          is_active: boolean | null
          last_processed_at: string | null
          last_processed_event_id: number | null
        }
        Insert: {
          config?: Json | null
          consumer_name: string
          created_at?: string | null
          error_count?: number | null
          event_types: Database["public"]["Enums"]["event_name"][]
          id?: string
          is_active?: boolean | null
          last_processed_at?: string | null
          last_processed_event_id?: number | null
        }
        Update: {
          config?: Json | null
          consumer_name?: string
          created_at?: string | null
          error_count?: number | null
          event_types?: Database["public"]["Enums"]["event_name"][]
          id?: string
          is_active?: boolean | null
          last_processed_at?: string | null
          last_processed_event_id?: number | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          error_message: string | null
          id: number
          max_retries: number | null
          name: Database["public"]["Enums"]["event_name"]
          payload: Json
          processed_at: string | null
          processed_by: string | null
          retry_count: number | null
          status: Database["public"]["Enums"]["event_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: number
          max_retries?: number | null
          name: Database["public"]["Enums"]["event_name"]
          payload?: Json
          processed_at?: string | null
          processed_by?: string | null
          retry_count?: number | null
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: number
          max_retries?: number | null
          name?: Database["public"]["Enums"]["event_name"]
          payload?: Json
          processed_at?: string | null
          processed_by?: string | null
          retry_count?: number | null
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      facebook_ads_metrics: {
        Row: {
          alcance: number | null
          campanha_id: string
          campanha_nome: string | null
          cliques: number | null
          conversoes: number | null
          cpc: number | null
          cpm: number | null
          ctr: number | null
          data: string
          id: string
          impressoes: number | null
          investimento: number | null
          receita: number | null
          roi: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          alcance?: number | null
          campanha_id: string
          campanha_nome?: string | null
          cliques?: number | null
          conversoes?: number | null
          cpc?: number | null
          cpm?: number | null
          ctr?: number | null
          data: string
          id?: string
          impressoes?: number | null
          investimento?: number | null
          receita?: number | null
          roi?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          alcance?: number | null
          campanha_id?: string
          campanha_nome?: string | null
          cliques?: number | null
          conversoes?: number | null
          cpc?: number | null
          cpm?: number | null
          ctr?: number | null
          data?: string
          id?: string
          impressoes?: number | null
          investimento?: number | null
          receita?: number | null
          roi?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      financial_categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_personal: boolean | null
          name: string
          parent_id: string | null
          type: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_personal?: boolean | null
          name: string
          parent_id?: string | null
          type: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_personal?: boolean | null
          name?: string
          parent_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_goals: {
        Row: {
          category: string
          color: string | null
          created_at: string
          current_amount: number
          deadline: string | null
          description: string | null
          icon: string | null
          id: string
          priority: string
          status: string
          target_amount: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          color?: string | null
          created_at?: string
          current_amount?: number
          deadline?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          priority?: string
          status?: string
          target_amount?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string
          current_amount?: number
          deadline?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          priority?: string
          status?: string
          target_amount?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fluxo_caixa: {
        Row: {
          conta_bancaria_id: string | null
          created_at: string
          data: string
          id: string
          saldo_final: number | null
          saldo_inicial: number | null
          total_entradas: number | null
          total_saidas: number | null
          updated_at: string
        }
        Insert: {
          conta_bancaria_id?: string | null
          created_at?: string
          data: string
          id?: string
          saldo_final?: number | null
          saldo_inicial?: number | null
          total_entradas?: number | null
          total_saidas?: number | null
          updated_at?: string
        }
        Update: {
          conta_bancaria_id?: string | null
          created_at?: string
          data?: string
          id?: string
          saldo_final?: number | null
          saldo_inicial?: number | null
          total_entradas?: number | null
          total_saidas?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fluxo_caixa_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      folha_monthly_closures: {
        Row: {
          ano: number
          created_at: string | null
          fechado_por: string | null
          id: string
          mes: number
          observacoes: string | null
          por_departamento: Json | null
          qtd_funcionarios: number | null
          total_beneficios: number | null
          total_descontos: number | null
          total_liquido: number | null
          total_salarios: number | null
          updated_at: string | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          mes: number
          observacoes?: string | null
          por_departamento?: Json | null
          qtd_funcionarios?: number | null
          total_beneficios?: number | null
          total_descontos?: number | null
          total_liquido?: number | null
          total_salarios?: number | null
          updated_at?: string | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          mes?: number
          observacoes?: string | null
          por_departamento?: Json | null
          qtd_funcionarios?: number | null
          total_beneficios?: number | null
          total_descontos?: number | null
          total_liquido?: number | null
          total_salarios?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      folha_pagamento: {
        Row: {
          ano_referencia: number
          created_at: string
          created_by: string | null
          data_pagamento: string | null
          desconto_faltas: number | null
          employee_id: number | null
          faltas: number | null
          fgts: number | null
          horas_extras: number | null
          id: string
          inss: number | null
          irrf: number | null
          mes_referencia: number
          observacoes: string | null
          outros_beneficios: number | null
          outros_descontos: number | null
          salario_bruto: number
          salario_liquido: number | null
          status: string | null
          updated_at: string
          vale_refeicao: number | null
          vale_transporte: number | null
          valor_horas_extras: number | null
        }
        Insert: {
          ano_referencia: number
          created_at?: string
          created_by?: string | null
          data_pagamento?: string | null
          desconto_faltas?: number | null
          employee_id?: number | null
          faltas?: number | null
          fgts?: number | null
          horas_extras?: number | null
          id?: string
          inss?: number | null
          irrf?: number | null
          mes_referencia: number
          observacoes?: string | null
          outros_beneficios?: number | null
          outros_descontos?: number | null
          salario_bruto?: number
          salario_liquido?: number | null
          status?: string | null
          updated_at?: string
          vale_refeicao?: number | null
          vale_transporte?: number | null
          valor_horas_extras?: number | null
        }
        Update: {
          ano_referencia?: number
          created_at?: string
          created_by?: string | null
          data_pagamento?: string | null
          desconto_faltas?: number | null
          employee_id?: number | null
          faltas?: number | null
          fgts?: number | null
          horas_extras?: number | null
          id?: string
          inss?: number | null
          irrf?: number | null
          mes_referencia?: number
          observacoes?: string | null
          outros_beneficios?: number | null
          outros_descontos?: number | null
          salario_bruto?: number
          salario_liquido?: number | null
          status?: string | null
          updated_at?: string
          vale_refeicao?: number | null
          vale_transporte?: number | null
          valor_horas_extras?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "folha_pagamento_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folha_pagamento_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folha_pagamento_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      folha_yearly_closures: {
        Row: {
          ano: number
          created_at: string | null
          custo_total_ano: number | null
          fechado_por: string | null
          id: string
          meses_fechados: number | null
          observacoes: string | null
          total_13: number | null
          total_beneficios: number | null
          total_ferias: number | null
          total_salarios: number | null
          updated_at: string | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          custo_total_ano?: number | null
          fechado_por?: string | null
          id?: string
          meses_fechados?: number | null
          observacoes?: string | null
          total_13?: number | null
          total_beneficios?: number | null
          total_ferias?: number | null
          total_salarios?: number | null
          updated_at?: string | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          custo_total_ano?: number | null
          fechado_por?: string | null
          id?: string
          meses_fechados?: number | null
          observacoes?: string | null
          total_13?: number | null
          total_beneficios?: number | null
          total_ferias?: number | null
          total_salarios?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gastos: {
        Row: {
          categoria: string | null
          comprovante_url: string | null
          created_at: string | null
          created_by: string | null
          data: string | null
          descricao: string
          fonte: string | null
          fornecedor: string | null
          id: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          categoria?: string | null
          comprovante_url?: string | null
          created_at?: string | null
          created_by?: string | null
          data?: string | null
          descricao: string
          fonte?: string | null
          fornecedor?: string | null
          id?: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          categoria?: string | null
          comprovante_url?: string | null
          created_at?: string | null
          created_by?: string | null
          data?: string | null
          descricao?: string
          fonte?: string | null
          fornecedor?: string | null
          id?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: []
      }
      general_documents: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          extracted_content: string | null
          extraction_date: string | null
          extraction_model: string | null
          extraction_status: string | null
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          tags: string[] | null
          title: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          extracted_content?: string | null
          extraction_date?: string | null
          extraction_model?: string | null
          extraction_status?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          extracted_content?: string | null
          extraction_date?: string | null
          extraction_model?: string | null
          extraction_status?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      goal_progress_history: {
        Row: {
          amount: number
          created_at: string
          goal_id: string
          id: string
          note: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          goal_id: string
          id?: string
          note?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          goal_id?: string
          id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_progress_history_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "financial_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      google_analytics_metrics: {
        Row: {
          avg_session_duration: number | null
          bounce_rate: number | null
          created_at: string | null
          date: string
          devices: Json | null
          direct: number | null
          id: string
          locations: Json | null
          new_users: number | null
          organic_search: number | null
          page_views: number | null
          pages_per_session: number | null
          paid_search: number | null
          referral: number | null
          sessions: number | null
          social: number | null
          top_pages: Json | null
          updated_at: string | null
          users: number | null
        }
        Insert: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          created_at?: string | null
          date?: string
          devices?: Json | null
          direct?: number | null
          id?: string
          locations?: Json | null
          new_users?: number | null
          organic_search?: number | null
          page_views?: number | null
          pages_per_session?: number | null
          paid_search?: number | null
          referral?: number | null
          sessions?: number | null
          social?: number | null
          top_pages?: Json | null
          updated_at?: string | null
          users?: number | null
        }
        Update: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          created_at?: string | null
          date?: string
          devices?: Json | null
          direct?: number | null
          id?: string
          locations?: Json | null
          new_users?: number | null
          organic_search?: number | null
          page_views?: number | null
          pages_per_session?: number | null
          paid_search?: number | null
          referral?: number | null
          sessions?: number | null
          social?: number | null
          top_pages?: Json | null
          updated_at?: string | null
          users?: number | null
        }
        Relationships: []
      }
      hotmart_monthly_closures: {
        Row: {
          ano: number
          created_at: string | null
          fechado_por: string | null
          id: string
          mes: number
          observacoes: string | null
          por_afiliado: Json | null
          por_produto: Json | null
          receita_bruta: number | null
          receita_liquida: number | null
          total_aprovadas: number | null
          total_canceladas: number | null
          total_reembolsadas: number | null
          total_transacoes: number | null
          updated_at: string | null
          valor_cancelado: number | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          mes: number
          observacoes?: string | null
          por_afiliado?: Json | null
          por_produto?: Json | null
          receita_bruta?: number | null
          receita_liquida?: number | null
          total_aprovadas?: number | null
          total_canceladas?: number | null
          total_reembolsadas?: number | null
          total_transacoes?: number | null
          updated_at?: string | null
          valor_cancelado?: number | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          mes?: number
          observacoes?: string | null
          por_afiliado?: Json | null
          por_produto?: Json | null
          receita_bruta?: number | null
          receita_liquida?: number | null
          total_aprovadas?: number | null
          total_canceladas?: number | null
          total_reembolsadas?: number | null
          total_transacoes?: number | null
          updated_at?: string | null
          valor_cancelado?: number | null
        }
        Relationships: []
      }
      hotmart_yearly_closures: {
        Row: {
          ano: number
          created_at: string | null
          fechado_por: string | null
          id: string
          melhor_mes: number | null
          meses_fechados: number | null
          observacoes: string | null
          pior_mes: number | null
          receita_ano: number | null
          total_aprovadas: number | null
          total_canceladas: number | null
          total_transacoes: number | null
          updated_at: string | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          melhor_mes?: number | null
          meses_fechados?: number | null
          observacoes?: string | null
          pior_mes?: number | null
          receita_ano?: number | null
          total_aprovadas?: number | null
          total_canceladas?: number | null
          total_transacoes?: number | null
          updated_at?: string | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          melhor_mes?: number | null
          meses_fechados?: number | null
          observacoes?: string | null
          pior_mes?: number | null
          receita_ano?: number | null
          total_aprovadas?: number | null
          total_canceladas?: number | null
          total_transacoes?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      income: {
        Row: {
          banco: string | null
          created_at: string | null
          created_by: string | null
          fonte: string
          id: number
          mes_referencia: string | null
          valor: number
        }
        Insert: {
          banco?: string | null
          created_at?: string | null
          created_by?: string | null
          fonte: string
          id?: number
          mes_referencia?: string | null
          valor?: number
        }
        Update: {
          banco?: string | null
          created_at?: string | null
          created_by?: string | null
          fonte?: string
          id?: number
          mes_referencia?: string | null
          valor?: number
        }
        Relationships: []
      }
      instagram_metrics: {
        Row: {
          alcance: number | null
          created_at: string | null
          data: string
          engajamento_rate: number | null
          id: string
          impressoes: number | null
          novos_seguidores: number | null
          posts_count: number | null
          seguidores: number | null
          visualizacoes_perfil: number | null
        }
        Insert: {
          alcance?: number | null
          created_at?: string | null
          data: string
          engajamento_rate?: number | null
          id?: string
          impressoes?: number | null
          novos_seguidores?: number | null
          posts_count?: number | null
          seguidores?: number | null
          visualizacoes_perfil?: number | null
        }
        Update: {
          alcance?: number | null
          created_at?: string | null
          data?: string
          engajamento_rate?: number | null
          id?: string
          impressoes?: number | null
          novos_seguidores?: number | null
          posts_count?: number | null
          seguidores?: number | null
          visualizacoes_perfil?: number | null
        }
        Relationships: []
      }
      integration_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          processed: boolean
          processed_at: string | null
          source: string
          source_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          source: string
          source_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          source?: string
          source_id?: string | null
        }
        Relationships: []
      }
      lesson_annotations: {
        Row: {
          content_html: string | null
          created_at: string
          id: string
          lesson_id: string
          timestamp_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content_html?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          timestamp_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content_html?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          timestamp_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_annotations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_annotations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_annotations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_attempts: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          id: string
          last_position_seconds: number | null
          lesson_id: string
          updated_at: string
          user_id: string
          watch_time_seconds: number | null
          xp_earned: number | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          last_position_seconds?: number | null
          lesson_id: string
          updated_at?: string
          user_id: string
          watch_time_seconds?: number | null
          xp_earned?: number | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          last_position_seconds?: number | null
          lesson_id?: string
          updated_at?: string
          user_id?: string
          watch_time_seconds?: number | null
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_notes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          lesson_id: string
          timestamp_seconds: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          lesson_id: string
          timestamp_seconds?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          lesson_id?: string
          timestamp_seconds?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          avaliacao: number | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          last_position_seconds: number | null
          lesson_id: string
          notas: string | null
          updated_at: string | null
          user_id: string
          watch_time_seconds: number | null
        }
        Insert: {
          avaliacao?: number | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_position_seconds?: number | null
          lesson_id: string
          notas?: string | null
          updated_at?: string | null
          user_id: string
          watch_time_seconds?: number | null
        }
        Update: {
          avaliacao?: number | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_position_seconds?: number | null
          lesson_id?: string
          notas?: string | null
          updated_at?: string | null
          user_id?: string
          watch_time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          area_id: string | null
          content: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_free: boolean | null
          material_nome: string | null
          material_url: string | null
          module_id: string
          position: number | null
          status: string | null
          tipo: string | null
          title: string
          transcript: string | null
          updated_at: string | null
          video_duration: number | null
          video_url: string | null
          xp_reward: number | null
        }
        Insert: {
          area_id?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_free?: boolean | null
          material_nome?: string | null
          material_url?: string | null
          module_id: string
          position?: number | null
          status?: string | null
          tipo?: string | null
          title: string
          transcript?: string | null
          updated_at?: string | null
          video_duration?: number | null
          video_url?: string | null
          xp_reward?: number | null
        }
        Update: {
          area_id?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_free?: boolean | null
          material_nome?: string | null
          material_url?: string | null
          module_id?: string
          position?: number | null
          status?: string | null
          tipo?: string | null
          title?: string
          transcript?: string | null
          updated_at?: string | null
          video_duration?: number | null
          video_url?: string | null
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      live_chat_bans: {
        Row: {
          banned_by: string | null
          created_at: string | null
          id: string
          is_ban: boolean | null
          live_id: string
          reason: string | null
          timeout_until: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          banned_by?: string | null
          created_at?: string | null
          id?: string
          is_ban?: boolean | null
          live_id: string
          reason?: string | null
          timeout_until?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          banned_by?: string | null
          created_at?: string | null
          id?: string
          is_ban?: boolean | null
          live_id?: string
          reason?: string | null
          timeout_until?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      live_chat_messages: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          is_deleted: boolean | null
          is_highlighted: boolean | null
          is_moderator: boolean | null
          is_pinned: boolean | null
          live_id: string
          message: string
          updated_at: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_highlighted?: boolean | null
          is_moderator?: boolean | null
          is_pinned?: boolean | null
          live_id: string
          message: string
          updated_at?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_highlighted?: boolean | null
          is_moderator?: boolean | null
          is_pinned?: boolean | null
          live_id?: string
          message?: string
          updated_at?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      live_chat_settings: {
        Row: {
          chat_enabled: boolean | null
          created_at: string | null
          follower_only: boolean | null
          id: string
          live_id: string
          slow_mode: boolean | null
          slow_mode_interval: number | null
          subscriber_only: boolean | null
          updated_at: string | null
        }
        Insert: {
          chat_enabled?: boolean | null
          created_at?: string | null
          follower_only?: boolean | null
          id?: string
          live_id: string
          slow_mode?: boolean | null
          slow_mode_interval?: number | null
          subscriber_only?: boolean | null
          updated_at?: string | null
        }
        Update: {
          chat_enabled?: boolean | null
          created_at?: string | null
          follower_only?: boolean | null
          id?: string
          live_id?: string
          slow_mode?: boolean | null
          slow_mode_interval?: number | null
          subscriber_only?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      logs_integracao_detalhado: {
        Row: {
          acoes_executadas: Json | null
          created_at: string
          erro_detalhado: string | null
          etapa_atual: string | null
          etapas_concluidas: Json | null
          event: string
          ias_acionadas: string[] | null
          id: string
          ip_origem: string | null
          payload_entrada: Json | null
          payload_saida: Json | null
          source: string
          stack_trace: string | null
          status: string
          tempo_total_ms: number | null
          updated_at: string
          user_agent: string | null
          webhook_queue_id: string | null
        }
        Insert: {
          acoes_executadas?: Json | null
          created_at?: string
          erro_detalhado?: string | null
          etapa_atual?: string | null
          etapas_concluidas?: Json | null
          event: string
          ias_acionadas?: string[] | null
          id?: string
          ip_origem?: string | null
          payload_entrada?: Json | null
          payload_saida?: Json | null
          source: string
          stack_trace?: string | null
          status?: string
          tempo_total_ms?: number | null
          updated_at?: string
          user_agent?: string | null
          webhook_queue_id?: string | null
        }
        Update: {
          acoes_executadas?: Json | null
          created_at?: string
          erro_detalhado?: string | null
          etapa_atual?: string | null
          etapas_concluidas?: Json | null
          event?: string
          ias_acionadas?: string[] | null
          id?: string
          ip_origem?: string | null
          payload_entrada?: Json | null
          payload_saida?: Json | null
          source?: string
          stack_trace?: string | null
          status?: string
          tempo_total_ms?: number | null
          updated_at?: string
          user_agent?: string | null
          webhook_queue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_integracao_detalhado_webhook_queue_id_fkey"
            columns: ["webhook_queue_id"]
            isOneToOne: false
            referencedRelation: "webhooks_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_alerts: {
        Row: {
          created_at: string | null
          dados: Json | null
          id: string
          lido: boolean | null
          mensagem: string
          resolvido: boolean | null
          severidade: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          created_at?: string | null
          dados?: Json | null
          id?: string
          lido?: boolean | null
          mensagem: string
          resolvido?: boolean | null
          severidade?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          created_at?: string | null
          dados?: Json | null
          id?: string
          lido?: boolean | null
          mensagem?: string
          resolvido?: boolean | null
          severidade?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          budget: number | null
          conversions: number | null
          created_at: string | null
          created_by: string | null
          end_date: string | null
          id: string
          leads: number | null
          name: string
          notes: string | null
          platform: string | null
          spent: number | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          conversions?: number | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          leads?: number | null
          name: string
          notes?: string | null
          platform?: string | null
          spent?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          conversions?: number | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          leads?: number | null
          name?: string
          notes?: string | null
          platform?: string | null
          spent?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      marketing_leads: {
        Row: {
          campanha_id: string | null
          canal: string | null
          convertido: boolean | null
          created_at: string | null
          data_conversao: string | null
          email: string
          id: string
          nome: string | null
          origem: string | null
          score: number | null
          status: string | null
          telefone: string | null
          updated_at: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          valor_conversao: number | null
        }
        Insert: {
          campanha_id?: string | null
          canal?: string | null
          convertido?: boolean | null
          created_at?: string | null
          data_conversao?: string | null
          email: string
          id?: string
          nome?: string | null
          origem?: string | null
          score?: number | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          valor_conversao?: number | null
        }
        Update: {
          campanha_id?: string | null
          canal?: string | null
          convertido?: boolean | null
          created_at?: string | null
          data_conversao?: string | null
          email?: string
          id?: string
          nome?: string | null
          origem?: string | null
          score?: number | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          valor_conversao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_leads_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      metricas_diarias: {
        Row: {
          acessos_plataforma: number | null
          alunos_ativos: number | null
          aulas_concluidas: number | null
          calculado_em: string
          cancelamentos: number | null
          certificados_emitidos: number | null
          comandos_ia_executados: number | null
          comandos_ia_sucesso: number | null
          created_at: string
          custo_aquisicao: number | null
          data: string
          data_referencia: string | null
          id: string
          leads_gerados: number | null
          leads_qualificados: number | null
          lucro_dia: number | null
          novos_alunos: number | null
          novos_cadastros: number | null
          novos_pagamentos: number | null
          receita_bruta: number | null
          receita_dia: number | null
          receita_liquida: number | null
          reembolsos: number | null
          taxa_conversao: number | null
          tempo_medio_processamento_ms: number | null
          ticket_medio: number | null
          total_vendas: number | null
          valor_cancelado: number | null
          valor_reembolsado: number | null
          webhooks_falha: number | null
          webhooks_processados: number | null
          webhooks_recebidos: number | null
        }
        Insert: {
          acessos_plataforma?: number | null
          alunos_ativos?: number | null
          aulas_concluidas?: number | null
          calculado_em?: string
          cancelamentos?: number | null
          certificados_emitidos?: number | null
          comandos_ia_executados?: number | null
          comandos_ia_sucesso?: number | null
          created_at?: string
          custo_aquisicao?: number | null
          data?: string
          data_referencia?: string | null
          id?: string
          leads_gerados?: number | null
          leads_qualificados?: number | null
          lucro_dia?: number | null
          novos_alunos?: number | null
          novos_cadastros?: number | null
          novos_pagamentos?: number | null
          receita_bruta?: number | null
          receita_dia?: number | null
          receita_liquida?: number | null
          reembolsos?: number | null
          taxa_conversao?: number | null
          tempo_medio_processamento_ms?: number | null
          ticket_medio?: number | null
          total_vendas?: number | null
          valor_cancelado?: number | null
          valor_reembolsado?: number | null
          webhooks_falha?: number | null
          webhooks_processados?: number | null
          webhooks_recebidos?: number | null
        }
        Update: {
          acessos_plataforma?: number | null
          alunos_ativos?: number | null
          aulas_concluidas?: number | null
          calculado_em?: string
          cancelamentos?: number | null
          certificados_emitidos?: number | null
          comandos_ia_executados?: number | null
          comandos_ia_sucesso?: number | null
          created_at?: string
          custo_aquisicao?: number | null
          data?: string
          data_referencia?: string | null
          id?: string
          leads_gerados?: number | null
          leads_qualificados?: number | null
          lucro_dia?: number | null
          novos_alunos?: number | null
          novos_cadastros?: number | null
          novos_pagamentos?: number | null
          receita_bruta?: number | null
          receita_dia?: number | null
          receita_liquida?: number | null
          reembolsos?: number | null
          taxa_conversao?: number | null
          tempo_medio_processamento_ms?: number | null
          ticket_medio?: number | null
          total_vendas?: number | null
          valor_cancelado?: number | null
          valor_reembolsado?: number | null
          webhooks_falha?: number | null
          webhooks_processados?: number | null
          webhooks_recebidos?: number | null
        }
        Relationships: []
      }
      metricas_marketing: {
        Row: {
          cac: number
          created_at: string
          created_by: string | null
          custo_aquisicao: number
          id: string
          investimento_marketing: number
          ltv: number
          mes_referencia: string
          novos_clientes: number
          observacoes: string | null
          receita_gerada: number
          roi_percentual: number
        }
        Insert: {
          cac?: number
          created_at?: string
          created_by?: string | null
          custo_aquisicao?: number
          id?: string
          investimento_marketing?: number
          ltv?: number
          mes_referencia: string
          novos_clientes?: number
          observacoes?: string | null
          receita_gerada?: number
          roi_percentual?: number
        }
        Update: {
          cac?: number
          created_at?: string
          created_by?: string | null
          custo_aquisicao?: number
          id?: string
          investimento_marketing?: number
          ltv?: number
          mes_referencia?: string
          novos_clientes?: number
          observacoes?: string | null
          receita_gerada?: number
          roi_percentual?: number
        }
        Relationships: []
      }
      modules: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          id: string
          is_published: boolean | null
          position: number | null
          status: string | null
          title: string
          updated_at: string | null
          xp_reward: number | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          position?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
          xp_reward?: number | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          position?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_xp: {
        Row: {
          created_at: string
          id: string
          lessons_completed: number | null
          month: number
          questions_answered: number | null
          streak_max: number | null
          updated_at: string
          user_id: string
          xp_earned: number
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          lessons_completed?: number | null
          month: number
          questions_answered?: number | null
          streak_max?: number | null
          updated_at?: string
          user_id: string
          xp_earned?: number
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          lessons_completed?: number | null
          month?: number
          questions_answered?: number | null
          streak_max?: number | null
          updated_at?: string
          user_id?: string
          xp_earned?: number
          year?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          expires_at: string | null
          id: string
          message: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      owner_automations: {
        Row: {
          actions: Json | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          nome: string
          run_count: number | null
          trigger_config: Json | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          actions?: Json | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          nome: string
          run_count?: number | null
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          actions?: Json | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          nome?: string
          run_count?: number | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      owner_layout_config: {
        Row: {
          config_key: string
          config_value: Json | null
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          config_key: string
          config_value?: Json | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      pagamentos_cursos: {
        Row: {
          aluno_id: string | null
          comprovante_url: string | null
          created_at: string | null
          cupom_usado: string | null
          curso_id: string | null
          data_pagamento: string | null
          data_vencimento: string | null
          enrollment_id: string | null
          forma_pagamento: string | null
          gateway: string | null
          id: string
          metadata: Json | null
          observacoes: string | null
          parcela_atual: number | null
          parcelas: number | null
          status: string | null
          transaction_id: string | null
          updated_at: string | null
          valor: number
          valor_desconto: number | null
          valor_final: number
        }
        Insert: {
          aluno_id?: string | null
          comprovante_url?: string | null
          created_at?: string | null
          cupom_usado?: string | null
          curso_id?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          enrollment_id?: string | null
          forma_pagamento?: string | null
          gateway?: string | null
          id?: string
          metadata?: Json | null
          observacoes?: string | null
          parcela_atual?: number | null
          parcelas?: number | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          valor?: number
          valor_desconto?: number | null
          valor_final?: number
        }
        Update: {
          aluno_id?: string | null
          comprovante_url?: string | null
          created_at?: string | null
          cupom_usado?: string | null
          curso_id?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          enrollment_id?: string | null
          forma_pagamento?: string | null
          gateway?: string | null
          id?: string
          metadata?: Json | null
          observacoes?: string | null
          parcela_atual?: number | null
          parcelas?: number | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          valor?: number
          valor_desconto?: number | null
          valor_final?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_cursos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_cursos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_cursos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_cursos_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          metadata: Json | null
          payment_type: string
          reference_id: string | null
          reference_type: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          payment_type: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          payment_type?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          ano: number | null
          categoria: string | null
          comprovante_url: string | null
          created_at: string
          created_by: string | null
          data_fechamento: string | null
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          dia: number | null
          fechado: boolean | null
          fechado_por: string | null
          id: string
          mes: number | null
          metodo_pagamento: string | null
          observacoes: string | null
          recorrente: boolean
          semana: number | null
          status: string
          tipo: string
          user_id: string
          valor: number
        }
        Insert: {
          ano?: number | null
          categoria?: string | null
          comprovante_url?: string | null
          created_at?: string
          created_by?: string | null
          data_fechamento?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          dia?: number | null
          fechado?: boolean | null
          fechado_por?: string | null
          id?: string
          mes?: number | null
          metodo_pagamento?: string | null
          observacoes?: string | null
          recorrente?: boolean
          semana?: number | null
          status?: string
          tipo: string
          user_id: string
          valor?: number
        }
        Update: {
          ano?: number | null
          categoria?: string | null
          comprovante_url?: string | null
          created_at?: string
          created_by?: string | null
          data_fechamento?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          dia?: number | null
          fechado?: boolean | null
          fechado_por?: string | null
          id?: string
          mes?: number | null
          metodo_pagamento?: string | null
          observacoes?: string | null
          recorrente?: boolean
          semana?: number | null
          status?: string
          tipo?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      payments_monthly_closures: {
        Row: {
          ano: number
          created_at: string
          fechado_em: string | null
          fechado_por: string | null
          id: string
          is_fechado: boolean | null
          mes: number
          observacoes: string | null
          resumo_por_metodo: Json | null
          resumo_por_tipo: Json | null
          tipo: string
          total_atrasado: number | null
          total_cancelado: number | null
          total_pagamentos: number | null
          total_pago: number | null
          total_pendente: number | null
          total_valor_atrasado: number | null
          total_valor_pago: number | null
          total_valor_pendente: number | null
          updated_at: string
        }
        Insert: {
          ano: number
          created_at?: string
          fechado_em?: string | null
          fechado_por?: string | null
          id?: string
          is_fechado?: boolean | null
          mes: number
          observacoes?: string | null
          resumo_por_metodo?: Json | null
          resumo_por_tipo?: Json | null
          tipo?: string
          total_atrasado?: number | null
          total_cancelado?: number | null
          total_pagamentos?: number | null
          total_pago?: number | null
          total_pendente?: number | null
          total_valor_atrasado?: number | null
          total_valor_pago?: number | null
          total_valor_pendente?: number | null
          updated_at?: string
        }
        Update: {
          ano?: number
          created_at?: string
          fechado_em?: string | null
          fechado_por?: string | null
          id?: string
          is_fechado?: boolean | null
          mes?: number
          observacoes?: string | null
          resumo_por_metodo?: Json | null
          resumo_por_tipo?: Json | null
          tipo?: string
          total_atrasado?: number | null
          total_cancelado?: number | null
          total_pagamentos?: number | null
          total_pago?: number | null
          total_pendente?: number | null
          total_valor_atrasado?: number | null
          total_valor_pago?: number | null
          total_valor_pendente?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      payments_yearly_closures: {
        Row: {
          ano: number
          created_at: string
          fechado_em: string | null
          fechado_por: string | null
          id: string
          is_fechado: boolean | null
          media_mensal: number | null
          melhor_mes: number | null
          melhor_mes_valor: number | null
          observacoes: string | null
          pior_mes: number | null
          pior_mes_valor: number | null
          resumo_por_metodo: Json | null
          resumo_por_tipo: Json | null
          total_meses_fechados: number | null
          total_pagamentos: number | null
          total_valor_geral: number | null
          total_valor_pago: number | null
          updated_at: string
        }
        Insert: {
          ano: number
          created_at?: string
          fechado_em?: string | null
          fechado_por?: string | null
          id?: string
          is_fechado?: boolean | null
          media_mensal?: number | null
          melhor_mes?: number | null
          melhor_mes_valor?: number | null
          observacoes?: string | null
          pior_mes?: number | null
          pior_mes_valor?: number | null
          resumo_por_metodo?: Json | null
          resumo_por_tipo?: Json | null
          total_meses_fechados?: number | null
          total_pagamentos?: number | null
          total_valor_geral?: number | null
          total_valor_pago?: number | null
          updated_at?: string
        }
        Update: {
          ano?: number
          created_at?: string
          fechado_em?: string | null
          fechado_por?: string | null
          id?: string
          is_fechado?: boolean | null
          media_mensal?: number | null
          melhor_mes?: number | null
          melhor_mes_valor?: number | null
          observacoes?: string | null
          pior_mes?: number | null
          pior_mes_valor?: number | null
          resumo_por_metodo?: Json | null
          resumo_por_tipo?: Json | null
          total_meses_fechados?: number | null
          total_pagamentos?: number | null
          total_valor_geral?: number | null
          total_valor_pago?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          cache_hit_ratio: number | null
          concurrent_users: number | null
          endpoint: string | null
          error_count: number | null
          id: string
          measured_at: string | null
          metric_type: string
          response_time_ms: number | null
          success_count: number | null
        }
        Insert: {
          cache_hit_ratio?: number | null
          concurrent_users?: number | null
          endpoint?: string | null
          error_count?: number | null
          id?: string
          measured_at?: string | null
          metric_type: string
          response_time_ms?: number | null
          success_count?: number | null
        }
        Update: {
          cache_hit_ratio?: number | null
          concurrent_users?: number | null
          endpoint?: string | null
          error_count?: number | null
          id?: string
          measured_at?: string | null
          metric_type?: string
          response_time_ms?: number | null
          success_count?: number | null
        }
        Relationships: []
      }
      permission_audit_logs: {
        Row: {
          action: string
          changed_by: string
          changed_by_email: string | null
          changed_by_name: string | null
          created_at: string
          id: string
          ip_address: string | null
          new_role: string | null
          old_role: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          action: string
          changed_by: string
          changed_by_email?: string | null
          changed_by_name?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_role?: string | null
          old_role?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          action?: string
          changed_by?: string
          changed_by_email?: string | null
          changed_by_name?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_role?: string | null
          old_role?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      personal_expenses_v2: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          date: string | null
          description: string
          id: string
          notes: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          date?: string | null
          description: string
          id?: string
          notes?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          date?: string | null
          description?: string
          id?: string
          notes?: string | null
        }
        Relationships: []
      }
      personal_extra_expenses: {
        Row: {
          categoria: Database["public"]["Enums"]["expense_category"] | null
          created_at: string | null
          data: string | null
          fonte: string | null
          id: number
          nome: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["expense_category"] | null
          created_at?: string | null
          data?: string | null
          fonte?: string | null
          id?: number
          nome: string
          user_id: string
          valor?: number
        }
        Update: {
          categoria?: Database["public"]["Enums"]["expense_category"] | null
          created_at?: string | null
          data?: string | null
          fonte?: string | null
          id?: number
          nome?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      personal_fixed_expenses: {
        Row: {
          categoria: string | null
          created_at: string | null
          id: number
          nome: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          id?: number
          nome: string
          user_id: string
          valor?: number
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          id?: number
          nome?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      personal_monthly_closures: {
        Row: {
          ano: number
          created_at: string | null
          fechado_por: string | null
          id: string
          mes: number
          observacoes: string | null
          qtd_gastos_extras: number | null
          qtd_gastos_fixos: number | null
          saldo_periodo: number | null
          total_gastos_extras: number | null
          total_gastos_fixos: number | null
          updated_at: string | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          mes: number
          observacoes?: string | null
          qtd_gastos_extras?: number | null
          qtd_gastos_fixos?: number | null
          saldo_periodo?: number | null
          total_gastos_extras?: number | null
          total_gastos_fixos?: number | null
          updated_at?: string | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          mes?: number
          observacoes?: string | null
          qtd_gastos_extras?: number | null
          qtd_gastos_fixos?: number | null
          saldo_periodo?: number | null
          total_gastos_extras?: number | null
          total_gastos_fixos?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      personal_yearly_closures: {
        Row: {
          ano: number
          created_at: string | null
          fechado_por: string | null
          id: string
          melhor_mes: number | null
          meses_fechados: number | null
          observacoes: string | null
          pior_mes: number | null
          saldo_ano: number | null
          total_gastos_extras: number | null
          total_gastos_fixos: number | null
          updated_at: string | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          melhor_mes?: number | null
          meses_fechados?: number | null
          observacoes?: string | null
          pior_mes?: number | null
          saldo_ano?: number | null
          total_gastos_extras?: number | null
          total_gastos_fixos?: number | null
          updated_at?: string | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          fechado_por?: string | null
          id?: string
          melhor_mes?: number | null
          meses_fechados?: number | null
          observacoes?: string | null
          pior_mes?: number | null
          saldo_ano?: number | null
          total_gastos_extras?: number | null
          total_gastos_fixos?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pet_vaccines: {
        Row: {
          applied_date: string | null
          created_at: string | null
          id: string
          name: string
          next_date: string | null
          notes: string | null
          pet_id: string | null
          vet_name: string | null
        }
        Insert: {
          applied_date?: string | null
          created_at?: string | null
          id?: string
          name: string
          next_date?: string | null
          notes?: string | null
          pet_id?: string | null
          vet_name?: string | null
        }
        Update: {
          applied_date?: string | null
          created_at?: string | null
          id?: string
          name?: string
          next_date?: string | null
          notes?: string | null
          pet_id?: string | null
          vet_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_vaccines_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          breed: string | null
          created_at: string | null
          id: string
          name: string
          notes: string | null
          species: string | null
          updated_at: string | null
          vet_name: string | null
          vet_phone: string | null
          weight: number | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          breed?: string | null
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          species?: string | null
          updated_at?: string | null
          vet_name?: string | null
          vet_phone?: string | null
          weight?: number | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          breed?: string | null
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          species?: string | null
          updated_at?: string | null
          vet_name?: string | null
          vet_phone?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      ponto_eletronico: {
        Row: {
          aprovado: boolean | null
          aprovado_em: string | null
          aprovado_por: string | null
          created_at: string
          data: string
          employee_id: number | null
          entrada_1: string | null
          entrada_2: string | null
          horas_extras: number | null
          horas_trabalhadas: number | null
          id: string
          justificativa: string | null
          saida_1: string | null
          saida_2: string | null
          tipo: string | null
          updated_at: string
        }
        Insert: {
          aprovado?: boolean | null
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          data: string
          employee_id?: number | null
          entrada_1?: string | null
          entrada_2?: string | null
          horas_extras?: number | null
          horas_trabalhadas?: number | null
          id?: string
          justificativa?: string | null
          saida_1?: string | null
          saida_2?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          aprovado?: boolean | null
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          data?: string
          employee_id?: number | null
          entrada_1?: string | null
          entrada_2?: string | null
          horas_extras?: number | null
          horas_trabalhadas?: number | null
          id?: string
          justificativa?: string | null
          saida_1?: string | null
          saida_2?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ponto_eletronico_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ponto_eletronico_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ponto_eletronico_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      professor_checklists: {
        Row: {
          created_at: string
          id: string
          itens: Json
          observacoes: string | null
          professor_id: string
          semana_inicio: string
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          itens?: Json
          observacoes?: string | null
          professor_id: string
          semana_inicio: string
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          itens?: Json
          observacoes?: string | null
          professor_id?: string
          semana_inicio?: string
          status?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          access_expires_at: string | null
          avatar_url: string | null
          bio: string | null
          churn_risk_score: number | null
          cpf: string | null
          created_at: string | null
          current_focus_area_id: string | null
          email: string | null
          id: string
          is_online: boolean | null
          last_activity_at: string | null
          last_login_at: string | null
          learning_style: string | null
          level: number | null
          nome: string
          phone: string | null
          preferences: Json | null
          streak_days: number | null
          study_preferences: Json | null
          updated_at: string | null
          xp_total: number | null
        }
        Insert: {
          access_expires_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          churn_risk_score?: number | null
          cpf?: string | null
          created_at?: string | null
          current_focus_area_id?: string | null
          email?: string | null
          id: string
          is_online?: boolean | null
          last_activity_at?: string | null
          last_login_at?: string | null
          learning_style?: string | null
          level?: number | null
          nome: string
          phone?: string | null
          preferences?: Json | null
          streak_days?: number | null
          study_preferences?: Json | null
          updated_at?: string | null
          xp_total?: number | null
        }
        Update: {
          access_expires_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          churn_risk_score?: number | null
          cpf?: string | null
          created_at?: string | null
          current_focus_area_id?: string | null
          email?: string | null
          id?: string
          is_online?: boolean | null
          last_activity_at?: string | null
          last_login_at?: string | null
          learning_style?: string | null
          level?: number | null
          nome?: string
          phone?: string | null
          preferences?: Json | null
          streak_days?: number | null
          study_preferences?: Json | null
          updated_at?: string | null
          xp_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_focus_area_fkey"
            columns: ["current_focus_area_id"]
            isOneToOne: false
            referencedRelation: "study_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      question_attempts: {
        Row: {
          attempt_number: number | null
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          selected_answer: string
          time_spent_seconds: number | null
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          attempt_number?: number | null
          created_at?: string
          id?: string
          is_correct: boolean
          question_id: string
          selected_answer: string
          time_spent_seconds?: number | null
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          attempt_number?: number | null
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_answer?: string
          time_spent_seconds?: number | null
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "question_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "sanctuary_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          ano: number | null
          area_id: string | null
          banca: string | null
          correct_answer: string
          created_at: string
          difficulty: Database["public"]["Enums"]["question_difficulty"] | null
          explanation: string | null
          id: string
          is_active: boolean | null
          lesson_id: string | null
          options: Json
          points: number | null
          position: number | null
          question_text: string
          question_type: string | null
          quiz_id: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          ano?: number | null
          area_id?: string | null
          banca?: string | null
          correct_answer: string
          created_at?: string
          difficulty?: Database["public"]["Enums"]["question_difficulty"] | null
          explanation?: string | null
          id?: string
          is_active?: boolean | null
          lesson_id?: string | null
          options?: Json
          points?: number | null
          position?: number | null
          question_text: string
          question_type?: string | null
          quiz_id?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          ano?: number | null
          area_id?: string | null
          banca?: string | null
          correct_answer?: string
          created_at?: string
          difficulty?: Database["public"]["Enums"]["question_difficulty"] | null
          explanation?: string | null
          id?: string
          is_active?: boolean | null
          lesson_id?: string | null
          options?: Json
          points?: number | null
          position?: number | null
          question_text?: string
          question_type?: string | null
          quiz_id?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_answers: {
        Row: {
          answered_at: string | null
          attempt_id: string
          id: string
          is_correct: boolean | null
          points_earned: number | null
          question_id: string
          user_answer: string | null
        }
        Insert: {
          answered_at?: string | null
          attempt_id: string
          id?: string
          is_correct?: boolean | null
          points_earned?: number | null
          question_id: string
          user_answer?: string | null
        }
        Update: {
          answered_at?: string | null
          attempt_id?: string
          id?: string
          is_correct?: boolean | null
          points_earned?: number | null
          question_id?: string
          user_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          completed_at: string | null
          id: string
          max_score: number | null
          passed: boolean | null
          percentage: number | null
          quiz_id: string
          score: number | null
          started_at: string | null
          time_spent_seconds: number | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          id?: string
          max_score?: number | null
          passed?: boolean | null
          percentage?: number | null
          quiz_id: string
          score?: number | null
          started_at?: string | null
          time_spent_seconds?: number | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          id?: string
          max_score?: number | null
          passed?: boolean | null
          percentage?: number | null
          quiz_id?: string
          score?: number | null
          started_at?: string | null
          time_spent_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: string | null
          created_at: string | null
          difficulty: string | null
          explanation: string | null
          id: string
          options: Json | null
          points: number | null
          position: number | null
          question_text: string
          question_type: string | null
          quiz_id: string
          topic: string | null
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          options?: Json | null
          points?: number | null
          position?: number | null
          question_text: string
          question_type?: string | null
          quiz_id: string
          topic?: string | null
        }
        Update: {
          correct_answer?: string | null
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          options?: Json | null
          points?: number | null
          position?: number | null
          question_text?: string
          question_type?: string | null
          quiz_id?: string
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          course_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_published: boolean | null
          max_attempts: number | null
          module_id: string | null
          passing_score: number | null
          quiz_type: string | null
          show_correct_answers: boolean | null
          shuffle_questions: boolean | null
          time_limit_minutes: number | null
          title: string
          updated_at: string | null
          xp_reward: number | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          max_attempts?: number | null
          module_id?: string | null
          passing_score?: number | null
          quiz_type?: string | null
          show_correct_answers?: boolean | null
          shuffle_questions?: boolean | null
          time_limit_minutes?: number | null
          title: string
          updated_at?: string | null
          xp_reward?: number | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          max_attempts?: number | null
          module_id?: string | null
          passing_score?: number | null
          quiz_type?: string | null
          show_correct_answers?: boolean | null
          shuffle_questions?: boolean | null
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string | null
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_config: {
        Row: {
          burst_limit: number | null
          cooldown_seconds: number | null
          created_at: string | null
          endpoint: string
          id: string
          is_active: boolean | null
          requests_per_hour: number | null
          requests_per_minute: number | null
          role: string | null
        }
        Insert: {
          burst_limit?: number | null
          cooldown_seconds?: number | null
          created_at?: string | null
          endpoint: string
          id?: string
          is_active?: boolean | null
          requests_per_hour?: number | null
          requests_per_minute?: number | null
          role?: string | null
        }
        Update: {
          burst_limit?: number | null
          cooldown_seconds?: number | null
          created_at?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean | null
          requests_per_hour?: number | null
          requests_per_minute?: number | null
          role?: string | null
        }
        Relationships: []
      }
      rate_limit_realtime: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          identifier: string
          is_throttled: boolean | null
          last_request_at: string | null
          request_count: number | null
          throttle_until: string | null
          violation_count: number | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          identifier: string
          is_throttled?: boolean | null
          last_request_at?: string | null
          request_count?: number | null
          throttle_until?: string | null
          violation_count?: number | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          identifier?: string
          is_throttled?: boolean | null
          last_request_at?: string | null
          request_count?: number | null
          throttle_until?: string | null
          violation_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      rate_limit_state: {
        Row: {
          blocked_until: string | null
          created_at: string
          endpoint: string
          id: string
          identifier: string
          request_count: number | null
          total_blocked_count: number | null
          updated_at: string
          window_start: string
        }
        Insert: {
          blocked_until?: string | null
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
          request_count?: number | null
          total_blocked_count?: number | null
          updated_at?: string
          window_start?: string
        }
        Update: {
          blocked_until?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number | null
          total_blocked_count?: number | null
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      reagents: {
        Row: {
          cas_number: string | null
          created_at: string | null
          created_by: string | null
          expiry_date: string | null
          formula: string | null
          id: string
          is_hazardous: boolean | null
          location: string | null
          min_quantity: number | null
          name: string
          quantity: number | null
          safety_notes: string | null
          supplier: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          cas_number?: string | null
          created_at?: string | null
          created_by?: string | null
          expiry_date?: string | null
          formula?: string | null
          id?: string
          is_hazardous?: boolean | null
          location?: string | null
          min_quantity?: number | null
          name: string
          quantity?: number | null
          safety_notes?: string | null
          supplier?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          cas_number?: string | null
          created_at?: string | null
          created_by?: string | null
          expiry_date?: string | null
          formula?: string | null
          id?: string
          is_hazardous?: boolean | null
          location?: string | null
          min_quantity?: number | null
          name?: string
          quantity?: number | null
          safety_notes?: string | null
          supplier?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      receipt_ocr_extractions: {
        Row: {
          amount_detected: number | null
          category_suggested: string | null
          confidence_score: number | null
          created_at: string
          date_detected: string | null
          error_message: string | null
          extracted_data: Json | null
          file_name: string
          file_url: string
          id: string
          processed_at: string | null
          status: string | null
          user_id: string
          vendor_detected: string | null
        }
        Insert: {
          amount_detected?: number | null
          category_suggested?: string | null
          confidence_score?: number | null
          created_at?: string
          date_detected?: string | null
          error_message?: string | null
          extracted_data?: Json | null
          file_name: string
          file_url: string
          id?: string
          processed_at?: string | null
          status?: string | null
          user_id: string
          vendor_detected?: string | null
        }
        Update: {
          amount_detected?: number | null
          category_suggested?: string | null
          confidence_score?: number | null
          created_at?: string
          date_detected?: string | null
          error_message?: string | null
          extracted_data?: Json | null
          file_name?: string
          file_url?: string
          id?: string
          processed_at?: string | null
          status?: string | null
          user_id?: string
          vendor_detected?: string | null
        }
        Relationships: []
      }
      relatorios_gerados: {
        Row: {
          arquivo_url: string | null
          created_at: string
          dados: Json
          descricao: string | null
          destinatarios: string[] | null
          enviado: boolean | null
          enviado_em: string | null
          formato: string | null
          gerado_por: string | null
          id: string
          periodo_fim: string | null
          periodo_inicio: string | null
          tipo: string
          titulo: string
          visualizado: boolean | null
          visualizado_em: string | null
        }
        Insert: {
          arquivo_url?: string | null
          created_at?: string
          dados: Json
          descricao?: string | null
          destinatarios?: string[] | null
          enviado?: boolean | null
          enviado_em?: string | null
          formato?: string | null
          gerado_por?: string | null
          id?: string
          periodo_fim?: string | null
          periodo_inicio?: string | null
          tipo: string
          titulo: string
          visualizado?: boolean | null
          visualizado_em?: string | null
        }
        Update: {
          arquivo_url?: string | null
          created_at?: string
          dados?: Json
          descricao?: string | null
          destinatarios?: string[] | null
          enviado?: boolean | null
          enviado_em?: string | null
          formato?: string | null
          gerado_por?: string | null
          id?: string
          periodo_fim?: string | null
          periodo_inicio?: string | null
          tipo?: string
          titulo?: string
          visualizado?: boolean | null
          visualizado_em?: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          affiliate_id: number | null
          comprador_email: string | null
          comprador_nome: string | null
          created_at: string | null
          hotmart_transaction_id: string | null
          id: number
          produto: string | null
          status: string | null
          valor: number
        }
        Insert: {
          affiliate_id?: number | null
          comprador_email?: string | null
          comprador_nome?: string | null
          created_at?: string | null
          hotmart_transaction_id?: string | null
          id?: number
          produto?: string | null
          status?: string | null
          valor?: number
        }
        Update: {
          affiliate_id?: number | null
          comprador_email?: string | null
          comprador_nome?: string | null
          created_at?: string | null
          hotmart_transaction_id?: string | null
          id?: number
          produto?: string | null
          status?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_funnel_data: {
        Row: {
          created_at: string | null
          id: string
          period: string | null
          reference_date: string | null
          stage: string
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          period?: string | null
          reference_date?: string | null
          stage: string
          value?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          period?: string | null
          reference_date?: string | null
          stage?: string
          value?: number
        }
        Relationships: []
      }
      sanctuary_questions: {
        Row: {
          area_id: string
          banca: string | null
          correct_answer: string
          created_at: string
          difficulty: string | null
          explanation: string | null
          id: string
          options: Json
          tags: string[] | null
          text: string
          year: number | null
        }
        Insert: {
          area_id: string
          banca?: string | null
          correct_answer: string
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          id?: string
          options: Json
          tags?: string[] | null
          text: string
          year?: number | null
        }
        Update: {
          area_id?: string
          banca?: string | null
          correct_answer?: string
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          id?: string
          options?: Json
          tags?: string[] | null
          text?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sanctuary_questions_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "study_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      security_access_attempts: {
        Row: {
          attempted_resource: string
          blocked: boolean | null
          created_at: string | null
          id: string
          ip_address: string | null
          reason: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          attempted_resource: string
          blocked?: boolean | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          reason?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          attempted_resource?: string
          blocked?: boolean | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          reason?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          action_category: string
          city: string | null
          correlation_id: string | null
          country_code: string | null
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          request_id: string | null
          session_id: string | null
          severity: Database["public"]["Enums"]["security_severity"]
          table_name: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          action_category?: string
          city?: string | null
          correlation_id?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          request_id?: string | null
          session_id?: string | null
          severity?: Database["public"]["Enums"]["security_severity"]
          table_name?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          action_category?: string
          city?: string | null
          correlation_id?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          request_id?: string | null
          session_id?: string | null
          severity?: Database["public"]["Enums"]["security_severity"]
          table_name?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          ip_address: string | null
          payload: Json | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          payload?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          payload?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      security_events_v2: {
        Row: {
          asn: string | null
          city: string | null
          country_code: string | null
          created_at: string
          details: Json | null
          event_type: string
          fingerprint: string | null
          id: string
          ip_address: unknown
          is_blocked: boolean | null
          resolution_notes: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          risk_score: number
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          asn?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          details?: Json | null
          event_type: string
          fingerprint?: string | null
          id?: string
          ip_address?: unknown
          is_blocked?: boolean | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_score?: number
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          asn?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          details?: Json | null
          event_type?: string
          fingerprint?: string | null
          id?: string
          ip_address?: unknown
          is_blocked?: boolean | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_score?: number
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_log_immutable: {
        Row: {
          action_taken: Database["public"]["Enums"]["security_action"] | null
          created_at: string | null
          details: Json | null
          device_fingerprint: string | null
          event_type: string
          id: string
          ip_address: unknown
          risk_score: number | null
          session_id: string | null
          severity: string | null
          threat_level: Database["public"]["Enums"]["threat_level"] | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_taken?: Database["public"]["Enums"]["security_action"] | null
          created_at?: string | null
          details?: Json | null
          device_fingerprint?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          risk_score?: number | null
          session_id?: string | null
          severity?: string | null
          threat_level?: Database["public"]["Enums"]["threat_level"] | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_taken?: Database["public"]["Enums"]["security_action"] | null
          created_at?: string | null
          details?: Json | null
          device_fingerprint?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          risk_score?: number | null
          session_id?: string | null
          severity?: string | null
          threat_level?: Database["public"]["Enums"]["threat_level"] | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sensitive_operation_limits: {
        Row: {
          id: string
          operation_type: string
          request_count: number | null
          user_id: string | null
          window_start: string | null
        }
        Insert: {
          id?: string
          operation_type: string
          request_count?: number | null
          user_id?: string | null
          window_start?: string | null
        }
        Update: {
          id?: string
          operation_type?: string
          request_count?: number | null
          user_id?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      smart_checklists: {
        Row: {
          ai_suggested: boolean | null
          category: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          due_date: string | null
          entity_id: string
          entity_type: string
          id: string
          order_index: number | null
          priority: string | null
          text: string
          updated_at: string | null
        }
        Insert: {
          ai_suggested?: boolean | null
          category?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          entity_id: string
          entity_type: string
          id?: string
          order_index?: number | null
          priority?: string | null
          text: string
          updated_at?: string | null
        }
        Update: {
          ai_suggested?: boolean | null
          category?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          order_index?: number | null
          priority?: string | null
          text?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      social_media_history: {
        Row: {
          engagement_rate: number | null
          followers: number | null
          id: string
          platform: string
          recorded_at: string
          views_count: number | null
        }
        Insert: {
          engagement_rate?: number | null
          followers?: number | null
          id?: string
          platform: string
          recorded_at?: string
          views_count?: number | null
        }
        Update: {
          engagement_rate?: number | null
          followers?: number | null
          id?: string
          platform?: string
          recorded_at?: string
          views_count?: number | null
        }
        Relationships: []
      }
      social_media_metrics: {
        Row: {
          created_at: string
          engagement_rate: number | null
          extra_data: Json | null
          followers: number | null
          following: number | null
          growth_rate: number | null
          id: string
          is_auto_fetch: boolean | null
          last_fetched_at: string | null
          platform: string
          posts_count: number | null
          profile_url: string | null
          subscribers: number | null
          updated_at: string
          username: string | null
          videos_count: number | null
          views_count: number | null
        }
        Insert: {
          created_at?: string
          engagement_rate?: number | null
          extra_data?: Json | null
          followers?: number | null
          following?: number | null
          growth_rate?: number | null
          id?: string
          is_auto_fetch?: boolean | null
          last_fetched_at?: string | null
          platform: string
          posts_count?: number | null
          profile_url?: string | null
          subscribers?: number | null
          updated_at?: string
          username?: string | null
          videos_count?: number | null
          views_count?: number | null
        }
        Update: {
          created_at?: string
          engagement_rate?: number | null
          extra_data?: Json | null
          followers?: number | null
          following?: number | null
          growth_rate?: number | null
          id?: string
          is_auto_fetch?: boolean | null
          last_fetched_at?: string | null
          platform?: string
          posts_count?: number | null
          profile_url?: string | null
          subscribers?: number | null
          updated_at?: string
          username?: string | null
          videos_count?: number | null
          views_count?: number | null
        }
        Relationships: []
      }
      students: {
        Row: {
          created_at: string | null
          curso: string | null
          email: string | null
          id: number
          nome: string
          status: string | null
          wordpress_id: string | null
        }
        Insert: {
          created_at?: string | null
          curso?: string | null
          email?: string | null
          id?: number
          nome: string
          status?: string | null
          wordpress_id?: string | null
        }
        Update: {
          created_at?: string | null
          curso?: string | null
          email?: string | null
          id?: number
          nome?: string
          status?: string | null
          wordpress_id?: string | null
        }
        Relationships: []
      }
      studio_checklist: {
        Row: {
          category: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          is_completed: boolean
          task: string
        }
        Insert: {
          category?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          task: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          task?: string
        }
        Relationships: []
      }
      study_areas: {
        Row: {
          color: string | null
          course_id: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          position: number | null
        }
        Insert: {
          color?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          position?: number | null
        }
        Update: {
          color?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "study_areas_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_areas_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "study_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      study_flashcards: {
        Row: {
          answer: string
          area_id: string | null
          created_at: string
          difficulty: number | null
          due_date: string
          elapsed_days: number | null
          id: string
          lapses: number | null
          last_review: string | null
          lesson_id: string | null
          question: string
          reps: number | null
          scheduled_days: number | null
          source: string | null
          stability: number | null
          state: string | null
          tags: string[] | null
          user_id: string
        }
        Insert: {
          answer: string
          area_id?: string | null
          created_at?: string
          difficulty?: number | null
          due_date?: string
          elapsed_days?: number | null
          id?: string
          lapses?: number | null
          last_review?: string | null
          lesson_id?: string | null
          question: string
          reps?: number | null
          scheduled_days?: number | null
          source?: string | null
          stability?: number | null
          state?: string | null
          tags?: string[] | null
          user_id: string
        }
        Update: {
          answer?: string
          area_id?: string | null
          created_at?: string
          difficulty?: number | null
          due_date?: string
          elapsed_days?: number | null
          id?: string
          lapses?: number | null
          last_review?: string | null
          lesson_id?: string | null
          question?: string
          reps?: number | null
          scheduled_days?: number | null
          source?: string | null
          stability?: number | null
          state?: string | null
          tags?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_flashcards_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "study_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_flashcards_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_flashcards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_flashcards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      synapse_integrations: {
        Row: {
          config: Json | null
          created_at: string
          error_message: string | null
          id: string
          is_active: boolean
          last_sync: string | null
          name: string
          sync_status: string | null
          type: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          is_active?: boolean
          last_sync?: string | null
          name: string
          sync_status?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          is_active?: boolean
          last_sync?: string | null
          name?: string
          sync_status?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      synapse_metrics: {
        Row: {
          category: string
          created_at: string
          id: string
          metadata: Json | null
          metric_name: string
          metric_unit: string | null
          metric_value: number
          period: string | null
          reference_date: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_unit?: string | null
          metric_value?: number
          period?: string | null
          reference_date?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number
          period?: string | null
          reference_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      synapse_transactions: {
        Row: {
          affiliate_code: string | null
          amount: number
          cnpj_origem: string | null
          created_at: string
          currency: string | null
          customer_email: string | null
          customer_name: string | null
          external_id: string | null
          id: string
          metadata: Json | null
          product_id: string | null
          product_name: string | null
          source: string
          status: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          affiliate_code?: string | null
          amount?: number
          cnpj_origem?: string | null
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          external_id?: string | null
          id?: string
          metadata?: Json | null
          product_id?: string | null
          product_name?: string | null
          source: string
          status?: string
          transaction_type?: string
          updated_at?: string
        }
        Update: {
          affiliate_code?: string | null
          amount?: number
          cnpj_origem?: string | null
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          external_id?: string | null
          id?: string
          metadata?: Json | null
          product_id?: string | null
          product_name?: string | null
          source?: string
          status?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          setting_key: string
          setting_type?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          setting_key?: string
          setting_type?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      tarefas: {
        Row: {
          concluido_em: string | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          fonte: string | null
          id: string
          lead_id: string | null
          prazo: string | null
          prioridade: string | null
          responsavel: string | null
          status: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          concluido_em?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          fonte?: string | null
          id?: string
          lead_id?: string | null
          prazo?: string | null
          prioridade?: string | null
          responsavel?: string | null
          status?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          concluido_em?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          fonte?: string | null
          id?: string
          lead_id?: string | null
          prazo?: string | null
          prioridade?: string | null
          responsavel?: string | null
          status?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: number | null
          assigned_to_user: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: number | null
          assigned_to_user?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: number | null
          assigned_to_user?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      taxes: {
        Row: {
          categoria: string | null
          created_at: string | null
          created_by: string | null
          id: number
          mes_referencia: string | null
          nome: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: number
          mes_referencia?: string | null
          nome: string
          valor?: number
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: number
          mes_referencia?: string | null
          nome?: string
          valor?: number
        }
        Relationships: []
      }
      team_chat_messages: {
        Row: {
          allowed_users: string[] | null
          attachments: Json | null
          content: string
          created_at: string
          id: string
          is_private: boolean | null
          is_read: boolean | null
          message_type: string | null
          reply_to: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          allowed_users?: string[] | null
          attachments?: Json | null
          content: string
          created_at?: string
          id?: string
          is_private?: boolean | null
          is_read?: boolean | null
          message_type?: string | null
          reply_to?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          allowed_users?: string[] | null
          attachments?: Json | null
          content?: string
          created_at?: string
          id?: string
          is_private?: boolean | null
          is_read?: boolean | null
          message_type?: string | null
          reply_to?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_chat_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "team_chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      threat_intelligence: {
        Row: {
          blocked_until: string | null
          created_at: string | null
          device_fingerprint: string | null
          id: string
          ip_address: unknown
          last_violation_at: string | null
          metadata: Json | null
          risk_score: number | null
          threat_level: Database["public"]["Enums"]["threat_level"] | null
          total_violations: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          blocked_until?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          id?: string
          ip_address?: unknown
          last_violation_at?: string | null
          metadata?: Json | null
          risk_score?: number | null
          threat_level?: Database["public"]["Enums"]["threat_level"] | null
          total_violations?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          blocked_until?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          id?: string
          ip_address?: unknown
          last_violation_at?: string | null
          metadata?: Json | null
          risk_score?: number | null
          threat_level?: Database["public"]["Enums"]["threat_level"] | null
          total_violations?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tiktok_metrics: {
        Row: {
          created_at: string
          curtidas_totais: number | null
          data: string
          engagement_rate: number | null
          id: string
          seguidores: number | null
          seguindo: number | null
          total_videos: number | null
          username: string | null
          visualizacoes_perfil: number | null
        }
        Insert: {
          created_at?: string
          curtidas_totais?: number | null
          data?: string
          engagement_rate?: number | null
          id?: string
          seguidores?: number | null
          seguindo?: number | null
          total_videos?: number | null
          username?: string | null
          visualizacoes_perfil?: number | null
        }
        Update: {
          created_at?: string
          curtidas_totais?: number | null
          data?: string
          engagement_rate?: number | null
          id?: string
          seguidores?: number | null
          seguindo?: number | null
          total_videos?: number | null
          username?: string | null
          visualizacoes_perfil?: number | null
        }
        Relationships: []
      }
      tiktok_videos: {
        Row: {
          comentarios: number | null
          compartilhamentos: number | null
          created_at: string
          descricao: string | null
          id: string
          likes: number | null
          publicado_em: string | null
          updated_at: string
          username: string | null
          video_id: string
          visualizacoes: number | null
        }
        Insert: {
          comentarios?: number | null
          compartilhamentos?: number | null
          created_at?: string
          descricao?: string | null
          id?: string
          likes?: number | null
          publicado_em?: string | null
          updated_at?: string
          username?: string | null
          video_id: string
          visualizacoes?: number | null
        }
        Update: {
          comentarios?: number | null
          compartilhamentos?: number | null
          created_at?: string
          descricao?: string | null
          id?: string
          likes?: number | null
          publicado_em?: string | null
          updated_at?: string
          username?: string | null
          video_id?: string
          visualizacoes?: number | null
        }
        Relationships: []
      }
      time_clock_absences: {
        Row: {
          absence_date: string
          absence_type: string
          approved: boolean | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          document_url: string | null
          employee_id: number
          id: string
          justification: string | null
        }
        Insert: {
          absence_date: string
          absence_type: string
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          document_url?: string | null
          employee_id: number
          id?: string
          justification?: string | null
        }
        Update: {
          absence_date?: string
          absence_type?: string
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          document_url?: string | null
          employee_id?: number
          id?: string
          justification?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_clock_absences_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_clock_absences_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_clock_absences_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      time_clock_entries: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          device_info: string | null
          employee_id: number
          entry_type: string
          id: string
          ip_address: string | null
          is_manual: boolean | null
          latitude: number | null
          location_address: string | null
          longitude: number | null
          notes: string | null
          photo_url: string | null
          registered_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          device_info?: string | null
          employee_id: number
          entry_type: string
          id?: string
          ip_address?: string | null
          is_manual?: boolean | null
          latitude?: number | null
          location_address?: string | null
          longitude?: number | null
          notes?: string | null
          photo_url?: string | null
          registered_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          device_info?: string | null
          employee_id?: number
          entry_type?: string
          id?: string
          ip_address?: string | null
          is_manual?: boolean | null
          latitude?: number | null
          location_address?: string | null
          longitude?: number | null
          notes?: string | null
          photo_url?: string | null
          registered_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_clock_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_clock_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_clock_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      time_clock_reports: {
        Row: {
          created_at: string
          early_departure_minutes: number | null
          employee_id: number
          id: string
          late_minutes: number | null
          observations: string | null
          overtime_minutes: number | null
          report_date: string
          status: string | null
          total_worked_minutes: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          early_departure_minutes?: number | null
          employee_id: number
          id?: string
          late_minutes?: number | null
          observations?: string | null
          overtime_minutes?: number | null
          report_date: string
          status?: string | null
          total_worked_minutes?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          early_departure_minutes?: number | null
          employee_id?: number
          id?: string
          late_minutes?: number | null
          observations?: string | null
          overtime_minutes?: number | null
          report_date?: string
          status?: string | null
          total_worked_minutes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_clock_reports_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_clock_reports_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_clock_reports_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      time_clock_settings: {
        Row: {
          allowed_locations: Json | null
          created_at: string
          employee_id: number
          id: string
          lunch_end_time: string | null
          lunch_start_time: string | null
          require_location: boolean | null
          require_photo: boolean | null
          tolerance_minutes: number | null
          updated_at: string
          work_end_time: string | null
          work_start_time: string | null
        }
        Insert: {
          allowed_locations?: Json | null
          created_at?: string
          employee_id: number
          id?: string
          lunch_end_time?: string | null
          lunch_start_time?: string | null
          require_location?: boolean | null
          require_photo?: boolean | null
          tolerance_minutes?: number | null
          updated_at?: string
          work_end_time?: string | null
          work_start_time?: string | null
        }
        Update: {
          allowed_locations?: Json | null
          created_at?: string
          employee_id?: number
          id?: string
          lunch_end_time?: string | null
          lunch_start_time?: string | null
          require_location?: boolean | null
          require_photo?: boolean | null
          tolerance_minutes?: number | null
          updated_at?: string
          work_end_time?: string | null
          work_start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_clock_settings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_clock_settings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_clock_settings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      time_tracking: {
        Row: {
          break_end: string | null
          break_start: string | null
          clock_in: string
          clock_out: string | null
          created_at: string | null
          employee_id: number | null
          id: string
          notes: string | null
          user_id: string | null
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          clock_in: string
          clock_out?: string | null
          created_at?: string | null
          employee_id?: number | null
          id?: string
          notes?: string | null
          user_id?: string | null
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          clock_in?: string
          clock_out?: string | null
          created_at?: string | null
          employee_id?: number | null
          id?: string
          notes?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_tracking_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_tracking_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_tracking_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      tramon_actions: {
        Row: {
          action_data: Json
          action_type: string
          conversation_id: string | null
          created_at: string
          executed_at: string | null
          id: string
          result: Json | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          action_data?: Json
          action_type: string
          conversation_id?: string | null
          created_at?: string
          executed_at?: string | null
          id?: string
          result?: Json | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          action_data?: Json
          action_type?: string
          conversation_id?: string | null
          created_at?: string
          executed_at?: string | null
          id?: string
          result?: Json | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tramon_actions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "tramon_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      tramon_command_log: {
        Row: {
          comando: string
          contexto: Json | null
          created_at: string | null
          id: string
          resposta: string | null
          sucesso: boolean | null
          tempo_execucao_ms: number | null
          user_id: string | null
        }
        Insert: {
          comando: string
          contexto?: Json | null
          created_at?: string | null
          id?: string
          resposta?: string | null
          sucesso?: boolean | null
          tempo_execucao_ms?: number | null
          user_id?: string | null
        }
        Update: {
          comando?: string
          contexto?: Json | null
          created_at?: string | null
          id?: string
          resposta?: string | null
          sucesso?: boolean | null
          tempo_execucao_ms?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      tramon_conversations: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          session_id: string
          source: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          session_id?: string
          source?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string
          source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tramon_logs: {
        Row: {
          acao: string | null
          comando: string | null
          created_at: string | null
          entidade: string | null
          id: string
          resultado: string | null
          tempo_processamento: number | null
          tipo: string | null
          user_id: string | null
        }
        Insert: {
          acao?: string | null
          comando?: string | null
          created_at?: string | null
          entidade?: string | null
          id?: string
          resultado?: string | null
          tempo_processamento?: number | null
          tipo?: string | null
          user_id?: string | null
        }
        Update: {
          acao?: string | null
          comando?: string | null
          created_at?: string | null
          entidade?: string | null
          id?: string
          resultado?: string | null
          tempo_processamento?: number | null
          tipo?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      transacoes_hotmart_completo: {
        Row: {
          affiliate_id: string | null
          affiliate_name: string | null
          buyer_cpf: string | null
          buyer_email: string
          buyer_name: string | null
          buyer_phone: string | null
          comissao_afiliado: number | null
          cpf: string | null
          created_at: string
          data_cancelamento: string | null
          data_compra: string | null
          data_confirmacao: string | null
          hotmart_fee: number | null
          id: string
          metodo_pagamento: string | null
          motivo_cancelamento: string | null
          parcelas: number | null
          product_id: string | null
          product_name: string | null
          status: string
          telefone: string | null
          transaction_id: string
          updated_at: string
          valor_bruto: number | null
          valor_liquido: number | null
          webhook_raw: Json | null
        }
        Insert: {
          affiliate_id?: string | null
          affiliate_name?: string | null
          buyer_cpf?: string | null
          buyer_email: string
          buyer_name?: string | null
          buyer_phone?: string | null
          comissao_afiliado?: number | null
          cpf?: string | null
          created_at?: string
          data_cancelamento?: string | null
          data_compra?: string | null
          data_confirmacao?: string | null
          hotmart_fee?: number | null
          id?: string
          metodo_pagamento?: string | null
          motivo_cancelamento?: string | null
          parcelas?: number | null
          product_id?: string | null
          product_name?: string | null
          status: string
          telefone?: string | null
          transaction_id: string
          updated_at?: string
          valor_bruto?: number | null
          valor_liquido?: number | null
          webhook_raw?: Json | null
        }
        Update: {
          affiliate_id?: string | null
          affiliate_name?: string | null
          buyer_cpf?: string | null
          buyer_email?: string
          buyer_name?: string | null
          buyer_phone?: string | null
          comissao_afiliado?: number | null
          cpf?: string | null
          created_at?: string
          data_cancelamento?: string | null
          data_compra?: string | null
          data_confirmacao?: string | null
          hotmart_fee?: number | null
          id?: string
          metodo_pagamento?: string | null
          motivo_cancelamento?: string | null
          parcelas?: number | null
          product_id?: string | null
          product_name?: string | null
          status?: string
          telefone?: string | null
          transaction_id?: string
          updated_at?: string
          valor_bruto?: number | null
          valor_liquido?: number | null
          webhook_raw?: Json | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          attachment_url: string | null
          category_id: string | null
          created_at: string | null
          created_by: string | null
          description: string
          due_date: string | null
          id: string
          is_personal: boolean | null
          is_recurring: boolean | null
          notes: string | null
          paid_date: string | null
          recurrence_type: string | null
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          due_date?: string | null
          id?: string
          is_personal?: boolean | null
          is_recurring?: boolean | null
          notes?: string | null
          paid_date?: string | null
          recurrence_type?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          due_date?: string | null
          id?: string
          is_personal?: boolean | null
          is_recurring?: boolean | null
          notes?: string | null
          paid_date?: string | null
          recurrence_type?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      two_factor_codes: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
          verified: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
          verified?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      universal_attachments: {
        Row: {
          ai_insights: Json | null
          ai_summary: string | null
          category: string | null
          created_at: string | null
          description: string | null
          entity_id: string
          entity_type: string
          extracted_content: string | null
          extraction_date: string | null
          extraction_model: string | null
          extraction_status: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          storage_path: string
          tags: string[] | null
          title: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          ai_insights?: Json | null
          ai_summary?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          entity_id: string
          entity_type: string
          extracted_content?: string | null
          extraction_date?: string | null
          extraction_model?: string | null
          extraction_status?: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          storage_path: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          ai_insights?: Json | null
          ai_summary?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          entity_id?: string
          entity_type?: string
          extracted_content?: string | null
          extraction_date?: string | null
          extraction_model?: string | null
          extraction_status?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          storage_path?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      url_access_rules: {
        Row: {
          allowed_roles: string[]
          created_at: string | null
          description: string | null
          domain: string
          id: string
          is_active: boolean | null
          max_risk_score: number | null
          priority: number | null
          require_mfa: boolean | null
          require_valid_subscription: boolean | null
          url_pattern: string
        }
        Insert: {
          allowed_roles: string[]
          created_at?: string | null
          description?: string | null
          domain: string
          id?: string
          is_active?: boolean | null
          max_risk_score?: number | null
          priority?: number | null
          require_mfa?: boolean | null
          require_valid_subscription?: boolean | null
          url_pattern: string
        }
        Update: {
          allowed_roles?: string[]
          created_at?: string | null
          description?: string | null
          domain?: string
          id?: string
          is_active?: boolean | null
          max_risk_score?: number | null
          priority?: number | null
          require_mfa?: boolean | null
          require_valid_subscription?: boolean | null
          url_pattern?: string
        }
        Relationships: []
      }
      user_access_expiration: {
        Row: {
          access_end_date: string
          access_start_date: string
          created_at: string | null
          days_duration: number
          extended_at: string | null
          extended_by: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          original_end_date: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_end_date?: string
          access_start_date?: string
          created_at?: string | null
          days_duration?: number
          extended_at?: string | null
          extended_by?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          original_end_date?: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_end_date?: string
          access_start_date?: string
          created_at?: string | null
          days_duration?: number
          extended_at?: string | null
          extended_by?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          original_end_date?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          browser: string | null
          created_at: string | null
          deactivated_at: string | null
          deactivated_by: string | null
          device_fingerprint: string
          device_name: string
          device_type: string | null
          first_seen_at: string | null
          id: string
          is_active: boolean | null
          is_trusted: boolean | null
          last_seen_at: string | null
          os: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          device_fingerprint: string
          device_name: string
          device_type?: string | null
          first_seen_at?: string | null
          id?: string
          is_active?: boolean | null
          is_trusted?: boolean | null
          last_seen_at?: string | null
          os?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          device_fingerprint?: string
          device_name?: string
          device_type?: string | null
          first_seen_at?: string | null
          id?: string
          is_active?: boolean | null
          is_trusted?: boolean | null
          last_seen_at?: string | null
          os?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_gamification: {
        Row: {
          badges_earned: number | null
          courses_completed: number | null
          created_at: string | null
          current_level: number | null
          current_streak: number | null
          id: string
          last_activity_date: string | null
          lessons_completed: number | null
          longest_streak: number | null
          total_xp: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          badges_earned?: number | null
          courses_completed?: number | null
          created_at?: string | null
          current_level?: number | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          lessons_completed?: number | null
          longest_streak?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          badges_earned?: number | null
          courses_completed?: number | null
          created_at?: string | null
          current_level?: number | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          lessons_completed?: number | null
          longest_streak?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_gamification_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_gamification_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mfa_settings: {
        Row: {
          backup_codes: Json | null
          created_at: string
          id: string
          last_verified_at: string | null
          mfa_enabled: boolean | null
          mfa_type: string | null
          phone_number: string | null
          totp_secret: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: Json | null
          created_at?: string
          id?: string
          last_verified_at?: string | null
          mfa_enabled?: boolean | null
          mfa_type?: string | null
          phone_number?: string | null
          totp_secret?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: Json | null
          created_at?: string
          id?: string
          last_verified_at?: string | null
          mfa_enabled?: boolean | null
          mfa_type?: string | null
          phone_number?: string | null
          totp_secret?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          browser: string | null
          device_fingerprint: string | null
          device_name: string | null
          device_type: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          is_trusted: boolean | null
          last_activity_at: string | null
          login_at: string
          logout_at: string | null
          os: string | null
          registered_at: string | null
          session_token: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          device_fingerprint?: string | null
          device_name?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          is_trusted?: boolean | null
          last_activity_at?: string | null
          login_at?: string
          logout_at?: string | null
          os?: string | null
          registered_at?: string | null
          session_token?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          device_fingerprint?: string | null
          device_name?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          is_trusted?: boolean | null
          last_activity_at?: string | null
          login_at?: string
          logout_at?: string | null
          os?: string | null
          registered_at?: string | null
          session_token?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      usuarios_wordpress_sync: {
        Row: {
          created_at: string
          data_cadastro_wp: string | null
          email: string
          grupos: Json | null
          id: string
          metadata: Json | null
          nome: string | null
          progresso_curso: number | null
          roles: Json | null
          status_acesso: string | null
          sync_error: string | null
          sync_status: string | null
          tem_pagamento_confirmado: boolean | null
          transaction_id_vinculado: string | null
          ultimo_acesso_curso: string | null
          ultimo_login: string | null
          updated_at: string
          username: string | null
          wp_user_id: number
        }
        Insert: {
          created_at?: string
          data_cadastro_wp?: string | null
          email: string
          grupos?: Json | null
          id?: string
          metadata?: Json | null
          nome?: string | null
          progresso_curso?: number | null
          roles?: Json | null
          status_acesso?: string | null
          sync_error?: string | null
          sync_status?: string | null
          tem_pagamento_confirmado?: boolean | null
          transaction_id_vinculado?: string | null
          ultimo_acesso_curso?: string | null
          ultimo_login?: string | null
          updated_at?: string
          username?: string | null
          wp_user_id: number
        }
        Update: {
          created_at?: string
          data_cadastro_wp?: string | null
          email?: string
          grupos?: Json | null
          id?: string
          metadata?: Json | null
          nome?: string | null
          progresso_curso?: number | null
          roles?: Json | null
          status_acesso?: string | null
          sync_error?: string | null
          sync_status?: string | null
          tem_pagamento_confirmado?: boolean | null
          transaction_id_vinculado?: string | null
          ultimo_acesso_curso?: string | null
          ultimo_login?: string | null
          updated_at?: string
          username?: string | null
          wp_user_id?: number
        }
        Relationships: []
      }
      vehicle_maintenance: {
        Row: {
          cost: number | null
          created_at: string | null
          description: string | null
          id: string
          km_at_service: number | null
          next_km: number | null
          next_service_date: string | null
          notes: string | null
          service_date: string | null
          type: string
          vehicle_id: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          km_at_service?: number | null
          next_km?: number | null
          next_service_date?: string | null
          notes?: string | null
          service_date?: string | null
          type: string
          vehicle_id?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          km_at_service?: number | null
          next_km?: number | null
          next_service_date?: string | null
          notes?: string | null
          service_date?: string | null
          type?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_maintenance_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          avatar_url: string | null
          brand: string | null
          color: string | null
          created_at: string | null
          current_km: number | null
          fuel_type: string | null
          id: string
          model: string | null
          name: string
          plate: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          avatar_url?: string | null
          brand?: string | null
          color?: string | null
          created_at?: string | null
          current_km?: number | null
          fuel_type?: string | null
          id?: string
          model?: string | null
          name: string
          plate?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          avatar_url?: string | null
          brand?: string | null
          color?: string | null
          created_at?: string | null
          current_km?: number | null
          fuel_type?: string | null
          id?: string
          model?: string | null
          name?: string
          plate?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      vencimentos_notificacoes: {
        Row: {
          created_at: string
          data_notificacao: string
          enviado_para: string
          erro: string | null
          id: string
          itens_ids: string[] | null
          sucesso: boolean | null
          tipo_notificacao: string
          total_itens: number
          valor_total: number
        }
        Insert: {
          created_at?: string
          data_notificacao?: string
          enviado_para: string
          erro?: string | null
          id?: string
          itens_ids?: string[] | null
          sucesso?: boolean | null
          tipo_notificacao?: string
          total_itens?: number
          valor_total?: number
        }
        Update: {
          created_at?: string
          data_notificacao?: string
          enviado_para?: string
          erro?: string | null
          id?: string
          itens_ids?: string[] | null
          sucesso?: boolean | null
          tipo_notificacao?: string
          total_itens?: number
          valor_total?: number
        }
        Relationships: []
      }
      video_signed_urls: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: unknown
          max_uses: number | null
          signed_url: string
          used_count: number | null
          user_agent: string | null
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown
          max_uses?: number | null
          signed_url: string
          used_count?: number | null
          user_agent?: string | null
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          max_uses?: number | null
          signed_url?: string
          used_count?: number | null
          user_agent?: string | null
          user_id?: string
          video_id?: string
        }
        Relationships: []
      }
      webhook_diagnostics: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          metadata: Json | null
          payload_size: number | null
          processing_time_ms: number | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          payload_size?: number | null
          processing_time_ms?: number | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          payload_size?: number | null
          processing_time_ms?: number | null
          status?: string | null
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          attempts: number | null
          event_id: string
          event_type: string | null
          id: string
          ip_address: unknown
          last_error: string | null
          max_attempts: number | null
          payload: Json | null
          processed_at: string | null
          provider: string
          received_at: string
          response: Json | null
          signature_algorithm: string | null
          signature_valid: boolean | null
          status: string
        }
        Insert: {
          attempts?: number | null
          event_id: string
          event_type?: string | null
          id?: string
          ip_address?: unknown
          last_error?: string | null
          max_attempts?: number | null
          payload?: Json | null
          processed_at?: string | null
          provider: string
          received_at?: string
          response?: Json | null
          signature_algorithm?: string | null
          signature_valid?: boolean | null
          status?: string
        }
        Update: {
          attempts?: number | null
          event_id?: string
          event_type?: string | null
          id?: string
          ip_address?: unknown
          last_error?: string | null
          max_attempts?: number | null
          payload?: Json | null
          processed_at?: string | null
          provider?: string
          received_at?: string
          response?: Json | null
          signature_algorithm?: string | null
          signature_valid?: boolean | null
          status?: string
        }
        Relationships: []
      }
      webhook_events_v2: {
        Row: {
          attempts: number | null
          event_id: string
          event_type: string | null
          id: string
          ip_address: unknown
          last_error: string | null
          max_attempts: number | null
          payload: Json | null
          processed_at: string | null
          provider: string
          received_at: string
          response: Json | null
          signature_algorithm: string | null
          signature_valid: boolean | null
          status: string
        }
        Insert: {
          attempts?: number | null
          event_id: string
          event_type?: string | null
          id?: string
          ip_address?: unknown
          last_error?: string | null
          max_attempts?: number | null
          payload?: Json | null
          processed_at?: string | null
          provider: string
          received_at?: string
          response?: Json | null
          signature_algorithm?: string | null
          signature_valid?: boolean | null
          status?: string
        }
        Update: {
          attempts?: number | null
          event_id?: string
          event_type?: string | null
          id?: string
          ip_address?: unknown
          last_error?: string | null
          max_attempts?: number | null
          payload?: Json | null
          processed_at?: string | null
          provider?: string
          received_at?: string
          response?: Json | null
          signature_algorithm?: string | null
          signature_valid?: boolean | null
          status?: string
        }
        Relationships: []
      }
      webhook_rate_limits: {
        Row: {
          created_at: string
          id: string
          ip_address: string
          request_count: number | null
          source: string
          updated_at: string
          window_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address: string
          request_count?: number | null
          source: string
          updated_at?: string
          window_start?: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string
          request_count?: number | null
          source?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      webhooks_queue: {
        Row: {
          created_at: string
          error_message: string | null
          event: string
          external_event_id: string | null
          id: string
          max_retries: number | null
          payload: Json
          processed_at: string | null
          result: Json | null
          retry_count: number | null
          source: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event: string
          external_event_id?: string | null
          id?: string
          max_retries?: number | null
          payload: Json
          processed_at?: string | null
          result?: Json | null
          retry_count?: number | null
          source: string
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event?: string
          external_event_id?: string | null
          id?: string
          max_retries?: number | null
          payload?: Json
          processed_at?: string | null
          result?: Json | null
          retry_count?: number | null
          source?: string
          status?: string
        }
        Relationships: []
      }
      website_pendencias: {
        Row: {
          area: string
          arquivos: Json | null
          created_at: string
          created_by: string | null
          data_conclusao: string | null
          data_limite: string | null
          descricao: string | null
          id: string
          prioridade: string
          responsavel: string | null
          status: string
          titulo: string
        }
        Insert: {
          area: string
          arquivos?: Json | null
          created_at?: string
          created_by?: string | null
          data_conclusao?: string | null
          data_limite?: string | null
          descricao?: string | null
          id?: string
          prioridade?: string
          responsavel?: string | null
          status?: string
          titulo: string
        }
        Update: {
          area?: string
          arquivos?: Json | null
          created_at?: string
          created_by?: string | null
          data_conclusao?: string | null
          data_limite?: string | null
          descricao?: string | null
          id?: string
          prioridade?: string
          responsavel?: string | null
          status?: string
          titulo?: string
        }
        Relationships: []
      }
      weekly_xp: {
        Row: {
          last_updated: string
          user_id: string
          week_start: string
          xp_this_week: number
        }
        Insert: {
          last_updated?: string
          user_id: string
          week_start?: string
          xp_this_week?: number
        }
        Update: {
          last_updated?: string
          user_id?: string
          week_start?: string
          xp_this_week?: number
        }
        Relationships: [
          {
            foreignKeyName: "weekly_xp_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_xp_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_attachments: {
        Row: {
          attachment_type: string
          caption: string | null
          conversation_id: string | null
          created_at: string | null
          download_error: string | null
          download_status: string | null
          duration: number | null
          file_size: number | null
          filename: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          mime_type: string | null
          public_url: string | null
          sha256: string | null
          storage_path: string | null
        }
        Insert: {
          attachment_type: string
          caption?: string | null
          conversation_id?: string | null
          created_at?: string | null
          download_error?: string | null
          download_status?: string | null
          duration?: number | null
          file_size?: number | null
          filename?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          mime_type?: string | null
          public_url?: string | null
          sha256?: string | null
          storage_path?: string | null
        }
        Update: {
          attachment_type?: string
          caption?: string | null
          conversation_id?: string | null
          created_at?: string | null
          download_error?: string | null
          download_status?: string | null
          duration?: number | null
          file_size?: number | null
          filename?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          mime_type?: string | null
          public_url?: string | null
          sha256?: string | null
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_attachments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_messages"
            referencedColumns: ["message_id"]
          },
        ]
      }
      whatsapp_conversation_history: {
        Row: {
          ai_response: string
          created_at: string
          id: string
          lead_id: string
          metadata: Json | null
          processed_by: string | null
          response_time_ms: number | null
          user_message: string
        }
        Insert: {
          ai_response: string
          created_at?: string
          id?: string
          lead_id: string
          metadata?: Json | null
          processed_by?: string | null
          response_time_ms?: number | null
          user_message: string
        }
        Update: {
          ai_response?: string
          created_at?: string
          id?: string
          lead_id?: string
          metadata?: Json | null
          processed_by?: string | null
          response_time_ms?: number | null
          user_message?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversation_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversation_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_leads_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversations: {
        Row: {
          created_at: string | null
          crm_stage: string | null
          display_name: string | null
          id: string
          last_message_at: string | null
          notes: string | null
          owner_detected: boolean | null
          owner_name: string | null
          phone: string
          session_mode: string | null
          session_started_at: string | null
          status: string | null
          tags: Json | null
          unread_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          crm_stage?: string | null
          display_name?: string | null
          id?: string
          last_message_at?: string | null
          notes?: string | null
          owner_detected?: boolean | null
          owner_name?: string | null
          phone: string
          session_mode?: string | null
          session_started_at?: string | null
          status?: string | null
          tags?: Json | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          crm_stage?: string | null
          display_name?: string | null
          id?: string
          last_message_at?: string | null
          notes?: string | null
          owner_detected?: boolean | null
          owner_name?: string | null
          phone?: string
          session_mode?: string | null
          session_started_at?: string | null
          status?: string | null
          tags?: Json | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_leads: {
        Row: {
          assigned_to: string | null
          contact_count: number
          created_at: string
          email: string | null
          external_id: string | null
          id: string
          last_ai_response: string | null
          last_contact: string
          last_message: string | null
          nome: string
          notes: string | null
          phone: string | null
          source: string
          status: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          contact_count?: number
          created_at?: string
          email?: string | null
          external_id?: string | null
          id?: string
          last_ai_response?: string | null
          last_contact?: string
          last_message?: string | null
          nome: string
          notes?: string | null
          phone?: string | null
          source?: string
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          contact_count?: number
          created_at?: string
          email?: string | null
          external_id?: string | null
          id?: string
          last_ai_response?: string | null
          last_contact?: string
          last_message?: string | null
          nome?: string
          notes?: string | null
          phone?: string | null
          source?: string
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          direction: string
          from_phone: string
          handled_by: string | null
          id: string
          is_read: boolean | null
          message_id: string
          message_text: string | null
          message_type: string | null
          raw_payload: Json | null
          timestamp: string | null
          to_phone: string | null
          trigger_detected: boolean | null
          trigger_name: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          direction: string
          from_phone: string
          handled_by?: string | null
          id?: string
          is_read?: boolean | null
          message_id: string
          message_text?: string | null
          message_type?: string | null
          raw_payload?: Json | null
          timestamp?: string | null
          to_phone?: string | null
          trigger_detected?: boolean | null
          trigger_name?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          direction?: string
          from_phone?: string
          handled_by?: string | null
          id?: string
          is_read?: boolean | null
          message_id?: string
          message_text?: string | null
          message_type?: string | null
          raw_payload?: Json | null
          timestamp?: string | null
          to_phone?: string | null
          trigger_detected?: boolean | null
          trigger_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_notifications: {
        Row: {
          created_at: string
          error_message: string | null
          external_id: string | null
          id: string
          message_content: string
          message_type: string
          metadata: Json | null
          phone_number: string
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          template_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          message_content: string
          message_type: string
          metadata?: Json | null
          phone_number: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          message_content?: string
          message_type?: string
          metadata?: Json | null
          phone_number?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      whatsapp_templates: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      woocommerce_daily_metrics: {
        Row: {
          abandoned_carts: number | null
          average_order_value: number | null
          conversion_rate: number | null
          created_at: string | null
          date: string
          id: string
          items_sold: number | null
          new_customers: number | null
          payment_methods: Json | null
          returning_customers: number | null
          top_products: Json | null
          total_orders: number | null
          total_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          abandoned_carts?: number | null
          average_order_value?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          date?: string
          id?: string
          items_sold?: number | null
          new_customers?: number | null
          payment_methods?: Json | null
          returning_customers?: number | null
          top_products?: Json | null
          total_orders?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          abandoned_carts?: number | null
          average_order_value?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          date?: string
          id?: string
          items_sold?: number | null
          new_customers?: number | null
          payment_methods?: Json | null
          returning_customers?: number | null
          top_products?: Json | null
          total_orders?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      woocommerce_orders: {
        Row: {
          billing_city: string | null
          billing_country: string | null
          billing_state: string | null
          created_at: string | null
          currency: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          date_created: string | null
          date_paid: string | null
          discount_total: number | null
          id: string
          items_count: number | null
          order_id: string
          order_number: string | null
          payment_method: string | null
          payment_method_title: string | null
          products: Json | null
          shipping_total: number | null
          status: string | null
          subtotal: number | null
          tax_total: number | null
          total: number
          updated_at: string | null
        }
        Insert: {
          billing_city?: string | null
          billing_country?: string | null
          billing_state?: string | null
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          date_created?: string | null
          date_paid?: string | null
          discount_total?: number | null
          id?: string
          items_count?: number | null
          order_id: string
          order_number?: string | null
          payment_method?: string | null
          payment_method_title?: string | null
          products?: Json | null
          shipping_total?: number | null
          status?: string | null
          subtotal?: number | null
          tax_total?: number | null
          total?: number
          updated_at?: string | null
        }
        Update: {
          billing_city?: string | null
          billing_country?: string | null
          billing_state?: string | null
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          date_created?: string | null
          date_paid?: string | null
          discount_total?: number | null
          id?: string
          items_count?: number | null
          order_id?: string
          order_number?: string | null
          payment_method?: string | null
          payment_method_title?: string | null
          products?: Json | null
          shipping_total?: number | null
          status?: string | null
          subtotal?: number | null
          tax_total?: number | null
          total?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      wordpress_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          page_url: string | null
          referrer: string | null
          user_agent: string | null
          user_email: string | null
          user_ip: string | null
          user_name: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          page_url?: string | null
          referrer?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_ip?: string | null
          user_name?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          page_url?: string | null
          referrer?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_ip?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      wordpress_metrics: {
        Row: {
          active_users: number | null
          avg_session_duration: number | null
          bounce_rate: number | null
          date: string
          id: string
          new_registrations: number | null
          page_views: number | null
          top_pages: Json | null
          total_users: number | null
          traffic_sources: Json | null
          unique_visitors: number | null
          updated_at: string
        }
        Insert: {
          active_users?: number | null
          avg_session_duration?: number | null
          bounce_rate?: number | null
          date?: string
          id?: string
          new_registrations?: number | null
          page_views?: number | null
          top_pages?: Json | null
          total_users?: number | null
          traffic_sources?: Json | null
          unique_visitors?: number | null
          updated_at?: string
        }
        Update: {
          active_users?: number | null
          avg_session_duration?: number | null
          bounce_rate?: number | null
          date?: string
          id?: string
          new_registrations?: number | null
          page_views?: number | null
          top_pages?: Json | null
          total_users?: number | null
          traffic_sources?: Json | null
          unique_visitors?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      xp_history: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          source: string
          source_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          source: string
          source_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          source?: string
          source_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xp_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_rules: {
        Row: {
          action: Database["public"]["Enums"]["event_name"]
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_daily_occurrences: number | null
          multiplier_streak: number | null
          updated_at: string | null
          xp_amount: number
        }
        Insert: {
          action: Database["public"]["Enums"]["event_name"]
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_daily_occurrences?: number | null
          multiplier_streak?: number | null
          updated_at?: string | null
          xp_amount: number
        }
        Update: {
          action?: Database["public"]["Enums"]["event_name"]
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_daily_occurrences?: number | null
          multiplier_streak?: number | null
          updated_at?: string | null
          xp_amount?: number
        }
        Relationships: []
      }
      youtube_live_attendance: {
        Row: {
          aluno_id: string | null
          id: string
          interactions: number | null
          joined_at: string | null
          left_at: string | null
          live_id: string | null
          watch_time_minutes: number | null
          xp_earned: number | null
        }
        Insert: {
          aluno_id?: string | null
          id?: string
          interactions?: number | null
          joined_at?: string | null
          left_at?: string | null
          live_id?: string | null
          watch_time_minutes?: number | null
          xp_earned?: number | null
        }
        Update: {
          aluno_id?: string | null
          id?: string
          interactions?: number | null
          joined_at?: string | null
          left_at?: string | null
          live_id?: string | null
          watch_time_minutes?: number | null
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "youtube_live_attendance_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "youtube_live_attendance_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "youtube_live_attendance_live_id_fkey"
            columns: ["live_id"]
            isOneToOne: false
            referencedRelation: "youtube_lives"
            referencedColumns: ["id"]
          },
        ]
      }
      youtube_live_chat: {
        Row: {
          author_channel_id: string | null
          author_name: string | null
          created_at: string | null
          id: string
          is_member: boolean | null
          is_moderator: boolean | null
          is_owner: boolean | null
          live_id: string | null
          message: string | null
          published_at: string | null
          super_chat_amount: number | null
          video_id: string | null
        }
        Insert: {
          author_channel_id?: string | null
          author_name?: string | null
          created_at?: string | null
          id?: string
          is_member?: boolean | null
          is_moderator?: boolean | null
          is_owner?: boolean | null
          live_id?: string | null
          message?: string | null
          published_at?: string | null
          super_chat_amount?: number | null
          video_id?: string | null
        }
        Update: {
          author_channel_id?: string | null
          author_name?: string | null
          created_at?: string | null
          id?: string
          is_member?: boolean | null
          is_moderator?: boolean | null
          is_owner?: boolean | null
          live_id?: string | null
          message?: string | null
          published_at?: string | null
          super_chat_amount?: number | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "youtube_live_chat_live_id_fkey"
            columns: ["live_id"]
            isOneToOne: false
            referencedRelation: "youtube_lives"
            referencedColumns: ["id"]
          },
        ]
      }
      youtube_lives: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          aula_id: string | null
          created_at: string | null
          curso_id: string | null
          descricao: string | null
          id: string
          max_viewers: number | null
          scheduled_start: string | null
          status: string | null
          thumbnail_url: string | null
          titulo: string
          total_chat_messages: number | null
          updated_at: string | null
          video_id: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          aula_id?: string | null
          created_at?: string | null
          curso_id?: string | null
          descricao?: string | null
          id?: string
          max_viewers?: number | null
          scheduled_start?: string | null
          status?: string | null
          thumbnail_url?: string | null
          titulo: string
          total_chat_messages?: number | null
          updated_at?: string | null
          video_id: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          aula_id?: string | null
          created_at?: string | null
          curso_id?: string | null
          descricao?: string | null
          id?: string
          max_viewers?: number | null
          scheduled_start?: string | null
          status?: string | null
          thumbnail_url?: string | null
          titulo?: string
          total_chat_messages?: number | null
          updated_at?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "youtube_lives_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      youtube_metrics: {
        Row: {
          channel_id: string | null
          channel_name: string | null
          created_at: string
          data: string
          engagement_rate: number | null
          id: string
          inscritos: number | null
          total_videos: number | null
          videos_recentes: number | null
          visualizacoes_recentes: number | null
          visualizacoes_totais: number | null
        }
        Insert: {
          channel_id?: string | null
          channel_name?: string | null
          created_at?: string
          data?: string
          engagement_rate?: number | null
          id?: string
          inscritos?: number | null
          total_videos?: number | null
          videos_recentes?: number | null
          visualizacoes_recentes?: number | null
          visualizacoes_totais?: number | null
        }
        Update: {
          channel_id?: string | null
          channel_name?: string | null
          created_at?: string
          data?: string
          engagement_rate?: number | null
          id?: string
          inscritos?: number | null
          total_videos?: number | null
          videos_recentes?: number | null
          visualizacoes_recentes?: number | null
          visualizacoes_totais?: number | null
        }
        Relationships: []
      }
      youtube_videos: {
        Row: {
          actual_start_time: string | null
          channel_id: string | null
          comentarios: number | null
          concurrent_viewers: number | null
          created_at: string
          descricao: string | null
          duracao: string | null
          id: string
          is_live: boolean | null
          likes: number | null
          live_status: string | null
          publicado_em: string | null
          scheduled_start_time: string | null
          thumbnail_url: string | null
          titulo: string | null
          updated_at: string
          video_id: string
          visualizacoes: number | null
        }
        Insert: {
          actual_start_time?: string | null
          channel_id?: string | null
          comentarios?: number | null
          concurrent_viewers?: number | null
          created_at?: string
          descricao?: string | null
          duracao?: string | null
          id?: string
          is_live?: boolean | null
          likes?: number | null
          live_status?: string | null
          publicado_em?: string | null
          scheduled_start_time?: string | null
          thumbnail_url?: string | null
          titulo?: string | null
          updated_at?: string
          video_id: string
          visualizacoes?: number | null
        }
        Update: {
          actual_start_time?: string | null
          channel_id?: string | null
          comentarios?: number | null
          concurrent_viewers?: number | null
          created_at?: string
          descricao?: string | null
          duracao?: string | null
          id?: string
          is_live?: boolean | null
          likes?: number | null
          live_status?: string | null
          publicado_em?: string | null
          scheduled_start_time?: string | null
          thumbnail_url?: string | null
          titulo?: string | null
          updated_at?: string
          video_id?: string
          visualizacoes?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      alunos_safe: {
        Row: {
          cidade: string | null
          created_at: string | null
          curso_id: string | null
          data_matricula: string | null
          email: string | null
          estado: string | null
          fonte: string | null
          id: string | null
          nome: string | null
          status: string | null
        }
        Insert: {
          cidade?: string | null
          created_at?: string | null
          curso_id?: string | null
          data_matricula?: string | null
          email?: string | null
          estado?: string | null
          fonte?: string | null
          id?: string | null
          nome?: string | null
          status?: string | null
        }
        Update: {
          cidade?: string | null
          created_at?: string | null
          curso_id?: string | null
          data_matricula?: string | null
          email?: string | null
          estado?: string | null
          fonte?: string | null
          id?: string | null
          nome?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alunos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_executivo: {
        Row: {
          afiliados_ativos: number | null
          alunos_ativos: number | null
          conversas_abertas: number | null
          despesa_mes: number | null
          funcionarios_ativos: number | null
          receita_mes: number | null
          tarefas_pendentes: number | null
        }
        Relationships: []
      }
      employees_public: {
        Row: {
          data_admissao: string | null
          funcao: string | null
          horario_trabalho: string | null
          id: number | null
          nome: string | null
          setor: Database["public"]["Enums"]["sector_type"] | null
          status: Database["public"]["Enums"]["employee_status"] | null
        }
        Insert: {
          data_admissao?: string | null
          funcao?: string | null
          horario_trabalho?: string | null
          id?: number | null
          nome?: string | null
          setor?: Database["public"]["Enums"]["sector_type"] | null
          status?: Database["public"]["Enums"]["employee_status"] | null
        }
        Update: {
          data_admissao?: string | null
          funcao?: string | null
          horario_trabalho?: string | null
          id?: number | null
          nome?: string | null
          setor?: Database["public"]["Enums"]["sector_type"] | null
          status?: Database["public"]["Enums"]["employee_status"] | null
        }
        Relationships: []
      }
      employees_safe: {
        Row: {
          data_admissao: string | null
          email: string | null
          funcao: string | null
          horario_trabalho: string | null
          id: number | null
          nome: string | null
          responsabilidades: string | null
          salario: number | null
          setor: Database["public"]["Enums"]["sector_type"] | null
          status: Database["public"]["Enums"]["employee_status"] | null
          telefone: string | null
        }
        Relationships: []
      }
      metricas_afiliados: {
        Row: {
          afiliados_ativos: number | null
          comissoes_totais: number | null
          percentual_medio: number | null
          total_afiliados: number | null
          vendas_totais: number | null
        }
        Relationships: []
      }
      metricas_alunos: {
        Row: {
          alunos_ativos: number | null
          alunos_cancelados: number | null
          alunos_concluidos: number | null
          receita_total: number | null
          ticket_medio: number | null
          total_alunos: number | null
          vindos_hotmart: number | null
        }
        Relationships: []
      }
      metricas_funcionarios: {
        Row: {
          folha_mensal: number | null
          funcionarios_afastados: number | null
          funcionarios_ativos: number | null
          funcionarios_ferias: number | null
          total_funcionarios: number | null
          total_setores: number | null
        }
        Relationships: []
      }
      mv_dashboard_stats_v2: {
        Row: {
          afiliados_ativos: number | null
          alunos_ativos: number | null
          despesa_mes: number | null
          funcionarios_ativos: number | null
          receita_mes: number | null
          tarefas_hoje: number | null
          updated_at: string | null
          usuarios_online: number | null
          vendas_mes: number | null
        }
        Relationships: []
      }
      mv_realtime_stats: {
        Row: {
          alunos_ativos: number | null
          funcionarios_ativos: number | null
          receita_mes: number | null
          updated_at: string | null
          usuarios_online: number | null
          vendas_mes: number | null
        }
        Relationships: []
      }
      owner_activity_summary: {
        Row: {
          action: string | null
          data: string | null
          total: number | null
          usuarios_unicos: number | null
        }
        Relationships: []
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          id: string | null
          is_online: boolean | null
          nome: string | null
        }
        Insert: {
          avatar_url?: string | null
          id?: string | null
          is_online?: boolean | null
          nome?: string | null
        }
        Update: {
          avatar_url?: string | null
          id?: string | null
          is_online?: boolean | null
          nome?: string | null
        }
        Relationships: []
      }
      resumo_financeiro: {
        Row: {
          despesas: number | null
          lucro: number | null
          receitas: number | null
          ticket_medio: number | null
          total_transacoes: number | null
        }
        Relationships: []
      }
      security_dashboard: {
        Row: {
          metric: string | null
          value: string | null
        }
        Relationships: []
      }
      v_dashboard_consolidado: {
        Row: {
          afiliados_ativos: number | null
          alunos_ativos: number | null
          alunos_inativos: number | null
          comissoes_pagas: number | null
          comissoes_pendentes: number | null
          despesas_extras_mes: number | null
          despesas_fixas_mes: number | null
          funcionarios_ativos: number | null
          novos_alunos_mes: number | null
          receita_mes: number | null
          updated_at: string | null
          vendas_mes: number | null
        }
        Relationships: []
      }
      whatsapp_leads_dashboard: {
        Row: {
          contact_count: number | null
          created_at: string | null
          id: string | null
          last_contact: string | null
          nome: string | null
          phone: string | null
          source: string | null
          status: string | null
        }
        Insert: {
          contact_count?: number | null
          created_at?: string | null
          id?: string | null
          last_contact?: string | null
          nome?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
        }
        Update: {
          contact_count?: number | null
          created_at?: string | null
          id?: string | null
          last_contact?: string | null
          nome?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_user_xp: {
        Args: {
          p_amount: number
          p_description?: string
          p_source: string
          p_source_id?: string
          p_user_id: string
        }
        Returns: number
      }
      admin_get_all_devices:
        | { Args: { p_limit?: number; p_offset?: number }; Returns: Json }
        | {
            Args: {
              p_limit?: number
              p_offset?: number
              p_only_active?: boolean
            }
            Returns: Json
          }
      admin_get_blocked_attempts: {
        Args: { p_limit?: number; p_only_unresolved?: boolean }
        Returns: Json
      }
      admin_get_device_stats: { Args: never; Returns: Json }
      admin_list_beta_users: {
        Args: never
        Returns: {
          access_end: string
          access_start: string
          days_remaining: number
          email: string
          is_active: boolean
          is_expired: boolean
          nome: string
          user_id: string
        }[]
      }
      analyze_slow_queries: {
        Args: never
        Returns: {
          calls: number
          mean_time: number
          query_text: string
          total_time: number
        }[]
      }
      audit_rls_coverage: {
        Args: never
        Returns: {
          has_delete_policy: boolean
          has_insert_policy: boolean
          has_select_policy: boolean
          has_update_policy: boolean
          policy_count: number
          risk_level: string
          rls_enabled: boolean
          table_name: string
        }[]
      }
      audit_rls_coverage_v2: {
        Args: never
        Returns: {
          has_delete_policy: boolean
          has_insert_policy: boolean
          has_select_policy: boolean
          has_update_policy: boolean
          policy_count: number
          risk_level: string
          rls_enabled: boolean
          table_name: string
        }[]
      }
      auto_cleanup_for_load: { Args: never; Returns: undefined }
      can_access_attachment: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: boolean
      }
      can_access_sanctuary: { Args: { p_user_id: string }; Returns: boolean }
      can_access_url: {
        Args: { p_url: string; p_user_id?: string }
        Returns: boolean
      }
      can_access_url_v2: {
        Args: { p_url: string; p_user_id?: string }
        Returns: boolean
      }
      can_edit_content: { Args: { _user_id?: string }; Returns: boolean }
      can_manage_documents: { Args: { _user_id?: string }; Returns: boolean }
      can_use_god_mode: { Args: { _user_id?: string }; Returns: boolean }
      can_view_all_data: { Args: { _user_id?: string }; Returns: boolean }
      can_view_financial: { Args: { _user_id: string }; Returns: boolean }
      can_view_personal: { Args: { _user_id: string }; Returns: boolean }
      check_advanced_rate_limit: {
        Args: {
          p_block_seconds?: number
          p_endpoint: string
          p_identifier: string
          p_max_requests?: number
          p_window_seconds?: number
        }
        Returns: Json
      }
      check_and_update_overdue_expenses: { Args: never; Returns: undefined }
      check_api_rate_limit: {
        Args: {
          p_client_id: string
          p_endpoint: string
          p_limit?: number
          p_window_seconds?: number
        }
        Returns: boolean
      }
      check_beta_access: { Args: { _user_id: string }; Returns: Json }
      check_chat_rate_limit: {
        Args: {
          p_interval_seconds?: number
          p_live_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      check_is_owner_email: { Args: { p_user_id: string }; Returns: boolean }
      check_rate_limit: {
        Args: {
          p_max_requests?: number
          p_operation: string
          p_window_minutes?: number
        }
        Returns: boolean
      }
      check_rate_limit_v2: {
        Args: {
          p_block_seconds?: number
          p_endpoint: string
          p_identifier: string
          p_max_requests?: number
          p_window_seconds?: number
        }
        Returns: Json
      }
      check_rate_limit_v3: {
        Args: { p_endpoint: string; p_identifier: string; p_role?: string }
        Returns: {
          allowed: boolean
          remaining: number
          retry_after: number
        }[]
      }
      check_url_access_v3: {
        Args: { p_domain?: string; p_url: string; p_user_id: string }
        Returns: {
          allowed: boolean
          reason: string
          redirect_to: string
        }[]
      }
      check_webhook_idempotency: {
        Args: {
          p_event_id: string
          p_event_type?: string
          p_ip_address?: unknown
          p_payload?: Json
          p_provider: string
          p_signature_valid?: boolean
        }
        Returns: Json
      }
      check_webhook_idempotency_v2: {
        Args: {
          p_event_id: string
          p_event_type?: string
          p_ip_address?: unknown
          p_payload?: Json
          p_provider: string
          p_signature_valid?: boolean
        }
        Returns: Json
      }
      claim_next_event: {
        Args: {
          p_consumer_name: string
          p_event_types: Database["public"]["Enums"]["event_name"][]
        }
        Returns: {
          created_at: string
          entity_id: string
          entity_type: string
          event_id: number
          event_name: Database["public"]["Enums"]["event_name"]
          payload: Json
          user_id: string
        }[]
      }
      cleanup_expired_2fa_codes: { Args: never; Returns: undefined }
      cleanup_expired_sessions: { Args: never; Returns: number }
      cleanup_expired_sessions_v2: { Args: never; Returns: number }
      cleanup_expired_signed_urls: { Args: never; Returns: number }
      cleanup_expired_timeouts: { Args: never; Returns: number }
      cleanup_old_chat_messages: { Args: never; Returns: number }
      cleanup_old_location_data: { Args: never; Returns: undefined }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      cleanup_old_rate_limits_v2: { Args: never; Returns: undefined }
      cleanup_old_security_events: { Args: never; Returns: number }
      cleanup_old_security_events_v2: { Args: never; Returns: number }
      cleanup_old_sensitive_data: { Args: never; Returns: undefined }
      cleanup_rate_limits: { Args: never; Returns: number }
      cleanup_rate_limits_v3: { Args: never; Returns: number }
      cleanup_security_data: { Args: never; Returns: Json }
      cleanup_security_data_v3: { Args: never; Returns: Json }
      complete_event: {
        Args: {
          p_error_message?: string
          p_event_id: number
          p_success?: boolean
        }
        Returns: boolean
      }
      comprehensive_security_cleanup: { Args: never; Returns: undefined }
      count_entity_attachments: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: number
      }
      count_user_devices: { Args: { p_user_id?: string }; Returns: number }
      create_single_session: {
        Args: {
          _browser?: string
          _device_type?: string
          _ip_address?: string
          _os?: string
          _user_agent?: string
        }
        Returns: {
          session_id: string
          session_token: string
        }[]
      }
      current_user_email: { Args: never; Returns: string }
      deactivate_device: { Args: { p_device_id: string }; Returns: Json }
      extend_beta_access: {
        Args: { _additional_days: number; _user_id: string }
        Returns: Json
      }
      fn_check_overdue_expenses: { Args: never; Returns: undefined }
      generate_2fa_code: { Args: never; Returns: string }
      generate_signed_video_url: {
        Args: { p_expires_minutes?: number; p_video_id: string }
        Returns: Json
      }
      get_all_users_last_access: {
        Args: never
        Returns: {
          avatar_url: string
          email: string
          full_name: string
          id: string
          is_online: boolean
          last_activity_at: string
          last_login_at: string
          status_atividade: string
          ultima_sessao: Json
        }[]
      }
      get_audit_logs: {
        Args: {
          p_action?: string
          p_from_date?: string
          p_limit?: number
          p_table_name?: string
          p_to_date?: string
          p_user_id?: string
        }
        Returns: {
          action: string
          created_at: string
          id: string
          metadata: Json
          new_data: Json
          old_data: Json
          record_id: string
          table_name: string
          user_email: string
          user_id: string
        }[]
      }
      get_cached_dashboard_stats: { Args: never; Returns: Json }
      get_dashboard_cached: {
        Args: { p_force_refresh?: boolean }
        Returns: Json
      }
      get_dashboard_stats_realtime: { Args: never; Returns: Json }
      get_entity_attachments: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: {
          ai_insights: Json | null
          ai_summary: string | null
          category: string | null
          created_at: string | null
          description: string | null
          entity_id: string
          entity_type: string
          extracted_content: string | null
          extraction_date: string | null
          extraction_model: string | null
          extraction_status: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          storage_path: string
          tags: string[] | null
          title: string | null
          updated_at: string | null
          uploaded_by: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "universal_attachments"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_masked_location: {
        Args: { p_address: string; p_latitude: number; p_longitude: number }
        Returns: Json
      }
      get_masked_salary: {
        Args: { emp_salary: number; emp_user_id: string }
        Returns: number
      }
      get_projected_fixed_expenses: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: {
          ano: number
          categoria: string
          created_at: string
          data_pagamento: string
          data_vencimento: string
          dia: number
          gasto_origem_id: number
          id: number
          is_projecao: boolean
          mes: number
          nome: string
          recorrente: boolean
          semana: number
          status_pagamento: string
          valor: number
        }[]
      }
      get_quiz_questions_for_student: {
        Args: { p_quiz_id: string }
        Returns: {
          id: string
          options: Json
          points: number
          question_position: number
          question_text: string
          question_type: string
          quiz_id: string
        }[]
      }
      get_safe_profile: {
        Args: { p_user_id: string }
        Returns: {
          avatar_url: string
          id: string
          is_online: boolean
          nome: string
        }[]
      }
      get_security_dashboard_v3: { Args: never; Returns: Json }
      get_system_load: { Args: never; Returns: Json }
      get_url_access_result: {
        Args: { p_url: string; p_user_id?: string }
        Returns: Json
      }
      get_user_chat_ban_status: {
        Args: { p_live_id: string; p_user_id: string }
        Returns: {
          is_banned: boolean
          is_timed_out: boolean
          reason: string
          timeout_until: string
        }[]
      }
      get_user_devices: { Args: { p_user_id?: string }; Returns: Json }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_role_secure: {
        Args: { _user_id?: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_role_v2: { Args: { p_user_id?: string }; Returns: string }
      grant_beta_access: {
        Args: { _days?: number; _user_id: string }
        Returns: Json
      }
      has_area_permission: {
        Args: { _area: string; _user_id: string }
        Returns: boolean
      }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { _role: string; _user_id: string }; Returns: boolean }
      increment_metrica_diaria: {
        Args: { p_campo: string; p_data: string; p_valor: number }
        Returns: undefined
      }
      invalidate_session: {
        Args: { p_session_token?: string }
        Returns: boolean
      }
      is_admin_or_owner: { Args: { _user_id: string }; Returns: boolean }
      is_admin_or_owner_v2: { Args: { p_user_id: string }; Returns: boolean }
      is_beta_user: { Args: { p_user_id?: string }; Returns: boolean }
      is_beta_v2: { Args: { p_user_id?: string }; Returns: boolean }
      is_funcionario_user: { Args: { p_user_id?: string }; Returns: boolean }
      is_funcionario_v2: { Args: { p_user_id?: string }; Returns: boolean }
      is_owner:
        | { Args: never; Returns: boolean }
        | { Args: { _user_id?: string }; Returns: boolean }
      is_user_banned_from_chat: {
        Args: { p_live_id: string; p_user_id: string }
        Returns: boolean
      }
      log_activity: {
        Args: {
          _action: string
          _new_value?: Json
          _old_value?: Json
          _record_id?: string
          _table_name?: string
        }
        Returns: string
      }
      log_audit_v2: {
        Args: {
          p_action: string
          p_category?: string
          p_metadata?: Json
          p_new_data?: Json
          p_old_data?: Json
          p_record_id?: string
          p_severity?: Database["public"]["Enums"]["security_severity"]
          p_table_name?: string
        }
        Returns: string
      }
      log_blocked_access: {
        Args: { p_ip?: string; p_reason: string; p_resource: string }
        Returns: string
      }
      log_report_access: {
        Args: { p_report_params?: Json; p_report_type: string }
        Returns: string
      }
      log_security_audit: {
        Args: {
          p_action: string
          p_category?: string
          p_metadata?: Json
          p_new_data?: Json
          p_old_data?: Json
          p_record_id?: string
          p_severity?: string
          p_table_name?: string
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          p_description?: string
          p_event_type: string
          p_ip_address?: string
          p_payload?: Json
          p_severity?: string
          p_source?: string
        }
        Returns: string
      }
      log_security_event_v2: {
        Args: {
          p_details?: Json
          p_event_type: string
          p_fingerprint?: string
          p_ip_address?: unknown
          p_risk_score?: number
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: string
      }
      log_security_v3: {
        Args: {
          p_details?: Json
          p_event_type: string
          p_severity?: string
          p_user_id?: string
        }
        Returns: string
      }
      log_sensitive_data_access: {
        Args: {
          p_action: string
          p_record_count?: number
          p_table_name: string
        }
        Returns: undefined
      }
      mark_webhook_processed:
        | {
            Args: {
              p_error?: string
              p_event_id: string
              p_provider: string
              p_response?: Json
            }
            Returns: boolean
          }
        | {
            Args: {
              p_error?: string
              p_event_id: string
              p_provider: string
              p_response?: Json
              p_status?: string
            }
            Returns: boolean
          }
      mask_email: { Args: { p_email: string }; Returns: string }
      mask_phone: { Args: { p_phone: string }; Returns: string }
      materialize_fixed_expense: {
        Args: { p_ano: number; p_gasto_origem_id: number; p_mes: number }
        Returns: number
      }
      move_to_dead_letter_queue: {
        Args: { p_error: string; p_webhook_id: string }
        Returns: string
      }
      publish_event: {
        Args: {
          p_entity_id?: string
          p_entity_type?: string
          p_name: Database["public"]["Enums"]["event_name"]
          p_payload?: Json
        }
        Returns: number
      }
      refresh_dashboard_stats: { Args: never; Returns: undefined }
      refresh_realtime_stats: { Args: never; Returns: undefined }
      register_device_with_limit: {
        Args: {
          p_browser?: string
          p_device_fingerprint: string
          p_device_name: string
          p_device_type?: string
          p_os?: string
        }
        Returns: Json
      }
      register_user_login: {
        Args: {
          _browser?: string
          _device_type?: string
          _ip_address?: string
          _os?: string
          _user_agent?: string
        }
        Returns: string
      }
      register_user_logout: { Args: never; Returns: undefined }
      revoke_beta_access: { Args: { _user_id: string }; Returns: Json }
      revoke_other_sessions_v2: {
        Args: { p_current_session_token: string; p_user_id: string }
        Returns: number
      }
      security_cleanup_job: { Args: never; Returns: undefined }
      send_chat_message: {
        Args: {
          p_avatar_url?: string
          p_live_id: string
          p_message: string
          p_user_name?: string
        }
        Returns: string
      }
      update_expense_status: {
        Args: {
          p_data_pagamento?: string
          p_expense_id: number
          p_expense_type: string
          p_new_status: string
        }
        Returns: Json
      }
      update_item_status_v2: {
        Args: {
          p_data_pagamento?: string
          p_item_id: string
          p_item_type: string
          p_new_status: string
        }
        Returns: Json
      }
      update_user_activity: { Args: never; Returns: undefined }
      update_user_streak: { Args: { p_user_id: string }; Returns: number }
      upsert_hotmart_transaction: {
        Args: {
          p_affiliate_id?: string
          p_affiliate_name?: string
          p_buyer_email?: string
          p_buyer_name?: string
          p_buyer_phone?: string
          p_commission_value?: number
          p_coupon_code?: string
          p_data_compra?: string
          p_hotmart_event?: string
          p_is_subscription?: boolean
          p_metodo_pagamento?: string
          p_offer_code?: string
          p_parcelas?: number
          p_product_id?: string
          p_product_name?: string
          p_recurrence_number?: number
          p_status?: string
          p_subscription_id?: string
          p_transaction_id: string
          p_valor_bruto?: number
          p_webhook_raw?: Json
        }
        Returns: string
      }
      upsert_whatsapp_lead: {
        Args: {
          p_ai_response?: string
          p_external_id?: string
          p_message?: string
          p_nome: string
          p_phone: string
          p_source?: string
        }
        Returns: string
      }
      validate_session_token: {
        Args: { p_session_token: string }
        Returns: boolean
      }
      validate_session_v2: { Args: { p_session_token: string }; Returns: Json }
      validate_signed_video_url: {
        Args: { p_token: string; p_video_id: string }
        Returns: boolean
      }
      verify_2fa_code: { Args: { p_code: string }; Returns: boolean }
    }
    Enums: {
      ai_content_type: "summary" | "flashcards" | "quiz" | "mindmap"
      app_role:
        | "owner"
        | "admin"
        | "employee"
        | "coordenacao"
        | "suporte"
        | "monitoria"
        | "afiliado"
        | "marketing"
        | "contabilidade"
        | "aluno"
        | "beta"
        | "aluno_gratuito"
      attack_type:
        | "brute_force"
        | "credential_stuffing"
        | "session_hijacking"
        | "privilege_escalation"
        | "sql_injection"
        | "xss_attempt"
        | "ddos"
        | "bot_attack"
        | "api_abuse"
        | "data_exfiltration"
      employee_status: "ativo" | "ferias" | "afastado" | "inativo"
      event_name:
        | "payment.succeeded"
        | "payment.failed"
        | "payment.refunded"
        | "lesson.started"
        | "lesson.completed"
        | "quiz.started"
        | "quiz.passed"
        | "quiz.failed"
        | "correct.answer"
        | "wrong.answer"
        | "daily.login"
        | "streak.achieved"
        | "level.up"
        | "badge.earned"
        | "certificate.generated"
        | "access.granted"
        | "access.expired"
        | "access.revoked"
        | "user.registered"
        | "user.upgraded"
        | "churn.risk.detected"
        | "ai.prediction.made"
        | "webhook.received"
        | "notification.sent"
        | "content.viewed"
        | "flashcard.reviewed"
        | "churn.risk.high"
        | "study.session.started"
        | "study.session.ended"
      event_status:
        | "pending"
        | "processing"
        | "processed"
        | "failed"
        | "retrying"
      expense_category:
        | "comida"
        | "casa"
        | "pessoal"
        | "transporte"
        | "lazer"
        | "outros"
        | "feira"
        | "compras_casa"
        | "compras_bruna"
        | "compras_moises"
        | "cachorro"
        | "carro"
        | "gasolina"
        | "lanches"
      flashcard_rating: "again" | "hard" | "good" | "easy"
      flashcard_state: "new" | "learning" | "review" | "relearning"
      question_difficulty: "easy" | "medium" | "hard"
      sector_type:
        | "Coordenação"
        | "Suporte"
        | "Monitoria"
        | "Afiliados"
        | "Marketing"
        | "Administrativo"
        | "Financeiro"
        | "Vendas"
        | "Design"
        | "Gestão"
      security_action:
        | "allow"
        | "challenge"
        | "rate_limit"
        | "block_temp"
        | "block_perm"
        | "alert_admin"
        | "quarantine"
      security_severity: "debug" | "info" | "warning" | "error" | "critical"
      session_status: "active" | "expired" | "revoked" | "suspicious"
      threat_level:
        | "none"
        | "low"
        | "medium"
        | "high"
        | "critical"
        | "emergency"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_content_type: ["summary", "flashcards", "quiz", "mindmap"],
      app_role: [
        "owner",
        "admin",
        "employee",
        "coordenacao",
        "suporte",
        "monitoria",
        "afiliado",
        "marketing",
        "contabilidade",
        "aluno",
        "beta",
        "aluno_gratuito",
      ],
      attack_type: [
        "brute_force",
        "credential_stuffing",
        "session_hijacking",
        "privilege_escalation",
        "sql_injection",
        "xss_attempt",
        "ddos",
        "bot_attack",
        "api_abuse",
        "data_exfiltration",
      ],
      employee_status: ["ativo", "ferias", "afastado", "inativo"],
      event_name: [
        "payment.succeeded",
        "payment.failed",
        "payment.refunded",
        "lesson.started",
        "lesson.completed",
        "quiz.started",
        "quiz.passed",
        "quiz.failed",
        "correct.answer",
        "wrong.answer",
        "daily.login",
        "streak.achieved",
        "level.up",
        "badge.earned",
        "certificate.generated",
        "access.granted",
        "access.expired",
        "access.revoked",
        "user.registered",
        "user.upgraded",
        "churn.risk.detected",
        "ai.prediction.made",
        "webhook.received",
        "notification.sent",
        "content.viewed",
        "flashcard.reviewed",
        "churn.risk.high",
        "study.session.started",
        "study.session.ended",
      ],
      event_status: [
        "pending",
        "processing",
        "processed",
        "failed",
        "retrying",
      ],
      expense_category: [
        "comida",
        "casa",
        "pessoal",
        "transporte",
        "lazer",
        "outros",
        "feira",
        "compras_casa",
        "compras_bruna",
        "compras_moises",
        "cachorro",
        "carro",
        "gasolina",
        "lanches",
      ],
      flashcard_rating: ["again", "hard", "good", "easy"],
      flashcard_state: ["new", "learning", "review", "relearning"],
      question_difficulty: ["easy", "medium", "hard"],
      sector_type: [
        "Coordenação",
        "Suporte",
        "Monitoria",
        "Afiliados",
        "Marketing",
        "Administrativo",
        "Financeiro",
        "Vendas",
        "Design",
        "Gestão",
      ],
      security_action: [
        "allow",
        "challenge",
        "rate_limit",
        "block_temp",
        "block_perm",
        "alert_admin",
        "quarantine",
      ],
      security_severity: ["debug", "info", "warning", "error", "critical"],
      session_status: ["active", "expired", "revoked", "suspicious"],
      threat_level: ["none", "low", "medium", "high", "critical", "emergency"],
    },
  },
} as const
