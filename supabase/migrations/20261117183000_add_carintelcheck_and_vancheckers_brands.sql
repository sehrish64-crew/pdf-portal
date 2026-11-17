-- Add CarIntelCheck and VanCheckers to the shared brands catalog
INSERT INTO brands (name, slug, default_color, email, website)
VALUES
  (
    'CarIntelCheck',
    'carintelcheck',
    '#10B981',
    'info@carintelcheck.com',
    'https://carintelcheck.com/'
  ),
  (
    'VanCheckers',
    'vancheckers',
    '#189EDD',
    'info@vancheckers.com',
    'https://vancheckers.com/'
  )
ON CONFLICT (name) DO NOTHING;
