-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create brands table
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  default_color TEXT DEFAULT '#3B82F6',
  email TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default brands
INSERT INTO brands (name, slug, default_color, email, website) VALUES
  ('CarReaders', 'carreaders', '#3B82F6', 'info@carreaders.com', 'https://carreaders.com/'),
  ('VehicleHealthAnalysis', 'vehiclehealthanalysis', '#10B981', 'info@vehiclehealthanalysis.com', 'https://vehiclehealthanalysis.com/'),
  ('VehicleHealthEstimate', 'vehiclehealthestimate', '#F59E0B', 'info@vehiclehealthestimate.com', 'https://vehiclehealthestimate.com/'),
  ('CarBronze', 'carbronze', '#92400E', 'info@carbronze.com', 'https://carbronze.com/'),
  ('TrueAnalyzers', 'trueanalyzers', '#8B5CF6', 'info@trueanalyzers.com', 'https://trueanalyzers.com/'),
  ('TrueInspectify', 'trueinspectify', '#EC4899', 'info@trueinspectify.com', 'https://trueinspectify.com/'),
  ('TrueInfoProvider', 'trueinfoprovider', '#06B6D4', 'info@trueinfoprovider.com', 'https://trueinfoprovider.com/'),
  ('CarDefiner', 'cardefiner', '#EF4444', 'info@cardefiner.com', 'https://cardefiner.com/');

-- Create reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('VIN', 'Plate')),
  package_type TEXT NOT NULL CHECK (package_type IN ('Basic', 'Standard', 'Premium')),
  
  -- Vehicle details
  vin_number TEXT,
  plate_number TEXT,
  make TEXT,
  model TEXT,
  year INTEGER,
  mileage INTEGER,
  
  -- Branding
  brand_color TEXT DEFAULT '#3B82F6',
  logo_url TEXT,
  
  -- Report content (JSON blob for flexible storage)
  report_data JSONB DEFAULT '{}',
  
  -- Metadata
  client_name TEXT,
  vehicle_name TEXT,
  overall_score INTEGER,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for search
CREATE INDEX idx_reports_search ON reports (vin_number, plate_number, client_name, vehicle_name);
CREATE INDEX idx_reports_user ON reports (user_id);
CREATE INDEX idx_reports_brand ON reports (brand_id);

-- Enable RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Brands policies (read-only for authenticated users)
CREATE POLICY "brands_select" ON brands FOR SELECT
  TO authenticated USING (true);

-- Reports policies
CREATE POLICY "reports_select_own" ON reports FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
  
CREATE POLICY "reports_insert_own" ON reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "reports_update_own" ON reports FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "reports_delete_own" ON reports FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for reports
CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
