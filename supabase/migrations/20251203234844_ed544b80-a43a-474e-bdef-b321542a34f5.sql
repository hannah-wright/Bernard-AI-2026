-- Create enum types
CREATE TYPE public.round_type AS ENUM ('Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D+');
CREATE TYPE public.sector_type AS ENUM ('AI/ML', 'Fintech', 'Healthcare', 'SaaS', 'E-commerce', 'Biotech', 'Climate Tech', 'Enterprise', 'Consumer');
CREATE TYPE public.confidence_level AS ENUM ('verified', 'high', 'medium', 'low');
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  credits_remaining INTEGER DEFAULT 10,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create startups table
CREATE TABLE public.startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo TEXT,
  description TEXT NOT NULL,
  eli5 TEXT NOT NULL,
  website TEXT NOT NULL,
  sectors sector_type[] NOT NULL DEFAULT '{}',
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL,
  estimated_revenue TEXT,
  estimated_size TEXT,
  buzz_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create funding_rounds table
CREATE TABLE public.funding_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE NOT NULL,
  round_type round_type NOT NULL,
  amount BIGINT NOT NULL,
  date DATE NOT NULL,
  lead_investors TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create data_sources table
CREATE TABLE public.data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  confidence confidence_level NOT NULL DEFAULT 'medium',
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create favorites table
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, startup_id)
);

-- Create saved_filters table
CREATE TABLE public.saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_alerts table
CREATE TABLE public.user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notification_email BOOLEAN DEFAULT true,
  notification_slack BOOLEAN DEFAULT false,
  slack_webhook TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Startups policies (public read, admin write)
CREATE POLICY "Anyone can view startups" ON public.startups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert startups" ON public.startups FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update startups" ON public.startups FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete startups" ON public.startups FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Funding rounds policies
CREATE POLICY "Anyone can view funding rounds" ON public.funding_rounds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert funding rounds" ON public.funding_rounds FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update funding rounds" ON public.funding_rounds FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete funding rounds" ON public.funding_rounds FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Data sources policies
CREATE POLICY "Anyone can view data sources" ON public.data_sources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert data sources" ON public.data_sources FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update data sources" ON public.data_sources FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete data sources" ON public.data_sources FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Favorites policies
CREATE POLICY "Users can view their own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own favorites" ON public.favorites FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favorites" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- Saved filters policies
CREATE POLICY "Users can view their own saved filters" ON public.saved_filters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own saved filters" ON public.saved_filters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own saved filters" ON public.saved_filters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saved filters" ON public.saved_filters FOR DELETE USING (auth.uid() = user_id);

-- User alerts policies
CREATE POLICY "Users can view their own alerts" ON public.user_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own alerts" ON public.user_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own alerts" ON public.user_alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own alerts" ON public.user_alerts FOR DELETE USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_startups_updated_at BEFORE UPDATE ON public.startups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();