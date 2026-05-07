-- Fix: handle_new_user trigger was failing when the username derived from
-- Google display name already existed in profiles (UNIQUE constraint on username).
-- This version handles conflicts by appending a numeric suffix.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  suffix INTEGER := 0;
BEGIN
  -- Derive base username from Google display name or email prefix
  base_username := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    split_part(NEW.email, '@', 1)
  );

  -- Strip spaces and anything that isn't alphanumeric or underscore
  base_username := REGEXP_REPLACE(base_username, '[^a-zA-Z0-9_]', '', 'g');

  -- Safety: if nothing remains, use 'user'
  IF base_username = '' THEN
    base_username := 'user';
  END IF;

  -- Truncate to 30 chars so the suffix has room
  base_username := LEFT(base_username, 30);
  final_username := base_username;

  -- Increment suffix until we find a free username
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    suffix := suffix + 1;
    final_username := base_username || suffix::TEXT;
  END LOOP;

  INSERT INTO profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    final_username,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
