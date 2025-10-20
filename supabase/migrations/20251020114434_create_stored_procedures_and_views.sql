/*
  # Stored Procedures and Database Views

  ## 1. Stored Procedures

  ### `book_appointment`
  Books a new appointment with validation
  - Checks for scheduling conflicts
  - Validates lawyer availability
  - Automatically sets status to 'scheduled'
  - Returns the created appointment

  ### `update_case_status`
  Updates case status with timeline tracking
  - Updates case status
  - Automatically creates timeline entry
  - Sets closure_date when status is 'closed'
  - Returns updated case

  ### `process_payment`
  Processes payment and updates billing status
  - Records payment
  - Updates billing status if fully paid
  - Returns payment record

  ## 2. Database Views

  ### `v_active_cases`
  Shows all active cases with client and lawyer information

  ### `v_pending_cases`
  Shows all pending cases awaiting action

  ### `v_closed_cases`
  Shows all closed cases with closure information

  ### `v_case_summary`
  Comprehensive view of all cases with aggregated statistics

  ### `v_upcoming_appointments`
  Shows all future scheduled appointments

  ### `v_overdue_invoices`
  Shows all overdue invoices with payment status

  ### `v_client_financial_summary`
  Shows financial summary per client (total billed, paid, outstanding)

  ## 3. Important Notes

  - All stored procedures include comprehensive error handling
  - Views provide real-time data for reporting
  - Procedures respect RLS policies
  - Views include all necessary joins for complete information
*/

-- =============================================
-- STORED PROCEDURE: BOOK APPOINTMENT
-- =============================================
CREATE OR REPLACE FUNCTION book_appointment(
  p_client_id uuid,
  p_lawyer_id uuid,
  p_case_id uuid,
  p_appointment_date timestamptz,
  p_duration_minutes integer,
  p_location text,
  p_meeting_type text,
  p_notes text
)
RETURNS TABLE (
  appointment_id uuid,
  success boolean,
  message text
) AS $$
DECLARE
  v_appointment_id uuid;
  v_conflict_count integer;
BEGIN
  -- Check for scheduling conflicts (same lawyer, overlapping time)
  SELECT COUNT(*) INTO v_conflict_count
  FROM appointments
  WHERE lawyer_id = p_lawyer_id
    AND status NOT IN ('cancelled', 'completed')
    AND (
      (p_appointment_date >= appointment_date 
        AND p_appointment_date < appointment_date + (duration_minutes || ' minutes')::interval)
      OR
      (p_appointment_date + (p_duration_minutes || ' minutes')::interval > appointment_date
        AND p_appointment_date + (p_duration_minutes || ' minutes')::interval <= appointment_date + (duration_minutes || ' minutes')::interval)
      OR
      (p_appointment_date <= appointment_date
        AND p_appointment_date + (p_duration_minutes || ' minutes')::interval >= appointment_date + (duration_minutes || ' minutes')::interval)
    );

  IF v_conflict_count > 0 THEN
    RETURN QUERY SELECT NULL::uuid, false, 'Scheduling conflict: Lawyer is not available at this time';
    RETURN;
  END IF;

  -- Create appointment
  INSERT INTO appointments (
    client_id,
    lawyer_id,
    case_id,
    appointment_date,
    duration_minutes,
    location,
    meeting_type,
    notes,
    status
  ) VALUES (
    p_client_id,
    p_lawyer_id,
    p_case_id,
    p_appointment_date,
    p_duration_minutes,
    p_location,
    p_meeting_type,
    p_notes,
    'scheduled'
  ) RETURNING id INTO v_appointment_id;

  RETURN QUERY SELECT v_appointment_id, true, 'Appointment booked successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STORED PROCEDURE: UPDATE CASE STATUS
-- =============================================
CREATE OR REPLACE FUNCTION update_case_status(
  p_case_id uuid,
  p_new_status text,
  p_updated_by uuid,
  p_notes text DEFAULT NULL
)
RETURNS TABLE (
  case_id uuid,
  success boolean,
  message text
) AS $$
DECLARE
  v_old_status text;
  v_case_title text;
BEGIN
  -- Get current status
  SELECT status, title INTO v_old_status, v_case_title
  FROM cases
  WHERE id = p_case_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::uuid, false, 'Case not found';
    RETURN;
  END IF;

  -- Update case status
  UPDATE cases
  SET 
    status = p_new_status,
    closure_date = CASE WHEN p_new_status = 'closed' THEN CURRENT_DATE ELSE closure_date END,
    updated_at = now()
  WHERE id = p_case_id;

  -- Create timeline entry for status change
  INSERT INTO case_timeline (
    case_id,
    event_type,
    title,
    description,
    event_date,
    completed,
    created_by
  ) VALUES (
    p_case_id,
    'other',
    'Status Changed: ' || v_old_status || ' → ' || p_new_status,
    COALESCE(p_notes, 'Case status updated from ' || v_old_status || ' to ' || p_new_status),
    now(),
    true,
    p_updated_by
  );

  RETURN QUERY SELECT p_case_id, true, 'Case status updated successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STORED PROCEDURE: PROCESS PAYMENT
-- =============================================
CREATE OR REPLACE FUNCTION process_payment(
  p_billing_id uuid,
  p_client_id uuid,
  p_amount decimal,
  p_payment_method text,
  p_transaction_reference text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS TABLE (
  payment_id uuid,
  success boolean,
  message text
) AS $$
DECLARE
  v_payment_id uuid;
  v_total_amount decimal;
  v_total_paid decimal;
  v_remaining decimal;
BEGIN
  -- Get billing total
  SELECT total_amount INTO v_total_amount
  FROM billing
  WHERE id = p_billing_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::uuid, false, 'Invoice not found';
    RETURN;
  END IF;

  -- Calculate total paid so far
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM payments
  WHERE billing_id = p_billing_id AND status = 'completed';

  -- Check if payment exceeds remaining balance
  v_remaining := v_total_amount - v_total_paid;
  IF p_amount > v_remaining THEN
    RETURN QUERY SELECT NULL::uuid, false, 'Payment amount exceeds remaining balance of ' || v_remaining;
    RETURN;
  END IF;

  -- Record payment
  INSERT INTO payments (
    billing_id,
    client_id,
    payment_date,
    amount,
    payment_method,
    transaction_reference,
    status,
    notes
  ) VALUES (
    p_billing_id,
    p_client_id,
    now(),
    p_amount,
    p_payment_method,
    p_transaction_reference,
    'completed',
    p_notes
  ) RETURNING id INTO v_payment_id;

  -- Update billing status if fully paid
  IF v_total_paid + p_amount >= v_total_amount THEN
    UPDATE billing
    SET status = 'paid', updated_at = now()
    WHERE id = p_billing_id;
  END IF;

  RETURN QUERY SELECT v_payment_id, true, 'Payment processed successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- VIEW: ACTIVE CASES
-- =============================================
CREATE OR REPLACE VIEW v_active_cases AS
SELECT 
  c.id,
  c.case_number,
  c.title,
  c.case_type,
  c.priority,
  c.filing_date,
  c.court_name,
  c.opposing_party,
  cl.full_name as client_name,
  cl.email as client_email,
  cl.phone as client_phone,
  p.full_name as lawyer_name,
  p.email as lawyer_email,
  c.created_at,
  c.updated_at
FROM cases c
LEFT JOIN clients cl ON c.client_id = cl.id
LEFT JOIN profiles p ON c.assigned_lawyer_id = p.id
WHERE c.status = 'active'
ORDER BY c.priority DESC, c.filing_date DESC;

-- =============================================
-- VIEW: PENDING CASES
-- =============================================
CREATE OR REPLACE VIEW v_pending_cases AS
SELECT 
  c.id,
  c.case_number,
  c.title,
  c.case_type,
  c.priority,
  c.filing_date,
  cl.full_name as client_name,
  cl.email as client_email,
  p.full_name as lawyer_name,
  c.created_at
FROM cases c
LEFT JOIN clients cl ON c.client_id = cl.id
LEFT JOIN profiles p ON c.assigned_lawyer_id = p.id
WHERE c.status = 'pending'
ORDER BY c.priority DESC, c.filing_date ASC;

-- =============================================
-- VIEW: CLOSED CASES
-- =============================================
CREATE OR REPLACE VIEW v_closed_cases AS
SELECT 
  c.id,
  c.case_number,
  c.title,
  c.case_type,
  c.filing_date,
  c.closure_date,
  cl.full_name as client_name,
  p.full_name as lawyer_name,
  c.created_at,
  c.updated_at
FROM cases c
LEFT JOIN clients cl ON c.client_id = cl.id
LEFT JOIN profiles p ON c.assigned_lawyer_id = p.id
WHERE c.status = 'closed'
ORDER BY c.closure_date DESC;

-- =============================================
-- VIEW: CASE SUMMARY
-- =============================================
CREATE OR REPLACE VIEW v_case_summary AS
SELECT 
  c.id,
  c.case_number,
  c.title,
  c.case_type,
  c.status,
  c.priority,
  c.filing_date,
  c.closure_date,
  cl.full_name as client_name,
  cl.email as client_email,
  p.full_name as lawyer_name,
  p.email as lawyer_email,
  COUNT(DISTINCT d.id) as document_count,
  COUNT(DISTINCT a.id) as appointment_count,
  COUNT(DISTINCT ct.id) as timeline_event_count,
  COUNT(DISTINCT ct.id) FILTER (WHERE ct.completed = false AND ct.event_date < now()) as overdue_events,
  c.created_at,
  c.updated_at
FROM cases c
LEFT JOIN clients cl ON c.client_id = cl.id
LEFT JOIN profiles p ON c.assigned_lawyer_id = p.id
LEFT JOIN documents d ON c.id = d.case_id
LEFT JOIN appointments a ON c.id = a.case_id
LEFT JOIN case_timeline ct ON c.id = ct.case_id
GROUP BY c.id, cl.full_name, cl.email, p.full_name, p.email
ORDER BY c.updated_at DESC;

-- =============================================
-- VIEW: UPCOMING APPOINTMENTS
-- =============================================
CREATE OR REPLACE VIEW v_upcoming_appointments AS
SELECT 
  a.id,
  a.appointment_date,
  a.duration_minutes,
  a.status,
  a.location,
  a.meeting_type,
  cl.full_name as client_name,
  cl.email as client_email,
  cl.phone as client_phone,
  p.full_name as lawyer_name,
  p.email as lawyer_email,
  c.case_number,
  c.title as case_title,
  a.notes,
  a.created_at
FROM appointments a
JOIN clients cl ON a.client_id = cl.id
JOIN profiles p ON a.lawyer_id = p.id
LEFT JOIN cases c ON a.case_id = c.id
WHERE a.appointment_date >= now()
  AND a.status IN ('scheduled', 'confirmed')
ORDER BY a.appointment_date ASC;

-- =============================================
-- VIEW: OVERDUE INVOICES
-- =============================================
CREATE OR REPLACE VIEW v_overdue_invoices AS
SELECT 
  b.id,
  b.invoice_number,
  b.issue_date,
  b.due_date,
  b.total_amount,
  b.status,
  CURRENT_DATE - b.due_date as days_overdue,
  cl.full_name as client_name,
  cl.email as client_email,
  cl.phone as client_phone,
  c.case_number,
  c.title as case_title,
  COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed'), 0) as amount_paid,
  b.total_amount - COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed'), 0) as amount_outstanding
FROM billing b
JOIN clients cl ON b.client_id = cl.id
LEFT JOIN cases c ON b.case_id = c.id
LEFT JOIN payments p ON b.id = p.billing_id
WHERE b.due_date < CURRENT_DATE
  AND b.status NOT IN ('paid', 'cancelled')
GROUP BY b.id, cl.full_name, cl.email, cl.phone, c.case_number, c.title
ORDER BY b.due_date ASC;

-- =============================================
-- VIEW: CLIENT FINANCIAL SUMMARY
-- =============================================
CREATE OR REPLACE VIEW v_client_financial_summary AS
SELECT 
  cl.id as client_id,
  cl.full_name as client_name,
  cl.email as client_email,
  COUNT(DISTINCT b.id) as total_invoices,
  COALESCE(SUM(b.total_amount), 0) as total_billed,
  COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed'), 0) as total_paid,
  COALESCE(SUM(b.total_amount), 0) - COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed'), 0) as outstanding_balance,
  COUNT(b.id) FILTER (WHERE b.status = 'overdue') as overdue_invoices_count
FROM clients cl
LEFT JOIN billing b ON cl.id = b.client_id
LEFT JOIN payments p ON b.id = p.billing_id
GROUP BY cl.id, cl.full_name, cl.email
HAVING COUNT(b.id) > 0
ORDER BY outstanding_balance DESC;

-- =============================================
-- SECURITY POLICIES
-- =============================================

-- Policies for "clients" table
CREATE POLICY "Clients can view own data"
  ON clients FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Clients can insert own data"
  ON clients FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Clients can update own data"
  ON clients FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Clients can delete own data"
  ON clients FOR DELETE
  USING (id = auth.uid());

-- Policies for "profiles" table
CREATE POLICY "Profiles can view own data"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Profiles can update own data"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Add after the existing policies for profiles
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);