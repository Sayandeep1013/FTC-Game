// Adds 5 more decks: DC, MCU, Naruto, Supercars, Harry Potter
// Usage: node --env-file=.env.local supabase/seed/seed_more_decks.mjs

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
const STAT_NAMES = ["rank","strength","stamina","height","weight","psychic","iq","speed"];

const NEW_DECKS = [
  { id: "d5000000-0000-0000-0000-000000000005", name: "DC Comics",    slug: "dc-comics",    cover_image_url: "pending" },
  { id: "d6000000-0000-0000-0000-000000000006", name: "MCU",          slug: "mcu",          cover_image_url: "pending" },
  { id: "d7000000-0000-0000-0000-000000000007", name: "Naruto",       slug: "naruto",       cover_image_url: "pending" },
  { id: "d8000000-0000-0000-0000-000000000008", name: "Supercars",    slug: "supercars",    cover_image_url: "pending" },
  { id: "d9000000-0000-0000-0000-000000000009", name: "Harry Potter", slug: "harry-potter", cover_image_url: "pending" },
];

const STAT_DEFS = [
  { name:"rank",     display_name:"Rank",     is_inverse:true,  display_order:1 },
  { name:"strength", display_name:"Strength", is_inverse:false, display_order:2 },
  { name:"stamina",  display_name:"Stamina",  is_inverse:false, display_order:3 },
  { name:"height",   display_name:"Height",   is_inverse:false, display_order:4 },
  { name:"weight",   display_name:"Weight",   is_inverse:false, display_order:5 },
  { name:"psychic",  display_name:"Psychic",  is_inverse:false, display_order:6 },
  { name:"iq",       display_name:"IQ",       is_inverse:false, display_order:7 },
  { name:"speed",    display_name:"Speed",    is_inverse:false, display_order:8 },
];

const DC = ["Superman","Batman","Wonder Woman","The Flash","Green Lantern","Aquaman","Cyborg","Shazam","Martian Manhunter","Black Adam","Green Arrow","Nightwing","Batgirl","Supergirl","Hawkgirl","Zatanna","Doctor Fate","Atom","Firestorm","Red Tornado","Darkseid","Lex Luthor","Joker","Deathstroke","Brainiac","Sinestro","Doomsday","Reverse Flash","Gorilla Grodd","Black Manta","Captain Cold","Poison Ivy","Harley Quinn","Catwoman","Penguin","Bane","Ra's al Ghul","Trigon","Slade Wilson","Lobo","Swamp Thing","Constantine","Deadman","Phantom Stranger","Blue Beetle","Booster Gold","Plastic Man","Elongated Man","Captain Atom","Steel","Power Girl","Black Canary"].slice(0,52);

const MCU = ["Iron Man","Captain America","Thor","Hulk","Black Widow","Hawkeye","Captain Marvel","Black Panther","Doctor Strange","Spider-Man","Scarlet Witch","Vision","Ant-Man","Wasp","Falcon","War Machine","Winter Soldier","Nebula","Gamora","Star-Lord","Drax","Rocket","Groot","Mantis","Thor (Jane Foster)","Shang-Chi","Ms. Marvel","Moon Knight","She-Hulk","Thanos","Loki","Ultron","Yellowjacket","Ronan","Red Skull","Dormammu","Hela","Vulture","Ghost","Mysterio","Taskmaster","Kang","Wenwu","Ikaris","Sersi","Eternals Sprite","Namor","Ego","Ayesha","High Evolutionary","Adam Warlock","Valentina"].slice(0,52);

const NARUTO = ["Naruto Uzumaki","Sasuke Uchiha","Sakura Haruno","Kakashi Hatake","Rock Lee","Neji Hyuga","Hinata Hyuga","Shikamaru Nara","Ino Yamanaka","Choji Akimichi","Kiba Inuzuka","Shino Aburame","Gaara","Temari","Kankuro","Itachi Uchiha","Kisame Hoshigaki","Pain (Nagato)","Konan","Deidara","Sasori","Hidan","Kakuzu","Zetsu","Tobi (Obito)","Madara Uchiha","Hashirama Senju","Tobirama Senju","Hiruzen Sarutobi","Jiraiya","Tsunade","Orochimaru","Minato Namikaze","Kushina Uzumaki","Guy Might","Ten-Ten","Asuma Sarutobi","Kurenai Yuhi","Yamato","Sai","Killer Bee","A (Raikage)","Mei Terumi","Onoki","Kaguya Otsutsuki","Hagoromo Otsutsuki","Hamura Otsutsuki","Boruto Uzumaki","Sarada Uchiha","Mitsuki","Shikadai Nara","Metal Lee"].slice(0,52);

const CARS = ["Bugatti Chiron Super Sport","Koenigsegg Jesko Absolut","SSC Tuatara","Hennessey Venom F5","Rimac Nevera","Ferrari LaFerrari","Pagani Huayra BC","McLaren P1","Lamborghini Sian","Porsche 918 Spyder","Mercedes AMG ONE","Aston Martin Valkyrie","Devel Sixteen","Zenvo TSR-S","Apollo IE","Lamborghini Revuelto","Ferrari SF90 Stradale","McLaren Speedtail","Bugatti Veyron","Koenigsegg Agera RS","Porsche 911 GT2 RS","Mercedes SLS AMG","BMW M3 CSL","Nissan GT-R Nismo","Ford GT","Chevrolet Corvette Z06","Dodge Viper SRT","Ferrari 488 Pista","McLaren 720S","Aston Martin DBS","Lamborghini Huracan STO","Porsche Taycan Turbo S","Tesla Model S Plaid","Rivian R1T","Lotus Evija","Pininfarina Battista","Gordon Murray T.50","Singer DLS","RUF CTR","Radical SR8","Ariel Atom 4","KTM X-Bow GT4","Caterham Seven 620R","BAC Mono","Donkervoort D8 GTO","Alfa Romeo 4C","Lancia Stratos","Lancia Delta HF","Ford RS200","Audi Sport Quattro","Group B Rally Car","Peugeot 205 T16"].slice(0,52);

const HP = ["Harry Potter","Hermione Granger","Ron Weasley","Albus Dumbledore","Severus Snape","Lord Voldemort","Draco Malfoy","Sirius Black","Remus Lupin","Neville Longbottom","Luna Lovegood","Ginny Weasley","Fred Weasley","George Weasley","Arthur Weasley","Molly Weasley","Bellatrix Lestrange","Lucius Malfoy","Dobby","Hagrid","McGonagall","Flitwick","Sprout","Trelawney","Umbridge","Moody (real)","Barty Crouch Jr","Peter Pettigrew","Lily Potter","James Potter","Cedric Diggory","Viktor Krum","Fleur Delacour","Bill Weasley","Charlie Weasley","Percy Weasley","Cho Chang","Dean Thomas","Seamus Finnigan","Lavender Brown","Parvati Patil","Padma Patil","Tom Riddle (young)","Grindelwald","Ollivander","Horace Slughorn","Cornelius Fudge","Rufus Scrimgeour","Kingsley Shacklebolt","Dolores Umbridge","Nymphadora Tonks","Fenrir Greyback"].slice(0,52);

const STAT_GENERATORS = {
  "dc-comics":    (rank) => ({ rank, strength:rnd(30,100), stamina:rnd(30,100), height:rnd(155,300), weight:rnd(55,450), psychic:rnd(1,100), iq:rnd(80,350), speed:rnd(15,1000) }),
  "mcu":          (rank) => ({ rank, strength:rnd(30,100), stamina:rnd(30,100), height:rnd(150,280), weight:rnd(55,450), psychic:rnd(1,100), iq:rnd(100,400), speed:rnd(15,1000) }),
  "naruto":       (rank) => ({ rank, strength:rnd(20,100), stamina:rnd(20,100), height:rnd(140,200), weight:rnd(40,100), psychic:rnd(5,100), iq:rnd(60,250), speed:rnd(20,500) }),
  "supercars":    (rank) => ({ rank, strength:rnd(400,1700), stamina:rnd(100,2000), height:rnd(100,160), weight:rnd(800,2200), psychic:0, iq:rnd(50,200), speed:rnd(250,500) }),
  "harry-potter": (rank) => ({ rank, strength:rnd(10,80), stamina:rnd(20,90), height:rnd(140,210), weight:rnd(40,130), psychic:rnd(10,100), iq:rnd(70,250), speed:rnd(10,200) }),
};

const DECK_CARDS = [
  { deck: NEW_DECKS[0], cards: DC },
  { deck: NEW_DECKS[1], cards: MCU },
  { deck: NEW_DECKS[2], cards: NARUTO },
  { deck: NEW_DECKS[3], cards: CARS },
  { deck: NEW_DECKS[4], cards: HP },
];

async function main() {
  await client.connect();
  console.log("Connected.\n");

  // Insert decks
  process.stdout.write("Inserting decks... ");
  for (const d of NEW_DECKS) {
    await client.query(
      `INSERT INTO decks (id, name, slug, cover_image_url) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING`,
      [d.id, d.name, d.slug, d.cover_image_url]
    );
  }
  console.log("done.");

  // Stat defs
  process.stdout.write("Inserting stat definitions... ");
  for (const d of NEW_DECKS) {
    for (const def of STAT_DEFS) {
      await client.query(
        `INSERT INTO stat_definitions (deck_id, name, display_name, is_inverse, display_order) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (deck_id, name) DO NOTHING`,
        [d.id, def.name, def.display_name, def.is_inverse, def.display_order]
      );
    }
  }
  console.log("done.");

  // Fetch stat def IDs
  const { rows: sdRows } = await client.query(`SELECT id, deck_id, name FROM stat_definitions WHERE deck_id = ANY($1)`, [NEW_DECKS.map(d => d.id)]);
  const statIdMap = {};
  for (const sd of sdRows) {
    if (!statIdMap[sd.deck_id]) statIdMap[sd.deck_id] = {};
    statIdMap[sd.deck_id][sd.name] = sd.id;
  }

  // Cards + stats
  for (const { deck, cards } of DECK_CARDS) {
    process.stdout.write(`Inserting ${cards.length} ${deck.name} cards... `);
    const gen = STAT_GENERATORS[deck.slug];
    const deckStats = statIdMap[deck.id];

    for (let i = 0; i < cards.length; i++) {
      const name = cards[i];
      const rank = i + 1;

      let cardId;
      const { rows: ex } = await client.query(`SELECT id FROM cards WHERE deck_id=$1 AND name=$2`, [deck.id, name]);
      if (ex.length > 0) {
        cardId = ex[0].id;
      } else {
        const { rows } = await client.query(`INSERT INTO cards (deck_id, name, image_url) VALUES ($1,$2,$3) RETURNING id`, [deck.id, name, null]);
        cardId = rows[0].id;
      }

      const vals = gen(rank);
      for (const statName of STAT_NAMES) {
        const statDefId = deckStats?.[statName];
        const value = vals[statName];
        if (!statDefId || value === undefined) continue;
        await client.query(
          `INSERT INTO card_stats (card_id, stat_definition_id, value) VALUES ($1,$2,$3) ON CONFLICT (card_id, stat_definition_id) DO NOTHING`,
          [cardId, statDefId, value]
        );
      }
    }
    console.log("done.");
  }

  await client.end();
  console.log("\nAll new decks seeded.");
}

main().catch(e => { console.error(e.message); client.end(); process.exit(1); });
