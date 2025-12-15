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
      affiliates: {
        Row: {
          comissao_total: number | null
          created_at: string | null
          email: string | null
          hotmart_id: string | null
          id: number
          nome: string
          total_vendas: number | null
        }
        Insert: {
          comissao_total?: number | null
          created_at?: string | null
          email?: string | null
          hotmart_id?: string | null
          id?: number
          nome: string
          total_vendas?: number | null
        }
        Update: {
          comissao_total?: number | null
          created_at?: string | null
          email?: string | null
          hotmart_id?: string | null
          id?: number
          nome?: string
          total_vendas?: number | null
        }
        Relationships: []
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
      courses: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          estimated_hours: number | null
          id: string
          instructor_id: string | null
          is_published: boolean | null
          price: number | null
          thumbnail_url: string | null
          title: string
          total_xp: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          estimated_hours?: number | null
          id?: string
          instructor_id?: string | null
          is_published?: boolean | null
          price?: number | null
          thumbnail_url?: string | null
          title: string
          total_xp?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          estimated_hours?: number | null
          id?: string
          instructor_id?: string | null
          is_published?: boolean | null
          price?: number | null
          thumbnail_url?: string | null
          title?: string
          total_xp?: number | null
          updated_at?: string | null
        }
        Relationships: [
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
          salario: number
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
          salario?: number
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
          salario?: number
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
          created_at: string | null
          email: string | null
          id: string
          nome: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          nome: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string
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
    }
    Views: {
      employees_safe: {
        Row: {
          created_at: string | null
          created_by: string | null
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
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data_admissao?: string | null
          email?: string | null
          funcao?: string | null
          horario_trabalho?: string | null
          id?: number | null
          nome?: string | null
          responsabilidades?: string | null
          salario?: never
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
          funcao?: string | null
          horario_trabalho?: string | null
          id?: number | null
          nome?: string | null
          responsabilidades?: string | null
          salario?: never
          setor?: Database["public"]["Enums"]["sector_type"] | null
          status?: Database["public"]["Enums"]["employee_status"] | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          id: string | null
          nome: string | null
        }
        Insert: {
          avatar_url?: string | null
          id?: string | null
          nome?: string | null
        }
        Update: {
          avatar_url?: string | null
          id?: string | null
          nome?: string | null
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
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      get_masked_salary: {
        Args: { emp_salary: number; emp_user_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_owner: { Args: { _user_id: string }; Returns: boolean }
      update_user_streak: { Args: { p_user_id: string }; Returns: number }
    }
    Enums: {
      app_role: "owner" | "admin" | "employee"
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
      app_role: ["owner", "admin", "employee"],
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
