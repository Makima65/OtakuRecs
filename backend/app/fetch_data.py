import requests
import pandas as pd

def fetch_top_anime():
    print("Fetching data from Jikan API...")
    url = "https://api.jikan.moe/v4/top/anime"
    
    # Send a request to the API
    response = requests.get(url)
    data = response.json()
    
    anime_list = []
    
    # Loop through the data and pick out what we need
    for item in data.get('data', []):
        # Some anime don't have an English title, so we fallback to the default title
        title = item.get('title_english') or item.get('title')
        
        anime_list.append({
            'mal_id': item['mal_id'],
            'title': title,
            'synopsis': item['synopsis'],
            'genres': ", ".join([g['name'] for g in item.get('genres', [])]),
            'image_url': item['images']['jpg']['image_url']
        })
    
    # Convert our list into a Pandas DataFrame (a fancy spreadsheet)
    df = pd.DataFrame(anime_list)
    
    # Save it to a CSV file
    df.to_csv('app/anime_data.csv', index=False)
    print(f"Success! Saved {len(df)} anime to anime_data.csv!")

if __name__ == "__main__":
    fetch_top_anime()