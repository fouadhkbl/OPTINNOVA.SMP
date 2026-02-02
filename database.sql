-- Moon Night Digital Shop - Complete Database Schema

-- 1. Profiles (Users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    wallet_balance DECIMAL(12,2) DEFAULT 0.00,
    discord_points BIGINT DEFAULT 0,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_dh DECIMAL(12,2) NOT NULL,
    category TEXT NOT NULL,
    stock INTEGER DEFAULT 0,
    image_url TEXT,
    type TEXT DEFAULT 'key' CHECK (type IN ('account', 'key', 'service')),
    secret_content TEXT, -- The actual digital item (key/acc info)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Schema Migration Fixes: Ensure columns exist if table was already created
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS secret_content TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'key' CHECK (type IN ('account', 'key', 'service'));

-- 3. Orders
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    product_id UUID REFERENCES public.products(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
    price_paid DECIMAL(12,2) NOT NULL,
    points_earned INTEGER DEFAULT 0,
    delivery_data TEXT, -- Copy of product.secret_content at time of purchase
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Schema Migration Fixes
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_data TEXT;

-- 4. Messages (Order Support)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Wallet History
CREATE TABLE IF NOT EXISTS public.wallet_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    amount DECIMAL(12,2) NOT NULL,
    type TEXT NOT NULL, -- 'deposit', 'purchase', 'refund'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Point Shop Items
CREATE TABLE IF NOT EXISTS public.point_shop_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    cost_points INTEGER NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. Tournaments
CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    role_required TEXT DEFAULT 'Silver Member',
    prize_pool TEXT DEFAULT '1000 DH',
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'finished')),
    tournament_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() + interval '7 days')
);

-- 8. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    target_id TEXT,
    details JSONB,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS (Row Level Security) - Set to PERMISSIVE for easy access as requested
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Profiles access" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Products access" ON public.products FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Orders access" ON public.orders FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Messages access" ON public.messages FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.wallet_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public History access" ON public.wallet_history FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.point_shop_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public PointShop access" ON public.point_shop_items FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Tournaments access" ON public.tournaments FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Audit access" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- 9. Transactional Checkout Function (PL/pgSQL)
CREATE OR REPLACE FUNCTION public.process_checkout(cart_items JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item RECORD;
    current_product RECORD;
    total_cost DECIMAL(12,2) := 0;
    total_points INTEGER := 0;
    user_balance DECIMAL(12,2);
    caller_id UUID;
BEGIN
    caller_id := auth.uid();
    IF caller_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Unauthorized purchase attempt.');
    END IF;

    -- Calculate total cost and check availability
    FOR item IN SELECT * FROM jsonb_to_recordset(cart_items) AS x(id UUID, quantity INTEGER)
    LOOP
        SELECT * INTO current_product FROM products WHERE id = item.id;
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'message', 'Product not found.');
        END IF;
        IF current_product.stock < item.quantity THEN
            RETURN jsonb_build_object('success', false, 'message', 'Insufficient stock for ' || current_product.name);
        END IF;
        total_cost := total_cost + (current_product.price_dh * item.quantity);
        total_points := total_points + FLOOR(current_product.price_dh * 10); -- 10 points per 1 DH
    END LOOP;

    -- Check user balance
    SELECT wallet_balance INTO user_balance FROM profiles WHERE id = caller_id;
    IF user_balance < total_cost THEN
        RETURN jsonb_build_object('success', false, 'message', 'Insufficient wallet balance.');
    END IF;

    -- Deduct funds, update points, decrease stock, create orders
    UPDATE profiles SET 
        wallet_balance = wallet_balance - total_cost,
        discord_points = discord_points + total_points
    WHERE id = caller_id;

    FOR item IN SELECT * FROM jsonb_to_recordset(cart_items) AS x(id UUID, quantity INTEGER)
    LOOP
        SELECT * INTO current_product FROM products WHERE id = item.id;
        
        UPDATE products SET stock = stock - item.quantity WHERE id = item.id;
        
        -- Create orders (one per quantity for unique items if needed, or simple)
        INSERT INTO orders (user_id, product_id, status, price_paid, points_earned, delivery_data)
        VALUES (caller_id, current_product.id, 'completed', current_product.price_dh, FLOOR(current_product.price_dh * 10), current_product.secret_content);
    END LOOP;

    -- Record wallet history
    INSERT INTO wallet_history (user_id, amount, type, description)
    VALUES (caller_id, -total_cost, 'purchase', 'Purchase of digital items');

    RETURN jsonb_build_object('success', true, 'new_balance', user_balance - total_cost, 'points_earned', total_points);
END;
$$;

-- Seed Data (Optional)
INSERT INTO public.products (name, description, price_dh, category, stock, type, secret_content) VALUES 
('Elite Valorant Account', 'Level 100+, multiple rare skins.', 250.00, 'Accounts', 5, 'account', 'VAL-ACC-XYZ-123'),
('Windows 11 Pro Key', 'Genuine OEM activation key.', 45.00, 'Keys', 50, 'key', 'WIN11-PRO-ABCD-EFGH'),
('Netlfix Premium 1M', 'Shared private profile.', 15.00, 'Services', 10, 'service', 'NETFLIX-LOGIN-MoonNight');

INSERT INTO public.point_shop_items (name, description, cost_points) VALUES 
('Silver Member Role', 'Discord role + 5% discount.', 1000),
('Gold Member Role', 'Discord role + 10% discount.', 2500),
('Free 10 DH Key', 'Redeem for 10 DH wallet credit.', 5000);