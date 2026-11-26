-- 003_security_hardening.sql
-- Atomic payment processing, rate limiting, settings, email queue, access tokens hashing.
-- Safe to apply on top of 001 + 002 without data loss.

-- ───────── Idempotency keys on payments ─────────
ALTER TABLE payments ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_payments_idempotency ON payments (idempotency_key);

-- ───────── App settings (admin-editable) ─────────
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES admin_users(id)
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO app_settings (key, value) VALUES
  ('sales_enabled', 'false'::jsonb),
  ('product_price_cents', '0'::jsonb),
  ('product_currency', '"USD"'::jsonb),
  ('calendar_open_hour', '8'::jsonb),
  ('calendar_timezone', '"America/Puerto_Rico"'::jsonb),
  ('calendar_year', '2027'::jsonb),
  ('support_email', '""'::jsonb),
  ('zelle_recipient_name', '""'::jsonb),
  ('zelle_recipient_email', '""'::jsonb),
  ('zelle_recipient_phone', '""'::jsonb),
  ('zelle_instructions', '"Envía el monto exacto por Zelle. Incluye tu referencia en la nota del pago."'::jsonb),
  ('paypal_enabled', 'false'::jsonb),
  ('ath_movil_enabled', 'false'::jsonb),
  ('zelle_enabled', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ───────── Products: add sales_enabled + price in cents ─────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_cents INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sales_enabled BOOLEAN NOT NULL DEFAULT false;

-- Migrate existing price to cents (if price is set and non-zero)
UPDATE products SET price_cents = (price * 100)::integer WHERE price IS NOT NULL AND price > 0 AND price_cents IS NULL;

-- ───────── Rate limiting ─────────
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_count INTEGER NOT NULL DEFAULT 1,
  UNIQUE(identifier, endpoint, window_start)
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
  ON rate_limits (identifier, endpoint, window_start);

-- Auto-cleanup old rate limit records (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits WHERE window_start < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- ───────── Email delivery queue ─────────
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  template TEXT,
  customer_id UUID REFERENCES customers(id),
  order_id UUID REFERENCES orders(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'skipped')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  last_attempt_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  resend_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key TEXT UNIQUE
);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue (status) WHERE status IN ('pending', 'sending');
CREATE INDEX IF NOT EXISTS idx_email_queue_customer ON email_queue (customer_id);

ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- ───────── Webhook events (PayPal, ATH Móvil) ─────────
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('paypal', 'ath_movil')),
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, event_id)
);
CREATE INDEX IF NOT EXISTS idx_webhook_events_lookup
  ON webhook_events (provider, event_id);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- ───────── Hashed access tokens ─────────
ALTER TABLE customer_access ADD COLUMN IF NOT EXISTS token_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_customer_access_token_hash ON customer_access (token_hash);

-- Unique constraint: one active access per order (prevent duplicate grants)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_access_unique_active
  ON customer_access (order_id) WHERE active = true;

-- ───────── Atomic payment finalization ─────────
-- This function handles the entire payment → order → access → email flow atomically.
-- Called by PayPal capture, Zelle approval, and ATH Móvil confirmation.
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
  -- Lock the payment row to prevent concurrent processing
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

  -- Idempotency: if already completed, return existing result
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

  -- Verify payment is in a processable state
  IF v_payment.status NOT IN ('pending', 'processing') THEN
    RETURN jsonb_build_object('success', false, 'error',
      'Payment is in state ' || v_payment.status || ' and cannot be finalized');
  END IF;

  -- Verify amount if provided (PayPal capture verification)
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

  -- Lock the order row
  PERFORM 1 FROM orders WHERE id = v_payment.order_id FOR UPDATE;

  -- Check order isn't already paid (another payment may have succeeded)
  IF v_payment.order_status = 'paid' THEN
    UPDATE payments SET status = 'failed',
      raw_response = COALESCE(p_raw_response, raw_response)
    WHERE id = p_payment_id;
    RETURN jsonb_build_object('success', false, 'error', 'Order already paid by another payment');
  END IF;

  -- Update payment to completed
  UPDATE payments SET
    status = 'completed',
    external_id = COALESCE(p_external_id, external_id),
    raw_response = COALESCE(p_raw_response, raw_response),
    verified_at = now(),
    verified_by = p_verified_by,
    idempotency_key = p_idempotency_key
  WHERE id = p_payment_id;

  -- Update order to paid
  UPDATE orders SET status = 'paid', notes = COALESCE(p_notes, notes)
  WHERE id = v_payment.order_id;

  -- Get customer info
  SELECT c.id, c.name, c.email INTO v_customer
  FROM customers c WHERE c.id = v_payment.customer_id;

  -- Check for existing active access on this order (idempotency)
  SELECT * INTO v_existing_access
  FROM customer_access
  WHERE order_id = v_payment.order_id AND active = true
  LIMIT 1;

  IF v_existing_access.id IS NOT NULL THEN
    v_access_token := v_existing_access.access_token;
  ELSE
    -- Generate access token (hex, will be hashed in app layer)
    v_access_token := encode(gen_random_bytes(32), 'hex');
    v_token_hash := encode(sha256(v_access_token::bytea), 'hex');

    INSERT INTO customer_access (customer_id, order_id, access_token, token_hash, active)
    VALUES (v_payment.customer_id, v_payment.order_id, v_access_token, v_token_hash, true);
  END IF;

  -- Queue confirmation email
  INSERT INTO email_queue (to_email, subject, template, customer_id, order_id, idempotency_key)
  VALUES (
    v_customer.email,
    '¡Tu calendario está listo!',
    'access_granted',
    v_customer.id,
    v_payment.order_id,
    'access_granted_' || v_payment.order_id::text
  )
  ON CONFLICT (idempotency_key) DO NOTHING;

  -- Queue purchase confirmation email
  INSERT INTO email_queue (to_email, subject, template, customer_id, order_id, idempotency_key)
  VALUES (
    v_customer.email,
    'Tu compra de 14 días de dulce amor',
    'purchase_confirmation',
    v_customer.id,
    v_payment.order_id,
    'purchase_confirm_' || v_payment.order_id::text
  )
  ON CONFLICT (idempotency_key) DO NOTHING;

  -- Audit log
  INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, details)
  VALUES (
    p_verified_by,
    'finalize_payment',
    'payment',
    p_payment_id,
    jsonb_build_object(
      'order_id', v_payment.order_id,
      'amount', v_payment.amount,
      'method', v_payment.payment_method,
      'external_id', COALESCE(p_external_id, v_payment.external_id)
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'already_completed', false,
    'access_token', v_access_token,
    'order_reference', v_payment.order_reference,
    'customer_name', v_customer.name,
    'customer_email', v_customer.email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke public execute on finalize_payment
REVOKE ALL ON FUNCTION finalize_payment FROM PUBLIC;
GRANT EXECUTE ON FUNCTION finalize_payment TO service_role;

-- ───────── Rate limit check function ─────────
-- Returns true if request is allowed, false if rate-limited.
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER,
  p_window_seconds INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  v_window_start := date_trunc('second', now()) - (extract(epoch from now())::integer % p_window_seconds) * interval '1 second';

  -- Clean old entries opportunistically (1% chance)
  IF random() < 0.01 THEN
    PERFORM cleanup_rate_limits();
  END IF;

  -- Upsert the counter
  INSERT INTO rate_limits (identifier, endpoint, window_start, request_count)
  VALUES (p_identifier, p_endpoint, v_window_start, 1)
  ON CONFLICT (identifier, endpoint, window_start)
  DO UPDATE SET request_count = rate_limits.request_count + 1
  RETURNING request_count INTO v_count;

  RETURN v_count <= p_max_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION check_rate_limit FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_rate_limit TO service_role;

-- ───────── Get setting helper ─────────
CREATE OR REPLACE FUNCTION get_setting(p_key TEXT)
RETURNS JSONB AS $$
  SELECT value FROM app_settings WHERE key = p_key;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

REVOKE ALL ON FUNCTION get_setting FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_setting TO service_role;

-- ───────── Update setting helper ─────────
CREATE OR REPLACE FUNCTION set_setting(p_key TEXT, p_value JSONB, p_admin_id UUID DEFAULT NULL)
RETURNS void AS $$
BEGIN
  INSERT INTO app_settings (key, value, updated_at, updated_by)
  VALUES (p_key, p_value, now(), p_admin_id)
  ON CONFLICT (key)
  DO UPDATE SET value = p_value, updated_at = now(), updated_by = p_admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION set_setting FROM PUBLIC;
GRANT EXECUTE ON FUNCTION set_setting TO service_role;

-- ───────── Process email queue function ─────────
-- Returns up to N pending emails to send, marking them as 'sending'.
CREATE OR REPLACE FUNCTION claim_pending_emails(p_limit INTEGER DEFAULT 5)
RETURNS SETOF email_queue AS $$
  UPDATE email_queue
  SET status = 'sending', last_attempt_at = now(), attempts = attempts + 1
  WHERE id IN (
    SELECT id FROM email_queue
    WHERE status = 'pending'
      AND (last_attempt_at IS NULL OR last_attempt_at < now() - interval '1 minute')
      AND attempts < max_attempts
    ORDER BY created_at
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
$$ LANGUAGE sql SECURITY DEFINER;

REVOKE ALL ON FUNCTION claim_pending_emails FROM PUBLIC;
GRANT EXECUTE ON FUNCTION claim_pending_emails TO service_role;
