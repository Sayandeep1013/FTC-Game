-- ============================================================
-- FTC Game — Universe Architecture
-- Adds a universe parent layer above decks.
-- ============================================================

CREATE TABLE IF NOT EXISTS universes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,
  description      TEXT,
  cover_image_url  TEXT NOT NULL DEFAULT 'pending',
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  display_order    INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE decks
  ADD COLUMN IF NOT EXISTS universe_id UUID REFERENCES universes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_decks_universe ON decks(universe_id);
CREATE INDEX IF NOT EXISTS idx_universes_active_order ON universes(is_active, display_order, name);

ALTER TABLE universes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'universes'
      AND policyname = 'universes_read'
  ) THEN
    CREATE POLICY "universes_read" ON universes FOR SELECT USING (is_active = true);
  END IF;
END;
$$;

-- Seed universe parents from current launch decks. Re-runnable.
INSERT INTO universes (id, name, slug, description, display_order)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Ben 10', 'ben-10', 'Aliens, Omnitrix forms, and alternate-era Ben 10 decks.', 10),
  ('a2000000-0000-0000-0000-000000000002', 'Power Rangers', 'power-rangers', 'Rangers, villains, zords, and team variants.', 20),
  ('a3000000-0000-0000-0000-000000000003', 'Superheroes', 'superheroes', 'Mixed superhero decks and comic-inspired matchups.', 30),
  ('a4000000-0000-0000-0000-000000000004', 'Dragon Ball', 'dragon-ball', 'Dragon Ball fighters, forms, and sagas.', 40),
  ('a5000000-0000-0000-0000-000000000005', 'DC Comics', 'dc-comics', 'DC heroes, villains, and era-specific decks.', 50),
  ('a6000000-0000-0000-0000-000000000006', 'MCU', 'mcu', 'Marvel Cinematic Universe heroes and teams.', 60),
  ('a7000000-0000-0000-0000-000000000007', 'Naruto', 'naruto', 'Shinobi, clans, villages, and arc-based decks.', 70),
  ('a8000000-0000-0000-0000-000000000008', 'Supercars', 'supercars', 'Cars, classes, generations, and performance decks.', 80),
  ('a9000000-0000-0000-0000-000000000009', 'Harry Potter', 'harry-potter', 'Wizarding World characters and era decks.', 90)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

UPDATE decks SET universe_id = 'a1000000-0000-0000-0000-000000000001', name = 'Ben 10 Classic', display_order = 10 WHERE slug = 'ben-10';
UPDATE decks SET universe_id = 'a2000000-0000-0000-0000-000000000002', display_order = 10 WHERE slug = 'power-rangers';
UPDATE decks SET universe_id = 'a3000000-0000-0000-0000-000000000003', display_order = 10 WHERE slug = 'superheroes';
UPDATE decks SET universe_id = 'a4000000-0000-0000-0000-000000000004', display_order = 10 WHERE slug = 'dragon-ball';
UPDATE decks SET universe_id = 'a5000000-0000-0000-0000-000000000005', display_order = 10 WHERE slug = 'dc-comics';
UPDATE decks SET universe_id = 'a6000000-0000-0000-0000-000000000006', display_order = 10 WHERE slug = 'mcu';
UPDATE decks SET universe_id = 'a7000000-0000-0000-0000-000000000007', display_order = 10 WHERE slug = 'naruto';
UPDATE decks SET universe_id = 'a8000000-0000-0000-0000-000000000008', display_order = 10 WHERE slug = 'supercars';
UPDATE decks SET universe_id = 'a9000000-0000-0000-0000-000000000009', display_order = 10 WHERE slug = 'harry-potter';

-- Inactive placeholders for the new universe-first admin workflow.
-- They show up in admin as content targets, but stay hidden from players until
-- they have 8 stats, 52 cards, a cover, and are explicitly activated.
INSERT INTO decks (name, slug, cover_image_url, is_active, universe_id, display_order)
VALUES
  ('Ben 10 Alien Force', 'ben-10-alien-force', 'pending', false, 'a1000000-0000-0000-0000-000000000001', 20),
  ('Ben 10 Ultimate Alien', 'ben-10-ultimate-alien', 'pending', false, 'a1000000-0000-0000-0000-000000000001', 30),
  ('Power Rangers Mighty Morphin', 'power-rangers-mighty-morphin', 'pending', false, 'a2000000-0000-0000-0000-000000000002', 20),
  ('Dragon Ball Z', 'dragon-ball-z', 'pending', false, 'a4000000-0000-0000-0000-000000000004', 20),
  ('Naruto Shippuden', 'naruto-shippuden', 'pending', false, 'a7000000-0000-0000-0000-000000000007', 20)
ON CONFLICT (slug) DO UPDATE SET
  universe_id = EXCLUDED.universe_id,
  display_order = EXCLUDED.display_order;

-- Safety net: no deck should remain orphaned. For every deck that still has no
-- universe, create a same-name universe and place the deck inside it.
INSERT INTO universes (name, slug, description, cover_image_url, is_active, display_order)
SELECT
  d.name,
  d.slug,
  d.name || ' universe.',
  d.cover_image_url,
  d.is_active,
  ROW_NUMBER() OVER (ORDER BY d.name) * 10 + 1000
FROM decks d
WHERE d.universe_id IS NULL
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = COALESCE(universes.description, EXCLUDED.description);

UPDATE decks d
SET universe_id = u.id,
    display_order = CASE WHEN d.display_order = 0 THEN 10 ELSE d.display_order END
FROM universes u
WHERE d.universe_id IS NULL
  AND u.slug = d.slug;
