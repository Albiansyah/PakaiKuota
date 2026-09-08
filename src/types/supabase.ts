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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_logs: {
        Row: {
          api_key_id: string | null
          completion_tokens: number
          cost_rupiah: number
          cost_usd: number
          created_at: string
          forex_rate_at_hold: number | null
          forex_rate_used: number | null
          id: string
          model: string
          prompt_tokens: number
          request_metadata: Json | null
          total_tokens: number
          user_id: string
        }
        Insert: {
          api_key_id?: string | null
          completion_tokens?: number
          cost_rupiah?: number
          cost_usd?: number
          created_at?: string
          forex_rate_at_hold?: number | null
          forex_rate_used?: number | null
          id?: string
          model: string
          prompt_tokens?: number
          request_metadata?: Json | null
          total_tokens?: number
          user_id: string
        }
        Update: {
          api_key_id?: string | null
          completion_tokens?: number
          cost_rupiah?: number
          cost_usd?: number
          created_at?: string
          forex_rate_at_hold?: number | null
          forex_rate_used?: number | null
          id?: string
          model?: string
          prompt_tokens?: number
          request_metadata?: Json | null
          total_tokens?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          message: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          message: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          message?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          id: string
          ip_whitelist: string[] | null
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          revoked_at: string | null
          total_cost_rupiah: number
          total_usage_tokens: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_whitelist?: string[] | null
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          revoked_at?: string | null
          total_cost_rupiah?: number
          total_usage_tokens?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_whitelist?: string[] | null
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          total_cost_rupiah?: number
          total_usage_tokens?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      data_deletion_requests: {
        Row: {
          created_at: string
          id: string
          processed_at: string | null
          reason: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          processed_at?: string | null
          reason?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          processed_at?: string | null
          reason?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_deletion_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      forex_history: {
        Row: {
          base: string
          created_at: string
          id: string
          quote: string
          rate: number
        }
        Insert: {
          base: string
          created_at?: string
          id?: string
          quote: string
          rate: number
        }
        Update: {
          base?: string
          created_at?: string
          id?: string
          quote?: string
          rate?: number
        }
        Relationships: []
      }
      loyalty_rules: {
        Row: {
          api_key_access: boolean
          created_at: string
          custom_model_access: boolean
          description: string | null
          min_total_purchased: number
          package_discount_percent: number
          priority_support: boolean
          purchase_bonus_percent: number
          tier: Database["public"]["Enums"]["loyalty_tier"]
          updated_at: string
        }
        Insert: {
          api_key_access?: boolean
          created_at?: string
          custom_model_access?: boolean
          description?: string | null
          min_total_purchased?: number
          package_discount_percent?: number
          priority_support?: boolean
          purchase_bonus_percent?: number
          tier: Database["public"]["Enums"]["loyalty_tier"]
          updated_at?: string
        }
        Update: {
          api_key_access?: boolean
          created_at?: string
          custom_model_access?: boolean
          description?: string | null
          min_total_purchased?: number
          package_discount_percent?: number
          priority_support?: boolean
          purchase_bonus_percent?: number
          tier?: Database["public"]["Enums"]["loyalty_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      model_markup_history: {
        Row: {
          changed_by: string
          created_at: string
          id: string
          model_id: string
          new_markup: number
          old_markup: number
        }
        Insert: {
          changed_by: string
          created_at?: string
          id?: string
          model_id: string
          new_markup: number
          old_markup: number
        }
        Update: {
          changed_by?: string
          created_at?: string
          id?: string
          model_id?: string
          new_markup?: number
          old_markup?: number
        }
        Relationships: [
          {
            foreignKeyName: "model_markup_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_markup_history_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      models: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          markup_price_per_token: number
          name: string
          provider: string
          tier: Database["public"]["Enums"]["model_tier"]
          updated_at: string
          upstream_price_per_token: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          markup_price_per_token: number
          name: string
          provider: string
          tier: Database["public"]["Enums"]["model_tier"]
          updated_at?: string
          upstream_price_per_token: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          markup_price_per_token?: number
          name?: string
          provider?: string
          tier?: Database["public"]["Enums"]["model_tier"]
          updated_at?: string
          upstream_price_per_token?: number
        }
        Relationships: []
      }
      newapi_config: {
        Row: {
          api_key: string
          base_url: string
          created_at: string
          default_model: string
          id: number
          is_active: boolean
          markup_percent: number
          updated_at: string
        }
        Insert: {
          api_key?: string
          base_url?: string
          created_at?: string
          default_model?: string
          id?: number
          is_active?: boolean
          markup_percent?: number
          updated_at?: string
        }
        Update: {
          api_key?: string
          base_url?: string
          created_at?: string
          default_model?: string
          id?: number
          is_active?: boolean
          markup_percent?: number
          updated_at?: string
        }
        Relationships: []
      }
      playground_sessions: {
        Row: {
          completion_tokens: number
          created_at: string
          id: string
          model: string
          prompt_tokens: number
          user_id: string
        }
        Insert: {
          completion_tokens: number
          created_at?: string
          id?: string
          model: string
          prompt_tokens: number
          user_id: string
        }
        Update: {
          completion_tokens?: number
          created_at?: string
          id?: string
          model?: string
          prompt_tokens?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playground_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_logs: {
        Row: {
          actual_amount: number
          created_at: string
          difference: number
          expected_amount: number
          id: string
          notes: string | null
          source: Database["public"]["Enums"]["recon_source"]
          status: Database["public"]["Enums"]["recon_status"]
        }
        Insert: {
          actual_amount: number
          created_at?: string
          difference: number
          expected_amount: number
          id?: string
          notes?: string | null
          source: Database["public"]["Enums"]["recon_source"]
          status: Database["public"]["Enums"]["recon_status"]
        }
        Update: {
          actual_amount?: number
          created_at?: string
          difference?: number
          expected_amount?: number
          id?: string
          notes?: string | null
          source?: Database["public"]["Enums"]["recon_source"]
          status?: Database["public"]["Enums"]["recon_status"]
        }
        Relationships: []
      }
      refund_requests: {
        Row: {
          amount: number
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          reason: string | null
          status: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          reason?: string | null
          status?: string
          transaction_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          reason?: string | null
          status?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_requests_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refund_requests_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refund_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reseller_applications: {
        Row: {
          business_name: string
          business_phone: string
          created_at: string
          decided_at: string | null
          id: string
          npwp: string | null
          status: Database["public"]["Enums"]["reseller_status"]
          user_id: string
        }
        Insert: {
          business_name: string
          business_phone: string
          created_at?: string
          decided_at?: string | null
          id?: string
          npwp?: string | null
          status?: Database["public"]["Enums"]["reseller_status"]
          user_id: string
        }
        Update: {
          business_name?: string
          business_phone?: string
          created_at?: string
          decided_at?: string | null
          id?: string
          npwp?: string | null
          status?: Database["public"]["Enums"]["reseller_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reseller_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      signup_log: {
        Row: {
          created_at: string
          email: string
          id: string
          ip: unknown
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip: unknown
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip?: unknown
        }
        Relationships: []
      }
      spending_limits: {
        Row: {
          created_at: string
          id: string
          limit_type: Database["public"]["Enums"]["limit_type"]
          max_cost_rupiah: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          limit_type: Database["public"]["Enums"]["limit_type"]
          max_cost_rupiah: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          limit_type?: Database["public"]["Enums"]["limit_type"]
          max_cost_rupiah?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spending_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      token_packages: {
        Row: {
          bonus_percent: number
          created_at: string
          description: string | null
          duration_days: number | null
          id: string
          is_active: boolean
          name: string
          price_rupiah: number
          sort_order: number
          token_amount: number
          updated_at: string
        }
        Insert: {
          bonus_percent?: number
          created_at?: string
          description?: string | null
          duration_days?: number | null
          id?: string
          is_active?: boolean
          name: string
          price_rupiah: number
          sort_order?: number
          token_amount: number
          updated_at?: string
        }
        Update: {
          bonus_percent?: number
          created_at?: string
          description?: string | null
          duration_days?: number | null
          id?: string
          is_active?: boolean
          name?: string
          price_rupiah?: number
          sort_order?: number
          token_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount_rupiah: number
          bonus_tokens: number
          created_at: string
          custom_duration_days: number | null
          custom_token_amount: number | null
          expires_at: string | null
          id: string
          invoice_number: string | null
          loyalty_tier_at_purchase:
            | Database["public"]["Enums"]["loyalty_tier"]
            | null
          order_id: string
          package_id: string | null
          paid_at: string | null
          pakasir_tx_id: string | null
          payment_channel: string | null
          payment_fee: number | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_number: string | null
          purchase_type: Database["public"]["Enums"]["purchase_type"]
          refunded_amount: number | null
          status: Database["public"]["Enums"]["transaction_status"]
          token_amount: number | null
          total_payment: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_rupiah: number
          bonus_tokens?: number
          created_at?: string
          custom_duration_days?: number | null
          custom_token_amount?: number | null
          expires_at?: string | null
          id?: string
          invoice_number?: string | null
          loyalty_tier_at_purchase?:
            | Database["public"]["Enums"]["loyalty_tier"]
            | null
          order_id: string
          package_id?: string | null
          paid_at?: string | null
          pakasir_tx_id?: string | null
          payment_channel?: string | null
          payment_fee?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_number?: string | null
          purchase_type?: Database["public"]["Enums"]["purchase_type"]
          refunded_amount?: number | null
          status?: Database["public"]["Enums"]["transaction_status"]
          token_amount?: number | null
          total_payment?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_rupiah?: number
          bonus_tokens?: number
          created_at?: string
          custom_duration_days?: number | null
          custom_token_amount?: number | null
          expires_at?: string | null
          id?: string
          invoice_number?: string | null
          loyalty_tier_at_purchase?:
            | Database["public"]["Enums"]["loyalty_tier"]
            | null
          order_id?: string
          package_id?: string | null
          paid_at?: string | null
          pakasir_tx_id?: string | null
          payment_channel?: string | null
          payment_fee?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_number?: string | null
          purchase_type?: Database["public"]["Enums"]["purchase_type"]
          refunded_amount?: number | null
          status?: Database["public"]["Enums"]["transaction_status"]
          token_amount?: number | null
          total_payment?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "token_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_logs: {
        Row: {
          api_key_id: string | null
          completion_tokens: number
          cost_rupiah: number
          created_at: string
          id: string
          model: string
          prompt_tokens: number
          request_metadata: Json | null
          total_tokens: number
          user_id: string
        }
        Insert: {
          api_key_id?: string | null
          completion_tokens?: number
          cost_rupiah?: number
          created_at?: string
          id?: string
          model: string
          prompt_tokens?: number
          request_metadata?: Json | null
          total_tokens?: number
          user_id: string
        }
        Update: {
          api_key_id?: string | null
          completion_tokens?: number
          cost_rupiah?: number
          created_at?: string
          id?: string
          model?: string
          prompt_tokens?: number
          request_metadata?: Json | null
          total_tokens?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          balance_held: number
          balance_rupiah: number
          business_name: string | null
          business_phone: string | null
          created_at: string
          deleted_at: string | null
          email: string
          id: string
          is_suspended: boolean
          loyalty_tier: Database["public"]["Enums"]["loyalty_tier"]
          name: string | null
          npwp: string | null
          privacy_mode: boolean
          role: Database["public"]["Enums"]["user_role"]
          spending_limit_daily: number | null
          spending_limit_hourly: number | null
          suspended_at: string | null
          token_balance: number
          token_expiry: string | null
          total_purchased: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          balance_held?: number
          balance_rupiah?: number
          business_name?: string | null
          business_phone?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          id: string
          is_suspended?: boolean
          loyalty_tier?: Database["public"]["Enums"]["loyalty_tier"]
          name?: string | null
          npwp?: string | null
          privacy_mode?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          spending_limit_daily?: number | null
          spending_limit_hourly?: number | null
          suspended_at?: string | null
          token_balance?: number
          token_expiry?: string | null
          total_purchased?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          balance_held?: number
          balance_rupiah?: number
          business_name?: string | null
          business_phone?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          id?: string
          is_suspended?: boolean
          loyalty_tier?: Database["public"]["Enums"]["loyalty_tier"]
          name?: string | null
          npwp?: string | null
          privacy_mode?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          spending_limit_daily?: number | null
          spending_limit_hourly?: number | null
          suspended_at?: string | null
          token_balance?: number
          token_expiry?: string | null
          total_purchased?: number
          updated_at?: string
        }
        Relationships: []
      }
      wallet_ledger: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_tokens:
        | {
            Args: {
              p_amount_rupiah: number
              p_description?: string
              p_transaction_id: string
              p_user_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_bonus_tokens?: number
              p_duration_days?: number
              p_token_amount: number
              p_transaction_id?: string
              p_user_id: string
            }
            Returns: undefined
          }
      approve_refund: {
        Args: { p_refund_id: string; p_reviewer: string }
        Returns: undefined
      }
      authorize_request: {
        Args: {
          p_estimated_cost_usd: number
          p_forex_rate_at_hold: number
          p_idempotency_key?: string
          p_model_id: string
          p_user_id: string
        }
        Returns: string
      }
      calculate_custom_purchase: {
        Args: {
          p_duration_days: number
          p_nominal_rupiah: number
          p_token_amount: number
          p_user_id?: string
        }
        Returns: {
          bonus_percent: number
          bonus_tokens: number
          final_price: number
          is_competitive: boolean
          loyalty_tier: Database["public"]["Enums"]["loyalty_tier"]
          price_per_token: number
          token_amount: number
          total_tokens: number
        }[]
      }
      calculate_package_price: {
        Args: { p_package_id: string; p_user_id?: string }
        Returns: {
          bonus_tokens: number
          discount_percent: number
          final_price: number
          loyalty_tier: Database["public"]["Enums"]["loyalty_tier"]
          price_rupiah: number
          token_amount: number
        }[]
      }
      consume_tokens: {
        Args: {
          p_cost_rupiah: number
          p_cost_usd?: number
          p_metadata?: Json
          p_model: string
          p_tokens_used: number
          p_user_id: string
        }
        Returns: boolean
      }
      create_pending_topup: {
        Args: { p_amount_rupiah: number; p_order_id: string; p_user_id: string }
        Returns: string
      }
      expire_pending_topups: { Args: never; Returns: number }
      expire_pending_transactions: { Args: never; Returns: undefined }
      finalize_request: {
        Args: {
          p_actual_cost_usd?: number
          p_forex_rate_used?: number
          p_input_tokens?: number
          p_output_tokens?: number
          p_request_id: string
          p_status: string
        }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      mark_topup_payment: {
        Args: {
          p_expires_at: string
          p_fee: number
          p_payment_method: string
          p_payment_number: string
          p_total_payment: number
          p_transaction_id: string
        }
        Returns: undefined
      }
      process_pakasir_payment: {
        Args: { p_amount_rupiah: number; p_order_id: string }
        Returns: boolean
      }
      run_billing_reconciliation: { Args: never; Returns: undefined }
      sweep_orphaned_holds: { Args: never; Returns: number }
      update_user_loyalty_tier: {
        Args: { p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      limit_type: "hourly" | "daily"
      loyalty_tier: "bronze" | "silver" | "gold"
      model_tier: "murah" | "menengah" | "mahal"
      payment_method: "qris" | "va"
      purchase_type: "package" | "custom"
      recon_source: "redis_vs_supabase" | "internal_vs_upstream"
      recon_status: "ok" | "alert" | "resolved"
      reseller_status: "pending" | "approved" | "rejected"
      transaction_status:
        | "pending"
        | "success"
        | "failed"
        | "expired"
        | "refunded"
        | "refund_requested"
      user_role: "user" | "super_admin" | "support"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      limit_type: ["hourly", "daily"],
      loyalty_tier: ["bronze", "silver", "gold"],
      model_tier: ["murah", "menengah", "mahal"],
      payment_method: ["qris", "va"],
      purchase_type: ["package", "custom"],
      recon_source: ["redis_vs_supabase", "internal_vs_upstream"],
      recon_status: ["ok", "alert", "resolved"],
      reseller_status: ["pending", "approved", "rejected"],
      transaction_status: [
        "pending",
        "success",
        "failed",
        "expired",
        "refunded",
        "refund_requested",
      ],
      user_role: ["user", "super_admin", "support"],
    },
  },
} as const
