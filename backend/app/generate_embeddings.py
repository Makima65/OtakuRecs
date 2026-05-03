import pandas as pd
from sentence_transformers import SentenceTransformer

def create_embeddings():
    print("Loading AI model (this takes a few seconds)...")
    # This is the brain we downloaded earlier!
    model = SentenceTransformer('all-MiniLM-L6-v2') 
    
    print("Loading our anime data...")
    df = pd.read_csv('app/anime_data.csv')
    
    # We combine the title, genres, and synopsis so the AI reads the full context
    df['combined_text'] = df['title'] + " | Genres: " + df['genres'] + " | Synopsis: " + df['synopsis']
    
    print("Converting anime into 'Vibe Vectors'...")
    # This is the heavy lifting: turning text into math!
    embeddings = model.encode(df['combined_text'].tolist(), show_progress_bar=True)
    
    # Add the math to our dataframe
    df['embeddings'] = embeddings.tolist()
    
    # Save the upgraded data as a JSON file
    df.to_json('app/anime_vectors.json', orient='records')
    print("Success! Created vector embeddings for all 25 anime!")

if __name__ == "__main__":
    create_embeddings()