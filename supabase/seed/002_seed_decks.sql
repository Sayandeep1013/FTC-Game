-- ============================================================
-- FTC Game — Seed Data: 4 Decks × 52 Cards
-- Stats are placeholder values. Update manually in Supabase
-- Table Editor once actual reference values are confirmed.
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- ── Helper: insert decks ─────────────────────────────────────────────────────

INSERT INTO decks (id, name, slug, cover_image_url) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Ben 10',        'ben-10',        'https://upload.wikimedia.org/wikipedia/en/1/1e/Ben10poster.jpg'),
  ('d2000000-0000-0000-0000-000000000002', 'Power Rangers',  'power-rangers', 'https://upload.wikimedia.org/wikipedia/en/0/04/MMPR_title_screen.jpg'),
  ('d3000000-0000-0000-0000-000000000003', 'Superheroes',    'superheroes',   'https://upload.wikimedia.org/wikipedia/en/6/6a/Avengers_Endgame_poster.jpg'),
  ('d4000000-0000-0000-0000-000000000004', 'Dragon Ball',    'dragon-ball',   'https://upload.wikimedia.org/wikipedia/en/a/a7/Dragon_Ball_Super_logo.png')
ON CONFLICT (id) DO NOTHING;


-- ── Stat Definitions (same 8 stats shared across all decks for launch) ───────
-- is_inverse = TRUE for Rank only (lower rank number = better card)

-- Ben 10 stat defs
INSERT INTO stat_definitions (deck_id, name, display_name, is_inverse, display_order) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'rank',      'Rank',      TRUE,  1),
  ('d1000000-0000-0000-0000-000000000001', 'strength',  'Strength',  FALSE, 2),
  ('d1000000-0000-0000-0000-000000000001', 'stamina',   'Stamina',   FALSE, 3),
  ('d1000000-0000-0000-0000-000000000001', 'height',    'Height',    FALSE, 4),
  ('d1000000-0000-0000-0000-000000000001', 'weight',    'Weight',    FALSE, 5),
  ('d1000000-0000-0000-0000-000000000001', 'psychic',   'Psychic',   FALSE, 6),
  ('d1000000-0000-0000-0000-000000000001', 'iq',        'IQ',        FALSE, 7),
  ('d1000000-0000-0000-0000-000000000001', 'speed',     'Speed',     FALSE, 8);

-- Power Rangers stat defs
INSERT INTO stat_definitions (deck_id, name, display_name, is_inverse, display_order) VALUES
  ('d2000000-0000-0000-0000-000000000002', 'rank',      'Rank',      TRUE,  1),
  ('d2000000-0000-0000-0000-000000000002', 'strength',  'Strength',  FALSE, 2),
  ('d2000000-0000-0000-0000-000000000002', 'stamina',   'Stamina',   FALSE, 3),
  ('d2000000-0000-0000-0000-000000000002', 'height',    'Height',    FALSE, 4),
  ('d2000000-0000-0000-0000-000000000002', 'weight',    'Weight',    FALSE, 5),
  ('d2000000-0000-0000-0000-000000000002', 'psychic',   'Psychic',   FALSE, 6),
  ('d2000000-0000-0000-0000-000000000002', 'iq',        'IQ',        FALSE, 7),
  ('d2000000-0000-0000-0000-000000000002', 'speed',     'Speed',     FALSE, 8);

-- Superheroes stat defs
INSERT INTO stat_definitions (deck_id, name, display_name, is_inverse, display_order) VALUES
  ('d3000000-0000-0000-0000-000000000003', 'rank',      'Rank',      TRUE,  1),
  ('d3000000-0000-0000-0000-000000000003', 'strength',  'Strength',  FALSE, 2),
  ('d3000000-0000-0000-0000-000000000003', 'stamina',   'Stamina',   FALSE, 3),
  ('d3000000-0000-0000-0000-000000000003', 'height',    'Height',    FALSE, 4),
  ('d3000000-0000-0000-0000-000000000003', 'weight',    'Weight',    FALSE, 5),
  ('d3000000-0000-0000-0000-000000000003', 'psychic',   'Psychic',   FALSE, 6),
  ('d3000000-0000-0000-0000-000000000003', 'iq',        'IQ',        FALSE, 7),
  ('d3000000-0000-0000-0000-000000000003', 'speed',     'Speed',     FALSE, 8);

-- Dragon Ball stat defs
INSERT INTO stat_definitions (deck_id, name, display_name, is_inverse, display_order) VALUES
  ('d4000000-0000-0000-0000-000000000004', 'rank',      'Rank',      TRUE,  1),
  ('d4000000-0000-0000-0000-000000000004', 'strength',  'Strength',  FALSE, 2),
  ('d4000000-0000-0000-0000-000000000004', 'stamina',   'Stamina',   FALSE, 3),
  ('d4000000-0000-0000-0000-000000000004', 'height',    'Height',    FALSE, 4),
  ('d4000000-0000-0000-0000-000000000004', 'weight',    'Weight',    FALSE, 5),
  ('d4000000-0000-0000-0000-000000000004', 'psychic',   'Psychic',   FALSE, 6),
  ('d4000000-0000-0000-0000-000000000004', 'iq',        'IQ',        FALSE, 7),
  ('d4000000-0000-0000-0000-000000000004', 'speed',     'Speed',     FALSE, 8);


-- ── Ben 10 Cards (52 aliens) ─────────────────────────────────────────────────
-- Rank 1 = best alien. Stats are placeholder — update with real values later.

WITH ben10_cards AS (
  INSERT INTO cards (deck_id, name, image_url) VALUES
    ('d1000000-0000-0000-0000-000000000001', 'Alien X',         'https://static.wikia.nocookie.net/ben10/images/thumb/Alien_X_OV.png/200px-Alien_X_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Way Big',         'https://static.wikia.nocookie.net/ben10/images/thumb/Way_Big_OV.png/200px-Way_Big_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Atomix',          'https://static.wikia.nocookie.net/ben10/images/thumb/Atomix_OV.png/200px-Atomix_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Humungousaur',    'https://static.wikia.nocookie.net/ben10/images/thumb/Humungousaur_OV.png/200px-Humungousaur_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Feedback',        'https://static.wikia.nocookie.net/ben10/images/thumb/Feedback_OV.png/200px-Feedback_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Rath',            'https://static.wikia.nocookie.net/ben10/images/thumb/Rath_OV.png/200px-Rath_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Four Arms',       'https://static.wikia.nocookie.net/ben10/images/thumb/Four_Arms_OV.png/200px-Four_Arms_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Gravattack',      'https://static.wikia.nocookie.net/ben10/images/thumb/Gravattack_OV.png/200px-Gravattack_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Jetray',          'https://static.wikia.nocookie.net/ben10/images/thumb/Jetray_OV.png/200px-Jetray_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Big Chill',       'https://static.wikia.nocookie.net/ben10/images/thumb/Big_Chill_OV.png/200px-Big_Chill_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Diamondhead',     'https://static.wikia.nocookie.net/ben10/images/thumb/Diamondhead_OV.png/200px-Diamondhead_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Cannonbolt',      'https://static.wikia.nocookie.net/ben10/images/thumb/Cannonbolt_OV.png/200px-Cannonbolt_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Heatblast',       'https://static.wikia.nocookie.net/ben10/images/thumb/Heatblast_OV.png/200px-Heatblast_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'XLR8',            'https://static.wikia.nocookie.net/ben10/images/thumb/XLR8_OV.png/200px-XLR8_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Upgrade',         'https://static.wikia.nocookie.net/ben10/images/thumb/Upgrade_OV.png/200px-Upgrade_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Shocksquatch',    'https://static.wikia.nocookie.net/ben10/images/thumb/Shocksquatch_OV.png/200px-Shocksquatch_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Spidermonkey',    'https://static.wikia.nocookie.net/ben10/images/thumb/Spidermonkey_OV.png/200px-Spidermonkey_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Ghostfreak',      'https://static.wikia.nocookie.net/ben10/images/thumb/Ghostfreak_OV.png/200px-Ghostfreak_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Lodestar',        'https://static.wikia.nocookie.net/ben10/images/thumb/Lodestar_OV.png/200px-Lodestar_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Ripjaws',         'https://static.wikia.nocookie.net/ben10/images/thumb/Ripjaws_OV.png/200px-Ripjaws_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Stinkfly',        'https://static.wikia.nocookie.net/ben10/images/thumb/Stinkfly_OV.png/200px-Stinkfly_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Wildmutt',        'https://static.wikia.nocookie.net/ben10/images/thumb/Wildmutt_OV.png/200px-Wildmutt_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Eye Guy',         'https://static.wikia.nocookie.net/ben10/images/thumb/Eye_Guy_OV.png/200px-Eye_Guy_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Overflow',        'https://static.wikia.nocookie.net/ben10/images/thumb/Overflow_OV.png/200px-Overflow_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Shock Rock',      'https://static.wikia.nocookie.net/ben10/images/thumb/Shock_Rock_OV.png/200px-Shock_Rock_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Slapback',        'https://static.wikia.nocookie.net/ben10/images/thumb/Slapback_OV.png/200px-Slapback_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Wildvine',        'https://static.wikia.nocookie.net/ben10/images/thumb/Wildvine_OV.png/200px-Wildvine_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Upchuck',         'https://static.wikia.nocookie.net/ben10/images/thumb/Upchuck_OV.png/200px-Upchuck_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Blitzwolfer',     'https://static.wikia.nocookie.net/ben10/images/thumb/Blitzwolfer_OV.png/200px-Blitzwolfer_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Crashhopper',     'https://static.wikia.nocookie.net/ben10/images/thumb/Crashhopper_OV.png/200px-Crashhopper_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Grey Matter',     'https://static.wikia.nocookie.net/ben10/images/thumb/Grey_Matter_OV.png/200px-Grey_Matter_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Pesky Dust',      'https://static.wikia.nocookie.net/ben10/images/thumb/Pesky_Dust_OV.png/200px-Pesky_Dust_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Gutrot',          'https://static.wikia.nocookie.net/ben10/images/thumb/Gutrot_OV.png/200px-Gutrot_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Whampire',        'https://static.wikia.nocookie.net/ben10/images/thumb/Whampire_OV.png/200px-Whampire_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Ball Weevil',     'https://static.wikia.nocookie.net/ben10/images/thumb/Ball_Weevil_OV.png/200px-Ball_Weevil_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Toepick',         'https://static.wikia.nocookie.net/ben10/images/thumb/Toepick_OV.png/200px-Toepick_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Mole-Stache',     'https://static.wikia.nocookie.net/ben10/images/thumb/Mole-Stache_OV.png/200px-Mole-Stache_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Kickin Hawk',     'https://static.wikia.nocookie.net/ben10/images/thumb/Kickin_Hawk_OV.png/200px-Kickin_Hawk_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Astrodactyl',     'https://static.wikia.nocookie.net/ben10/images/thumb/Astrodactyl_OV.png/200px-Astrodactyl_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Bullfrag',        'https://static.wikia.nocookie.net/ben10/images/thumb/Bullfrag_OV.png/200px-Bullfrag_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Frankenstrike',   'https://static.wikia.nocookie.net/ben10/images/thumb/Frankenstrike_OV.png/200px-Frankenstrike_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Snare-oh',        'https://static.wikia.nocookie.net/ben10/images/thumb/Snare-oh_OV.png/200px-Snare-oh_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Ditto',           'https://static.wikia.nocookie.net/ben10/images/thumb/Ditto_OV.png/200px-Ditto_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Spitter',         'https://static.wikia.nocookie.net/ben10/images/thumb/Spitter_OV.png/200px-Spitter_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Sandbox',         'https://static.wikia.nocookie.net/ben10/images/thumb/Sandbox_OV.png/200px-Sandbox_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Rocks',           'https://static.wikia.nocookie.net/ben10/images/thumb/Rocks_OV.png/200px-Rocks_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Snakepit',        'https://static.wikia.nocookie.net/ben10/images/thumb/Snakepit_OV.png/200px-Snakepit_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Charcoal Man',    'https://static.wikia.nocookie.net/ben10/images/thumb/Charcoal_Man_OV.png/200px-Charcoal_Man_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Glitch',          'https://static.wikia.nocookie.net/ben10/images/thumb/Glitch_OV.png/200px-Glitch_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'The Worst',       'https://static.wikia.nocookie.net/ben10/images/thumb/The_Worst_OV.png/200px-The_Worst_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Walkatrout',      'https://static.wikia.nocookie.net/ben10/images/thumb/Walkatrout_OV.png/200px-Walkatrout_OV.png'),
    ('d1000000-0000-0000-0000-000000000001', 'Bloxx',           'https://static.wikia.nocookie.net/ben10/images/thumb/Bloxx_OV.png/200px-Bloxx_OV.png')
  RETURNING id, name
)
-- Assign rank 1..52 and placeholder stats based on insertion order
INSERT INTO card_stats (card_id, stat_definition_id, value)
SELECT
  c.id,
  sd.id,
  CASE sd.name
    WHEN 'rank'     THEN row_number() OVER (ORDER BY c.name)
    WHEN 'strength' THEN FLOOR(20 + (EXTRACT(EPOCH FROM NOW()) * random()) % 80)
    WHEN 'stamina'  THEN FLOOR(20 + (EXTRACT(EPOCH FROM NOW()) * random()) % 80)
    WHEN 'height'   THEN FLOOR(100 + (EXTRACT(EPOCH FROM NOW()) * random()) % 900)
    WHEN 'weight'   THEN FLOOR(30 + (EXTRACT(EPOCH FROM NOW()) * random()) % 970)
    WHEN 'psychic'  THEN FLOOR(1 + (EXTRACT(EPOCH FROM NOW()) * random()) % 100)
    WHEN 'iq'       THEN FLOOR(20 + (EXTRACT(EPOCH FROM NOW()) * random()) % 180)
    WHEN 'speed'    THEN FLOOR(10 + (EXTRACT(EPOCH FROM NOW()) * random()) % 990)
  END
FROM ben10_cards c
CROSS JOIN stat_definitions sd
WHERE sd.deck_id = 'd1000000-0000-0000-0000-000000000001';


-- ── Power Rangers Cards (52 rangers & zords) ─────────────────────────────────

INSERT INTO cards (deck_id, name, image_url) VALUES
  ('d2000000-0000-0000-0000-000000000002', 'Red Ranger (MMPR)',       NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Blue Ranger (MMPR)',      NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Black Ranger (MMPR)',     NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Yellow Ranger (MMPR)',    NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Pink Ranger (MMPR)',      NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Green Ranger (MMPR)',     NULL),
  ('d2000000-0000-0000-0000-000000000002', 'White Ranger (MMPR)',     NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Red Zeo Ranger',          NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Red Turbo Ranger',        NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Red Space Ranger',        NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Black Space Ranger',      NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Phantom Ranger',          NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Red Galaxy Ranger',       NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Magna Defender',          NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Red Lightspeed Ranger',   NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Titanium Ranger',         NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Red Time Force Ranger',   NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Quantum Ranger',          NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Red Wild Force Ranger',   NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Lunar Wolf Ranger',       NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Red Wind Ranger',         NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Green Samurai Ranger',    NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Red Dino Thunder Ranger', NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Black Dino Thunder',      NULL),
  ('d2000000-0000-0000-0000-000000000002', 'White Dino Thunder',      NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Red SPD Ranger',          NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Shadow Ranger',           NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Omega Ranger',            NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Red Mystic Ranger',       NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Solaris Knight',          NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Wolf Warrior',            NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Red OO Ranger',           NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Black OO Ranger',         NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Mercury Ranger',          NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Red RPM Ranger',          NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Gold RPM Ranger',         NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Red Samurai Ranger',      NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Gold Samurai Ranger',     NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Red Megaforce Ranger',    NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Robo Knight',             NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Red Super Megaforce',     NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Silver Megaforce Ranger', NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Red Dino Charge Ranger',  NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Gold Dino Charge Ranger', NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Graphite Dino Charge',    NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Red Ninja Steel Ranger',  NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Gold Ninja Steel Ranger', NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Red Beast Morphers',      NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Gold Beast Morphers',     NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Red Dino Fury Ranger',    NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Gold Dino Fury Ranger',   NULL),
  ('d2000000-0000-0000-0000-000000000002', 'Lord Drakkon',            NULL);

-- Assign stats for Power Rangers
INSERT INTO card_stats (card_id, stat_definition_id, value)
SELECT
  c.id,
  sd.id,
  CASE sd.name
    WHEN 'rank'     THEN row_number() OVER (ORDER BY c.name)
    WHEN 'strength' THEN FLOOR(40 + random() * 60)
    WHEN 'stamina'  THEN FLOOR(40 + random() * 60)
    WHEN 'height'   THEN FLOOR(165 + random() * 30)
    WHEN 'weight'   THEN FLOOR(60 + random() * 40)
    WHEN 'psychic'  THEN FLOOR(10 + random() * 90)
    WHEN 'iq'       THEN FLOOR(80 + random() * 120)
    WHEN 'speed'    THEN FLOOR(30 + random() * 70)
  END
FROM cards c
CROSS JOIN stat_definitions sd
WHERE c.deck_id = 'd2000000-0000-0000-0000-000000000002'
  AND sd.deck_id = 'd2000000-0000-0000-0000-000000000002';


-- ── Superheroes Cards (52 heroes & villains) ─────────────────────────────────

INSERT INTO cards (deck_id, name, image_url) VALUES
  ('d3000000-0000-0000-0000-000000000003', 'Superman',           NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Batman',             NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Wonder Woman',       NULL),
  ('d3000000-0000-0000-0000-000000000003', 'The Flash',          NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Green Lantern',      NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Aquaman',            NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Cyborg',             NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Shazam',             NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Martian Manhunter',  NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Black Adam',         NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Iron Man',           NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Thor',               NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Captain America',    NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Hulk',               NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Spider-Man',         NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Doctor Strange',     NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Black Panther',      NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Wolverine',          NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Scarlet Witch',      NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Silver Surfer',      NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Sentry',             NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Hyperion',           NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Captain Marvel',     NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Vision',             NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Deadpool',           NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Magneto',            NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Professor X',        NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Storm',              NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Cyclops',            NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Jean Grey',          NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Phoenix',            NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Colossus',           NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Gambit',             NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Rogue',              NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Ghost Rider',        NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Daredevil',          NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Luke Cage',          NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Iron Fist',          NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Black Widow',        NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Hawkeye',            NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Ant-Man',            NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Wasp',               NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Thanos',             NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Galactus',           NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Lex Luthor',         NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Darkseid',           NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Brainiac',           NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Doomsday',           NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Reverse Flash',      NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Green Arrow',        NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Zatanna',            NULL),
  ('d3000000-0000-0000-0000-000000000003', 'Doctor Fate',        NULL);

INSERT INTO card_stats (card_id, stat_definition_id, value)
SELECT
  c.id, sd.id,
  CASE sd.name
    WHEN 'rank'     THEN row_number() OVER (ORDER BY c.name)
    WHEN 'strength' THEN FLOOR(30 + random() * 70)
    WHEN 'stamina'  THEN FLOOR(30 + random() * 70)
    WHEN 'height'   THEN FLOOR(160 + random() * 200)
    WHEN 'weight'   THEN FLOOR(60 + random() * 440)
    WHEN 'psychic'  THEN FLOOR(1 + random() * 100)
    WHEN 'iq'       THEN FLOOR(100 + random() * 300)
    WHEN 'speed'    THEN FLOOR(20 + random() * 980)
  END
FROM cards c
CROSS JOIN stat_definitions sd
WHERE c.deck_id = 'd3000000-0000-0000-0000-000000000003'
  AND sd.deck_id = 'd3000000-0000-0000-0000-000000000003';


-- ── Dragon Ball Cards (52 characters) ────────────────────────────────────────

INSERT INTO cards (deck_id, name, image_url) VALUES
  ('d4000000-0000-0000-0000-000000000004', 'Goku (Ultra Instinct)',      NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Vegeta (Ultra Ego)',         NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Gohan Beast',               NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Broly (DBS)',               NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Gogeta (SSB)',              NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Vegito (SSB)',              NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Jiren',                     NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Beerus',                    NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Whis',                      NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Grand Priest',              NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Zeno',                      NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Goku (SSJ4)',               NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Vegeta (SSJ4)',             NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Gogeta (SSJ4)',             NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Goku Black (SSR)',          NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Zamasu (Fused)',            NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Hit',                       NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Kefla',                     NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Android 17',                NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Android 18',                NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Cell (Perfect)',            NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Majin Buu (Kid)',           NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Super Buu',                 NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Buuhan',                    NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Frieza (Golden)',           NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Cooler (Meta)',             NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Gotenks (SSJ3)',            NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Trunks (Future SSJ Rage)', NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Goten',                     NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Piccolo (Orange)',          NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Gohan (SSJ2)',              NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Goku (SSJ3)',               NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Vegeta (Majin SSJ2)',       NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Krillin',                   NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Tien Shinhan',              NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Yamcha',                    NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Chiaotzu',                  NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Master Roshi (Max Power)', NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Android 16',                NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Android 19',                NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Dr. Gero',                  NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Turles',                    NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Lord Slug',                 NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Bojack',                    NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Janemba',                   NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Baby Vegeta',               NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Super 17',                  NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Omega Shenron',             NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Toppo (GoD)',               NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Dyspo',                     NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Caulifla (SSJ2)',           NULL),
  ('d4000000-0000-0000-0000-000000000004', 'Cabba',                     NULL);

INSERT INTO card_stats (card_id, stat_definition_id, value)
SELECT
  c.id, sd.id,
  CASE sd.name
    WHEN 'rank'     THEN row_number() OVER (ORDER BY c.name)
    WHEN 'strength' THEN FLOOR(50 + random() * 9950)
    WHEN 'stamina'  THEN FLOOR(50 + random() * 9950)
    WHEN 'height'   THEN FLOOR(155 + random() * 300)
    WHEN 'weight'   THEN FLOOR(50 + random() * 200)
    WHEN 'psychic'  THEN FLOOR(10 + random() * 90)
    WHEN 'iq'       THEN FLOOR(50 + random() * 200)
    WHEN 'speed'    THEN FLOOR(100 + random() * 99900)
  END
FROM cards c
CROSS JOIN stat_definitions sd
WHERE c.deck_id = 'd4000000-0000-0000-0000-000000000004'
  AND sd.deck_id = 'd4000000-0000-0000-0000-000000000004';
