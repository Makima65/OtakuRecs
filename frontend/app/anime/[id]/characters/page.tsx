// frontend/app/anime/[id]/characters/page.tsx

"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users, MessageCircle, Heart, HeartCrack, X, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client'; 

const supabase = createClient();

const CharacterRow = ({ 
  char, 
  user, 
  onRequireLogin 
}: { 
  char: any, 
  user: any, 
  onRequireLogin: () => void 
}) => {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    
    const fetchCharacterData = async () => {
      const charId = String(char.character.mal_id);

      const { count } = await supabase
        .from('character_comments')
        .select('*', { count: 'exact', head: true })
        .eq('character_id', charId);
      
      if (count !== null && isMounted) setCommentCount(count);

      if (user) {
        const { data } = await supabase
          .from('character_likes')
          .select('is_like')
          .eq('user_id', user.id)
          .eq('character_id', charId)
          .single();
        
        if (data && isMounted) {
          if (data.is_like === true) setLiked(true);
          if (data.is_like === false) setDisliked(true);
        }
      } else if (isMounted) {
        setLiked(false);
        setDisliked(false);
      }
    };

    fetchCharacterData();
    
    return () => { isMounted = false; };
  }, [char.character.mal_id, user]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    if (!user) return onRequireLogin();

    const newLikedState = !liked;
    setLiked(newLikedState);
    if (newLikedState) setDisliked(false);

    const charId = String(char.character.mal_id);

    if (newLikedState) {
      await supabase.from('character_likes').upsert({
        user_id: user.id,
        character_id: charId,
        is_like: true
      }, { onConflict: 'user_id, character_id' });
    } else {
      await supabase.from('character_likes').delete()
        .eq('user_id', user.id)
        .eq('character_id', charId);
    }
  };

  const handleDislike = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    if (!user) return onRequireLogin();

    const newDislikedState = !disliked;
    setDisliked(newDislikedState);
    if (newDislikedState) setLiked(false);

    const charId = String(char.character.mal_id);

    if (newDislikedState) {
      await supabase.from('character_likes').upsert({
        user_id: user.id,
        character_id: charId,
        is_like: false
      }, { onConflict: 'user_id, character_id' });
    } else {
      await supabase.from('character_likes').delete()
        .eq('user_id', user.id)
        .eq('character_id', charId);
    }
  };

  const jpVA = char.voice_actors?.find((va: any) => va.language === "Japanese");

  return (
    <div className="flex bg-[#282828] border border-[#2E2E2E] rounded-lg overflow-hidden hover:border-[#3ECF8E] transition-colors group">
      <Link 
        href={`/character/${char.character.mal_id}`} 
        className="flex flex-1 hover:bg-[#2E2E2E]/50 transition-colors cursor-pointer"
      >
        <img 
          src={char.character.images?.jpg?.image_url} 
          alt={char.character.name}
          className="w-24 sm:w-28 object-cover shrink-0"
        />
        
        <div className="p-4 flex flex-col justify-center flex-1 min-w-0">
          <h4 className="text-[#EDEDED] font-bold text-lg truncate group-hover:text-[#3ECF8E] transition-colors">
            {char.character.name}
          </h4>
          <span className="text-[#A0A0A0] text-sm mt-0.5 truncate">{char.role}</span>

          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-[#A0A0A0]">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs font-medium">{commentCount}</span>
            </div>
            
            <div className="flex gap-1.5">
              <button 
                onClick={handleLike} 
                className={`p-1.5 rounded-md bg-[#1C1C1C] border border-[#2E2E2E] hover:border-pink-500/50 transition-colors ${liked ? 'text-pink-400 border-pink-500/30 bg-pink-500/10' : 'text-[#A0A0A0]'}`}
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-pink-400' : ''}`} />
              </button>
              <button 
                onClick={handleDislike} 
                className={`p-1.5 rounded-md bg-[#1C1C1C] border border-[#2E2E2E] hover:border-[#A0A0A0]/50 transition-colors ${disliked ? 'text-[#EDEDED] border-[#A0A0A0]/50 bg-[#A0A0A0]/20' : 'text-[#A0A0A0]'}`}
              >
                <HeartCrack className={`w-4 h-4 ${disliked ? 'fill-[#A0A0A0]' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </Link>

      {jpVA && (
        <div className="hidden sm:flex items-center p-4 border-l border-[#2E2E2E] bg-[#222222] min-w-[200px]">
          <div className="flex flex-col items-end flex-1 pr-4">
            <span className="text-[#EDEDED] font-medium text-sm text-right truncate max-w-[120px]">{jpVA.person.name}</span>
            <span className="text-[#A0A0A0] text-xs mt-1">Japanese</span>
          </div>
          <img 
            src={jpVA.person.images?.jpg?.image_url} 
            alt={jpVA.person.name}
            className="w-12 h-12 rounded-full object-cover border border-[#2E2E2E] shrink-0"
          />
        </div>
      )}
    </div>
  );
};

export default function AllCharactersPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [characters, setCharacters] = useState<any[]>([]);
  const [animeTitle, setAnimeTitle] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [user, setUser] = useState<any>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchAuthData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) setUser(session?.user || null);
      } catch (error) {
        console.warn("Ignored lock error fetching auth on characters page");
      }
    };

    fetchAuthData();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) setUser(session?.user || null);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchCharacters = async () => {
      if (!id) return;
      try {
        const [animeRes, charRes] = await Promise.all([
          fetch(`https://api.jikan.moe/v4/anime/${id}`),
          fetch(`https://api.jikan.moe/v4/anime/${id}/characters`)
        ]);

        const animeData = await animeRes.json();
        const charData = await charRes.json();

        setAnimeTitle(animeData.data?.title_english || animeData.data?.title || "Anime");
        setCharacters(charData.data || []);
      } catch (error) {
        console.error("Failed to fetch characters:", error);
      }
      setLoading(false);
    };

    fetchCharacters();
  }, [id]);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: `${window.location.origin}/auth/callback?next=${window.location.pathname}` 
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C1C1C] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#2E2E2E] border-t-[#3ECF8E] rounded-full animate-spin"></div>
      </div>
    );
  }

  const mainCharacters = characters.filter(c => c.role === "Main");
  const supportingCharacters = characters.filter(c => c.role !== "Main");

  return (
    <div className="min-h-screen bg-[#1C1C1C] text-[#EDEDED] font-sans pb-24">
      <header className="sticky top-0 z-40 w-full border-b border-[#2E2E2E] bg-[#1C1C1C]/80 backdrop-blur">
        <div className="max-w-5xl mx-auto flex h-14 items-center px-4 sm:px-6">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 font-medium text-[#A0A0A0] hover:text-[#EDEDED] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {animeTitle}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[#EDEDED] flex items-center gap-3">
            <Users className="w-8 h-8 text-[#3ECF8E]" />
            Characters & Voice Actors
          </h1>
          <p className="text-[#A0A0A0] mt-2">All characters from {animeTitle}</p>
        </div>

        {mainCharacters.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-[#EDEDED] mb-4 border-b border-[#2E2E2E] pb-2">
              Main Characters
            </h2>
            <div className="flex flex-col gap-3">
              {mainCharacters.map(char => (
                <CharacterRow 
                  key={`main-${char.character.mal_id}`} 
                  char={char} 
                  user={user} 
                  onRequireLogin={() => setShowLoginPrompt(true)} 
                />
              ))}
            </div>
          </section>
        )}

        {supportingCharacters.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-[#EDEDED] mb-4 border-b border-[#2E2E2E] pb-2">
              Supporting Characters
            </h2>
            <div className="flex flex-col gap-3">
              {supportingCharacters.map(char => (
                <CharacterRow 
                  key={`sup-${char.character.mal_id}`} 
                  char={char} 
                  user={user} 
                  onRequireLogin={() => setShowLoginPrompt(true)} 
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* LOGIN MODAL */}
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
                Sign in to interact with characters and keep track of your favorites.
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
    </div>
  );
}