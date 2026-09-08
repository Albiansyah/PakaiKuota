/**
 * PLACEHOLDER — replace with generated types.
 *
 * The real schema (19 tables + RPC functions) already exists in the Supabase
 * project (ref: prqtblkjmhamcbpikevi). Generate the authoritative version with:
 *
 *     npm run gen:types
 *     # = supabase gen types typescript --project-id prqtblkjmhamcbpikevi > src/types/supabase.ts
 *
 * Do NOT hand-edit the generated file (final.md §14). This stub only exists so
 * the app type-checks before the first generation. It intentionally uses a
 * permissive shape; regenerate to get real column/RPC typings.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // Minimal shapes for the tables this codebase touches before the real
      // types are generated. `npm run gen:types` REPLACES this whole file with
      // the full 19-table schema. Do not rely on this stub being complete.
      transactions: {
        Row: {
          id: string;
          user_id: string;
          order_id: string;
          amount_rupiah: number;
          status: string;
          pakasir_tx_id: string | null;
        };
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
        Relationships: [];
      };
      forex_history: {
        Row: { id: string; usd_to_idr: number; created_at: string };
        Insert: { usd_to_idr: number };
        Update: Record<string, Json>;
        Relationships: [];
      };
      api_keys: {
        Row: { id: string; user_id: string; name: string; key_prefix: string; key_hash: string; revoked_at: string | null; last_used_at: string | null; created_at: string };
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
        Relationships: [];
      };
      models: {
        Row: { id: string; slug: string; name: string; tier: string; input_price_per_1k: number; output_price_per_1k: number; markup_percent: number; enabled: boolean; created_at: string };
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
        Relationships: [];
      };
      refund_requests: {
        Row: { id: string; user_id: string; amount_rupiah: number; reason: string; status: string; reviewed_by: string | null; reviewed_at: string | null; created_at: string };
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
        Relationships: [];
      };
    };
    Views: {
      [key: string]: { Row: Record<string, Json> };
    };
    Functions: {
      add_tokens: {
        Args: {
          p_user_id: string;
          p_amount_rupiah: number;
          p_transaction_id: string;
          p_description?: string;
        };
        Returns: undefined;
      };
      authorize_request: {
        Args: {
          p_user_id: string;
          p_model_id: string;
          p_estimated_cost_usd: number;
          p_forex_rate_at_hold: number;
          p_idempotency_key?: string;
        };
        Returns: string;
      };
      finalize_request: {
        Args: {
          p_request_id: string;
          p_status: string;
          p_actual_cost_usd?: number;
          p_forex_rate_used?: number;
          p_input_tokens?: number;
          p_output_tokens?: number;
        };
        Returns: undefined;
      };
      sweep_orphaned_holds: { Args: Record<string, never>; Returns: number };
      process_pakasir_payment: {
        Args: { p_order_id: string; p_amount_rupiah: number };
        Returns: boolean;
      };
      create_pending_topup: {
        Args: { p_user_id: string; p_order_id: string; p_amount_rupiah: number };
        Returns: string;
      };
      run_billing_reconciliation: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      mark_topup_payment: {
        Args: { p_transaction_id: string; p_payment_method: string; p_payment_number: string; p_fee: number; p_total_payment: number; p_expires_at: string };
        Returns: undefined;
      };
      expire_pending_topups: { Args: Record<string, never>; Returns: number };
      approve_refund: { Args: { p_refund_id: string; p_reviewer: string }; Returns: undefined };
    };
    Enums: { [key: string]: string };
    CompositeTypes: { [key: string]: Record<string, Json> };
  };
}
