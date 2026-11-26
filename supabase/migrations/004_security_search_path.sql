-- 004_security_search_path.sql
-- Fix SECURITY DEFINER functions: add SET search_path = public
-- and add zero-amount rejection to finalize_payment.
-- Safe to run on existing databases (uses CREATE OR REPLACE).

-- ───────── Fix search_path on all SECURITY DEFINER functions ─────────

ALTER FUNCTION cleanup_rate_limits() SET search_path = public;
ALTER FUNCTION check_rate_limit(TEXT, TEXT, INTEGER, INTEGER) SET search_path = public;
ALTER FUNCTION get_setting(TEXT) SET search_path = public;
ALTER FUNCTION set_setting(TEXT, JSONB, UUID) SET search_path = public;
ALTER FUNCTION claim_pending_emails(INTEGER) SET search_path = public;
ALTER FUNCTION finalize_payment(UUID, TEXT, UUID, NUMERIC, TEXT, JSONB, TEXT, TEXT) SET search_path = public;

-- ───────── Add zero-amount defense-in-depth to finalize_payment ─────────
-- Replace the function to add v_payment.amount <= 0 rejection after the state check.

CREATE OR REPLACE FUNCTION finalize_payment(
  p_payment_id UUID,
  p_external_id TEXT DEFAULT NULL,
  p_verified_by UUID DEFAULT NULL,
  p_capture_amount NUMERIC DEFAULT NULL,
  p_capture_currency TEXT DEFAULT NULL,
  p_raw_response JSONB DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_payment RECORD;
  v_order RECORD;
  v_customer RECORD;
  v_access_token TEXT;
  v_token_hash TEXT;
  v_existing_access RECORD;
  v_result JSONB;
  v_base_url TEXT;
BEGIN
  SELECT p.*, o.id AS order_id, o.status AS order_status,
         o.total AS order_total, o.currency AS order_currency,
         o.customer_id, o.reference AS order_reference
  INTO v_payment
  FROM payments p
  JOIN orders o ON o.id = p.order_id
  WHERE p.id = p_payment_id
  FOR UPDATE OF p;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Payment not found');
  END IF;

  IF v_payment.status = 'completed' THEN
    SELECT ca.access_token INTO v_access_token
    FROM customer_access ca
    WHERE ca.order_id = v_payment.order_id AND ca.active = true
    LIMIT 1;

    RETURN jsonb_build_object(
      'success', true,
      'already_completed', true,
      'access_token', COALESCE(v_access_token, ''),
      'order_reference', v_payment.order_reference
    );
  END IF;

  IF v_payment.status NOT IN ('pending', 'processing') THEN
    RETURN jsonb_build_object('success', false, 'error',
      'Payment is in state ' || v_payment.status || ' and cannot be finalized');
  END IF;

  -- Defense-in-depth: reject zero or negative amounts at the DB level
  IF v_payment.amount <= 0 THEN
    UPDATE payments SET status = 'failed' WHERE id = p_payment_id;
    RETURN jsonb_build_object('success', false, 'error', 'Invalid payment amount');
  END IF;

  IF p_capture_amount IS NOT NULL THEN
    IF p_capture_amount != v_payment.amount THEN
      UPDATE payments SET status = 'failed',
        raw_response = COALESCE(p_raw_response, raw_response)
      WHERE id = p_payment_id;
      RETURN jsonb_build_object('success', false, 'error', 'Payment amount mismatch');
    END IF;
  END IF;

  IF p_capture_currency IS NOT NULL THEN
    IF p_capture_currency != v_payment.currency THEN
      UPDATE payments SET status = 'failed',
        raw_response = COALESCE(p_raw_response, raw_response)
      WHERE id = p_payment_id;
      RETURN jsonb_build_object('success', false, 'error', 'Currency mismatch');
    END IF;
  END IF;

  PERFORM 1 FROM orders WHERE id = v_payment.order_id FOR UPDATE;

  IF v_payment.order_status = 'paid' THEN
    SELECT ca.access_token INTO v_access_token
    FROM customer_access ca
    WHERE ca.order_id = v_payment.order_id AND ca.active = true
    LIMIT 1;

    RETURN jsonb_build_object(
      'success', true,
      'already_completed', true,
      'access_token', COALESCE(v_access_token, ''),
      'order_reference', v_payment.order_reference
    );
  END IF;

  UPDATE payments
  SET status = 'completed',
      external_id = COALESCE(p_external_id, external_id),
      verified_at = now(),
      verified_by = p_verified_by,
      raw_response = COALESCE(p_raw_response, raw_response)
  WHERE id = p_payment_id;

  UPDATE orders
  SET status = 'paid',
      notes = COALESCE(p_notes, notes),
      updated_at = now()
  WHERE id = v_payment.order_id;

  SELECT * INTO v_customer FROM customers WHERE id = v_payment.customer_id;

  v_access_token := gen_random_uuid()::text;
  v_token_hash := encode(digest(v_access_token, 'sha256'), 'hex');

  SELECT * INTO v_existing_access
  FROM customer_access
  WHERE order_id = v_payment.order_id AND active = true
  LIMIT 1;

  IF v_existing_access IS NULL THEN
    INSERT INTO customer_access (customer_id, order_id, access_token, token_hash, active)
    VALUES (v_payment.customer_id, v_payment.order_id, v_access_token, v_token_hash, true);
  ELSE
    v_access_token := v_existing_access.access_token;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'already_completed', false,
    'access_token', v_access_token,
    'order_reference', v_payment.order_reference,
    'customer_name', v_customer.name,
    'customer_email', v_customer.email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION finalize_payment(UUID, TEXT, UUID, NUMERIC, TEXT, JSONB, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION finalize_payment(UUID, TEXT, UUID, NUMERIC, TEXT, JSONB, TEXT, TEXT) TO service_role;
