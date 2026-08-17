-- Create settings table
CREATE TABLE IF NOT EXISTS public.dashboard_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  description text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.dashboard_settings ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Allow authenticated admins to read settings"
  ON public.dashboard_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated admins to modify settings"
  ON public.dashboard_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert Default Configs
INSERT INTO public.dashboard_settings (key, value, description) VALUES
  ('revenue_goal', '10000', 'Monthly clinic revenue target in Euro'),
  ('average_session_rate', '60', 'Average cost per treatment session in Euro')
ON CONFLICT (key) DO NOTHING;
