
-- MOON NIGHT DIGITAL SHOP - DATABASE SCHEMA (FINAL VERSION)

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

-- 5. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 6. Cleanup and Create Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Orders are viewable by owner" ON public.orders;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Orders are viewable by owner" ON public.orders FOR SELECT USING (auth.uid() = user_id);

-- 7. Automatic Profile Creation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, username, role, discord_points, wallet_balance)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        'user',
        0,
        0.00
    ) ON CONFLICT (id) DO UPDATE SET 
        email = EXCLUDED.email,
        username = COALESCE(public.profiles.username, EXCLUDED.username);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
