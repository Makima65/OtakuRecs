"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HeartCrack, Lock, ArrowLeft, ListFilter, Tv, Users } from 'lucide-react';
import AnimeCard from '@/components/AnimeCard';

import { createClient } from '@/utils/supabase/client'; 

export default function MyList() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // View Toggle State
  const [viewMode, setViewMode] = useState<'anime' | 'characters'>('anime');

  // Anime State
  const [savedAnime, setSavedAnime] = useState<any[]>([]);
  const [activeAnimeList, setActiveAnimeList] = useState<string>("My List");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Character State
  const [savedCharacters, setSavedCharacters] = useState<any[]>([]);
  const [activeCharList, setActiveCharList] = useState<string>("Favorite Characters");

  const supabase = createClient();

  const loadSavedData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        
        // Fetch Anime
        const { data: animeData, error: animeError } = await supabase
          .from('user_anime_list')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (!animeError && animeData) {
          const formattedAnime = animeData.map((item) => ({
            id: item.anime_id,
            title: item.title,
            image_url: item.image_url,
            synopsis: item.synopsis || "No synopsis available.",
            score: item.score || 0,
            genres: item.genres || "", 
            watch_status: item.watch_status || "Want to Watch",
            list_name: item.list_name || "My List",
          }));
          
          setSavedAnime(formattedAnime);

          const availableAnimeLists = Array.from(new Set(formattedAnime.map(a => a.list_name)));
          setActiveAnimeList(prev => {
            if (availableAnimeLists.length > 0 && !availableAnimeLists.includes(prev)) {
              return availableAnimeLists[0] as string;
            }
            return prev;
          });
        }

        // Fetch Characters
        const { data: charData, error: charError } = await supabase
          .from('user_character_list')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (!charError && charData) {
          setSavedCharacters(charData);

          const availableCharLists = Array.from(new Set(charData.map(c => c.list_name)));
          setActiveCharList(prev => {
            if (availableCharLists.length > 0 && !availableCharLists.includes(prev)) {
              return availableCharLists[0] as string;
            }
            return prev;
          });
        }

      } else {
        setUser(null);
        setSavedAnime([]);
        setSavedCharacters([]);
      }
    } catch (error) {
      console.warn("Ignored lock error while loading saved data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    loadSavedData();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (isMounted) {
          await loadSavedData();
        }
      }
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Filtering Logic
  const uniqueAnimeLists = Array.from(new Set(savedAnime.map(a => a.list_name)));
  const filteredAnime = savedAnime.filter(anime => {
    const matchesList = anime.list_name === activeAnimeList;
    const matchesStatus = statusFilter === "All" || anime.watch_status === statusFilter;
    return matchesList && matchesStatus;
  });

  const uniqueCharLists = Array.from(new Set(savedCharacters.map(c => c.list_name)));
  const filteredCharacters = savedCharacters.filter(char => char.list_name === activeCharList);

  return (
    <div className="min-h-screen bg-[#1C1C1C] text-[#EDEDED] font-sans selection:bg-[#3ECF8E]/30 pb-24">
      
      

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#A0A0A0] hover:text-[#3ECF8E] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Search
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#EDEDED] sm:text-4xl mb-3">
            My Collections
          </h1>
          <p className="text-lg text-[#A0A0A0]">
            Track your watch progress and organize your favorite anime and characters.
          </p>
        </div>

        {/* View Toggle (Anime vs Characters) */}
        <div className="flex gap-6 mb-8 border-b border-[#2E2E2E]">
          <button 
            onClick={() => setViewMode('anime')}
            className={`pb-3 text-sm sm:text-base font-bold flex items-center gap-2 transition-colors ${
              viewMode === 'anime' 
                ? 'text-[#3ECF8E] border-b-2 border-[#3ECF8E]' 
                : 'text-[#A0A0A0] hover:text-[#EDEDED]'
            }`}
          >
            <Tv className="w-4 h-4" />
            Saved Anime
          </button>
          <button 
            onClick={() => setViewMode('characters')}
            className={`pb-3 text-sm sm:text-base font-bold flex items-center gap-2 transition-colors ${
              viewMode === 'characters' 
                ? 'text-[#3ECF8E] border-b-2 border-[#3ECF8E]' 
                : 'text-[#A0A0A0] hover:text-[#EDEDED]'
            }`}
          >
            <Users className="w-4 h-4" />
            Saved Characters
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={`skeleton-${i}`} className="h-[280px] w-full animate-pulse rounded-md bg-[#282828] border border-[#2E2E2E]"></div>
            ))}
          </div>
        ) : !user ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 border border-[#2E2E2E] rounded-md text-center bg-[#11181C] shadow-[8px_8px_0px_#11181C] mt-8">
            <Lock className="w-12 h-12 text-[#A0A0A0] mb-4" />
            <h3 className="text-xl font-bold text-[#EDEDED] mb-2">Sign in to view your list</h3>
            <p className="text-[#A0A0A0] max-w-sm mb-6">
              You need to be logged in to save and view your personal collections.
            </p>
          </div>
        ) : viewMode === 'anime' ? (
          // ANIME VIEW
          <>
            {savedAnime.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-[#11181C] p-4 rounded-xl border border-[#2E2E2E]">
                
                <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-hide">
                  {uniqueAnimeLists.map(listName => (
                    <button
                      key={listName as string}
                      onClick={() => setActiveAnimeList(listName as string)}
                      className={`px-4 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap transition-all ${
                        activeAnimeList === listName
                          ? 'bg-[#3ECF8E] text-[#11181C] shadow-[2px_2px_0px_#282828]'
                          : 'bg-[#282828] text-[#A0A0A0] hover:text-[#EDEDED]'
                      }`}
                    >
                      {listName as string}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <ListFilter className="w-4 h-4 text-[#A0A0A0]" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[#282828] border border-[#2E2E2E] text-[#EDEDED] rounded-md px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-[#3ECF8E] cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Unwatched">Unwatched</option>
                    <option value="Watching">Watching</option>
                    <option value="Watched">Watched</option>
                    <option value="Want to Watch">Want to Watch</option>
                    <option value="Stalled">Stalled</option>
                    <option value="Dropped">Dropped</option>
                    <option value="Won't Watch">Won't Watch</option>
                  </select>
                </div>
              </div>
            )}

            {savedAnime.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 border border-dashed border-[#2E2E2E] rounded-md text-center bg-[#11181C] shadow-[8px_8px_0px_#11181C]">
                <HeartCrack className="w-12 h-12 text-[#A0A0A0] mb-4" />
                <h3 className="text-xl font-bold text-[#EDEDED] mb-2">Your anime list is empty</h3>
                <p className="text-[#A0A0A0] max-w-sm mb-6">Looks like you haven't saved any anime yet.</p>
                <Link href="/" className="px-6 py-2.5 rounded-md border-2 border-[#3ECF8E] bg-[#11181C] text-[#EDEDED] font-semibold text-sm transition-all shadow-[3px_3px_0px_#3ECF8E]">
                  Discover Anime
                </Link>
              </div>
            ) : filteredAnime.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ListFilter className="w-10 h-10 text-[#444] mb-3" />
                <p className="text-[#A0A0A0]">No anime found in <span className="font-bold text-[#EDEDED]">"{activeAnimeList}"</span> with status <span className="font-bold text-[#EDEDED]">"{statusFilter}"</span>.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 animate-fadeIn">
                {filteredAnime.map((anime, index) => (
                  <AnimeCard 
                    key={`anime-${anime.id}-${index}`} 
                    anime={anime} 
                    onUpdate={loadSavedData} 
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          // CHARACTERS VIEW
          <>
            {savedCharacters.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-[#11181C] p-4 rounded-xl border border-[#2E2E2E]">
                <div className="flex gap-2 overflow-x-auto w-full pb-2 sm:pb-0 scrollbar-hide">
                  {uniqueCharLists.map(listName => (
                    <button
                      key={listName as string}
                      onClick={() => setActiveCharList(listName as string)}
                      className={`px-4 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap transition-all ${
                        activeCharList === listName
                          ? 'bg-[#3ECF8E] text-[#11181C] shadow-[2px_2px_0px_#282828]'
                          : 'bg-[#282828] text-[#A0A0A0] hover:text-[#EDEDED]'
                      }`}
                    >
                      {listName as string}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {savedCharacters.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 border border-dashed border-[#2E2E2E] rounded-md text-center bg-[#11181C] shadow-[8px_8px_0px_#11181C]">
                <Users className="w-12 h-12 text-[#A0A0A0] mb-4" />
                <h3 className="text-xl font-bold text-[#EDEDED] mb-2">No characters saved</h3>
                <p className="text-[#A0A0A0] max-w-sm mb-6">Explore anime details to find and save your favorite characters.</p>
                <Link href="/" className="px-6 py-2.5 rounded-md border-2 border-[#3ECF8E] bg-[#11181C] text-[#EDEDED] font-semibold text-sm transition-all shadow-[3px_3px_0px_#3ECF8E]">
                  Discover Anime
                </Link>
              </div>
            ) : filteredCharacters.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ListFilter className="w-10 h-10 text-[#444] mb-3" />
                <p className="text-[#A0A0A0]">No characters found in <span className="font-bold text-[#EDEDED]">"{activeCharList}"</span>.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 animate-fadeIn">
                {filteredCharacters.map((char, index) => (
                  <Link 
                    href={`/character/${char.character_id}`} 
                    key={`char-${char.character_id}-${index}`}
                    className="group relative flex flex-col w-full transition-all duration-300 hover:z-40"
                  >
                    <div className="overflow-hidden rounded-md w-full h-[250px] sm:h-[280px] shadow-lg border border-[#2E2E2E] bg-[#1C1C1C] relative transition-colors duration-300 group-hover:border-[#3ECF8E]">
                      <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#11181C]/90 via-[#11181C]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                      <img 
                        src={char.image_url} 
                        alt={char.name} 
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 z-0" 
                      />
                    </div>
                    <h3 className="text-sm font-semibold text-[#EDEDED] truncate px-1 mt-2 group-hover:text-[#3ECF8E] transition-colors duration-300">
                      {char.name}
                    </h3>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}