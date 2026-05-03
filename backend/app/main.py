import os
import re
import time
import logging
import asyncio
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone

# --- PRODUCTION UPGRADE: STRUCTURED LOGGING ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(levelname)s] - %(message)s"
)
logger = logging.getLogger("OtakuRecs")

app = FastAPI(title="OtakuRecs API", version="2.0", description="Hybrid Semantic Anime Search Engine")

# --- SECURITY: CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PYDANTIC RESPONSE MODELS (For Production Documentation & Validation) ---
class AnimeResult(BaseModel):
    id: str
    title: str
    synopsis: str
    genres: str
    image_url: str
    match_score: float

class RecommendationResponse(BaseModel):
    user_vibe: str
    results: List[AnimeResult]

logger.info("Waking up the AI model (all-MiniLM-L6-v2)...")
model = SentenceTransformer('all-MiniLM-L6-v2')

logger.info("Connecting to Pinecone Cloud Database...")
try:
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    index = pc.Index("anime-index")
    logger.info("Successfully connected to Pinecone!")
except Exception as e:
    logger.critical(f"Failed to connect to Pinecone: {e}")

# --- STRICT BOUNCER RULES ---
STRICT_FILTERS = {
    "action": ["action", "fight", "battle", "combat", "war", "martial arts", "physical conflict"],
    "adventure": ["adventure", "journey", "quest", "exploration"],
    "comedy": ["comedy", "funny", "gag humor", "parody", "humor", "lighthearted"],
    "drama": ["drama", "tragic", "emotional", "tension", "conflict"],
    "fantasy": ["fantasy", "magic", "mythology", "supernatural", "urban fantasy", "dragons", "sorcery"],
    "horror": ["horror", "terror", "scary", "blood", "murder", "dark", "gore", "suspense", "creepy", "monsters"],
    "mystery": ["mystery", "detective", "investigation", "whodunnit", "clues"],
    "romance": [
        "romance", "love", "couple", "dating", "feelings", "boys love", "girls love",
        "family", "heartwarming", "affection", "marriage", "domestic", "wholesome",
        "tender", "relationship", "pretend", "bond", "together"
    ],
    "sci-fi": ["sci-fi", "science fiction", "cyberpunk", "futuristic", "technology", "robots", "aliens"],
    "slice of life": ["slice of life", "iyashikei", "cgdct", "daily life", "everyday", "ordinary"],
    "sports": ["sports", "tournament", "team", "club", "championship", "combat sports", "racing", "athletic"],
    "isekai": ["isekai", "transported", "another world", "reincarnat", "new world", "portal fantasy"],
    "mecha": ["mecha", "robot", "pilots", "cyborg", "giant machine"],
    "space": ["space", "galaxy", "planet", "alien", "spaceship", "interstellar", "cosmic"],
    "food": ["gourmet", "food", "cooking", "baking", "restaurant", "culinary", "meal", "recipe"],
    "music": ["music", "idols", "performing arts", "band", "singing", "concert"],
    "school": ["school", "high school", "student", "classroom", "campus", "academy"],
    "historical": ["historical", "samurai", "edo", "ancient", "victorian", "traditional"],
    "military": ["military", "war", "army", "soldiers", "battlefield", "strategy"],
    "vampire": ["vampire", "bloodsucker", "immortal", "fangs", "gothic"],
    "super power": ["super power", "abilities", "mutant", "powers", "quirk", "superpower"],
    "game": ["video game", "strategy game", "high stakes game", "rpg", "gaming", "virtual"],
    "shounen": ["shounen"],
    "shoujo": ["shoujo"],
    "seinen": ["seinen"],
    "josei": ["josei"],
    "kids": ["kids", "children", "childcare"]
}

# Pre-compile Regular Expressions at startup
COMPILED_FILTERS = {
    keyword: (re.compile(r'\b' + re.escape(keyword) + r'\b'), required_terms)
    for keyword, required_terms in STRICT_FILTERS.items()
}

# --- THE ULTIMATE OTAKU DICTIONARY ---
OTAKU_DICTIONARY = {
    "action": "high energy, fighting, battles, physical conflict, fast-paced, explosions, combat",
    "adventure": "journey, exploration, quest, traveling, discovering new lands, epic scale",
    "avant garde": "experimental, surreal, abstract, weird visuals, unique storytelling, artistic, unconventional",
    "award winning": "high quality, critically acclaimed, masterpiece, top tier storytelling, prestige",
    "boys love": "BL, yaoi, male-male romance, bishounen, emotional male bonds, shounen-ai",
    "comedy": "funny, humor, laughter, jokes, hilarious situations, lighthearted, parody",
    "drama": "serious themes, emotional conflict, heavy storytelling, character growth, tension",
    "fantasy": "magic, mythical creatures, dragons, swords and sorcery, supernatural worlds",
    "girls love": "GL, yuri, female-female romance, sapphic, feminine bonds, shoujo-ai",
    "gourmet": "cooking, food, delicious meals, culinary battles, recipes, eating, restaurant life",
    "horror": "scary, creepy, gore, monsters, psychological terror, blood, suspense, dark",
    "mystery": "detective, investigation, puzzles, secrets, whodunnit, clues, hidden truth",
    "romance": "love, relationships, dating, falling in love, emotional connection, couples",
    "sci-fi": "science fiction, futuristic, technology, space, robots, advanced civilization, aliens",
    "slice of life": "everyday life, realistic, mundane activities, ordinary people, calm, slow paced",
    "sports": "competition, athletic matches, teamwork, training, physical achievement, high stakes games",
    "supernatural": "ghosts, spirits, yokai, paranormal powers, unexplained phenomena, mythology",
    "suspense": "tension, thriller, high pressure, edge of your seat, psychological stakes",
    "ecchi": "suggestive, fan service, risqué, adult comedy, mild nudity, spicy",
    "erotica": "mature content, sexual themes, explicit relationships, adult focused",
    "hentai": "x-rated, explicit sexual content, adult only, pornographic",
    "anthropomorphic": "furry, talking animals, human-like animals, beastmen, animal characters",
    "cyberpunk": "high tech low life, neon, hackers, cyborgs, futuristic city, rain-slicked streets",
    "historical": "ancient times, samurai, edo period, victorian era, traditional culture, old world",
    "isekai": "transported to another world, reincarnation, portal fantasy, new life in a magic land",
    "military": "war, army, soldiers, strategy, battlefield, weapons, patriotic, military hierarchy",
    "mythology": "gods, legends, folklore, ancient myths, divine beings, spiritual tales",
    "organized crime": "mafia, yakuza, gangs, underworld, crime syndicates, lawless",
    "post-apocalyptic": "ruined world, wasteland, survival after the end, lonely ruins, fallout",
    "space": "galaxy, planets, spaceships, interstellar travel, cosmic adventure, stars",
    "steampunk": "steam power, gears, victorian tech, clockwork, airships, brass aesthetics",
    "urban fantasy": "magic in the modern world, hidden supernatural city life, secret magic societies",
    "video game": "gaming world, RPG mechanics, levels, stats, virtual reality, players, gaming culture",
    "workplace": "office life, job struggles, career, professional environment, adult working life",
    "cgdct": "cute girls doing cute things, wholesome, friendship, fluff, low stakes, relaxing",
    "childcare": "raising kids, parenting, babysitting, family bonds, heartwarming, children",
    "combat sports": "boxing, mma, wrestling, martial arts competition, ring fighting",
    "crossdressing": "wearing clothes of the opposite gender, trap, reverse trap, gender disguise",
    "delinquents": "troublemakers, school gangs, yankees, rebels, tough kids, street fighting",
    "detective": "solving crimes, police work, investigation, mystery solving, sherlock style",
    "educational": "learning, teaching, informative, school subjects, useful facts",
    "gag humor": "random comedy, slapstick, absurd jokes, short funny skits",
    "gore": "bloody, violent, graphic injuries, extreme body horror, visceral",
    "harem": "one lead with many romantic interests, multiple girls liking one guy",
    "reverse harem": "one female lead with many handsome male interests, bishounen group",
    "high stakes game": "gambling, life or death matches, intense psychological games, debt",
    "idols": "singing, dancing, pop stars, stage performance, fame, music industry",
    "iyashikei": "healing, soothing, stress relief, peaceful atmosphere, nature, cozy",
    "love polygon": "complex romance, multiple love interests, complicated feelings, jealousy",
    "love status quo": "will-they-won't-they, slow progress, romantic stalemate, unchanging feelings",
    "magical sex shift": "gender bending, transforming into the opposite sex, body swap",
    "mahou shoujo": "magical girls, transformations, sparkly powers, fighting evil with magic",
    "martial arts": "karate, kung fu, sword fighting, discipline, training, hand-to-hand combat",
    "mecha": "giant robots, piloted machines, sci-fi military, heavy metal battles",
    "medical": "doctors, hospitals, surgery, diseases, saving lives, healthcare",
    "music": "instruments, bands, singing, concerts, musical passion, sound focused",
    "otaku culture": "anime fans, manga lovers, gaming obsession, conventions, geek life",
    "parody": "making fun of other anime, satire, meta humor, referencing tropes",
    "performing arts": "acting, theater, ballet, stage plays, artistic performance",
    "pets": "cats, dogs, cute animals, animal companions, living with pets",
    "psychological": "mind games, mental health, trauma, philosophy, internal struggle, deep",
    "racing": "cars, drifting, high speed, competitive driving, engines",
    "reincarnation": "born again, past life memories, starting a second life, soul transfer",
    "samurai": "katana, bushido code, ronin, sword duels, japanese warriors",
    "school": "high school life, students, classrooms, clubs, youth, teenage drama",
    "showbiz": "entertainment industry, acting, modeling, fame, behind the scenes",
    "strategy game": "chess, shogi, tactical battles, board games, brilliant plans",
    "super power": "abilities, quirks, special talents, superhuman strength, mutations",
    "survival": "staying alive, wilderness, dangerous environment, limited resources",
    "time travel": "changing the past, visiting the future, butterfly effect, temporal loops",
    "vampire": "blood drinkers, immortal, fangs, gothic, creatures of the night",
    "villainess": "antagonist lead, noble daughter trope, avoiding doom, otome game plot",
    "visual arts": "painting, drawing, photography, sculpture, creative expression",
    "shounen": "young boys, action, adventure, growth, competition, friendship, battles",
    "shoujo": "young girls, romance, drama, emotional depth, soft art, school life",
    "seinen": "adult men, mature themes, psychological, complex plot, violence, realism",
    "josei": "adult women, realistic romance, career, mature relationships, complex emotions",
    "kids": "children, simple stories, educational, fun, colorful, wholesome",
    "tsundere": "acts mean, hostile, and cold but is actually sweet and in love",
    "yandere": "obsessively in love, crazy, willing to harm others for their crush",
    "kuudere": "emotionless, blank face, cold, but slowly shows feelings over time",
    "dandere": "extremely shy, quiet, socially awkward, but sweet when you get to know them",
    "chuunibyou": "delusional teenager who thinks they have secret magical powers",
    "waifu": "perfect female character, ideal romantic interest, beloved girl",
    "husbando": "perfect male character, ideal romantic interest, handsome boy",
    "polyamory": "multiple romantic partners, everyone dating each other, group love",
    "dense mc": "main character who doesn't realize everyone likes them, oblivious, thick-headed",
    "romcom": "romantic comedy, funny love situations, misunderstandings, heart fluttering",
    "op mc": "overpowered main character, unbeatable, strongest person, power fantasy",
    "edgelord": "dark, brooding, dark past, anti-hero, wears black, gloomy",
    "tearjerker": "sad, depressing, makes you cry, tragic ending, heartbreak, emotional pain",
    "tournament arc": "fighting tournament, bracket competition, arena battles, one on one fights",
    "power of friendship": "overcoming impossible odds through friends, teamwork, nakama",
    "dark fantasy": "grim, dark, violent magic, monsters, bleak world, dangerous, despair",
    "brain rot": "mindless comedy, stupid, funny, nonsense, chaotic, gag anime",
    "ghibli vibe": "beautiful animation, relaxing, nature, emotional, magical world, studio ghibli",
    "ufotable vibe": "insane animation quality, glowing special effects, beautiful fight scenes",
    "trigger vibe": "over the top, chaotic, fast paced, colorful, crazy animation, studio trigger",
}

# PRODUCTION UPGRADE: Async endpoints to handle massive traffic
@app.get("/recommend", response_model=RecommendationResponse)
async def get_recommendations(
    vibe: str = Query(..., description="The user's search prompt"),
    min_score: Optional[float] = Query(None, description="Optional hard filter: Minimum MAL score"),
    year_from: Optional[int] = Query(None, description="Optional hard filter: Earliest release year"),
    safe_search: bool = Query(True, description="Filter out 18+ and Ecchi content")
):
    start_time = time.time()
    
    try:
        vibe_lower = vibe.lower()
        
        # 1. Enhance the vibe for the AI
        enhanced_vibe = vibe_lower
        for slang, translation in OTAKU_DICTIONARY.items():
            if slang in vibe_lower:
                enhanced_vibe += f" {translation}"
                
        # Prevent Vibe Dilution and token limit crashes
        if len(enhanced_vibe) > 1000:
            enhanced_vibe = enhanced_vibe[:1000]
                
        logger.info(f"USER SEARCHED: '{vibe}' | Safe Search: {safe_search} | Min Score: {min_score}")
        logger.info(f"ENHANCED VIBE:  '{enhanced_vibe[:100]}...'")

        # PRODUCTION UPGRADE: Offload heavy AI embedding to an async thread (Non-blocking)
        query_vector = await asyncio.to_thread(model.encode, enhanced_vibe)
        query_vector_list = query_vector.tolist()

        # FIX: Removed the Pinecone meta_filter here to prevent string/float crashes
        result = await asyncio.to_thread(
            index.query,
            vector=query_vector_list,
            top_k=100, 
            include_metadata=True
        )
        
        # 3. THE BOUNCER + SEQUEL SLASHER
        scored_results = []
        junk_words = [
            "season 2", "season 3", "season 4", "season 5",
            "part 2", "part 3", "ova", "movie", "special", "recap",
            "quartet", "spin-off", " 2nd", " 3rd", " 4th",
            "reproduction", "compilation", "summary"
        ]
        
        active_categories = []
        for keyword, (pattern, required_terms) in COMPILED_FILTERS.items():
            if pattern.search(vibe_lower):
                active_categories.append(required_terms)

        logger.info(f"ACTIVE FILTER CATEGORIES: {len(active_categories)}")

        for match in result['matches']:
            anime = match.get('metadata', {})
            title_lower = anime.get('title', '').lower()
            anime_text = (anime.get('synopsis', '') + " " + anime.get('genres', '')).lower()
            
            # --- THE MIN SCORE DETECTIVE FIX ---
            raw_score = anime.get('score') or anime.get('Score') or anime.get('rating') or anime.get('Rating')
            
           # --- FIX: MIN SCORE BLOCKER ---
            try:
                mal_score = float(anime.get('score', 5.0)) # Now it grabs the real score from your new database!
            except (ValueError, TypeError):
                mal_score = 5.0

            # NEW DEBUG LINE: Let's see what the database is giving us
            print(f"DEBUG -> Title: {anime.get('title')} | DB Score: {anime.get('score')} | Filter Set To: {min_score}")

            if min_score is not None and mal_score < min_score:
                continue # Throw it out if the score is too low

            # --- THE SAFE SEARCH BLOCKER ---
            is_nsfw = safe_search and any(nsfw_word in anime_text for nsfw_word in ["ecchi", "hentai", "erotica", "explicit"])
            
            if is_nsfw:
                continue

            # --- THE SEQUEL SLASHER ---
            is_junk = any(word in title_lower for word in junk_words)
            sneaky_sequel = title_lower.endswith((" 2", " 3", " 4", " ii", " iii", " iv"))
            
            if (is_junk or sneaky_sequel) and not any(w in vibe_lower for w in ["movie", "ova", "season", "sequel"]):
                continue
            
            # PRODUCTION UPGRADE: Advanced Hybrid Scoring (70% Vibe, 30% MAL Quality)
            vector_score = match['score']
            normalized_mal = mal_score / 10.0
            
            # Calculate the new base quality score
            hybrid_base_score = (vector_score * 0.7) + (normalized_mal * 0.3)
            
            # Now apply custom strict bouncer multipliers to the new hybrid score
            final_score = hybrid_base_score
            
            if len(active_categories) > 0:
                categories_passed = 0
                for required_terms in active_categories:
                    if any(term in anime_text for term in required_terms):
                        categories_passed += 1
                
                match_ratio = categories_passed / len(active_categories)
                
                if match_ratio == 1.0:
                    final_score = final_score * (1 + (categories_passed * 1.5))
                elif match_ratio >= 0.5:
                    final_score = final_score * 0.7
                else:
                    final_score = final_score * 0.2
            
            scored_results.append({
                "id": match['id'],  
                "title": anime.get('title', 'Unknown Title'),
                "synopsis": anime.get('synopsis', 'No synopsis available.'),
                "genres": anime.get('genres', 'Unknown Genres'),
                "image_url": anime.get('image_url', ''),
                "match_score": final_score,
                "display_score": round(final_score * 100, 1) 
            })
            
        # 4. Sort the surviving results by our new boosted score
        scored_results.sort(key=lambda x: x['match_score'], reverse=True)
        
        # 5. Take the absolute top 5
        top_5 = scored_results[:5]

        # Cleanup the data to send to frontend
        final_recommendations = []
        for r in top_5:
            final_recommendations.append({
                "id": r['id'],
                "title": r['title'],
                "synopsis": r['synopsis'],
                "genres": r['genres'],
                "image_url": r['image_url'],
                "match_score": r['display_score']
            })

        process_time = round(time.time() - start_time, 2)
        logger.info(f"SEARCH COMPLETED IN: {process_time} seconds.")
            
        return {"user_vibe": vibe, "results": final_recommendations}

    except Exception as e:
        logger.error(f"ERROR DURING SEARCH: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error during AI computation.")