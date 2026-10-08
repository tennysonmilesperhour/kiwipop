-- =========================================================
-- Email queue table for drip campaigns & transactional emails
-- =========================================================

CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  email_type TEXT NOT NULL,
  send_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for the cron processor: find pending emails due for sending
CREATE INDEX idx_email_queue_pending_due
  ON email_queue (send_at)
  WHERE status = 'pending';

-- Index for dedup checks (e.g., "has this user already received a welcome email?")
CREATE INDEX idx_email_queue_to_type
  ON email_queue (to_email, email_type);

-- RLS: only service role should access this table (no client access)
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- No RLS policies = only service role (supabaseAdmin) can read/write.
-- This is intentional — the email queue is server-side only.

COMMENT ON TABLE email_queue IS
  'Drip email queue processed by /api/cron/process-emails. '
  'Immediate emails are also logged here for audit trail.';
