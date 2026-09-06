export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type LoyaltyTier = "bronze" | "silver" | "gold"
export type PurchaseType = "package" | "custom"

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          role: "user" | "super_admin" | "support"
          balance_rupiah: number
          spending_limit_hourly: number | null
          spending_limit_daily: number | null
          is_suspended: boolean
          business_name: string | null
          business_phone: string | null
          npwp: string | null
          privacy_mode: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          role?: "user" | "super_admin" | "support"
          balance_rupiah?: number
          spending_limit_hourly?: number | null
          spending_limit_daily?: number | null
          is_suspended?: boolean
          business_name?: string | null
          business_phone?: string | null
          npwp?: string | null
          privacy_mode?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          role?: "user" | "super_admin" | "support"
          balance_rupiah?: number
          spending_limit_hourly?: number | null
          spending_limit_daily?: number | null
          is_suspended?: boolean
          business_name?: string | null
          business_phone?: string | null
          npwp?: string | null
          privacy_mode?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          name: string
          key_prefix: string
          key_hash: string
          is_active: boolean
          ip_whitelist: string[] | null
          total_usage_tokens: number
          total_cost_rupiah: number
          last_used_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          key_prefix: string
          key_hash: string
          is_active?: boolean
          ip_whitelist?: string[] | null
          total_usage_tokens?: number
          total_cost_rupiah?: number
          last_used_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          is_active?: boolean
          ip_whitelist?: string[] | null
          total_usage_tokens?: number
          total_cost_rupiah?: number
          last_used_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          order_id: string
          amount_rupiah: number
          status: "pending" | "success" | "failed" | "expired" | "refunded"
          payment_method: "qris" | "va" | null
          payment_channel: string | null
          pakasir_tx_id: string | null
          refunded_amount: number | null
          invoice_number: string | null
          expires_at: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_id: string
          amount_rupiah: number
          status?: "pending" | "success" | "failed" | "expired" | "refunded"
          payment_method?: "qris" | "va" | null
          payment_channel?: string | null
          pakasir_tx_id?: string | null
          refunded_amount?: number | null
          invoice_number?: string | null
          expires_at?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          status?: "pending" | "success" | "failed" | "expired" | "refunded"
          payment_method?: "qris" | "va" | null
          payment_channel?: string | null
          pakasir_tx_id?: string | null
          refunded_amount?: number | null
          invoice_number?: string | null
          paid_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      usage_logs: {
        Row: {
          id: string
          user_id: string
          api_key_id: string | null
          model: string
          prompt_tokens: number
          completion_tokens: number
          total_tokens: number
          cost_rupiah: number
          request_metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          api_key_id?: string | null
          model: string
          prompt_tokens?: number
          completion_tokens?: number
          total_tokens?: number
          cost_rupiah?: number
          request_metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          cost_rupiah?: number
          total_tokens?: number
        }
        Relationships: []
      }
      models: {
        Row: {
          id: string
          name: string
          provider: string
          tier: "murah" | "menengah" | "mahal"
          is_active: boolean
          upstream_price_per_token: number
          markup_price_per_token: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          provider: string
          tier: "murah" | "menengah" | "mahal"
          is_active?: boolean
          upstream_price_per_token: number
          markup_price_per_token: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tier?: "murah" | "menengah" | "mahal"
          is_active?: boolean
          upstream_price_per_token?: number
          markup_price_per_token?: number
          updated_at?: string
        }
        Relationships: []
      }
      model_markup_history: {
        Row: {
          id: string
          model_id: string
          old_markup: number
          new_markup: number
          changed_by: string
          created_at: string
        }
        Insert: {
          id?: string
          model_id: string
          old_markup: number
          new_markup: number
          changed_by: string
          created_at?: string
        }
        Update: {
          id?: string
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          id: string
          admin_id: string
          action: string
          target_type: string
          target_id: string | null
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action: string
          target_type: string
          target_id?: string | null
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
        }
        Relationships: []
      }
      spending_limits: {
        Row: {
          id: string
          user_id: string
          limit_type: "hourly" | "daily"
          max_cost_rupiah: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          limit_type: "hourly" | "daily"
          max_cost_rupiah: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          max_cost_rupiah?: number
          updated_at?: string
        }
        Relationships: []
      }
      reconciliation_logs: {
        Row: {
          id: string
          source: "redis_vs_supabase" | "internal_vs_upstream"
          expected_amount: number
          actual_amount: number
          difference: number
          status: "ok" | "alert" | "resolved"
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          source: "redis_vs_supabase" | "internal_vs_upstream"
          expected_amount: number
          actual_amount: number
          difference: number
          status: "ok" | "alert" | "resolved"
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          status?: "ok" | "alert" | "resolved"
          notes?: string | null
        }
        Relationships: []
      }
      playground_sessions: {
        Row: {
          id: string
          user_id: string
          model: string
          prompt_tokens: number
          completion_tokens: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          model: string
          prompt_tokens: number
          completion_tokens: number
          created_at?: string
        }
        Update: {
          id?: string
        }
        Relationships: []
      }
      signup_log: {
        Row: { id: string; ip: string; email: string; created_at: string }
        Insert: { id?: string; ip: string; email: string; created_at?: string }
        Update: { id?: string }
        Relationships: []
      }
      refund_requests: {
        Row: {
          id: string
          user_id: string
          transaction_id: string
          amount: number
          reason: string | null
          status: string
          decided_by: string | null
          decided_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transaction_id: string
          amount: number
          reason?: string | null
          status?: string
          decided_by?: string | null
          decided_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          status?: string
          decided_by?: string | null
          decided_at?: string | null
        }
        Relationships: []
      }
      reseller_applications: {
        Row: {
          id: string
          user_id: string
          business_name: string
          business_phone: string
          npwp: string | null
          status: "pending" | "approved" | "rejected"
          decided_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name: string
          business_phone: string
          npwp?: string | null
          status?: "pending" | "approved" | "rejected"
          decided_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          status?: "pending" | "approved" | "rejected"
          decided_at?: string | null
        }
        Relationships: []
      }
      data_deletion_requests: {
        Row: {
          id: string
          user_id: string
          reason: string | null
          status: string
          processed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          reason?: string | null
          status?: string
          processed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          status?: string
          processed_at?: string | null
        }
        Relationships: []
      }
      forex_history: {
        Row: { id: string; base: string; quote: string; rate: number; created_at: string }
        Insert: { id?: string; base: string; quote: string; rate: number; created_at?: string }
        Update: { id?: string }
        Relationships: []
      }
      token_packages: {
        Row: {
          id: string
          name: string
          description: string | null
          token_amount: number
          price_rupiah: number
          bonus_percent: number
          duration_days: number | null
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          token_amount: number
          price_rupiah: number
          bonus_percent?: number
          duration_days?: number | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          token_amount?: number
          price_rupiah?: number
          bonus_percent?: number
          duration_days?: number | null
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      loyalty_rules: {
        Row: {
          tier: LoyaltyTier
          min_total_purchased: number
          purchase_bonus_percent: number
          package_discount_percent: number
          priority_support: boolean
          custom_model_access: boolean
          api_key_access: boolean
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          tier: LoyaltyTier
          min_total_purchased?: number
          purchase_bonus_percent?: number
          package_discount_percent?: number
          priority_support?: boolean
          custom_model_access?: boolean
          api_key_access?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          tier?: LoyaltyTier
          min_total_purchased?: number
          purchase_bonus_percent?: number
          package_discount_percent?: number
          priority_support?: boolean
          custom_model_access?: boolean
          api_key_access?: boolean
          description?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      newapi_config: {
        Row: {
          id: number
          base_url: string
          api_key: string
          default_model: string
          markup_percent: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          base_url?: string
          api_key?: string
          default_model?: string
          markup_percent?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          base_url?: string
          api_key?: string
          default_model?: string
          markup_percent?: number
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          id: string
          user_id: string
          api_key_id: string | null
          model: string
          prompt_tokens: number
          completion_tokens: number
          total_tokens: number
          cost_usd: number
          cost_rupiah: number
          request_metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          api_key_id?: string | null
          model: string
          prompt_tokens?: number
          completion_tokens?: number
          total_tokens?: number
          cost_usd?: number
          cost_rupiah?: number
          request_metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          cost_usd?: number
          cost_rupiah?: number
          total_tokens?: number
        }
        Relationships: [
          { foreignKeyName: "ai_usage_logs_user_id_fkey", columns: ["user_id"], isOneToOne: false, referencedRelation: "users" },
          { foreignKeyName: "ai_usage_logs_api_key_id_fkey", columns: ["api_key_id"], isOneToOne: false, referencedRelation: "api_keys" }
        ]
      }
      settings: {
        Row: {
          key: string
          value: string
          updated_at: string
        }
        Insert: {
          key: string
          value: string
          updated_at?: string
        }
        Update: {
          key?: string
          value?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      deduct_quota: {
        Args: {
          p_user_id: string
          p_amount: number
          p_hourly_limit?: number
          p_daily_limit?: number
        }
        Returns: boolean
      }
      update_user_loyalty_tier: {
        Args: { p_user_id: string }
        Returns: void
      }
      consume_tokens: {
        Args: {
          p_user_id: string
          p_tokens_used: number
          p_model: string
          p_cost_rupiah: number
          p_cost_usd?: number
          p_metadata?: Json
        }
        Returns: boolean
      }
      add_tokens: {
        Args: {
          p_user_id: string
          p_token_amount: number
          p_bonus_tokens?: number
          p_duration_days?: number
          p_transaction_id?: string
        }
        Returns: void
      }
      calculate_package_price: {
        Args: { p_package_id: string; p_user_id?: string }
        Returns: {
          token_amount: number
          price_rupiah: number
          bonus_tokens: number
          final_price: number
          loyalty_tier: LoyaltyTier
          discount_percent: number
        }[]
      }
      calculate_custom_purchase: {
        Args: {
          p_token_amount: number
          p_duration_days: number
          p_nominal_rupiah: number
          p_user_id?: string
        }
        Returns: {
          token_amount: number
          bonus_tokens: number
          total_tokens: number
          price_per_token: number
          final_price: number
          loyalty_tier: LoyaltyTier
          bonus_percent: number
          is_competitive: boolean
        }[]
      }
    }
    Enums: {
      user_role: "user" | "super_admin" | "support"
      transaction_status: "pending" | "success" | "failed" | "expired" | "refunded" | "refund_requested"
      payment_method: "qris" | "va"
      model_tier: "murah" | "menengah" | "mahal"
      limit_type: "hourly" | "daily"
      recon_source: "redis_vs_supabase" | "internal_vs_upstream"
      recon_status: "ok" | "alert" | "resolved"
      reseller_status: "pending" | "approved" | "rejected"
      loyalty_tier: "bronze" | "silver" | "gold"
      purchase_type: "package" | "custom"
    }
    CompositeTypes: Record<string, never>
  }
}
