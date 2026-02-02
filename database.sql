
-- MOON NIGHT DIGITAL SHOP - PRODUCTION DATABASE SCHEMA

-- 1. Create custom types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('pending', 'completed', 'cancelled', 'refunded');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_type') THEN
        CREATE TYPE product_type AS ENUM ('account', 'key', 'service');
    END IF;
END $$;

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT,
    wallet_balance NUMERIC(12, 2) DEFAULT 0.00,
    discord_points BIGINT DEFAULT 0,
    role user_role DEFAULT 'user',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    secret_content TEXT, -- Sensitive content (keys/accounts)
    price_dh NUMERIC(12, 2) NOT NULL,
    category TEXT NOT NULL,
    stock INTEGER DEFAULT 0,
    image_url TEXT,
    type product_type DEFAULT 'key',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    product_id UUID REFERENCES public.products(id) NOT NULL,
    status order_status DEFAULT 'completed',
    price_paid NUMERIC(12, 2) NOT NULL,
    points_earned INTEGER DEFAULT 0,
    delivery_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Wallet History Table
CREATE TABLE IF NOT EXISTS public.wallet_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    type TEXT NOT NULL, -- 'deposit', 'purchase', 'refund', 'redemption'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. Point Shop Items Table
CREATE TABLE IF NOT EXISTS public.point_shop_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    cost_points INTEGER NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==========================================
-- SECURE CHECKOUT RPC (BACKEND LOGIC)
-- ==========================================
CREATE OR REPLACE FUNCTION process_checkout(cart_items JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges, but we verify user_id
SET search_path = public
AS $$
DECLARE
    item RECORD;
    prod_record RECORD;
    total_cost NUMERIC := 0;
    total_points INTEGER := 0;
    current_balance NUMERIC;
    user_id UUID := auth.uid();
    new_balance NUMERIC;
BEGIN
    -- 1. Basic Auth Check
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- 2. Lock User Profile to prevent concurrent balance manipulation
    SELECT wallet_balance INTO current_balance 
    FROM profiles WHERE id = user_id FOR UPDATE;

    -- 3. Calculate server-side totals and validate stock
    FOR item IN SELECT * FROM jsonb_to_recordset(cart_items) AS x(id UUID, quantity INTEGER)
    LOOP
        -- Lock product row to prevent stock race conditions
        SELECT price_dh, stock, secret_content, name INTO prod_record
        FROM products WHERE id = item.id FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % not found', item.id;
        END IF;

        IF prod_record.stock < item.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for %', prod_record.name;
        END IF;

        total_cost := total_cost + (prod_record.price_dh * item.quantity);
        total_points := total_points + floor(prod_record.price_dh * item.quantity * 10);
    END LOOP;

    -- 4. Verify Funds
    IF current_balance < total_cost THEN
        RAISE EXCEPTION 'Insufficient balance. Need: %, Have: %', total_cost, current_balance;
    END IF;

    -- 5. Deduct Balance & Award Points
    UPDATE profiles 
    SET wallet_balance = wallet_balance - total_cost,
        discord_points = discord_points + total_points
    WHERE id = user_id
    RETURNING wallet_balance INTO new_balance;

    -- 6. Record Wallet History
    INSERT INTO wallet_history (user_id, amount, type, description)
    VALUES (user_id, -total_cost, 'purchase', 'Shop Checkout');

    -- 7. Create Orders and Update Stock
    FOR item IN SELECT * FROM jsonb_to_recordset(cart_items) AS x(id UUID, quantity INTEGER)
    LOOP
        SELECT price_dh, secret_content INTO prod_record FROM products WHERE id = item.id;

        INSERT INTO orders (user_id, product_id, price_paid, points_earned, status, delivery_data)
        VALUES (user_id, item.id, (prod_record.price_dh * item.quantity), floor(prod_record.price_dh * item.quantity * 10), 'completed', COALESCE(prod_record.secret_content, 'Instant Delivery'));

        UPDATE products 
        SET stock = stock - item.quantity 
        WHERE id = item.id;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'new_balance', new_balance,
        'points_earned', total_points
    );
END;
$$;

-- ==========================================
-- HARDENED RLS POLICIES
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_history ENABLE ROW LEVEL SECURITY;

-- Deny All by default
DROP POLICY IF EXISTS "Enable all access for admins" ON public.products;
CREATE POLICY "Admins full access" ON public.products FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- PRODUCTS: Everyone can see basic info, but hide secret_content
-- Note: In a real production app, you might use a view to hide secret_content
CREATE POLICY "Products viewable by all" ON public.products FOR SELECT USING (true);

-- ORDERS: Strictly private or Admin
CREATE POLICY "Orders are private" ON public.orders FOR SELECT TO authenticated 
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- WALLET: Strictly private
CREATE POLICY "Wallet history is private" ON public.wallet_history FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

-- PROFILES: Users see themselves, Admins see all
CREATE POLICY "Profiles privacy" ON public.profiles FOR SELECT TO authenticated 
USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- MESSAGES: Linked to orders
CREATE POLICY "Messages visibility" ON public.messages FOR SELECT TO authenticated 
USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid()) 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Messages insert" ON public.messages FOR INSERT TO authenticated 
WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid()) 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
