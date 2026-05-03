import urllib.request
import json
import time
import os
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone

# Load environment variables
load_dotenv()

# Load your Pinecone API Key
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index("anime-index") 

print("Waking up the AI model...")
model = SentenceTransformer('all-MiniLM-L6-v2')

print("INITIATING PROTOCOL: HIGH-QUALITY ANIME HARVEST (ULTIMATE EDITION)")
anime_data = []

# We are going to fetch the Top 200 pages (5,000 Anime)
# By sorting by "members" (popularity), we get the most famous/watched shows first!
target_pages = 200

for page in range(1, target_pages + 1):
    # Notice the URL: We are sorting by "members" descending!
    url = f"https://api.jikan.moe/v4/anime?order_by=members&sort=desc&page={page}"
    req = urllib.request.Request(url, headers={'User-Agent': 'OtakuRecs/1.0'})
    
    try:
        with urllib.request.urlopen(req) as response:
            response_data = json.loads(response.read().decode())
            data = response_data['data']
            
            for item in data:
                # --- THE JUNK FILTER ---
                anime_type = item.get('type')
                members = item.get('members', 0)
                synopsis = item.get('synopsis')
                
                # 1. Must have a synopsis
                # 2. Must be a TV show, Movie, OVA, or ONA (Web anime)
                # 3. Must have at least 20,000 members (filters out nobody-watched-it junk)
                if synopsis and anime_type in ['TV', 'Movie', 'OVA', 'ONA'] and members >= 20000:
                    
                    genres = ", ".join([g['name'] for g in item.get('genres', [])])
                    title = item.get('title_english') or item.get('title')
                    
                    image_url = ""
                    if 'images' in item and 'jpg' in item['images']:
                        image_url = item['images']['jpg'].get('large_image_url', '')
                    
                    # --- THE NEW FUTURE-PROOF METADATA ---
                    score = item.get('score')
                    score = float(score) if score is not None else 5.0
                    
                    year = item.get('year')
                    year = int(year) if year is not None else 0
                    
                    episodes = item.get('episodes')
                    episodes = int(episodes) if episodes is not None else 0
                    
                    rating = item.get('rating') or "Unknown"
                    
                    anime_data.append({
                        "id": str(item['mal_id']), # THIS PREVENTS DUPLICATES!
                        "title": title,
                        "synopsis": synopsis,
                        "genres": genres,
                        "image_url": image_url,
                        "score": score,
                        "year": year,
                        "episodes": episodes,
                        "rating": rating
                    })
                    
        print(f"Fetched page {page}/{target_pages}... (Total saved so far: {len(anime_data)})")
        time.sleep(1.5) # The golden rule: don't get banned!
        
    except Exception as e:
        print(f"Failed to fetch page {page}: {e}")
        time.sleep(5) # Back off if there is an error

print(f"\nHARVEST COMPLETE! Successfully saved {len(anime_data)} high-quality anime!")
print("Converting text to AI vectors and uploading to Pinecone...")

# Convert and upload in batches
vectors = []
for item in anime_data:
    text_to_embed = f"{item['title']} {item['synopsis']} {item['genres']}"
    embedding = model.encode(text_to_embed).tolist()
    
    vectors.append({
        "id": item['id'],
        "values": embedding,
        "metadata": {
            "title": item['title'],
            "synopsis": item['synopsis'],
            "genres": item['genres'],
            "image_url": item['image_url'],
            "score": item['score'],
            "year": item['year'],
            "episodes": item['episodes'],
            "rating": item['rating']
        }
    })

# Uploading 50 at a time
batch_size = 50
for i in range(0, len(vectors), batch_size):
    batch = vectors[i:i + batch_size]
    # upsert means "Update if it exists, Insert if it's new"
    index.upsert(vectors=batch)
    print(f"Uploaded {min(i + batch_size, len(vectors))} / {len(vectors)} to Pinecone...")

print("TOTAL SUCCESS! Your database is now massive, clean, and future-proofed.")