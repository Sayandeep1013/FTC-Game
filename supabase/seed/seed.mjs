// JavaScript seeder — inserts all deck/card/stat data.
// Idempotent: safe to run multiple times.
// Usage: node --env-file=.env.local supabase/seed/seed.mjs

import pg from "pg";

const client = new pg.Client({
  host: process.env.SUPABASE_DB_HOST,
  port: 5432,
  database: "postgres",
  user: process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const STAT_NAMES = ["rank", "strength", "stamina", "height", "weight", "psychic", "iq", "speed"];

// ── Decks ─────────────────────────────────────────────────────────────────────

const DECKS = [
  { id: "d1000000-0000-0000-0000-000000000001", name: "Ben 10",        slug: "ben-10",        cover_image_url: "https://upload.wikimedia.org/wikipedia/en/1/1e/Ben10poster.jpg" },
  { id: "d2000000-0000-0000-0000-000000000002", name: "Power Rangers", slug: "power-rangers", cover_image_url: "https://upload.wikimedia.org/wikipedia/en/0/04/MMPR_title_screen.jpg" },
  { id: "d3000000-0000-0000-0000-000000000003", name: "Superheroes",   slug: "superheroes",   cover_image_url: "https://upload.wikimedia.org/wikipedia/en/6/6a/Avengers_Endgame_poster.jpg" },
  { id: "d4000000-0000-0000-0000-000000000004", name: "Dragon Ball",   slug: "dragon-ball",   cover_image_url: "https://upload.wikimedia.org/wikipedia/en/a/a7/Dragon_Ball_Super_logo.png" },
];

// ── Stat definitions (same 8 for all decks) ───────────────────────────────────

const STAT_DEFS = [
  { name: "rank",     display_name: "Rank",     is_inverse: true,  display_order: 1 },
  { name: "strength", display_name: "Strength", is_inverse: false, display_order: 2 },
  { name: "stamina",  display_name: "Stamina",  is_inverse: false, display_order: 3 },
  { name: "height",   display_name: "Height",   is_inverse: false, display_order: 4 },
  { name: "weight",   display_name: "Weight",   is_inverse: false, display_order: 5 },
  { name: "psychic",  display_name: "Psychic",  is_inverse: false, display_order: 6 },
  { name: "iq",       display_name: "IQ",       is_inverse: false, display_order: 7 },
  { name: "speed",    display_name: "Speed",    is_inverse: false, display_order: 8 },
];

// ── Card lists ────────────────────────────────────────────────────────────────

const BEN10 = [
  ["Alien X", "https://static.wikia.nocookie.net/ben10/images/0/0f/Alien_X_OS_Official_Artwork.png"],
  ["Way Big", null], ["Atomix", null], ["Humungousaur", null], ["Feedback", null],
  ["Rath", null], ["Four Arms", null], ["Gravattack", null], ["Jetray", null],
  ["Big Chill", null], ["Diamondhead", null], ["Cannonbolt", null], ["Heatblast", null],
  ["XLR8", null], ["Upgrade", null], ["Shocksquatch", null], ["Spidermonkey", null],
  ["Ghostfreak", null], ["Lodestar", null], ["Ripjaws", null], ["Stinkfly", null],
  ["Wildmutt", null], ["Eye Guy", null], ["Overflow", null], ["Shock Rock", null],
  ["Slapback", null], ["Wildvine", null], ["Upchuck", null], ["Blitzwolfer", null],
  ["Crashhopper", null], ["Grey Matter", null], ["Pesky Dust", null], ["Gutrot", null],
  ["Whampire", null], ["Ball Weevil", null], ["Toepick", null], ["Mole-Stache", null],
  ["Kickin Hawk", null], ["Astrodactyl", null], ["Bullfrag", null], ["Frankenstrike", null],
  ["Snare-oh", null], ["Ditto", null], ["Spitter", null], ["Sandbox", null],
  ["Rocks", null], ["Snakepit", null], ["Charcoal Man", null], ["Glitch", null],
  ["The Worst", null], ["Walkatrout", null], ["Bloxx", null],
];

const POWER_RANGERS = [
  "Red Ranger (MMPR)", "Blue Ranger (MMPR)", "Black Ranger (MMPR)", "Yellow Ranger (MMPR)",
  "Pink Ranger (MMPR)", "Green Ranger (MMPR)", "White Ranger (MMPR)", "Red Zeo Ranger",
  "Red Turbo Ranger", "Red Space Ranger", "Black Space Ranger", "Phantom Ranger",
  "Red Galaxy Ranger", "Magna Defender", "Red Lightspeed Ranger", "Titanium Ranger",
  "Red Time Force Ranger", "Quantum Ranger", "Red Wild Force Ranger", "Lunar Wolf Ranger",
  "Red Wind Ranger", "Green Samurai Ranger", "Red Dino Thunder Ranger", "Black Dino Thunder",
  "White Dino Thunder", "Red SPD Ranger", "Shadow Ranger", "Omega Ranger",
  "Red Mystic Ranger", "Solaris Knight", "Wolf Warrior", "Red OO Ranger",
  "Black OO Ranger", "Mercury Ranger", "Red RPM Ranger", "Gold RPM Ranger",
  "Red Samurai Ranger", "Gold Samurai Ranger", "Red Megaforce Ranger", "Robo Knight",
  "Red Super Megaforce", "Silver Megaforce Ranger", "Red Dino Charge Ranger", "Gold Dino Charge Ranger",
  "Graphite Dino Charge", "Red Ninja Steel Ranger", "Gold Ninja Steel Ranger", "Red Beast Morphers",
  "Gold Beast Morphers", "Red Dino Fury Ranger", "Gold Dino Fury Ranger", "Lord Drakkon",
].map((name) => [name, null]);

const SUPERHEROES = [
  "Superman", "Batman", "Wonder Woman", "The Flash", "Green Lantern", "Aquaman",
  "Cyborg", "Shazam", "Martian Manhunter", "Black Adam", "Iron Man", "Thor",
  "Captain America", "Hulk", "Spider-Man", "Doctor Strange", "Black Panther", "Wolverine",
  "Scarlet Witch", "Silver Surfer", "Sentry", "Hyperion", "Captain Marvel", "Vision",
  "Deadpool", "Magneto", "Professor X", "Storm", "Cyclops", "Jean Grey",
  "Phoenix", "Colossus", "Gambit", "Rogue", "Ghost Rider", "Daredevil",
  "Luke Cage", "Iron Fist", "Black Widow", "Hawkeye", "Ant-Man", "Wasp",
  "Thanos", "Galactus", "Lex Luthor", "Darkseid", "Brainiac", "Doomsday",
  "Reverse Flash", "Green Arrow", "Zatanna", "Doctor Fate",
].map((name) => [name, null]);

const DRAGON_BALL = [
  "Goku (Ultra Instinct)", "Vegeta (Ultra Ego)", "Gohan Beast", "Broly (DBS)",
  "Gogeta (SSB)", "Vegito (SSB)", "Jiren", "Beerus", "Whis", "Grand Priest",
  "Zeno", "Goku (SSJ4)", "Vegeta (SSJ4)", "Gogeta (SSJ4)", "Goku Black (SSR)",
  "Zamasu (Fused)", "Hit", "Kefla", "Android 17", "Android 18",
  "Cell (Perfect)", "Majin Buu (Kid)", "Super Buu", "Buuhan", "Frieza (Golden)",
  "Cooler (Meta)", "Gotenks (SSJ3)", "Trunks (Future SSJ Rage)", "Goten", "Piccolo (Orange)",
  "Gohan (SSJ2)", "Goku (SSJ3)", "Vegeta (Majin SSJ2)", "Krillin", "Tien Shinhan",
  "Yamcha", "Chiaotzu", "Master Roshi (Max Power)", "Android 16", "Android 19",
  "Dr. Gero", "Turles", "Lord Slug", "Bojack", "Janemba",
  "Baby Vegeta", "Super 17", "Omega Shenron", "Toppo (GoD)", "Dyspo",
  "Caulifla (SSJ2)", "Cabba",
].map((name) => [name, null]);

// ── Stat value generators per deck (placeholder values — update manually later) ─

const STATS = {
  "ben-10": (rank) => ({ rank, strength: rnd(20,100), stamina: rnd(20,100), height: rnd(100,1000), weight: rnd(30,1000), psychic: rnd(1,100), iq: rnd(20,200), speed: rnd(10,1000) }),
  "power-rangers": (rank) => ({ rank, strength: rnd(40,100), stamina: rnd(40,100), height: rnd(165,195), weight: rnd(60,100), psychic: rnd(10,100), iq: rnd(80,200), speed: rnd(30,100) }),
  "superheroes": (rank) => ({ rank, strength: rnd(30,100), stamina: rnd(30,100), height: rnd(160,360), weight: rnd(60,500), psychic: rnd(1,100), iq: rnd(100,400), speed: rnd(20,1000) }),
  "dragon-ball": (rank) => ({ rank, strength: rnd(50,10000), stamina: rnd(50,10000), height: rnd(155,455), weight: rnd(50,250), psychic: rnd(10,100), iq: rnd(50,250), speed: rnd(100,100000) }),
};

const DECK_CARDS = [
  { deckId: "d1000000-0000-0000-0000-000000000001", slug: "ben-10",        cards: BEN10 },
  { deckId: "d2000000-0000-0000-0000-000000000002", slug: "power-rangers", cards: POWER_RANGERS },
  { deckId: "d3000000-0000-0000-0000-000000000003", slug: "superheroes",   cards: SUPERHEROES },
  { deckId: "d4000000-0000-0000-0000-000000000004", slug: "dragon-ball",   cards: DRAGON_BALL },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  await client.connect();
  console.log("Connected.\n");

  // 1. Decks
  process.stdout.write("Inserting decks... ");
  for (const d of DECKS) {
    await client.query(
      `INSERT INTO decks (id, name, slug, cover_image_url) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO UPDATE SET name=$2, slug=$3, cover_image_url=$4`,
      [d.id, d.name, d.slug, d.cover_image_url]
    );
  }
  console.log("done.");

  // 2. Stat definitions
  process.stdout.write("Inserting stat definitions... ");
  for (const deck of DECKS) {
    for (const def of STAT_DEFS) {
      await client.query(
        `INSERT INTO stat_definitions (deck_id, name, display_name, is_inverse, display_order)
         VALUES ($1,$2,$3,$4,$5) ON CONFLICT (deck_id, name) DO NOTHING`,
        [deck.id, def.name, def.display_name, def.is_inverse, def.display_order]
      );
    }
  }
  console.log("done.");

  // 3. Fetch stat definition IDs
  const { rows: sdRows } = await client.query(`SELECT id, deck_id, name FROM stat_definitions`);
  // statIdMap[deckId][statName] = statDefId
  const statIdMap = {};
  for (const sd of sdRows) {
    if (!statIdMap[sd.deck_id]) statIdMap[sd.deck_id] = {};
    statIdMap[sd.deck_id][sd.name] = sd.id;
  }

  // 4. Cards + card_stats
  for (const { deckId, slug, cards } of DECK_CARDS) {
    const deckName = DECKS.find((d) => d.id === deckId).name;
    process.stdout.write(`Inserting ${cards.length} ${deckName} cards... `);
    const deckStats = statIdMap[deckId];

    for (let i = 0; i < cards.length; i++) {
      const [name, imageUrl] = cards[i];
      const rank = i + 1;

      // Get or insert the card
      let cardId;
      const existing = await client.query(
        `SELECT id FROM cards WHERE deck_id=$1 AND name=$2`,
        [deckId, name]
      );
      if (existing.rows.length > 0) {
        cardId = existing.rows[0].id;
      } else {
        const inserted = await client.query(
          `INSERT INTO cards (deck_id, name, image_url) VALUES ($1,$2,$3) RETURNING id`,
          [deckId, name, imageUrl]
        );
        cardId = inserted.rows[0].id;
      }

      // Insert stats
      const statValues = STATS[slug](rank);
      for (const statName of STAT_NAMES) {
        const statDefId = deckStats?.[statName];
        const value = statValues[statName];
        if (!statDefId || value === undefined) continue;
        await client.query(
          `INSERT INTO card_stats (card_id, stat_definition_id, value)
           VALUES ($1,$2,$3) ON CONFLICT (card_id, stat_definition_id) DO NOTHING`,
          [cardId, statDefId, value]
        );
      }
    }
    console.log("done.");
  }

  await client.end();
  console.log("\nAll seed data inserted successfully.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  client.end();
  process.exit(1);
});
