-- Add AutoScanOra brand to the shared brands catalog
INSERT INTO brands (name, slug, default_color, email, website)
VALUES (
  'AutoScanOra',
  'autoscanora',
  '#2563EB',
  'info@autoscanora.com',
  'https://autoscanora.com/'
)
ON CONFLICT (name) DO NOTHING;
