
-- MOON NIGHT DIGITAL SHOP - DATABASE SCHEMA (COMPLETE)

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
    secret_content TEXT,
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

-- 5. Wallet History Table
CREATE TABLE IF NOT EXISTS public.wallet_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    type TEXT NOT NULL, -- 'deposit', 'purchase', 'refund', 'redemption'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Point Shop Items Table
CREATE TABLE IF NOT EXISTS public.point_shop_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    cost_points INTEGER NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. Tournaments Table
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

-- 8. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- 9. Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Orders are viewable by owner" ON public.orders;
DROP POLICY IF EXISTS "History viewable by owner" ON public.wallet_history;
DROP POLICY IF EXISTS "Points shop items viewable by everyone" ON public.point_shop_items;
DROP POLICY IF EXISTS "Tournaments viewable by everyone" ON public.tournaments;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Orders are viewable by owner" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "History viewable by owner" ON public.wallet_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Points shop items viewable by everyone" ON public.point_shop_items FOR SELECT USING (true);
CREATE POLICY "Tournaments viewable by everyone" ON public.tournaments FOR SELECT USING (true);

-- 10. Automatic Profile Creation Trigger (FIXED FOR DISCORD/SOCIAL)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    username_val TEXT;
    avatar_val TEXT;
BEGIN
    -- Extract username from metadata (Discord uses full_name or preferred_username)
    username_val := COALESCE(
        new.raw_user_meta_data->>'full_name', 
        new.raw_user_meta_data->>'username', 
        new.raw_user_meta_data->>'preferred_username',
        split_part(new.email, '@', 1)
    );
    
    -- Extract avatar from metadata (Discord uses avatar_url, Google uses picture)
    avatar_val := COALESCE(
        new.raw_user_meta_data->>'avatar_url',
        new.raw_user_meta_data->>'picture'
    );

    INSERT INTO public.profiles (id, email, username, role, discord_points, wallet_balance, avatar_url)
    VALUES (
        new.id,
        new.email,
        username_val,
        'user',
        0,
        0.00,
        avatar_val
    ) ON CONFLICT (id) DO UPDATE SET 
        email = EXCLUDED.email,
        username = COALESCE(public.profiles.username, EXCLUDED.username),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);
        
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
