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
# --- TROPE & PACING VIBES ---
    "enemies to lovers": "rivals to lovers, former enemies, slow romance, redemption, hostile start, changing sides",
    "slow burn": "slow progression, gradual romance, delayed gratification, teasing, subtle feelings, long buildup",
    "found family": "adopting, bonding, non-biological family, crew, ragtag group, orphans finding a home",
    "monster of the week": "episodic, weekly villain, procedural, case by case, episodic action",
    "power fantasy": "overpowered, unbeatable, easy fights, everyone is amazed by the main character, wish fulfillment",
    "zero to hero": "weak to strong, training arc, underdog, hard work, leveling up, starting from the bottom",
    "death game": "battle royale, survival game, killing game, forced to fight, deadly competition, elimination",
    
    # --- CHARACTER ARCHETYPE VIBES ---
    "badass fmc": "strong female lead, independent woman, warrior girl, capable female protagonist, fierce",
    "sigma": "lone wolf, solitary, cold protagonist, outcast, ruthless, independent, stoic",
    "himbo": "muscular, kind, dumb, lovable idiot, pure hearted, strong but sweet",
    "crazed villain": "psychopath, insane antagonist, unhinged, chaotic evil, laughing maniacally",
    "morally grey": "anti-hero, questionable morals, doing bad things for good reasons, ruthless protagonist",
    
    # --- EMOTIONAL & MOOD VIBES ---
    "turn off my brain": "mindless, pure action, simple plot, fun, popcorn entertainment, easy to watch",
    "sad boy hours": "depression, tragedy, melancholic, grief, sorrow, suffering, crying",
    "cozy": "warm, relaxing, tea time, autumn atmosphere, low stakes, peaceful, comfortable",
    "hype": "screaming, power up, adrenaline, epic moments, fast paced, extreme excitement, intense",
    "mindfuck": "mind bending, confusing, plot twists, psychological horror, surreal, what did I just watch",
    
    # --- AESTHETIC & ART VIBES ---
    "90s aesthetic": "retro, cel animation, vintage, 1990s, nostalgic, classic anime look",
    "gritty": "dark, realistic, bloody, dirty, visceral, underground, harsh world, shadows",
    "cyberpunk aesthetic": "neon lights, rain slicked streets, synthwave, dystopian city, holograms",
    "cottagecore": "nature, countryside, farming, rural, forests, simple living, plants"
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