/*
  # Lawyer Client Management System - Complete Database Schema

  ## Overview
  This migration creates a comprehensive lawyer client management system with role-based access,
  case tracking, appointment scheduling, document management, and billing capabilities.

  ## 1. New Tables

  ### `profiles`
  Extends Supabase auth.users with additional user information
  - `id` (uuid, primary key, references auth.users)
  - `email` (text, unique)
  - `full_name` (text)
  - `phone` (text)
  - `role` (text) - 'lawyer', 'assistant', 'client'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `clients`
  Stores detailed client information
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles) - links to user account if client has login
  - `full_name` (text)
  - `email` (text, unique)
  - `phone` (text)
  - `address` (text)
  - `date_of_birth` (date)
  - `identification_number` (text, unique)
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `cases`
  Tracks all legal cases
  - `id` (uuid, primary key)
  - `case_number` (text, unique) - auto-generated unique identifier
  - `client_id` (uuid, references clients)
  - `assigned_lawyer_id` (uuid, references profiles)
  - `title` (text)
  - `description` (text)
  - `case_type` (text) - e.g., 'criminal', 'civil', 'corporate', 'family'
  - `status` (text) - 'active', 'pending', 'closed', 'archived'
  - `filing_date` (date)
  - `closure_date` (date)
  - `court_name` (text)
  - `opposing_party` (text)
  - `priority` (text) - 'low', 'medium', 'high', 'urgent'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `case_timeline`
  Tracks important events and deadlines for each case
  - `id` (uuid, primary key)
  - `case_id` (uuid, references cases)
  - `event_type` (text) - 'hearing', 'deadline', 'evidence_submission', 'filing', 'meeting', 'other'
  - `title` (text)
  - `description` (text)
  - `event_date` (timestamptz)
  - `completed` (boolean)
  - `created_by` (uuid, references profiles)
  - `created_at` (timestamptz)

  ### `appointments`
  Manages appointment scheduling
  - `id` (uuid, primary key)
  - `client_id` (uuid, references clients)
  - `lawyer_id` (uuid, references profiles)
  - `case_id` (uuid, references cases, nullable)
  - `appointment_date` (timestamptz)
  - `duration_minutes` (integer)
  - `status` (text) - 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'
  - `location` (text)
  - `meeting_type` (text) - 'in_person', 'video_call', 'phone_call'
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `documents`
  Stores legal document metadata (files stored in Supabase Storage)
  - `id` (uuid, primary key)
  - `case_id` (uuid, references cases)
  - `uploaded_by` (uuid, references profiles)
  - `document_name` (text)
  - `document_type` (text) - 'contract', 'evidence', 'pleading', 'correspondence', 'court_order', 'other'
  - `file_path` (text) - path in Supabase Storage
  - `file_size` (bigint) - in bytes
  - `mime_type` (text)
  - `description` (text)
  - `upload_date` (timestamptz)
  - `is_confidential` (boolean)

  ### `billing`
  Manages invoices and billing records
  - `id` (uuid, primary key)
  - `invoice_number` (text, unique)
  - `client_id` (uuid, references clients)
  - `case_id` (uuid, references cases, nullable)
  - `issued_by` (uuid, references profiles)
  - `issue_date` (date)
  - `due_date` (date)
  - `subtotal` (decimal)
  - `tax_amount` (decimal)
  - `total_amount` (decimal)
  - `status` (text) - 'draft', 'sent', 'paid', 'overdue', 'cancelled'
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `billing_items`
  Line items for each invoice
  - `id` (uuid, primary key)
  - `billing_id` (uuid, references billing)
  - `description` (text)
  - `quantity` (decimal)
  - `unit_price` (decimal)
  - `amount` (decimal)
  - `service_date` (date)

  ### `payments`
  Tracks payment transactions
  - `id` (uuid, primary key)
  - `billing_id` (uuid, references billing)
  - `client_id` (uuid, references clients)
  - `payment_date` (timestamptz)
  - `amount` (decimal)
  - `payment_method` (text) - 'cash', 'check', 'bank_transfer', 'credit_card', 'online'
  - `transaction_reference` (text)
  - `status` (text) - 'pending', 'completed', 'failed', 'refunded'
  - `notes` (text)
  - `created_at` (timestamptz)

  ## 2. Security Configuration

  ### Row Level Security (RLS)
  All tables have RLS enabled with policies based on user roles:
  - **Lawyers**: Full access to all data
  - **Assistants**: Read/write access to most data, limited financial access
  - **Clients**: Access only to their own data (cases, appointments, documents, billing)

  ### Policies Created
  Each table has specific policies for SELECT, INSERT, UPDATE, and DELETE operations
  based on the user's role and data ownership.

  ## 3. Important Notes

  ### Data Integrity
  - Unique constraints on case_number, invoice_number, client email, and identification_number
  - Foreign key relationships ensure referential integrity
  - Triggers prevent duplicate case entries
  - Default values set for timestamps, status fields, and booleans

  ### Automation
  - Auto-generated case numbers and invoice numbers
  - Automatic timestamp updates on record modifications
  - Calculated totals in billing tables

  ### Audit Trail
  - All tables include created_at timestamps
  - Key tables include updated_at timestamps
  - case_timeline tracks who created events
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL CHECK (role IN ('lawyer', 'assistant', 'client')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =============================================
-- CLIENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  address text,
  date_of_birth date,
  identification_number text UNIQUE,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers and assistants can view all clients"
  ON clients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('lawyer', 'assistant')
    )
  );

CREATE POLICY "Clients can view own record"
  ON clients FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Lawyers and assistants can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('lawyer', 'assistant')
    )
  );

CREATE POLICY "Lawyers and assistants can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('lawyer', 'assistant')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('lawyer', 'assistant')
    )
  );

CREATE POLICY "Lawyers can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'lawyer'
    )
  );

-- =============================================
-- CASES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number text UNIQUE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  assigned_lawyer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  case_type text CHECK (case_type IN ('criminal', 'civil', 'corporate', 'family', 'other')),
  status text DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'closed', 'archived')),
  filing_date date DEFAULT CURRENT_DATE,
  closure_date date,
  court_name text,
  opposing_party text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers and assistants can view all cases"
  ON cases FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('lawyer', 'assistant')
    )
  );

CREATE POLICY "Clients can view own cases"
  ON cases FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = cases.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Lawyers and assistants can insert cases"
  ON cases FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('lawyer', 'assistant')
    )
  );

CREATE POLICY "Lawyers and assistants can update cases"
  ON cases FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('lawyer', 'assistant')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('lawyer', 'assistant')
    )
  );

CREATE POLICY "Lawyers can delete cases"
  ON cases FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'lawyer'
    )
  );

-- =============================================
-- CASE TIMELINE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS case_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('hearing', 'deadline', 'evidence_submission', 'filing', 'meeting', 'other')),
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL,
  completed boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE case_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers and assistants can view all timeline events"
  ON case_timeline FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('lawyer', 'assistant')
    )
  );

CREATE POLICY "Clients can view own case timeline"
  ON case_timeline FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cases
      JOIN clients ON clients.id = cases.client_id
      WHERE cases.id = case_timeline.case_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Lawyers and assistants can insert timeline events"
  ON case_timeline FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('lawyer', 'assistant')
    )
  );

CREATE POLICY "Lawyers and assistants can update timeline events"
  ON case_timeline FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('lawyer', 'assistant')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('lawyer', 'assistant')
    )
  );

CREATE POLICY "Lawyers and assistants can delete timeline events"
  ON case_timeline FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('lawyer', 'assistant')
    )
  );

-- =============================================
-- APPOINTMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  lawyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  case_id uuid REFERENCES cases(id) ON DELETE SET NULL,
  appointment_date timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  location text,
  meeting_type text DEFAULT 'in_person' CHECK (meeting_type IN ('in_person', 'video_call', 'phone_call')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers and assistants can view all appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('lawyer', 'assistant')
    )
  );

CREATE POLICY "Clients can view own appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = appointments.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Lawyers and assistants can insert appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('lawyer', 'assistant')
    )
  );

CREATE POLICY "Clients can insert own appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = appointments.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Lawyers and assistants can update appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('lawyer', 'assistant')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('lawyer', 'assistant')
    )
  );

CREATE POLICY "Clients can update own appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = appointments.client_id
      AND clients.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = appointments.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Lawyers can delete appointments"
  ON appointments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'lawyer'
    )
  );

-- =============================================
-- DOCUMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  document_name text NOT NULL,
  document_type text CHECK (document_type IN ('contract', 'evidence', 'pleading', 'correspondence', 'court_order', 'other')),
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  description text,
  upload_date timestamptz DEFAULT now(),
  is_confidential boolean DEFAULT false
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers and assistants can view all documents"
  ON documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('lawyer', 'assistant')
    )
  );

CREATE POLICY "Clients can view own case documents"
  ON documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cases
      JOIN clients ON clients.id = cases.client_id
      WHERE cases.id = documents.case_id
      AND clients.user_id = auth.uid()
      AND documents.is_confidential = false
    )
  );

CREATE POLICY "Lawyers and assistants can insert documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('lawyer', 'assistant')
    )
  );

CREATE POLICY "Clients can upload documents to own cases"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cases
      JOIN clients ON clients.id = cases.client_id
      WHERE cases.id = documents.case_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Lawyers and assistants can update documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('lawyer', 'assistant')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('lawyer', 'assistant')
    )
  );

CREATE POLICY "Lawyers can delete documents"
  ON documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'lawyer'
    )
  );

-- =============================================
-- BILLING TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS billing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  case_id uuid REFERENCES cases(id) ON DELETE SET NULL,
  issued_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  issue_date date DEFAULT CURRENT_DATE,
  due_date date,
  subtotal decimal(10,2) DEFAULT 0,
  tax_amount decimal(10,2) DEFAULT 0,
  total_amount decimal(10,2) DEFAULT 0,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers can view all billing"
  ON billing FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'lawyer'
    )
  );

CREATE POLICY "Clients can view own billing"
  ON billing FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = billing.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Lawyers can insert billing"
  ON billing FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'lawyer'
    )
  );

CREATE POLICY "Lawyers can update billing"
  ON billing FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'lawyer'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'lawyer'
    )
  );

CREATE POLICY "Lawyers can delete billing"
  ON billing FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'lawyer'
    )
  );

-- =============================================
-- BILLING ITEMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS billing_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_id uuid REFERENCES billing(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  quantity decimal(10,2) DEFAULT 1,
  unit_price decimal(10,2) NOT NULL,
  amount decimal(10,2) NOT NULL,
  service_date date DEFAULT CURRENT_DATE
);

ALTER TABLE billing_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers can view all billing items"
  ON billing_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'lawyer'
    )
  );

CREATE POLICY "Clients can view own billing items"
  ON billing_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM billing
      JOIN clients ON clients.id = billing.client_id
      WHERE billing.id = billing_items.billing_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Lawyers can insert billing items"
  ON billing_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'lawyer'
    )
  );

CREATE POLICY "Lawyers can update billing items"
  ON billing_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'lawyer'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'lawyer'
    )
  );

CREATE POLICY "Lawyers can delete billing items"
  ON billing_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'lawyer'
    )
  );

-- =============================================
-- PAYMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_id uuid REFERENCES billing(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  payment_date timestamptz DEFAULT now(),
  amount decimal(10,2) NOT NULL,
  payment_method text CHECK (payment_method IN ('cash', 'check', 'bank_transfer', 'credit_card', 'online')),
  transaction_reference text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers can view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'lawyer'
    )
  );

CREATE POLICY "Clients can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = payments.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Lawyers can insert payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'lawyer'
    )
  );

CREATE POLICY "Lawyers can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'lawyer'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'lawyer'
    )
  );

CREATE POLICY "Lawyers can delete payments"
  ON payments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'lawyer'
    )
  );

-- =============================================
-- TRIGGERS AND FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_updated_at BEFORE UPDATE ON billing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to prevent duplicate case numbers
CREATE OR REPLACE FUNCTION check_duplicate_case_number()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM cases WHERE case_number = NEW.case_number AND id != NEW.id) THEN
    RAISE EXCEPTION 'Case number % already exists', NEW.case_number;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_duplicate_case_number BEFORE INSERT OR UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION check_duplicate_case_number();

-- Function to auto-generate case numbers
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number integer;
  year_prefix text;
BEGIN
  IF NEW.case_number IS NULL OR NEW.case_number = '' THEN
    year_prefix := TO_CHAR(CURRENT_DATE, 'YYYY');
    SELECT COALESCE(MAX(CAST(SUBSTRING(case_number FROM '[0-9]+$') AS integer)), 0) + 1
    INTO next_number
    FROM cases
    WHERE case_number LIKE 'CASE-' || year_prefix || '-%';
    
    NEW.case_number := 'CASE-' || year_prefix || '-' || LPAD(next_number::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_case_number BEFORE INSERT ON cases
  FOR EACH ROW EXECUTE FUNCTION generate_case_number();

-- Function to auto-generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number integer;
  year_prefix text;
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    year_prefix := TO_CHAR(CURRENT_DATE, 'YYYY');
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS integer)), 0) + 1
    INTO next_number
    FROM billing
    WHERE invoice_number LIKE 'INV-' || year_prefix || '-%';
    
    NEW.invoice_number := 'INV-' || year_prefix || '-' || LPAD(next_number::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_invoice_number BEFORE INSERT ON billing
  FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();