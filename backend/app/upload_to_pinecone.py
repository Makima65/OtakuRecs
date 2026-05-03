import json
import os
from pinecone import Pinecone

def upload_data():
    # Connect to Pinecone using your .env key
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    index = pc.Index("anime-index")

    print("Loading AI vectors from local file...")
    with open('app/anime_vectors.json', 'r') as f:
        data = json.load(f)

    print(f"Uploading {len(data)} anime to Pinecone...")
    
    vectors_to_upsert = []
    for item in data:
        # Pinecone needs: an ID, the math vector, and the actual anime info
        vectors_to_upsert.append({
            "id": str(item['mal_id']),
            "values": item['embeddings'],
            "metadata": {
                "title": item['title'],
                "genres": item['genres'],
                "synopsis": item['synopsis'],
                "image_url": item['image_url']
            }
        })

    # Push to the cloud database
    index.upsert(vectors=vectors_to_upsert)
    print("Success! Your AI now has a permanent memory in the cloud.")

if __name__ == "__main__":
    upload_data()