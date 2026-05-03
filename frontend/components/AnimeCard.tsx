"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, X, Bookmark, Check, ListPlus, Pencil } from 'lucide-react';

import { createClient } from '@/utils/supabase/client'; 

export default function AnimeCard({ anime, onUpdate }: { anime: any; onUpdate?: () => void }) {
  const [isSaved, setIsSaved] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'status' | 'lists'>('status');
  const [watchStatus, setWatchStatus] = useState("Want to Watch");
  const [listName, setListName] = useState("My List");

  // Initialize the Next.js cookie client
  const supabase = createClient();

  const genresList = anime.genres ? (typeof anime.genres === 'string' ? anime.genres.split(", ") : anime.genres.map((g:any) => g.name || g)) : [];
  const animeId = anime.id || anime.mal_id;

  const STATUS_OPTIONS = ["Unwatched", "Watched", "Watching", "Want to Watch", "Stalled", "Dropped", "Won't Watch"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Watched": return "bg-blue-500";
      case "Watching": return "bg-[#3ECF8E]"; 
      case "Want to Watch": return "bg-yellow-500";
      case "Stalled": return "bg-orange-500";
      case "Dropped": return "bg-red-500";
      case "Won't Watch": return "bg-purple-500";
      case "Unwatched": 
      default: return "bg-[#A0A0A0]";
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchSavedStatus = async (currentUser: any) => {
      const { data } = await supabase
        .from('user_anime_list')
        .select('anime_id, watch_status, list_name')
        .eq('user_id', currentUser.id)
        .eq('anime_id', String(animeId))
        .single();
        
      if (data && isMounted) {
        setIsSaved(true);
        setWatchStatus(data.watch_status || "Want to Watch");
        setListName(data.list_name || "My List");
      }
    };

    const checkInitialSession = async () => {
      try {
        // ✅ FIX: Use getSession() instead of getUser(). 
        // This reads instantly from cookies and prevents 25 simultaneous network requests!
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user || null;
        
        if (currentUser && isMounted) {
          setUser(currentUser);
          fetchSavedStatus(currentUser);
        }
      } catch (error) {
        // Safely ignore lock collisions
        console.warn("Ignored lock error in AnimeCard");
      }
    };

    checkInitialSession();

    // ✅ ACTIVE LISTENER: Syncs the heart status if you log in via the Navbar
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        const currentUser = session?.user || null;
        setUser(currentUser);
        
        if (currentUser) {
          fetchSavedStatus(currentUser); // Fetch data to turn the heart red if it's saved
        } else {
          setIsSaved(false); // Remove heart highlight if logged out
        }
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [animeId]); // Removed supabase from array to prevent unnecessary re-runs

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    
    if (user) {
      setShowSaveModal(true);
    } else {
      setShowLoginPrompt(true);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowSaveModal(true);
  };

  const confirmSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { error } = await supabase
      .from('user_anime_list')
      .upsert({
        user_id: user.id,
        anime_id: String(animeId),
        title: anime.title || anime.title_english,
        image_url: anime.image_url || anime.images?.jpg?.large_image_url,
        synopsis: anime.synopsis || "No synopsis available.",
        score: anime.score || 0,
        genres: genresList.join(", "),
        watch_status: watchStatus,
        list_name: listName
      }, { onConflict: 'user_id, anime_id' }); 

    if (error) {
      console.error("Supabase Save Error:", error.message);
      alert(`Failed to save! Supabase says: ${error.message}`);
    } else {
      setIsSaved(true);
      setShowSaveModal(false);
      if (onUpdate) onUpdate();
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const { error } = await supabase
      .from('user_anime_list')
      .delete()
      .eq('user_id', user.id)
      .eq('anime_id', String(animeId));
      
    if (!error) {
      setIsSaved(false);
      setShowSaveModal(false);
      if (onUpdate) onUpdate();
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <>
      <Link 
        href={`/anime/${animeId}`}
        className="group relative flex flex-col w-full transition-all duration-300 hover:z-40"
      >
        <div className="overflow-hidden rounded-md w-full h-[280px] shadow-lg border border-[#2E2E2E] bg-[#1C1C1C] relative transition-colors duration-300 group-hover:border-[#3ECF8E]">
          
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#11181C]/90 via-[#11181C]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <img 
            src={anime.image_url || anime.images?.jpg?.large_image_url} 
            alt={anime.title} 
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 z-0" 
          />
          
          <button 
            onClick={handleHeartClick}
            className="absolute top-2 right-2 p-2 rounded-full bg-[#282828]/80 backdrop-blur border border-[#2E2E2E] hover:bg-[#282828] transition-colors z-20"
          >
            <Heart className={`w-4 h-4 transition-colors ${isSaved ? 'fill-red-500 text-red-500' : 'text-[#EDEDED] hover:text-red-400'}`} />
          </button>
        </div>
        
        {/* --- UPDATED INTERACTIVE MINI STATUS INDICATOR --- */}
        {isSaved && (
          <div 
            onClick={handleEditClick}
            className="flex items-center justify-between mt-2 px-1 cursor-pointer group/status"
          >
            <div className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(watchStatus)} shadow-sm`} />
              <span className="text-xs font-medium text-[#A0A0A0] group-hover/status:text-[#EDEDED] transition-colors">
                {watchStatus}
              </span>
            </div>
            {/* Hidden Pencil icon that appears on hover */}
            <div className="flex items-center text-[#A0A0A0] opacity-0 group-hover/status:opacity-100 transition-opacity duration-200">
              <Pencil className="w-3 h-3 hover:text-[#3ECF8E] transition-colors" />
            </div>
          </div>
        )}

        <h3 className={`text-sm font-semibold text-[#EDEDED] truncate px-1 group-hover:text-[#3ECF8E] transition-colors duration-300 ${isSaved ? 'mt-1' : 'mt-2'}`}>
          {anime.title || anime.title_english}
        </h3>

        <div className="absolute left-full top-0 ml-2 hidden group-hover:flex flex-col w-80 bg-[#11181C] text-[#EDEDED] rounded-xl p-4 shadow-2xl z-50 border border-[#2E2E2E]">
          <div className="flex justify-between items-start gap-4 mb-3">
            <h2 className="text-lg font-bold text-[#EDEDED] leading-tight">
              {anime.title || anime.title_english}
            </h2>
            
            <div className="flex items-center gap-1 rounded-md bg-[#282828] px-2.5 py-0.5 text-sm font-semibold text-[#EDEDED] shrink-0 border border-[#2E2E2E]">
              {anime.match_score ? (
                <>
                  <span>{anime.match_score}%</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E]" />
                </>
              ) : (
                <>
                  <span className="text-yellow-500">★</span>
                  <span>{anime.score || "N/A"}</span>
                </>
              )}
            </div>
          </div>
          
          <p className="text-sm leading-relaxed text-[#A0A0A0] mb-4 line-clamp-6">
            {anime.synopsis || "No synopsis available."}
          </p>
          
          <div className="mt-auto flex flex-wrap gap-1.5">
            {genresList.map((genre: string, idx: number) => (
              <span key={idx} className="inline-flex items-center rounded-full border border-[#3ECF8E]/30 bg-[#3ECF8E]/10 px-2.5 py-0.5 text-xs font-medium text-[#3ECF8E]">
                {genre}
              </span>
            ))}
          </div>
        </div>
      </Link>

      {/* --- ADVANCED SAVE / EDIT MODAL --- */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowSaveModal(false); }}>
          <div className="relative flex flex-col p-6 rounded-xl bg-[#1C1C1C] border border-[#2E2E2E] shadow-2xl max-w-sm w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            
            {/* Header changes text based on if it's already saved */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[#EDEDED] font-bold text-lg">
                {isSaved ? 'Edit Anime' : 'Add to List'}
              </h2>
              <button onClick={() => setShowSaveModal(false)} className="text-[#A0A0A0] hover:text-[#EDEDED]"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex border-b border-[#2E2E2E] mb-6">
              <button onClick={() => setActiveTab('status')} className={`flex-1 pb-2 text-sm font-semibold transition-colors ${activeTab === 'status' ? 'text-[#3ECF8E] border-b-2 border-[#3ECF8E]' : 'text-[#A0A0A0] hover:text-[#EDEDED]'}`}>
                Status
              </button>
              <button onClick={() => setActiveTab('lists')} className={`flex-1 pb-2 text-sm font-semibold transition-colors ${activeTab === 'lists' ? 'text-[#3ECF8E] border-b-2 border-[#3ECF8E]' : 'text-[#A0A0A0] hover:text-[#EDEDED]'}`}>
                Personal Lists
              </button>
            </div>

            <div className="min-h-[160px]">
              {activeTab === 'status' ? (
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-[#A0A0A0] uppercase font-bold tracking-wider mb-1">Watch Status</label>
                  <select 
                    value={watchStatus}
                    onChange={(e) => setWatchStatus(e.target.value)}
                    className="w-full bg-[#11181C] border border-[#2E2E2E] text-[#EDEDED] rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ECF8E]"
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-[#A0A0A0] uppercase font-bold tracking-wider mb-1">Save to List</label>
                  <div className="relative">
                    <ListPlus className="absolute left-3 top-2.5 w-4 h-4 text-[#A0A0A0]" />
                    <input 
                      type="text" 
                      value={listName}
                      onChange={(e) => setListName(e.target.value)}
                      placeholder="e.g. Masterpieces, Comfort Anime..."
                      className="w-full bg-[#11181C] border border-[#2E2E2E] text-[#EDEDED] rounded-md pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#3ECF8E] placeholder:text-[#555]"
                    />
                  </div>
                  <p className="text-xs text-[#A0A0A0] mt-2">Type a new name to create a custom list, or leave as "My List" for your default collection.</p>
                </div>
              )}
            </div>

            {/* Footer Buttons update dynamically based on status */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-[#2E2E2E]">
              {isSaved && (
                <button onClick={handleRemove} className="px-4 py-2 rounded-md bg-[#282828] text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-colors">
                  Remove
                </button>
              )}
              <button onClick={confirmSave} className="flex-1 flex items-center justify-center gap-2 bg-[#3ECF8E] text-[#11181C] py-2 rounded-md font-bold text-sm hover:bg-[#2EB87D] transition-colors ml-auto">
                <Check className="w-4 h-4" /> {isSaved ? 'Update' : 'Save Anime'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- LOGIN MODAL --- */}
      {showLoginPrompt && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowLoginPrompt(false); }}
        >
          <div 
            className="relative flex flex-col items-center justify-center p-10 rounded-xl bg-[#1C1C1C] border border-[#2E2E2E] shadow-[8px_8px_0px_#11181C] max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1C1C1C] via-[#1C1C1C] to-[#11181C]" />
            <Heart className="absolute -bottom-10 -right-10 w-48 h-48 text-[#3ECF8E]/5 rotate-[-15deg] z-0" />
            
            <button 
              onClick={() => setShowLoginPrompt(false)}
              className="absolute top-4 right-4 text-[#A0A0A0] hover:text-[#EDEDED] transition-colors z-20 p-1.5 rounded-full hover:bg-[#282828]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center mb-8 z-10 text-center">
              <div className="flex items-center gap-3 mb-2">
                <Bookmark className="w-6 h-6 text-[#3ECF8E]" />
                <span className="text-[#EDEDED] font-bold text-2xl tracking-tight">Save to your list</span>
              </div>
              <p className="text-[#A0A0A0] text-sm mt-2 leading-relaxed max-w-xs">
                Sign in to keep track of what you've watched, what you're watching, and what you want to watch next.
              </p>
            </div>

            <button 
              onClick={handleGoogleLogin}
              className="group relative flex items-center justify-center gap-3 w-full h-12 rounded-md border border-[#3ECF8E] bg-[#11181C] shadow-[4px_4px_0px_#3ECF8E] text-[#EDEDED] font-semibold text-base transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_#3ECF8E] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none overflow-hidden z-10"
            >
              <svg className="w-5 h-5 z-10" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
              <span className="z-10 transition-colors">Continue with Google</span>
              
              <div className="absolute inset-0 w-full h-full bg-[#3ECF8E]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0" />
            </button>

            <button 
              onClick={() => setShowLoginPrompt(false)}
              className="mt-6 text-[#A0A0A0] text-sm font-medium hover:text-[#EDEDED] transition-colors underline decoration-[#A0A0A0]/40 hover:decoration-[#EDEDED] underline-offset-4 z-10"
            >
              Continue without signing in
            </button>
          </div>
        </div>
      )}
    </>
  );
}