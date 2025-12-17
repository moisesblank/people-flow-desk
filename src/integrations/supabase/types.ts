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
          total_vendas?: number | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      alunos: {
        Row: {
          created_at: string | null
          curso_id: string | null
          data_matricula: string | null
          email: string
          fonte: string | null
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
          created_at?: string | null
          curso_id?: string | null
          data_matricula?: string | null
          email: string
          fonte?: string | null
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
          created_at?: string | null
          curso_id?: string | null
          data_matricula?: string | null
          email?: string
          fonte?: string | null
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
          certificate_number: string
          course_id: string | null
          id: string
          issued_at: string | null
          pdf_url: string | null
          user_id: string | null
        }
        Insert: {
          certificate_number: string
          course_id?: string | null
          id?: string
          issued_at?: string | null
          pdf_url?: string | null
          user_id?: string | null
        }
        Update: {
          certificate_number?: string
          course_id?: string | null
          id?: string
          issued_at?: string | null
          pdf_url?: string | null
          user_id?: string | null
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
        ]
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
          categoria: string | null
          created_at: string | null
          created_by: string | null
          data: string | null
          id: number
          nome: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          created_by?: string | null
          data?: string | null
          id?: number
          nome: string
          valor?: number
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          created_by?: string | null
          data?: string | null
          id?: number
          nome?: string
          valor?: number
        }
        Relationships: []
      }
      company_fixed_expenses: {
        Row: {
          categoria: string | null
          created_at: string | null
          created_by: string | null
          id: number
          nome: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: number
          nome: string
          valor?: number
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: number
          nome?: string
          valor?: number
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
      courses: {
        Row: {
          average_rating: number | null
          category: string | null
          category_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          difficulty_level: string | null
          duration_hours: number | null
          estimated_hours: number | null
          id: string
          instructor_id: string | null
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          preview_video_url: string | null
          price: number | null
          published_at: string | null
          short_description: string | null
          slug: string | null
          thumbnail_url: string | null
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
          difficulty_level?: string | null
          duration_hours?: number | null
          estimated_hours?: number | null
          id?: string
          instructor_id?: string | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          preview_video_url?: string | null
          price?: number | null
          published_at?: string | null
          short_description?: string | null
          slug?: string | null
          thumbnail_url?: string | null
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
          difficulty_level?: string | null
          duration_hours?: number | null
          estimated_hours?: number | null
          id?: string
          instructor_id?: string | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          preview_video_url?: string | null
          price?: number | null
          published_at?: string | null
          short_description?: string | null
          slug?: string | null
          thumbnail_url?: string | null
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
      enrollments: {
        Row: {
          certificate_url: string | null
          completed_at: string | null
          course_id: string
          created_at: string | null
          enrolled_at: string | null
          id: string
          progress_percentage: number | null
          status: string | null
          user_id: string
        }
        Insert: {
          certificate_url?: string | null
          completed_at?: string | null
          course_id: string
          created_at?: string | null
          enrolled_at?: string | null
          id?: string
          progress_percentage?: number | null
          status?: string | null
          user_id: string
        }
        Update: {
          certificate_url?: string | null
          completed_at?: string | null
          course_id?: string
          created_at?: string | null
          enrolled_at?: string | null
          id?: string
          progress_percentage?: number | null
          status?: string | null
          user_id?: string
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
        ]
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
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          last_position_seconds: number | null
          lesson_id: string
          updated_at: string | null
          user_id: string
          watch_time_seconds: number | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_position_seconds?: number | null
          lesson_id: string
          updated_at?: string | null
          user_id: string
          watch_time_seconds?: number | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_position_seconds?: number | null
          lesson_id?: string
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
          content: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_free: boolean | null
          module_id: string
          position: number | null
          title: string
          updated_at: string | null
          video_duration: number | null
          video_url: string | null
          xp_reward: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_free?: boolean | null
          module_id: string
          position?: number | null
          title: string
          updated_at?: string | null
          video_duration?: number | null
          video_url?: string | null
          xp_reward?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_free?: boolean | null
          module_id?: string
          position?: number | null
          title?: string
          updated_at?: string | null
          video_duration?: number | null
          video_url?: string | null
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
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
          position: number | null
          title: string
          updated_at: string | null
          xp_reward: number | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          position?: number | null
          title: string
          updated_at?: string | null
          xp_reward?: number | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          position?: number | null
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
          comprovante_url: string | null
          created_at: string
          created_by: string | null
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          id: string
          metodo_pagamento: string | null
          observacoes: string | null
          recorrente: boolean
          status: string
          tipo: string
          user_id: string
          valor: number
        }
        Insert: {
          comprovante_url?: string | null
          created_at?: string
          created_by?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          id?: string
          metodo_pagamento?: string | null
          observacoes?: string | null
          recorrente?: boolean
          status?: string
          tipo: string
          user_id: string
          valor?: number
        }
        Update: {
          comprovante_url?: string | null
          created_at?: string
          created_by?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          id?: string
          metodo_pagamento?: string | null
          observacoes?: string | null
          recorrente?: boolean
          status?: string
          tipo?: string
          user_id?: string
          valor?: number
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
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          id: string
          is_online: boolean | null
          last_activity_at: string | null
          last_login_at: string | null
          level: number | null
          nome: string
          phone: string | null
          preferences: Json | null
          streak_days: number | null
          updated_at: string | null
          xp_total: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          is_online?: boolean | null
          last_activity_at?: string | null
          last_login_at?: string | null
          level?: number | null
          nome: string
          phone?: string | null
          preferences?: Json | null
          streak_days?: number | null
          updated_at?: string | null
          xp_total?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_online?: boolean | null
          last_activity_at?: string | null
          last_login_at?: string | null
          level?: number | null
          nome?: string
          phone?: string | null
          preferences?: Json | null
          streak_days?: number | null
          updated_at?: string | null
          xp_total?: number | null
        }
        Relationships: []
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
          attachments: Json | null
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          message_type: string | null
          reply_to: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          reply_to?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string
          id?: string
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
          device_type: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_activity_at: string | null
          login_at: string
          logout_at: string | null
          os: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity_at?: string | null
          login_at?: string
          logout_at?: string | null
          os?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity_at?: string | null
          login_at?: string
          logout_at?: string | null
          os?: string | null
          user_agent?: string | null
          user_id?: string
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
          name: string
          notes: string | null
          phone: string
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
          name: string
          notes?: string | null
          phone: string
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
          name?: string
          notes?: string | null
          phone?: string
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
          channel_id: string | null
          comentarios: number | null
          created_at: string
          id: string
          likes: number | null
          publicado_em: string | null
          titulo: string | null
          updated_at: string
          video_id: string
          visualizacoes: number | null
        }
        Insert: {
          channel_id?: string | null
          comentarios?: number | null
          created_at?: string
          id?: string
          likes?: number | null
          publicado_em?: string | null
          titulo?: string | null
          updated_at?: string
          video_id: string
          visualizacoes?: number | null
        }
        Update: {
          channel_id?: string | null
          comentarios?: number | null
          created_at?: string
          id?: string
          likes?: number | null
          publicado_em?: string | null
          titulo?: string | null
          updated_at?: string
          video_id?: string
          visualizacoes?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      employees_public: {
        Row: {
          data_admissao: string | null
          email: string | null
          funcao: string | null
          horario_trabalho: string | null
          id: number | null
          nome: string | null
          setor: Database["public"]["Enums"]["sector_type"] | null
          status: Database["public"]["Enums"]["employee_status"] | null
        }
        Insert: {
          data_admissao?: string | null
          email?: string | null
          funcao?: string | null
          horario_trabalho?: string | null
          id?: number | null
          nome?: string | null
          setor?: Database["public"]["Enums"]["sector_type"] | null
          status?: Database["public"]["Enums"]["employee_status"] | null
        }
        Update: {
          data_admissao?: string | null
          email?: string | null
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
      profiles_public: {
        Row: {
          avatar_url: string | null
          id: string | null
          is_online: boolean | null
          last_activity_at: string | null
          nome: string | null
        }
        Insert: {
          avatar_url?: string | null
          id?: string | null
          is_online?: boolean | null
          last_activity_at?: string | null
          nome?: string | null
        }
        Update: {
          avatar_url?: string | null
          id?: string | null
          is_online?: boolean | null
          last_activity_at?: string | null
          nome?: string | null
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
      whatsapp_leads_dashboard: {
        Row: {
          contact_count: number | null
          created_at: string | null
          id: string | null
          last_contact: string | null
          name: string | null
          phone: string | null
          source: string | null
          status: string | null
        }
        Insert: {
          contact_count?: number | null
          created_at?: string | null
          id?: string | null
          last_contact?: string | null
          name?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
        }
        Update: {
          contact_count?: number | null
          created_at?: string | null
          id?: string | null
          last_contact?: string | null
          name?: string | null
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
      can_edit_content: { Args: { _user_id?: string }; Returns: boolean }
      can_manage_documents: { Args: { _user_id?: string }; Returns: boolean }
      can_use_god_mode: { Args: { _user_id?: string }; Returns: boolean }
      can_view_all_data: { Args: { _user_id?: string }; Returns: boolean }
      can_view_financial: { Args: { _user_id: string }; Returns: boolean }
      can_view_personal: { Args: { _user_id: string }; Returns: boolean }
      check_rate_limit: {
        Args: {
          p_max_requests?: number
          p_operation: string
          p_window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_expired_2fa_codes: { Args: never; Returns: undefined }
      cleanup_old_location_data: { Args: never; Returns: undefined }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      cleanup_old_sensitive_data: { Args: never; Returns: undefined }
      count_entity_attachments: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: number
      }
      generate_2fa_code: { Args: never; Returns: string }
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_owner: { Args: { _user_id: string }; Returns: boolean }
      is_owner: { Args: { _user_id?: string }; Returns: boolean }
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
      log_sensitive_data_access: {
        Args: {
          p_action: string
          p_record_count?: number
          p_table_name: string
        }
        Returns: undefined
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
      update_user_activity: { Args: never; Returns: undefined }
      update_user_streak: { Args: { p_user_id: string }; Returns: number }
      upsert_whatsapp_lead: {
        Args: {
          p_ai_response?: string
          p_external_id?: string
          p_message?: string
          p_name: string
          p_phone: string
          p_source?: string
        }
        Returns: string
      }
      verify_2fa_code: { Args: { p_code: string }; Returns: boolean }
    }
    Enums: {
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
      employee_status: "ativo" | "ferias" | "afastado" | "inativo"
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
      ],
      employee_status: ["ativo", "ferias", "afastado", "inativo"],
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
    },
  },
} as const
