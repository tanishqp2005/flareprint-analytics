export type Order = {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  page_count: number;
  copies: number;
  color_print: boolean;
  total_price: number;
  status: string;
  pickup_location?: string | null;
  created_at: string;
  updated_at: string;
  payment_method?: string | null;
  floor?: string | null;
  room?: string | null;
  payment_provider?: string | null;
  secured_print?: boolean | null;
  payment_url?: string | null;
  phonepe_transaction_id?: string | null;
  payment_status: string | null;
  payment_completed_at?: string | null;
  batch_id?: string | null;
  print_sides?: string | null;
  kiosk_id?: string | null; // Contains kiosk code, e.g. 'flareprint-003'
};

/**
 * Sanitized order representation returned by the analytics API.
 * Excludes sensitive fields like payment_url, phonepe_transaction_id, file_path, etc.
 */
export type SafeOrder = {
  id: string;
  file_name: string;
  kiosk_id: string | null;
  page_count: number;
  copies: number;
  color_print: boolean;
  print_sides?: string | null;
  total_price: number;
  payment_status: string | null;
  status: string;
  created_at: string;
  batch_id?: string | null;
};

/**
 * Sanitized kiosk session representation returned by the analytics API.
 * Never exposes session_token, file_path, or private payment identifiers.
 */
export type SafeKioskSession = {
  id: string;
  kiosk_id: string; // kiosk UUID
  kiosk_code: string; // e.g. 'flareprint-003'
  kiosk_name?: string; // e.g. 'Flareprint Sakec Library'
  status: string; // 'completed' | 'cancelled' | 'expired' | 'active'
  payment_status: string | null;
  total_price: number;
  page_count: number;
  print_sides?: string | null;
  file_name?: string | null;
  created_at: string;
  expires_at?: string | null;
  completed_at?: string | null;
};

/**
 * Unified reconciled log item combining public.orders and public.kiosk_sessions
 */
export type UnifiedJobLog = {
  id: string;
  source: 'order' | 'kiosk_session' | 'reconciled';
  file_name: string;
  kiosk_id: string | null; // e.g. 'flareprint-003' or null for Web Upload
  kiosk_name?: string | null;
  page_count: number;
  copies: number;
  color_print: boolean;
  print_sides?: string | null;
  total_price: number;
  payment_status: string | null;
  status: string;
  created_at: string;
  completed_at?: string | null;
  batch_id?: string | null;
};

export type Kiosk = {
  id: string;
  kiosk_code: string;
  display_name: string;
  location?: string | null;
  status: 'online' | 'offline' | 'idle' | 'active' | string;
  current_session_id?: string | null;
  last_heartbeat?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type KioskSession = {
  id: string;
  kiosk_id: string;
  session_token: string;
  status: string;
  file_path?: string | null;
  file_name?: string | null;
  page_count?: number | null;
  print_sides?: string | null;
  total_price?: number | null;
  payment_status?: string | null;
  payment_id?: string | null;
  expires_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  file_paths?: string[] | null;
};

export type Profile = {
  id: string;
  user_id?: string;
  email: string;
  full_name?: string | null;
  department?: string | null;
  phone_number?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AdminSetting = {
  id: string;
  setting_key: string;
  setting_value: boolean;
  setting_description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};
