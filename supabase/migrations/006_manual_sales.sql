-- 006_manual_sales.sql
-- Phase 9: Manual sales model — allow admin to grant calendar access
-- without an automated payment/order.

BEGIN;

-- Allow customer_access rows without an order (for manual grants)
ALTER TABLE customer_access ALTER COLUMN order_id DROP NOT NULL;

-- Add a grant_type column to distinguish automated vs manual access
ALTER TABLE customer_access ADD COLUMN IF NOT EXISTS grant_type TEXT NOT NULL DEFAULT 'payment';

-- Add admin_id to track who granted manual access
ALTER TABLE customer_access ADD COLUMN IF NOT EXISTS granted_by UUID REFERENCES admin_users(id);

-- Add notes for manual grants
ALTER TABLE customer_access ADD COLUMN IF NOT EXISTS grant_notes TEXT;

COMMIT;
