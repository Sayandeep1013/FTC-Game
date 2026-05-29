-- ============================================================
-- FTC Game - Stat Units
-- Adds display metadata for stat values while keeping comparison numeric.
-- ============================================================

ALTER TABLE stat_definitions
  ADD COLUMN IF NOT EXISTS unit_label TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS value_format TEXT NOT NULL DEFAULT 'number';

ALTER TABLE stat_definitions
  DROP CONSTRAINT IF EXISTS stat_definitions_value_format_check;

ALTER TABLE stat_definitions
  ADD CONSTRAINT stat_definitions_value_format_check
  CHECK (value_format IN ('number', 'unit', 'height_ft_in'));

UPDATE stat_definitions
SET
  unit_label = CASE LOWER(name)
    WHEN 'height' THEN 'ft/in'
    WHEN 'weight' THEN 'kg'
    WHEN 'speed' THEN 'km/h'
    ELSE ''
  END,
  value_format = CASE LOWER(name)
    WHEN 'height' THEN 'height_ft_in'
    WHEN 'weight' THEN 'unit'
    WHEN 'speed' THEN 'unit'
    ELSE 'number'
  END
WHERE unit_label = '' AND value_format = 'number';
