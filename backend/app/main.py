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
# --- THE ULTIMATE OTAKU DICTIONARY ---
OTAKU_DICTIONARY = {
    # --- ROMANCE & RELATIONSHIP TROPES ---
    "enemies to lovers": "rivals to lovers, former enemies, slow romance, redemption, hostile start, changing sides",
    "slow burn": "slow progression, gradual romance, delayed gratification, teasing, subtle feelings, long buildup",
    "love triangle": "romantic rivalry, torn between two lovers, jealousy, competing for affection, complicated relationship, love polygon, romantic drama",
    "girls love": "GL, yuri, female-female romance, sapphic, lesbian, feminine bonds, shoujo-ai, women dating women",
    "boys love": "BL, yaoi, male-male romance, bishounen, shounen-ai, men dating men, gay romance",
    "forbidden love": "star crossed lovers, secret relationship, taboo romance, hiding their feelings, tragic romance",
    "harem": "one lead with many romantic interests, multiple girls liking one guy",
    "reverse harem": "one female lead with many handsome male interests, bishounen group",
    "polyamory": "multiple romantic partners, everyone dating each other, group love",
    "romcom": "romantic comedy, funny love situations, misunderstandings, heart fluttering",
    "love status quo": "will-they-won't-they, slow progress, romantic stalemate, unchanging feelings",
    
    # --- STORY TROPES & PACING ---
    "found family": "adopting, bonding, non-biological family, crew, ragtag group, orphans finding a home",
    "monster of the week": "episodic, weekly villain, procedural, case by case, episodic action",
    "power fantasy": "overpowered, unbeatable, easy fights, everyone is amazed by the main character, wish fulfillment",
    "zero to hero": "weak to strong, training arc, underdog, hard work, leveling up, starting from the bottom",
    "death game": "battle royale, survival game, killing game, forced to fight, deadly competition, elimination",
    "tournament arc": "fighting tournament, bracket competition, arena battles, one on one fights",
    "power of friendship": "overcoming impossible odds through friends, teamwork, nakama",
    "high stakes game": "gambling, life or death matches, intense psychological games, debt",
    "isekai": "transported to another world, reincarnation, portal fantasy, new life in a magic land",
    "reincarnation": "born again, past life memories, starting a second life, soul transfer",
    "time travel": "changing the past, visiting the future, butterfly effect, temporal loops",
    
    # --- CHARACTER ARCHETYPES ---
    "badass fmc": "strong female lead, independent woman, warrior girl, capable female protagonist, fierce",
    "sigma": "lone wolf, solitary, cold protagonist, outcast, ruthless, independent, stoic",
    "himbo": "muscular, kind, dumb, lovable idiot, pure hearted, strong but sweet",
    "crazed villain": "psychopath, insane antagonist, unhinged, chaotic evil, laughing maniacally",
    "morally grey": "anti-hero, questionable morals, doing bad things for good reasons, ruthless protagonist",
    "tsundere": "acts mean, hostile, and cold but is actually sweet and in love",
    "yandere": "obsessively in love, crazy, willing to harm others for their crush",
    "kuudere": "emotionless, blank face, cold, but slowly shows feelings over time",
    "dandere": "extremely shy, quiet, socially awkward, but sweet when you get to know them",
    "chuunibyou": "delusional teenager who thinks they have secret magical powers",
    "dense mc": "main character who doesn't realize everyone likes them, oblivious, thick-headed",
    "op mc": "overpowered main character, unbeatable, strongest person",
    "edgelord": "dark, brooding, dark past, anti-hero, wears black, gloomy",
    "waifu": "perfect female character, ideal romantic interest, beloved girl",
    "husbando": "perfect male character, ideal romantic interest, handsome boy",
    "villainess": "antagonist lead, noble daughter trope, avoiding doom, otome game plot",
    
    # --- EMOTIONAL & MOOD VIBES ---
    "turn off my brain": "mindless action, pure combat, simple plot, explosions, fighting, dumb fun, popcorn entertainment, martial arts brawler",
    "sad boy hours": "depression, tragedy, melancholic, grief, sorrow, suffering, crying",
    "tearjerker": "sad, depressing, makes you cry, tragic ending, heartbreak, emotional pain",
    "cozy": "warm, relaxing, tea time, autumn atmosphere, low stakes, peaceful, comfortable",
    "iyashikei": "healing, soothing, stress relief, peaceful atmosphere, nature, cozy",
    "hype fights": "epic battles, sakuga, intense combat, super powers, adrenaline, amazing animation, screaming power ups, hand-to-hand combat, action packed",
    "hype": "screaming, power up, adrenaline, epic moments, fast paced, extreme excitement, intense",
    "mindfuck": "mind bending, confusing, plot twists, psychological horror, surreal, what did I just watch",
    "suspense": "tension, thriller, high pressure, edge of your seat, psychological stakes",
    "brain rot": "mindless comedy, stupid, funny, nonsense, chaotic, gag anime, slapstick",
    
    # --- AESTHETICS & ART STYLES ---
    "90s aesthetic": "retro, cel animation, vintage, 1990s, nostalgic, classic anime look",
    "gritty": "dark, realistic, bloody, dirty, visceral, underground, harsh world, shadows",
    "cyberpunk aesthetic": "high tech low life, neon lights, rain slicked streets, synthwave, dystopian city, holograms",
    "cottagecore": "nature, countryside, farming, rural, forests, simple living, plants",
    "ghibli vibe": "beautiful animation, relaxing, nature, emotional, magical world, studio ghibli",
    "ufotable vibe": "insane animation quality, glowing special effects, beautiful fight scenes",
    "trigger vibe": "over the top, chaotic, fast paced, colorful, crazy animation, studio trigger",
    "steampunk": "steam power, gears, victorian tech, clockwork, airships, brass aesthetics",
    "dark fantasy": "grim, dark, violent magic, monsters, bleak world, dangerous, despair",
    "gore": "bloody, violent, graphic injuries, extreme body horror, visceral",
    
    # --- SPECIFIC NICHES & SETTINGS ---
    "avant garde": "experimental, surreal, abstract, weird visuals, unique storytelling, artistic, unconventional",
    "gourmet": "cooking, food, delicious meals, culinary battles, recipes, eating, restaurant life",
    "cgdct": "cute girls doing cute things, wholesome, friendship, fluff, low stakes, relaxing",
    "childcare": "raising kids, parenting, babysitting, family bonds, heartwarming, children",
    "delinquents": "troublemakers, school gangs, yankees, rebels, tough kids, street fighting",
    "idols": "singing, dancing, pop stars, stage performance, fame, music industry",
    "showbiz": "entertainment industry, acting, modeling, fame, behind the scenes",
    "medical": "doctors, hospitals, surgery, diseases, saving lives, healthcare",
    "workplace": "office life, job struggles, career, professional environment, adult working life",
    "school": "high school life, students, classrooms, clubs, youth, teenage drama",
    "military": "war, army, soldiers, strategy, battlefield, weapons, patriotic, military hierarchy",
    "urban fantasy": "magic in the modern world, hidden supernatural city life, secret magic societies",
    "mythology": "gods, legends, folklore, ancient myths, divine beings, spiritual tales",
    "historical": "ancient times, samurai, edo period, victorian era, traditional culture, old world",
    "space": "galaxy, planets, spaceships, interstellar travel, cosmic adventure, stars",
    "mecha": "giant robots, piloted machines, sci-fi military, heavy metal battles",
    "racing": "cars, drifting, high speed, competitive driving, engines",
    "video game": "gaming world, RPG mechanics, levels, stats, virtual reality, players, gaming culture",
    "otaku culture": "anime fans, manga lovers, gaming obsession, conventions, geek life",
    "anthropomorphic": "furry, talking animals, human-like animals, beastmen, animal characters",
    "magical sex shift": "gender bending, transforming into the opposite sex, body swap",
    "mahou shoujo": "magical girls, transformations, sparkly powers, fighting evil with magic"
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
                enhanced_vibe += f" {slang} {translation}"
                
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
# 4. Sort the surviving results by our new boosted score
        scored_results.sort(key=lambda x: x['match_score'], reverse=True)
        
        # 5. Take the top 15 results (Expanded from 5)
        top_results = scored_results[:15]

        # Cleanup the data to send to frontend
        final_recommendations = []
        for r in top_results:
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