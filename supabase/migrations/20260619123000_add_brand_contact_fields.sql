ALTER TABLE brands
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

UPDATE brands
SET email = CASE name
  WHEN 'CarReaders' THEN 'info@carreaders.com'
  WHEN 'VehicleHealthAnalysis' THEN 'info@vehiclehealthanalysis.com'
  WHEN 'VehicleHealthEstimate' THEN 'info@vehiclehealthestimate.com'
  WHEN 'CarBronze' THEN 'info@carbronze.com'
  WHEN 'TrueAnalyzers' THEN 'info@trueanalyzers.com'
  WHEN 'TrueInspectify' THEN 'info@trueinspectify.com'
  WHEN 'TrueInfoProvider' THEN 'info@trueinfoprovider.com'
  WHEN 'CarDefiner' THEN 'info@cardefiner.com'
  ELSE COALESCE(email, 'info@example.com')
END,
website = CASE name
  WHEN 'CarReaders' THEN 'https://carreaders.com/'
  WHEN 'VehicleHealthAnalysis' THEN 'https://vehiclehealthanalysis.com/'
  WHEN 'VehicleHealthEstimate' THEN 'https://vehiclehealthestimate.com/'
  WHEN 'CarBronze' THEN 'https://carbronze.com/'
  WHEN 'TrueAnalyzers' THEN 'https://trueanalyzers.com/'
  WHEN 'TrueInspectify' THEN 'https://trueinspectify.com/'
  WHEN 'TrueInfoProvider' THEN 'https://trueinfoprovider.com/'
  WHEN 'CarDefiner' THEN 'https://cardefiner.com/'
  ELSE COALESCE(website, 'https://example.com/')
END;