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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_owner: { Args: { _user_id: string }; Returns: boolean }
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
