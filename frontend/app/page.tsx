"use client";
import { useState, useEffect } from 'react';
import SearchBar from '@/components/SearchBar';
import AnimeCard from '@/components/AnimeCard';

import { LayoutGrid, ChevronLeft, ChevronRight } from "lucide-react"; 

const POPULAR_GENRES = [
  { id: 1, name: "Action" },
  { id: 2, name: "Adventure" },
  { id: 4, name: "Comedy" },
  { id: 8, name: "Drama" },
  { id: 10, name: "Fantasy" },
  { id: 14, name: "Horror" },
  { id: 7, name: "Mystery" },
  { id: 22, name: "Romance" },
  { id: 24, name: "Sci-Fi" },
  { id: 36, name: "Slice of Life" },
  { id: 30, name: "Sports" },
  { id: 37, name: "Supernatural" },
];

export default function Home() {
  const [vibe, setVibe] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]); 
  const [browseResults, setBrowseResults] = useState<any[]>([]); 
  
  const [searchMode, setSearchMode] = useState<'browse' | 'ai' | 'title'>('browse'); 
  
  const [sortBy, setSortBy] = useState('members'); 
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const [showFilters, setShowFilters] = useState(false);
  const [safeSearch, setSafeSearch] = useState(true);
  const [minScore, setMinScore] = useState(5.0);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [animeType, setAnimeType] = useState('');
  const [animeStatus, setAnimeStatus] = useState('');

  const [fetchTrigger, setFetchTrigger] = useState(0);

  const hasActiveFilters = selectedGenres.length > 0 || animeType !== '' || animeStatus !== '' || minScore !== 5.0 || !safeSearch;

  useEffect(() => {
    if (vibe === '' && searchMode !== 'browse') {
      setSearchMode('browse');
      setCurrentPage(1);
    }
  }, [vibe, searchMode]);

  const toggleGenre = (id: number) => {
    setSelectedGenres(prev => {
      if (prev.includes(id)) return prev.filter(genreId => genreId !== id);
      return [...prev, id];
    });
    setCurrentPage(1);
  };

  const fetchBrowseData = async () => {
    setLoading(true);
    setApiError(null); 
    try {
      let url = `https://api.jikan.moe/v4/anime?page=${currentPage}&limit=25&min_score=${minScore}`;
      
      if (safeSearch) url += '&sfw=true';
      if (searchMode === 'title' && vibe) url += `&q=${encodeURIComponent(vibe)}`;
      if (selectedGenres.length > 0) url += `&genres=${selectedGenres.join(',')}`;
      if (animeType) url += `&type=${animeType}`;
      if (animeStatus) url += `&status=${animeStatus}`;
      
      if (sortBy === "members") {
        url += `&order_by=members&sort=desc`;
      } else if (sortBy === "score") {
        url += `&order_by=score&sort=desc`;
      } else if (sortBy === "title") {
        url += `&order_by=title&sort=asc`;
      } else if (sortBy === "year") {
        const today = new Date().toISOString().split('T')[0];
        url += `&order_by=start_date&sort=desc&end_date=${today}`;
      }

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`Jikan API is currently down or rate-limited (Status: ${res.status}).`);
      }

      const data = await res.json();
      
      const formattedData = (data.data || [])
        .filter((item: any) => animeStatus === 'upcoming' ? true : item.status !== "Not yet aired")
        .map((item: any) => ({
          id: String(item.mal_id),
          title: item.title_english || item.title,
          synopsis: item.synopsis,
          genres: item.genres ? item.genres.map((g: any) => g.name).join(", ") : "",
          image_url: item.images?.jpg?.large_image_url || "",
          score: item.score,
          youtube_id: item.trailer?.youtube_id || null
        }));

      const uniqueData = Array.from(new Map(formattedData.map((item: any) => [item.id, item])).values());
      setBrowseResults(uniqueData);
      
      if (data.pagination) {
        setTotalPages(data.pagination.last_visible_page);
      }
    } catch (error: any) {
      console.error("Failed to fetch from Jikan:", error);
      setApiError(error.message || "Failed to connect to the anime database.");
      setBrowseResults([]); 
    }
    setLoading(false);
  };

  useEffect(() => {
    if (searchMode === 'browse' || searchMode === 'title') {
      fetchBrowseData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, currentPage, searchMode, safeSearch, minScore, fetchTrigger, selectedGenres, animeType, animeStatus]);

  const searchByName = () => {
    if (!vibe.trim()) {
      setSearchMode('browse');
      setCurrentPage(1);
      return;
    }
    setSearchMode('title');
    setCurrentPage(1);
    setFetchTrigger(prev => prev + 1); 
  };

  const searchVibe = async () => {
    if (!vibe.trim()) {
      setSearchMode('browse');
      setCurrentPage(1);
      return;
    }
    
    setSearchMode('ai');
    setLoading(true);
    setSearchResults([]); 
    setApiError(null); 
    
    try {
      let aiUrl = `http://localhost:8000/recommend?vibe=${encodeURIComponent(vibe)}&safe_search=${safeSearch}&min_score=${minScore}`;
      if (selectedGenres.length > 0) aiUrl += `&genres=${selectedGenres.join(',')}`;
      if (animeType) aiUrl += `&type=${animeType}`;
      if (animeStatus) aiUrl += `&status=${animeStatus}`;

      const res = await fetch(aiUrl);
      const data = await res.json();
      
      const uniqueAI = Array.from(new Map((data.results || []).map((item: any) => [item.id, item])).values());
      setSearchResults(uniqueAI);
    } catch (error) {
      console.error("Failed to fetch from AI:", error);
    }
    setLoading(false);
  };

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setVibe('');
    setSearchMode('browse');
    setCurrentPage(1);
    setSelectedGenres([]);
    setAnimeType('');
    setAnimeStatus('');
    setSortBy('members');
    setMinScore(5.0);
    setSafeSearch(true);
    setApiError(null);
  };

  const getPageNumbers = () => {
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const currentResults = searchMode === 'ai' ? searchResults : browseResults;

  return (
    <div className="min-h-screen bg-[#111111] text-[#EDEDED] font-sans selection:bg-[#3ECF8E]/30">
      
      {/* Drop in the cleanly separated Navbar */}
      

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-24">
        
        <div className="mb-6 max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight text-[#EDEDED] sm:text-3xl mb-2">
            Discover your next anime
          </h1>
          <p className="text-sm text-[#A0A0A0]">
            Search by title, describe a vibe, or use our filters to browse by genre.
          </p>
        </div>
        
        {/* Search Bar & Filters */}
        <div className="mb-10 w-full max-w-4xl">
          <SearchBar 
            query={vibe} 
            setQuery={setVibe} 
            searchVibe={searchVibe} 
            searchName={searchByName} 
            loading={loading}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            hasActiveFilters={hasActiveFilters}
          />

          <div className={`grid transition-all duration-300 ease-in-out ${showFilters ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0 mt-0"}`}>
            <div className="overflow-hidden">
              <div className="rounded-md border border-[#2E2E2E] bg-[#1A1A1A] p-4 shadow-lg space-y-5">
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#8B909A] mb-1.5 uppercase tracking-wider">Format</label>
                    <select 
                      value={animeType}
                      onChange={handleFilterChange(setAnimeType)}
                      className="h-10 bg-[#2A2A2A] border border-[#3E3E3E] text-[#EDEDED] text-sm rounded-md focus:ring-[#3ECF8E] focus:border-[#3ECF8E] block w-full px-3 py-2 cursor-pointer outline-none transition-colors hover:border-[#555]"
                    >
                      <option value="">Any Format</option>
                      <option value="tv">TV</option>
                      <option value="movie">Movie</option>
                      <option value="ova">OVA</option>
                      <option value="special">Special</option>
                      <option value="ona">ONA</option>
                      <option value="music">Music</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8B909A] mb-1.5 uppercase tracking-wider">Status</label>
                    <select 
                      value={animeStatus}
                      onChange={handleFilterChange(setAnimeStatus)}
                      className="h-10 bg-[#2A2A2A] border border-[#3E3E3E] text-[#EDEDED] text-sm rounded-md focus:ring-[#3ECF8E] focus:border-[#3ECF8E] block w-full px-3 py-2 cursor-pointer outline-none transition-colors hover:border-[#555]"
                    >
                      <option value="">Any Status</option>
                      <option value="airing">Airing</option>
                      <option value="complete">Completed</option>
                      <option value="upcoming">Upcoming</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8B909A] mb-1.5 uppercase tracking-wider">Sort By</label>
                    <select 
                      value={sortBy}
                      onChange={handleFilterChange(setSortBy)}
                      className="h-10 bg-[#2A2A2A] border border-[#3E3E3E] text-[#EDEDED] text-sm rounded-md focus:ring-[#3ECF8E] focus:border-[#3ECF8E] block w-full px-3 py-2 cursor-pointer outline-none transition-colors hover:border-[#555] disabled:opacity-50"
                      disabled={searchMode === 'ai'}
                    >
                      <option value="members">Popular</option>
                      <option value="score">Highest Rated</option>
                      <option value="year">Newest First</option>
                      <option value="title">Alphabetical</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#2E2E2E]">
                  <h4 className="text-xs font-medium text-[#8B909A] mb-2 uppercase tracking-wider">Genres</h4>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_GENRES.map((genre) => (
                      <button
                        key={genre.id}
                        onClick={() => toggleGenre(genre.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                          selectedGenres.includes(genre.id) 
                            ? 'bg-[#3ECF8E]/10 border-[#3ECF8E]/50 text-[#3ECF8E]' 
                            : 'bg-[#2A2A2A] border-[#3E3E3E] text-[#A0A0A0] hover:border-[#555] hover:text-[#EDEDED]'
                        }`}
                      >
                        {genre.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#2E2E2E] flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 max-w-xs w-full">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-medium text-[#8B909A] uppercase tracking-wider">Min MAL Score</label>
                      <span className="text-xs font-medium text-[#EDEDED] bg-[#2A2A2A] border border-[#3E3E3E] px-2 py-0.5 rounded-md">
                        {minScore.toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={minScore}
                      onChange={(e) => setMinScore(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-[#2A2A2A] rounded-lg appearance-none cursor-pointer accent-[#3ECF8E]"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-[#EDEDED]">Safe Search</h4>
                      <p className="text-xs text-[#8B909A] max-w-[200px]">Filters out Ecchi and Hentai genres.</p>
                    </div>
                    <button 
                      onClick={() => setSafeSearch(!safeSearch)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ECF8E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1A1A] ${
                        safeSearch ? 'bg-[#24B47E]' : 'bg-[#3E3E3E]'
                      }`}
                    >
                      <span className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${safeSearch ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2E2E2E] pb-3">
          <h3 className="text-sm font-medium text-[#EDEDED] flex items-center gap-2 uppercase tracking-wider">
            <LayoutGrid className="w-4 h-4 text-[#8B909A]" />
            {searchMode === 'ai' 
              ? "AI Vibe Matches" 
              : searchMode === 'title' 
                ? `Results for "${vibe}" (Page ${currentPage})`
                : `Browse Anime (Page ${currentPage})`}
          </h3>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {loading ? (
            [...Array(15)].map((_, i) => (
              <div key={`skeleton-${i}`} className="h-[260px] sm:h-[280px] w-full animate-pulse rounded-md bg-[#1A1A1A] border border-[#2E2E2E]"></div>
            ))
          ) : apiError && searchMode !== 'ai' ? (
            <div className="col-span-full w-full rounded-md border border-red-900/50 bg-red-900/20 p-8 sm:p-12 text-center text-[#EDEDED] text-sm">
              <div className="text-red-400 font-bold text-lg mb-2">MyAnimeList Database Offline</div>
              <p className="mb-4">{apiError}</p>
              <p className="text-[#A0A0A0]">
                While the official database is temporarily down, try typing a vibe in the search bar and clicking <strong>AI Search</strong>! Your custom Pinecone AI database is still online and working perfectly.
              </p>
            </div>
          ) : currentResults.length > 0 ? (
            currentResults.map((anime, index) => (
              <AnimeCard key={`${anime.id}-${index}`} anime={anime} />
            ))
          ) : (
            <div className="col-span-full w-full rounded-md border border-dashed border-[#3E3E3E] bg-[#1A1A1A] p-8 sm:p-12 text-center text-[#8B909A] text-sm">
              No anime found. Try lowering your minimum score or changing your search!
            </div>
          )}
        </div>

        {/* Pagination */}
        {searchMode !== 'ai' && !apiError && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="p-1.5 rounded-md border border-[#3E3E3E] bg-[#2A2A2A] text-[#A0A0A0] hover:text-[#EDEDED] hover:border-[#555] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {getPageNumbers().map(num => (
                <button
                  key={num}
                  onClick={() => setCurrentPage(num)}
                  disabled={loading}
                  className={`min-w-[32px] h-8 px-2 rounded-md text-xs font-medium transition-colors ${
                    currentPage === num 
                      ? "bg-[#24B47E] text-white border border-transparent" 
                      : "bg-[#2A2A2A] border border-[#3E3E3E] text-[#A0A0A0] hover:text-[#EDEDED] hover:border-[#555]"
                  } disabled:opacity-50`}
                >
                  {num}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
              className="p-1.5 rounded-md border border-[#3E3E3E] bg-[#2A2A2A] text-[#A0A0A0] hover:text-[#EDEDED] hover:border-[#555] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </main>
    </div>
  );
}