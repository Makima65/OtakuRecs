// frontend/app/character/[id]/page.tsx

"use client";
import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { 
  ArrowLeft, Mic, Tv, Heart, HeartCrack, MessageSquare, Send, X, Bookmark, 
  User, MoreVertical, Trash2, AlertTriangle, Pencil, ListPlus, Check 
} from 'lucide-react';
import Link from 'next/link';

import { createClient } from '@/utils/supabase/client'; 

export default function CharacterDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const supabase = useMemo(() => createClient(), []);
  
  const [character, setCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [allReactions, setAllReactions] = useState<any[]>([]);
  const [userAction, setUserAction] = useState<'like' | 'dislike' | null>(null);
  
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");

  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const [isSaved, setIsSaved] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [listName, setListName] = useState("Favorite Characters");

  useEffect(() => {
    let isMounted = true;

    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (isMounted) {
        if (error || !user) {
          setCurrentUser(null);
          setUserProfile(null);
        } else {
          setCurrentUser(user);
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (profile) {
            setUserProfile(profile);
          }
        }
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isMounted) {
        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setUserProfile(null);
          setIsSaved(false);
        } else {
          const { data: { user } } = await supabase.auth.getUser();
          setCurrentUser(user || null);
          if (user) {
             const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
             if (profile) setUserProfile(profile);
          }
        }
        router.refresh();
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [supabase, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const res = await fetch(`https://api.jikan.moe/v4/characters/${id}/full`);
        const data = await res.json();
        setCharacter(data.data);

        const { data: dbComments } = await supabase
          .from('character_comments')
          .select('*')
          .eq('character_id', id)
          .order('created_at', { ascending: false });

        if (dbComments) setComments(dbComments);

        const { data: reactions } = await supabase
          .from('character_likes')
          .select('*')
          .eq('character_id', id);

        if (reactions) {
          setAllReactions(reactions);
          setLikesCount(reactions.filter(r => r.is_like === true).length);
          setDislikesCount(reactions.filter(r => r.is_like === false).length);
        }

      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, supabase]);

  useEffect(() => {
    if (currentUser && allReactions.length > 0) {
      const reaction = allReactions.find(r => r.user_id === currentUser.id);
      if (reaction) {
        setUserAction(reaction.is_like ? 'like' : 'dislike');
      } else {
        setUserAction(null);
      }
    } else {
      setUserAction(null);
    }
  }, [currentUser, allReactions]);

  useEffect(() => {
    const fetchSavedStatus = async () => {
      if (currentUser && id) {
        const { data: savedData } = await supabase
          .from('user_character_list')
          .select('list_name')
          .eq('user_id', currentUser.id)
          .eq('character_id', String(id))
          .single();
          
        if (savedData) {
          setIsSaved(true);
          setListName(savedData.list_name || "Favorite Characters");
        } else {
          setIsSaved(false);
        }
      }
    };
    fetchSavedStatus();
  }, [currentUser, id, supabase]);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${pathname}`,
      },
    });
  };

  const confirmSaveCharacter = async () => {
    if (!character || !currentUser) return;
    const { error } = await supabase
      .from('user_character_list')
      .upsert({
        user_id: currentUser.id,
        character_id: String(character.mal_id),
        name: character.name,
        image_url: character.images?.jpg?.image_url,
        list_name: listName
      }, { onConflict: 'user_id, character_id' }); 

    if (!error) {
      setIsSaved(true);
      setShowSaveModal(false);
    } else {
      console.error("Failed to save character:", error.message);
    }
  };

  const handleRemoveCharacter = async () => {
    if (!currentUser) return;
    const { error } = await supabase
      .from('user_character_list')
      .delete()
      .eq('user_id', currentUser.id)
      .eq('character_id', String(character.mal_id));
      
    if (!error) {
      setIsSaved(false);
      setShowSaveModal(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser) { setShowLoginPrompt(true); return; }

    if (userAction === 'like') {
      setUserAction(null);
      setLikesCount(prev => prev - 1);
      await supabase.from('character_likes').delete().match({ character_id: id, user_id: currentUser.id });
    } else {
      const wasDislike = userAction === 'dislike';
      setUserAction('like');
      setLikesCount(prev => prev + 1);
      if (wasDislike) setDislikesCount(prev => prev - 1);
      
      await supabase.from('character_likes').upsert(
        { character_id: id, user_id: currentUser.id, is_like: true },
        { onConflict: 'character_id,user_id' }
      );
    }
  };

  const handleDislike = async () => {
    if (!currentUser) { setShowLoginPrompt(true); return; }

    if (userAction === 'dislike') {
      setUserAction(null);
      setDislikesCount(prev => prev - 1);
      await supabase.from('character_likes').delete().match({ character_id: id, user_id: currentUser.id });
    } else {
      const wasLike = userAction === 'like';
      setUserAction('dislike');
      setDislikesCount(prev => prev + 1);
      if (wasLike) setLikesCount(prev => prev - 1);
      
      await supabase.from('character_likes').upsert(
        { character_id: id, user_id: currentUser.id, is_like: false },
        { onConflict: 'character_id,user_id' }
      );
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!currentUser) {
      setShowLoginPrompt(true);
      return;
    }

    const finalUsername = userProfile?.username || currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User';
    const finalAvatar = userProfile?.avatar_url || currentUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.id}`;

    const { data, error } = await supabase
      .from('character_comments')
      .insert([
        {
          character_id: id,
          user_id: currentUser.id,
          content: commentText.trim(),
          username: finalUsername,
          avatar_url: finalAvatar
        }
      ])
      .select();

    if (!error && data) {
      setComments([data[0], ...comments]);
      setCommentText(""); 
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim() || !currentUser) return;
    
    const { data, error } = await supabase
      .from('character_comments')
      .update({ content: editContent.trim(), is_edited: true })
      .eq('id', commentId)
      .eq('user_id', currentUser.id)
      .select()
      .single();

    if (!error && data) {
      setComments(comments.map(c => c.id === commentId ? data : c));
      setEditingCommentId(null);
      setEditContent("");
    }
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete || !currentUser) return;
    
    const { error } = await supabase
      .from('character_comments')
      .delete()
      .eq('id', commentToDelete)
      .eq('user_id', currentUser.id); 
      
    if (!error) {
      setComments(comments.filter(c => c.id !== commentToDelete));
    }
    setCommentToDelete(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#2E2E2E] border-t-[#3ECF8E] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-[#141414] text-[#EDEDED] flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold">Character not found</h2>
        <button onClick={() => router.back()} className="text-[#A0A0A0] hover:text-[#3ECF8E] transition-colors flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  const jpVoiceActors = character.voices?.filter((v: any) => v.language === "Japanese") || [];

  return (
    <div className="min-h-screen bg-[#141414] text-[#EDEDED] font-sans pb-24 relative overflow-hidden" onClick={() => setOpenDropdownId(null)}>
      
      {showLoginPrompt && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowLoginPrompt(false); }}
        >
          <div 
            className="relative flex flex-col items-center justify-center p-8 sm:p-10 rounded-xl bg-[#1C1C1C] border border-[#2E2E2E] shadow-[8px_8px_0px_#11181C] max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1C1C1C] via-[#1C1C1C] to-[#11181C]" />
            <User className="absolute -bottom-10 -right-10 w-48 h-48 text-[#3ECF8E]/5 rotate-[-15deg] z-0" />
            
            <button 
              onClick={() => setShowLoginPrompt(false)}
              className="absolute top-4 right-4 text-[#A0A0A0] hover:text-[#EDEDED] transition-colors z-20 p-1.5 rounded-full hover:bg-[#282828]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center mb-8 z-10 text-center mt-4">
              <div className="flex items-center gap-3 mb-2">
                <Bookmark className="w-6 h-6 text-[#3ECF8E]" />
                <span className="text-[#EDEDED] font-bold text-xl sm:text-2xl tracking-tight">Join the discussion</span>
              </div>
              <p className="text-[#A0A0A0] text-sm mt-2 leading-relaxed max-w-xs">
                Sign in to like characters, save them to your list, and share your thoughts.
              </p>
            </div>

            <button 
              onClick={handleGoogleLogin}
              className="group relative flex items-center justify-center gap-3 w-full h-12 rounded-md border border-[#3ECF8E] bg-[#11181C] shadow-[4px_4px_0px_#3ECF8E] text-[#EDEDED] font-semibold text-sm sm:text-base transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_#3ECF8E] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none overflow-hidden z-10"
            >
              <svg className="w-5 h-5 z-10" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
              <span className="z-10 transition-colors">Continue with Google</span>
              <div className="absolute inset-0 w-full h-full bg-[#3ECF8E]/5 opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-0" />
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

      {showSaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setShowSaveModal(false)}>
          <div className="relative flex flex-col p-6 rounded-xl bg-[#1C1C1C] border border-[#2E2E2E] shadow-2xl max-w-sm w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[#EDEDED] font-bold text-lg">{isSaved ? 'Edit Character' : 'Save Character'}</h2>
              <button onClick={() => setShowSaveModal(false)} className="text-[#A0A0A0] hover:text-[#EDEDED] p-1 rounded-md hover:bg-[#282828]"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex flex-col gap-2 min-h-[80px]">
              <label className="text-xs text-[#A0A0A0] uppercase font-bold tracking-wider mb-1">Save to List</label>
              <div className="relative">
                <ListPlus className="absolute left-3 top-2.5 w-4 h-4 text-[#A0A0A0]" />
                <input 
                  type="text" 
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="e.g. Waifus, Husbandos..."
                  className="w-full bg-[#11181C] border border-[#2E2E2E] text-[#EDEDED] rounded-md pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#3ECF8E] placeholder:text-[#555]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-[#2E2E2E]">
              {isSaved && (
                <button onClick={handleRemoveCharacter} className="px-4 py-2 rounded-md bg-[#282828] text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-colors">
                  Remove
                </button>
              )}
              <button onClick={confirmSaveCharacter} className="flex-1 flex items-center justify-center gap-2 bg-[#3ECF8E] text-[#11181C] py-2 rounded-md font-bold text-sm hover:bg-[#2EB87D] transition-colors ml-auto">
                <Check className="w-4 h-4" /> {isSaved ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {commentToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setCommentToDelete(null)}>
          <div className="relative flex flex-col p-6 rounded-xl bg-[#1C1C1C] border border-[#2E2E2E] shadow-[8px_8px_0px_#11181C] max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4 text-[#EDEDED]">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h3 className="text-lg font-bold">Delete Comment</h3>
            </div>
            <p className="text-[#A0A0A0] text-sm mb-8 leading-relaxed">
              Are you sure you want to delete this comment? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setCommentToDelete(null)} className="flex-1 py-2.5 rounded-md bg-[#282828] text-[#EDEDED] font-semibold hover:bg-[#333] transition-colors">
                Cancel
              </button>
              <button onClick={confirmDeleteComment} className="flex-1 py-2.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 font-semibold hover:bg-red-500/20 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute top-0 left-0 w-full h-[500px] z-0 opacity-20 pointer-events-none select-none">
        <img 
          src={character.images?.jpg?.image_url} 
          alt="background blur"
          className="w-full h-full object-cover blur-3xl mask-image:linear-gradient(to_bottom,black,transparent)" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#141414]"></div>
      </div>

      <header className="sticky top-0 z-40 w-full border-b border-[#2E2E2E]/50 bg-[#141414]/80 backdrop-blur">
        <div className="max-w-5xl mx-auto flex h-14 items-center px-4 sm:px-6">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 font-medium text-[#A0A0A0] hover:text-[#EDEDED] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 mb-16">
          
          <div className="flex flex-col gap-4 items-center md:items-stretch">
            <div className="w-full max-w-[200px] md:max-w-none">
              <img 
                src={character.images?.jpg?.image_url} 
                alt={character.name} 
                className="w-full rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] object-cover border border-[#2E2E2E]"
              />
            </div>
            
            <div className="w-full max-w-[200px] md:max-w-none flex flex-col gap-3">
              
              <button 
                onClick={() => currentUser ? setShowSaveModal(true) : setShowLoginPrompt(true)}
                className={`group w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all border ${
                  isSaved 
                    ? "bg-[#3ECF8E]/10 text-[#3ECF8E] border-[#3ECF8E]/50 hover:bg-[#3ECF8E]/20" 
                    : "bg-[#282828] text-[#EDEDED] border-[#2E2E2E] hover:border-[#3ECF8E] hover:text-[#3ECF8E]"
                }`}
              >
                {isSaved ? <Pencil className="w-5 h-5" /> : <Bookmark className="w-5 h-5 group-hover:text-[#3ECF8E]" />}
                {isSaved ? "Edit Character" : "Save to List"}
              </button>

              {isSaved && (
                <div className="flex items-center justify-center gap-2 bg-[#1C1C1C] border border-[#2E2E2E] py-2 rounded-lg mb-1 shadow-lg">
                  <div className={`w-2.5 h-2.5 rounded-full bg-[#3ECF8E]`} />
                  <span className="text-sm font-medium text-[#A0A0A0] truncate max-w-[150px]">{listName}</span>
                </div>
              )}

              <div className="bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl p-3 flex items-center justify-center gap-2 text-[#A0A0A0] shadow-lg">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                <span className="font-bold text-[#EDEDED]">{character.favorites?.toLocaleString() || 0}</span>
                <span className="text-sm">MAL Favorites</span>
              </div>

              <div className="flex bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl overflow-hidden h-14 shadow-lg">
                <button 
                  onClick={handleLike} 
                  className={`flex-1 flex gap-2 justify-center items-center transition-all ${userAction === 'like' ? 'bg-pink-500/20' : 'hover:bg-[#282828]'}`}
                >
                  <Heart className={`w-5 h-5 ${userAction === 'like' ? 'fill-pink-400 text-pink-400' : 'text-[#888]'}`} />
                  <span className={`font-bold ${userAction === 'like' ? 'text-pink-400' : 'text-[#888]'}`}>{likesCount}</span>
                </button>
                <div className="w-px bg-[#2E2E2E]"></div>
                <button 
                  onClick={handleDislike} 
                  className={`flex-1 flex gap-2 justify-center items-center transition-all ${userAction === 'dislike' ? 'bg-[#333]' : 'hover:bg-[#282828]'}`}
                >
                  <HeartCrack className={`w-5 h-5 ${userAction === 'dislike' ? 'fill-[#ccc] text-[#ccc]' : 'text-[#888]'}`} />
                  <span className={`font-bold ${userAction === 'dislike' ? 'text-[#ccc]' : 'text-[#888]'}`}>{dislikesCount}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="text-center md:text-left">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-[#EDEDED] mb-2 tracking-tight drop-shadow-md">
                {character.name}
              </h1>
              {character.name_kanji && (
                <h2 className="text-xl text-[#888] font-medium tracking-widest">{character.name_kanji}</h2>
              )}
            </div>

            <div className="bg-[#1C1C1C] border border-[#2E2E2E] rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-[#EDEDED] mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-[#3ECF8E] rounded-full"></span>
                About
              </h3>
              <p className="text-[#A0A0A0] leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {character.about || "No biography available for this character."}
              </p>
            </div>
          </div>
        </div>

        {jpVoiceActors.length > 0 && (
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-[#EDEDED] mb-6 flex items-center gap-3">
              <Mic className="w-6 h-6 text-[#3ECF8E]" />
              Japanese Voice Actors
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {jpVoiceActors.map((va: any, idx: number) => (
                <div key={idx} className="flex bg-[#1C1C1C] border border-[#2E2E2E] hover:border-[#444] transition-colors rounded-xl overflow-hidden shadow-md">
                  <img 
                    src={va.person.images?.jpg?.image_url} 
                    alt={va.person.name}
                    className="w-20 h-24 object-cover"
                  />
                  <div className="p-4 flex flex-col justify-center">
                    <span className="text-[#EDEDED] font-bold">{va.person.name}</span>
                    <span className="text-[#3ECF8E] text-xs font-semibold mt-1 uppercase tracking-wider">{va.language}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {character.anime && character.anime.length > 0 && (
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-[#EDEDED] mb-6 flex items-center gap-3">
              <Tv className="w-6 h-6 text-[#3ECF8E]" />
              Anime Appearances
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
              {character.anime.map((appearance: any, idx: number) => (
                <Link 
                  key={idx} 
                  href={`/anime/${appearance.anime.mal_id}`} 
                  className="bg-[#1C1C1C] rounded-xl overflow-hidden border border-[#2E2E2E] flex flex-col hover:border-[#3ECF8E] hover:shadow-[0_0_15px_rgba(62,207,142,0.15)] transition-all group"
                >
                  <div className="overflow-hidden">
                    <img 
                      src={appearance.anime.images?.jpg?.large_image_url || appearance.anime.images?.jpg?.image_url} 
                      alt={appearance.anime.title}
                      className="w-full h-52 object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                    />
                  </div>
                  <div className="p-3 flex flex-col bg-[#1C1C1C] z-10 relative border-t border-[#2E2E2E]">
                    <span className="text-sm font-bold text-[#EDEDED] line-clamp-2 leading-tight mb-1">{appearance.anime.title}</span>
                    <span className="text-xs text-[#888]">{appearance.role}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <section className="bg-[#1C1C1C] border border-[#2E2E2E] rounded-2xl p-6 sm:p-8 shadow-xl">
          <h3 className="text-2xl font-bold text-[#EDEDED] mb-8 flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-[#3ECF8E]" />
            Discussions <span className="text-[#666] text-lg font-medium">({comments.length})</span>
          </h3>

          <form onSubmit={handlePostComment} className="mb-10">
            <div className="flex flex-col gap-3">
              <textarea 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="What do you think about this character?"
                className="w-full bg-[#141414] border border-[#2E2E2E] rounded-xl p-4 text-[#EDEDED] placeholder-[#666] focus:outline-none focus:border-[#3ECF8E] transition-colors resize-none h-28 shadow-inner"
              />
              <div className="flex justify-end">
                <button 
                  type="submit"
                  disabled={!commentText.trim() && currentUser !== null}
                  className="bg-[#3ECF8E] hover:bg-[#32B37A] disabled:bg-[#2E2E2E] disabled:text-[#666] text-[#141414] font-bold py-2.5 px-6 rounded-lg transition-all flex items-center gap-2 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  Post Comment
                </button>
              </div>
            </div>
          </form>

          <div className="flex flex-col gap-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-4 group">
                <img 
                  src={comment.avatar_url} 
                  alt={comment.username} 
                  className="w-12 h-12 rounded-full bg-[#282828] border border-[#2E2E2E] shrink-0 object-cover"
                />
                <div className="flex-1 bg-[#141414] border border-[#2E2E2E] group-hover:border-[#333] transition-colors rounded-xl p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#3ECF8E] text-sm">{comment.username}</span>
                      <span className="text-xs text-[#666]">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                      {comment.is_edited && (
                        <span className="text-[10px] text-[#A0A0A0] bg-[#1C1C1C] px-1.5 py-0.5 rounded border border-[#2E2E2E]">Edited</span>
                      )}
                    </div>
                    
                    {currentUser && currentUser.id === comment.user_id && (
                      <div className="relative">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setOpenDropdownId(openDropdownId === comment.id ? null : comment.id); 
                          }}
                          className="text-[#A0A0A0] hover:text-[#EDEDED] transition-colors p-1 rounded-md hover:bg-[#1C1C1C]"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {openDropdownId === comment.id && (
                          <div className="absolute right-0 top-8 w-32 bg-[#1C1C1C] border border-[#2E2E2E] rounded-md shadow-xl overflow-hidden z-20 animate-fadeIn">
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setEditingCommentId(comment.id); 
                                setEditContent(comment.content); 
                                setOpenDropdownId(null); 
                              }} 
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#282828] text-[#EDEDED] transition-colors"
                            >
                              Edit
                            </button>
                            <div className="h-[1px] bg-[#2E2E2E] w-full" />
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setCommentToDelete(comment.id); 
                                setOpenDropdownId(null); 
                              }} 
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#282828] text-red-400 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {editingCommentId === comment.id ? (
                    <div className="mt-2 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                      <textarea 
                        value={editContent} 
                        onChange={(e) => setEditContent(e.target.value)} 
                        className="w-full bg-[#1C1C1C] border border-[#3ECF8E] text-[#EDEDED] rounded-md px-3 py-2 text-sm focus:outline-none min-h-[60px]"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button 
                          onClick={() => setEditingCommentId(null)} 
                          className="px-3 py-1.5 text-xs font-semibold text-[#A0A0A0] hover:text-[#EDEDED] transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleUpdateComment(comment.id)} 
                          className="px-3 py-1.5 text-xs font-bold bg-[#3ECF8E] text-[#11181C] rounded hover:bg-[#2EB87D] transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[#EDEDED] text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {comments.length === 0 && (
              <div className="py-8 text-center border-2 border-dashed border-[#2E2E2E] rounded-xl">
                <p className="text-[#888] italic">No comments yet. Be the first to share your thoughts!</p>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}