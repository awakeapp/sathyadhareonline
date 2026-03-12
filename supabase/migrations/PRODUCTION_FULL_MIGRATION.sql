-- =============================================================
-- PRODUCTION FULL MIGRATION — Sathyadhare
-- Run this in the Supabase SQL Editor for production project
-- cmkkstszmhniceakjprq.supabase.co
-- All statements are idempotent (safe to re-run)
-- =============================================================

-- ─── 1. profiles: add status column ─────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'status'
    ) THEN
        ALTER TABLE profiles
            ADD COLUMN status text NOT NULL DEFAULT 'active'
            CHECK (status IN ('active', 'suspended', 'banned'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles (status);
CREATE INDEX IF NOT EXISTS idx_profiles_role   ON profiles (role);

-- ─── 2. categories: soft delete + sort_order + description ──
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'categories' AND column_name = 'is_deleted'
    ) THEN
        ALTER TABLE categories
            ADD COLUMN is_deleted boolean NOT NULL DEFAULT false,
            ADD COLUMN deleted_at timestamptz;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'categories' AND column_name = 'sort_order'
    ) THEN
        ALTER TABLE categories
            ADD COLUMN description TEXT,
            ADD COLUMN sort_order  INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Back-fill sort_order for existing rows
WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC NULLS LAST) AS rn
    FROM categories
)
UPDATE categories
SET sort_order = ranked.rn
FROM ranked
WHERE categories.id = ranked.id AND categories.sort_order = 0;

CREATE INDEX IF NOT EXISTS idx_categories_is_deleted  ON categories (is_deleted);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order  ON categories (sort_order ASC);

-- ─── 3. articles: add deleted_at + status migration ─────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'articles' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE articles ADD COLUMN deleted_at timestamptz;
    END IF;
    -- Widen status check to allow 'in_review', 'archived' etc.
    -- (Only needed if original schema was strict)
END $$;

CREATE INDEX IF NOT EXISTS idx_articles_deleted_at ON articles (deleted_at);

-- ─── 4. comments: soft delete + status + spam columns ───────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'comments' AND column_name = 'is_deleted'
    ) THEN
        ALTER TABLE comments
            ADD COLUMN is_deleted boolean NOT NULL DEFAULT false,
            ADD COLUMN deleted_at timestamptz;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'comments' AND column_name = 'is_spam'
    ) THEN
        ALTER TABLE comments ADD COLUMN is_spam BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'comments' AND column_name = 'status'
    ) THEN
        ALTER TABLE comments
            ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_comments_is_deleted  ON comments (is_deleted);
CREATE INDEX IF NOT EXISTS idx_comments_is_spam     ON comments (is_spam);
CREATE INDEX IF NOT EXISTS idx_comments_status      ON comments (status);
CREATE INDEX IF NOT EXISTS idx_comments_article_id  ON comments (article_id);

-- ─── 5. sequels: add deleted_at ──────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sequels' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE sequels ADD COLUMN deleted_at timestamptz;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sequels_deleted_at ON sequels (deleted_at);

-- ─── 6. friday_messages: soft delete ─────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'friday_messages' AND column_name = 'is_deleted'
    ) THEN
        ALTER TABLE friday_messages
            ADD COLUMN is_deleted boolean NOT NULL DEFAULT false,
            ADD COLUMN deleted_at timestamptz;
    END IF;
END $$;

-- ─── 7. media: soft delete ────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'media') THEN
        CREATE TABLE media (
            id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            url         text NOT NULL,
            filename    text,
            mimetype    text,
            size        bigint,
            uploaded_by uuid REFERENCES profiles(id),
            is_deleted  boolean NOT NULL DEFAULT false,
            deleted_at  timestamptz,
            created_at  timestamptz NOT NULL DEFAULT now()
        );
        ALTER TABLE media ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Admins can manage media" ON media FOR ALL USING (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin'))
        );
        CREATE POLICY "Public can view active media" ON media FOR SELECT USING (is_deleted = false);
    ELSE
        -- Add columns if table exists but lacks soft delete
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'media' AND column_name = 'is_deleted'
        ) THEN
            ALTER TABLE media
                ADD COLUMN is_deleted boolean NOT NULL DEFAULT false,
                ADD COLUMN deleted_at timestamptz;
        END IF;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_media_is_deleted ON media (is_deleted);

-- ─── 8. audit_logs ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
    action     text NOT NULL,
    details    jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id    ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action     ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);

-- RLS for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'audit_logs' AND policyname = 'Admins can view audit logs'
    ) THEN
        CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT USING (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin'))
        );
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'audit_logs' AND policyname = 'Service role can insert audit logs'
    ) THEN
        CREATE POLICY "Service role can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- ─── 9. site_settings ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
    id           integer PRIMARY KEY DEFAULT 1,
    general      JSONB DEFAULT '{"site_name": "Sathyadhare", "tagline": "", "logo_url": "", "favicon_url": "", "contact_email": ""}'::jsonb,
    social_links JSONB DEFAULT '{"twitter": "", "facebook": "", "instagram": "", "youtube": ""}'::jsonb,
    seo          JSONB DEFAULT '{"meta_title": "Sathyadhare", "meta_description": "", "og_image": ""}'::jsonb,
    integrations JSONB DEFAULT '{"google_oauth_enabled": false, "google_client_id": "", "analytics_id": ""}'::jsonb,
    features     JSONB DEFAULT '{"comments_enabled": true, "guest_submissions_enabled": true, "newsletter_enabled": true, "registration_enabled": true}'::jsonb,
    updated_at   timestamptz DEFAULT now(),
    CONSTRAINT enforce_single_row CHECK (id = 1)
);

INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'site_settings' AND policyname = 'Public can view site settings') THEN
        CREATE POLICY "Public can view site settings" ON site_settings FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'site_settings' AND policyname = 'Only super_admin can update settings') THEN
        CREATE POLICY "Only super_admin can update settings" ON site_settings FOR UPDATE USING (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
        );
    END IF;
END $$;

-- ─── 10. email_templates ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_templates (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text UNIQUE NOT NULL,
    subject    text NOT NULL,
    body       text NOT NULL,
    updated_at timestamptz DEFAULT now()
);

INSERT INTO email_templates (name, subject, body) VALUES
    ('welcome_email', 'Welcome to Sathyadhare!', '<p>Welcome to our platform. We are glad to have you here.</p>'),
    ('password_reset', 'Reset Your Password', '<p>Click the link below to reset your password:</p><p>{{reset_link}}</p>'),
    ('invitation', 'You have been invited', '<p>You have been invited to join Sathyadhare as {{role}}.</p><p><a href="{{invite_link}}">Accept Invitation</a></p>')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_templates' AND policyname = 'Admins can view email templates') THEN
        CREATE POLICY "Admins can view email templates" ON email_templates FOR SELECT USING (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin'))
        );
        CREATE POLICY "Only super_admin can manage email templates" ON email_templates FOR ALL USING (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
        );
    END IF;
END $$;

-- ─── 11. api_keys ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL,
    key_hash    text NOT NULL,
    prefix      text,
    permissions jsonb DEFAULT '[]'::jsonb,
    created_by  uuid REFERENCES profiles(id),
    created_at  timestamptz DEFAULT now(),
    last_used_at timestamptz
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'Super Admins can manage API keys') THEN
        CREATE POLICY "Super Admins can manage API keys" ON api_keys FOR ALL USING (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
        );
    END IF;
END $$;

-- Add missing columns if table already exists
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS prefix      text;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '[]'::jsonb;

-- ─── 12. security function: add is_spam if missing ───────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'comments' AND column_name = 'is_spam'
    ) THEN
        ALTER TABLE comments ADD COLUMN is_spam BOOLEAN DEFAULT false;
        CREATE INDEX IF NOT EXISTS idx_comments_is_spam ON comments(is_spam);
    END IF;
END $$;

-- get_login_history function
CREATE OR REPLACE FUNCTION get_login_history()
RETURNS TABLE (
    log_id     uuid,
    user_id    uuid,
    email      text,
    role       text,
    ip_address text,
    user_agent text,
    created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id AS log_id,
        l.actor_id AS user_id,
        p.email,
        p.role,
        l.ip_address::text,
        (l.payload->>'user_agent')::text AS user_agent,
        l.created_at
    FROM auth.audit_log_entries l
    LEFT JOIN public.profiles p ON l.actor_id = p.id
    WHERE l.payload->>'action' = 'login' OR l.action = 'login'
    ORDER BY l.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION get_login_history() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_login_history() TO authenticated;

-- ─── 13. subscription_plans ──────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_plans (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text NOT NULL,
    price           numeric(10, 2) NOT NULL,
    interval        text NOT NULL DEFAULT 'month',
    features        text[] DEFAULT '{}',
    is_active       boolean DEFAULT true,
    stripe_price_id text,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscription_plans' AND policyname = 'Super Admins can manage plans') THEN
        CREATE POLICY "Super Admins can manage plans" ON subscription_plans FOR ALL USING (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
        );
        CREATE POLICY "Public can view active plans" ON subscription_plans FOR SELECT USING (is_active = true);
    END IF;
END $$;

-- ─── 14. transactions ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
    id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                   uuid REFERENCES profiles(id),
    plan_id                   uuid REFERENCES subscription_plans(id),
    stripe_payment_intent_id  text,
    amount                    numeric(10, 2) NOT NULL,
    currency                  text DEFAULT 'INR',
    status                    text DEFAULT 'completed',
    type                      text DEFAULT 'payment',
    created_at                timestamptz DEFAULT now(),
    refunded_at               timestamptz
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Super Admins can view transactions') THEN
        CREATE POLICY "Super Admins can view transactions" ON transactions FOR SELECT USING (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
        );
        CREATE POLICY "Users can view their own transactions" ON transactions FOR SELECT USING (user_id = auth.uid());
        CREATE POLICY "Super Admins can manage transactions" ON transactions FOR UPDATE USING (
            EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
        );
    END IF;
END $$;

-- ─── 15. newsletter_subscribers ──────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email      text NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'newsletter_subscribers' AND policyname = 'Admins can view subscribers') THEN
        CREATE POLICY "Admins can view subscribers" ON newsletter_subscribers FOR SELECT USING (
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
        );
        CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- =============================================================
-- DONE — All tables created/updated successfully
-- =============================================================
SELECT 'Migration complete' AS status,
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') AS total_tables;
