import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: 'lawyer' | 'assistant' | 'client';
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  date_of_birth: string | null;
  identification_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Case {
  id: string;
  case_number: string;
  client_id: string;
  assigned_lawyer_id: string | null;
  title: string;
  description: string | null;
  case_type: 'criminal' | 'civil' | 'corporate' | 'family' | 'other';
  status: 'active' | 'pending' | 'closed' | 'archived';
  filing_date: string;
  closure_date: string | null;
  court_name: string | null;
  opposing_party: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  client_id: string;
  lawyer_id: string;
  case_id: string | null;
  appointment_date: string;
  duration_minutes: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  location: string | null;
  meeting_type: 'in_person' | 'video_call' | 'phone_call';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  case_id: string;
  uploaded_by: string | null;
  document_name: string;
  document_type: 'contract' | 'evidence' | 'pleading' | 'correspondence' | 'court_order' | 'other';
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  description: string | null;
  upload_date: string;
  is_confidential: boolean;
}

export interface Billing {
  id: string;
  invoice_number: string;
  client_id: string;
  case_id: string | null;
  issued_by: string | null;
  issue_date: string;
  due_date: string | null;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  billing_id: string;
  client_id: string;
  payment_date: string;
  amount: number;
  payment_method: 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'online';
  transaction_reference: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  notes: string | null;
  created_at: string;
}
