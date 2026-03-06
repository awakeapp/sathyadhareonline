-- 1. Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    price numeric(10, 2) NOT NULL,
    interval text NOT NULL DEFAULT 'month', -- month, year, one-time
    features text[] DEFAULT '{}',
    is_active boolean DEFAULT true,
    stripe_price_id text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Create transactions table to track revenue
CREATE TABLE IF NOT EXISTS transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id),
    plan_id uuid REFERENCES subscription_plans(id),
    stripe_payment_intent_id text,
    amount numeric(10, 2) NOT NULL,
    currency text DEFAULT 'INR',
    status text DEFAULT 'completed', -- completed, refunded, failed
    type text DEFAULT 'payment', -- payment, refund
    created_at timestamptz DEFAULT now(),
    refunded_at timestamptz
);

-- RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Super Admins can manage plans
CREATE POLICY "Super Admins can manage plans" ON subscription_plans FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
);

-- Readers can read active plans
CREATE POLICY "Public can view active plans" ON subscription_plans FOR SELECT USING (is_active = true);

-- Super Admins can view all transactions
CREATE POLICY "Super Admins can view transactions" ON transactions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
);

-- Users can view their own transactions
CREATE POLICY "Users can view their own transactions" ON transactions FOR SELECT USING (user_id = auth.uid());

-- Super Admins can modify transactions (e.g. refund logic)
CREATE POLICY "Super Admins can manage transactions" ON transactions FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
);
