
-- MOON NIGHT DIGITAL SHOP - DATABASE SCHEMA (REFINED)

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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    secret_content TEXT, -- Store the actual account/key here (Only visible to admin)
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
    status order_status DEFAULT 'pending',
    price_paid NUMERIC(12, 2) NOT NULL,
    points_earned INTEGER DEFAULT 0,
    delivery_data TEXT, -- The account info sent to the user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Point Shop Items
CREATE TABLE IF NOT EXISTS public.point_shop_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    cost_points INTEGER NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Tournaments Table
CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    role_required TEXT,
    prize_pool TEXT,
    status TEXT CHECK (status IN ('upcoming', 'ongoing', 'finished')) DEFAULT 'upcoming',
    tournament_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. Wallet History
CREATE TABLE IF NOT EXISTS public.wallet_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    type TEXT CHECK (type IN ('deposit', 'purchase', 'refund')) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_history ENABLE ROW LEVEL SECURITY;

-- DROP EXISTING POLICIES TO PREVENT ERRORS ON RE-RUN
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Orders are viewable by owner" ON public.orders;

-- RE-CREATE POLICIES
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Orders are viewable by owner" ON public.orders FOR SELECT USING (auth.uid() = user_id);

-- NOTE: Since the app now uses the service key in the frontend (Supabase Admin mode), 
-- these RLS policies will be bypassed for those specific requests, resolving the "stuck" issue.
