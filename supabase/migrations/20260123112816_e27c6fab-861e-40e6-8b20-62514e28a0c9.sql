-- Create subscription type enum
CREATE TYPE subscription_type AS ENUM ('free', 'premium_monthly', 'premium_yearly');

-- Create subscription status enum
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled', 'pending');

-- Create platform enum
CREATE TYPE subscription_platform AS ENUM ('android', 'ios', 'web', 'donation');

-- Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_type subscription_type NOT NULL DEFAULT 'free',
  platform subscription_platform NOT NULL DEFAULT 'web',
  purchase_token TEXT,
  transaction_id TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  status subscription_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create donations table to track supporter contributions
CREATE TABLE public.donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  platform TEXT NOT NULL,
  message TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add is_premium_only column to songs table
ALTER TABLE public.songs ADD COLUMN IF NOT EXISTS is_premium_only BOOLEAN NOT NULL DEFAULT false;

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_subscriptions
CREATE POLICY "Users can view their own subscription"
  ON public.user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
  ON public.user_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON public.user_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage all subscriptions"
  ON public.user_subscriptions
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
  ));

-- RLS policies for donations
CREATE POLICY "Anyone can view non-anonymous donations"
  ON public.donations
  FOR SELECT
  USING (is_anonymous = false);

CREATE POLICY "Users can view their own donations"
  ON public.donations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert donations"
  ON public.donations
  FOR INSERT
  WITH CHECK (true);

-- Admins can view all donations
CREATE POLICY "Admins can view all donations"
  ON public.donations
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
  ));

-- Create trigger for updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();