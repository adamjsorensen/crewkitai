-- Create feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  name TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add initial feature flags
INSERT INTO feature_flags (name, enabled, description)
VALUES ('enableStreaming', false, 'Enable streaming responses in the chat interface')
ON CONFLICT (name) DO NOTHING;

-- Add RLS policies for feature_flags table
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read feature flags
CREATE POLICY "Anyone can read feature flags"
  ON feature_flags FOR SELECT
  USING (true);

-- Only admins can update feature flags
CREATE POLICY "Only admins can update feature flags"
  ON feature_flags FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

-- Only admins can insert feature flags
CREATE POLICY "Only admins can insert feature flags"
  ON feature_flags FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

-- Only admins can delete feature flags
CREATE POLICY "Only admins can delete feature flags"
  ON feature_flags FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );
