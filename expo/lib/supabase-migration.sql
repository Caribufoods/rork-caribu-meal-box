-- ============================================
-- Caribu App — Supabase Database Migration
-- ============================================
-- Run this SQL in your Supabase Dashboard:
-- 1. Go to https://supabase.com/dashboard
-- 2. Select your project
-- 3. Click "SQL Editor" in the left sidebar
-- 4. Paste this entire script and click "Run"
-- ============================================

-- PROFILES TABLE (user accounts)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'email',
  referral_code TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  order_count INTEGER NOT NULL DEFAULT 0,
  total_spent NUMERIC(10,2) NOT NULL DEFAULT 0,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  reference TEXT NOT NULL,
  item_count INTEGER NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_applied NUMERIC(10,2) NOT NULL DEFAULT 0,
  promo_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROMOTIONS TABLE (per-user promotions)
CREATE TABLE IF NOT EXISTS promotions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  discount_percent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'locked',
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SELECTED PROMOTIONS TABLE
CREATE TABLE IF NOT EXISTS selected_promotions (
  user_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  promo_id TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES for fast lookups
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_promotions_user_id ON promotions(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ENABLE Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE selected_promotions ENABLE ROW LEVEL SECURITY;

-- ALLOW all operations with anon key (for this app's auth model)
-- In production, you'd want tighter policies tied to Supabase Auth
CREATE POLICY "Allow all on profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on promotions" ON promotions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on selected_promotions" ON selected_promotions FOR ALL USING (true) WITH CHECK (true);
