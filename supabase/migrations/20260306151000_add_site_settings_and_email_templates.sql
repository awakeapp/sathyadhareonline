-- Migration: Create Site Settings and Email Templates tables

-- 1. Site Settings (Single row enforced via CHECK constraint)
CREATE TABLE IF NOT EXISTS site_settings (
    id integer PRIMARY KEY DEFAULT 1,
    general JSONB DEFAULT '{"site_name": "Sathyadhare", "tagline": "", "logo_url": "", "favicon_url": "", "contact_email": ""}'::jsonb,
    social_links JSONB DEFAULT '{"twitter": "", "facebook": "", "instagram": "", "youtube": ""}'::jsonb,
    seo JSONB DEFAULT '{"meta_title": "Sathyadhare", "meta_description": "", "og_image": ""}'::jsonb,
    integrations JSONB DEFAULT '{"google_oauth_enabled": false, "google_client_id": "", "analytics_id": ""}'::jsonb,
    features JSONB DEFAULT '{"comments_enabled": true, "guest_submissions_enabled": true, "newsletter_enabled": true, "registration_enabled": true}'::jsonb,
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT enforce_single_row CHECK (id = 1)
);

-- Insert the default row if it doesn't exist
INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- RLS for site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view site settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Only super_admin can update settings" ON site_settings FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
);

-- 2. Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    updated_at timestamptz DEFAULT now()
);

-- Insert some default templates
INSERT INTO email_templates (name, subject, body) VALUES
('welcome_email', 'Welcome to Sathyadhare!', '<p>Welcome to our platform. We are glad to have you here.</p>'),
('password_reset', 'Reset Your Password', '<p>Click the link below to reset your password:</p><p>{{reset_link}}</p>'),
('invitation', 'You have been invited', '<p>You have been invited to join Sathyadhare as {{role}}.</p><p><a href="{{invite_link}}">Accept Invitation</a></p>')
ON CONFLICT (name) DO NOTHING;

-- RLS for email_templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view email templates" ON email_templates FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin')
    )
);
CREATE POLICY "Only super_admin can update email templates" ON email_templates FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
);
CREATE POLICY "Only super_admin can insert email templates" ON email_templates FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
);
CREATE POLICY "Only super_admin can delete email templates" ON email_templates FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
);
