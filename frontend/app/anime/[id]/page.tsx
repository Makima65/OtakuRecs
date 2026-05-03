// frontend/app/anime/[id]/page.tsx

"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, ExternalLink, Star, PlayCircle, Calendar, 
  Clock, Heart, X, Bookmark, Check, ListPlus, Pencil, Users, ThumbsUp, Link as LinkIcon,
  MessageCircle, HeartCrack, Send, LogIn, Trash2, AlertTriangle, MoreVertical
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client'; 

const supabase = createClient();

const CharacterCard = ({ char, user, onRequireLogin }: { char: any, user: any, onRequireLogin: () => void }) => {
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

  const jpVA = char.voice_actors?.find((va: any) => va.language === 'Japanese');

  return (
    <Link 
      href={`/character/${char.character.mal_id}`}
      className="bg-[#282828] rounded-md overflow-hidden flex h-[104px] border border-[#2E2E2E] hover:border-[#3ECF8E] transition-colors group cursor-pointer"
    >
      <img 
        src={char.character.images?.jpg?.image_url} 
        alt={char.character.name}
        className="w-[72px] h-full object-cover shrink-0"
      />
      <div className="p-3 flex flex-col justify-between flex-1 min-w-0">
        <div>
          <div className="flex justify-between items-start gap-2">
            <span className="font-bold text-[#EDEDED] text-sm truncate group-hover:text-[#3ECF8E] transition-colors">
              {char.character.name}
            </span>
          </div>
          {jpVA && (
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-3.5 h-2.5 bg-white flex items-center justify-center rounded-[2px] overflow-hidden shrink-0">
                <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
              </div>
              <span className="text-xs text-[#A0A0A0] truncate">{jpVA.person.name}</span>
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center gap-1.5 text-[#A0A0A0]">
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs font-medium">{commentCount}</span>
          </div>
          <div className="flex gap-1">
            <button 
              onClick={handleLike} 
              className={`p-1.5 rounded-md bg-[#1C1C1C] border border-[#2E2E2E] hover:border-pink-500/50 transition-colors ${liked ? 'text-pink-400 border-pink-500/30 bg-pink-500/10' : 'text-[#A0A0A0]'}`}
            >
              <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-pink-400' : ''}`} />
            </button>
            <button 
              onClick={handleDislike} 
              className={`p-1.5 rounded-md bg-[#1C1C1C] border border-[#2E2E2E] hover:border-[#A0A0A0]/50 transition-colors ${disliked ? 'text-[#EDEDED] border-[#A0A0A0]/50 bg-[#A0A0A0]/20' : 'text-[#A0A0A0]'}`}
            >
              <HeartCrack className={`w-3.5 h-3.5 ${disliked ? 'fill-[#A0A0A0]' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function AnimeDetails() {
  const { id } = useParams();
  const router = useRouter();
  
  const [anime, setAnime] = useState<any>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [user, setUser] = useState<any>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'lists'>('status');
  const [watchStatus, setWatchStatus] = useState("Want to Watch");
  const [listName, setListName] = useState("My List");

  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const STATUS_OPTIONS = ["Unwatched", "Watched", "Watching", "Want to Watch", "Stalled", "Dropped", "Won't Watch"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Watched": return "bg-blue-500";
      case "Watching": return "bg-[#3ECF8E]"; 
      case "Want to Watch": return "bg-yellow-500";
      case "Stalled": return "bg-orange-500";
      case "Dropped": return "bg-red-500";
      case "Won't Watch": return "bg-purple-500";
      default: return "bg-[#A0A0A0]";
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [animeRes, charRes, recRes] = await Promise.all([
          fetch(`https://api.jikan.moe/v4/anime/${id}/full`),
          fetch(`https://api.jikan.moe/v4/anime/${id}/characters`),
          fetch(`https://api.jikan.moe/v4/anime/${id}/recommendations`)
        ]);

        const animeData = await animeRes.json();
        const charData = await charRes.json();
        const recData = await recRes.json();

        if (isMounted) {
          setAnime(animeData.data);
          
          const sortedCharacters = (charData.data || [])
            .sort((a: any, b: any) => {
              if (a.role === 'Main' && b.role !== 'Main') return -1;
              if (a.role !== 'Main' && b.role === 'Main') return 1;
              return (b.favorites || 0) - (a.favorites || 0);
            })
            .slice(0, 8); 
          
          setCharacters(sortedCharacters);
          setRecommendations(recData.data?.slice(0, 12) || []);
        }
      } catch (error) {
        console.error("Failed to fetch anime details:", error);
      }
      if (isMounted) setLoading(false);
    };

    const fetchSupabaseData = async (currentUser?: any) => {
      try {
        let activeUser = currentUser;
        if (activeUser === undefined) {
          const { data: { session } } = await supabase.auth.getSession();
          activeUser = session?.user || null;
        }

        if (isMounted) setUser(activeUser);
        
        const { data: commentsData } = await supabase
          .from('anime_comments')
          .select('*')
          .eq('anime_id', String(id))
          .order('created_at', { ascending: false });
          
        if (commentsData && isMounted) setComments(commentsData);

        if (activeUser) {
          const { data: savedData } = await supabase
            .from('user_anime_list')
            .select('watch_status, list_name')
            .eq('user_id', activeUser.id)
            .eq('anime_id', String(id))
            .single();
            
          if (isMounted) {
            if (savedData) {
              setIsSaved(true);
              setWatchStatus(savedData.watch_status || "Want to Watch");
              setListName(savedData.list_name || "My List");
            } else {
              setIsSaved(false);
              setWatchStatus("Want to Watch");
              setListName("My List");
            }
          }
        } else if (isMounted) {
          setIsSaved(false);
        }
      } catch (error) {
        console.warn("Ignored lock error fetching auth data on anime details page");
      }
    };

    fetchAllData();
    fetchSupabaseData();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        const currentUser = session?.user || null;
        setUser(currentUser);
        if (currentUser) {
          fetchSupabaseData(currentUser);
        } else {
          setIsSaved(false);
        }
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    
    // ✅ FIXED: Checks for the custom username (full_name) first, before falling back to email!
    const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

    const { data, error } = await supabase
      .from('anime_comments')
      .insert([{
        anime_id: String(id),
        user_id: user.id,
        user_email: displayName, 
        content: newComment.trim()
      }])
      .select()
      .single();

    if (!error && data) {
      setComments([data, ...comments]); 
      setNewComment("");
    } else {
      console.error("Error posting comment:", error);
    }
    
    setIsSubmittingComment(false);
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) return;
    
    const { data, error } = await supabase
      .from('anime_comments')
      .update({ content: editContent.trim(), is_edited: true })
      .eq('id', commentId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (!error && data) {
      setComments(comments.map(c => c.id === commentId ? data : c));
      setEditingCommentId(null);
      setEditContent("");
    } else {
      console.error("Error updating comment:", error);
    }
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete || !user) return;
    
    const { error } = await supabase
      .from('anime_comments')
      .delete()
      .eq('id', commentToDelete)
      .eq('user_id', user.id); 
      
    if (!error) {
      setComments(comments.filter(c => c.id !== commentToDelete));
    } else {
      console.error("Error deleting comment:", error);
    }
    setCommentToDelete(null);
  };

  const handleMainActionClick = () => {
    if (user) {
      setShowSaveModal(true);
    } else {
      setShowLoginPrompt(true);
    }
  };

  const confirmSave = async () => {
    if (!anime) return;
    const genresList = anime.genres ? anime.genres.map((g: any) => g.name).join(", ") : "";

    const { error } = await supabase
      .from('user_anime_list')
      .upsert({
        user_id: user.id,
        anime_id: String(anime.mal_id),
        title: anime.title_english || anime.title,
        image_url: anime.images?.jpg?.large_image_url,
        synopsis: anime.synopsis || "No synopsis available.",
        score: anime.score || 0,
        genres: genresList,
        watch_status: watchStatus,
        list_name: listName
      }, { onConflict: 'user_id, anime_id' }); 

    if (!error) {
      setIsSaved(true);
      setShowSaveModal(false);
    } else {
      console.error("Failed to save entry:", error.message);
    }
  };

  const handleRemove = async () => {
    const { error } = await supabase
      .from('user_anime_list')
      .delete()
      .eq('user_id', user.id)
      .eq('anime_id', String(anime.mal_id));
      
    if (!error) {
      setIsSaved(false);
      setShowSaveModal(false);
    }
  };

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
        <div className="w-12 h-12 border-4 border-[#2E2E2E] border-t-[#3ECF8E] rounded-full animate-spin" />
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="min-h-screen bg-[#1C1C1C] flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold text-white">Anime not found</h2>
        <button onClick={() => router.back()} className="text-[#A0A0A0] hover:text-[#3ECF8E] transition-colors flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1C1C1C] text-[#EDEDED] font-sans selection:bg-[#3ECF8E]/30 pb-24" onClick={() => setOpenDropdownId(null)}>
      
      <header className="sticky top-0 z-40 w-full border-b border-[#2E2E2E] bg-[#1C1C1C]/80 backdrop-blur supports-[backdrop-filter]:bg-[#1C1C1C]/60">
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8 mb-16">
          <div className="flex flex-col gap-6">
            <img 
              src={anime.images?.jpg?.large_image_url} 
              alt={anime.title} 
              className="w-[200px] sm:w-[240px] md:w-full mx-auto rounded-xl shadow-2xl object-cover border border-[#2E2E2E]"
            />
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleMainActionClick}
                className={`group w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all border ${
                  isSaved 
                    ? "bg-[#3ECF8E]/10 text-[#3ECF8E] border-[#3ECF8E]/50 hover:bg-[#3ECF8E]/20" 
                    : "bg-[#282828] text-[#EDEDED] border-[#2E2E2E] hover:border-[#3ECF8E] hover:text-[#3ECF8E]"
                }`}
              >
                {isSaved ? <Pencil className="w-5 h-5" /> : <Heart className="w-5 h-5 group-hover:text-red-400" />}
                {isSaved ? "Edit Entry" : "Add to My List"}
              </button>

              {isSaved && (
                <div className="flex items-center justify-center gap-2 bg-[#11181C] border border-[#2E2E2E] py-2 rounded-lg">
                  <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(watchStatus)}`} />
                  <span className="text-sm font-medium text-[#A0A0A0]">{watchStatus}</span>
                  <span className="text-[#555] mx-1">•</span>
                  <span className="text-sm font-medium text-[#A0A0A0] truncate max-w-[100px]">{listName}</span>
                </div>
              )}

              <Link 
                href={anime.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-[#2E51A2] hover:bg-[#2E51A2]/80 text-white py-3 rounded-lg font-semibold transition-colors mt-2"
              >
                <ExternalLink className="w-4 h-4" />
                View on MyAnimeList
              </Link>
            </div>

            <div className="bg-[#282828] border border-[#2E2E2E] rounded-xl p-5 flex flex-col gap-4 text-sm">
              <div className="flex items-center gap-2 text-[#A0A0A0]">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-bold text-[#EDEDED] text-base">{anime.score || "N/A"}</span>
                <span className="text-[#A0A0A0]">({anime.scored_by ? anime.scored_by.toLocaleString() : 0} users)</span>
              </div>
              <div className="flex items-center gap-3 text-[#A0A0A0]">
                <Calendar className="w-4 h-4" />
                <span>{anime.aired?.string || "Unknown"}</span>
              </div>
              <div className="flex items-center gap-3 text-[#A0A0A0]">
                <Clock className="w-4 h-4" />
                <span>{anime.episodes ? `${anime.episodes} Episodes` : "Unknown Episodes"}</span>
              </div>
              
              <div className="pt-4 border-t border-[#2E2E2E] flex flex-col gap-2">
                <span className="text-[#A0A0A0] font-semibold">Studios</span>
                <span className="text-[#EDEDED]">
                  {anime.studios?.map((s: any) => s.name).join(', ') || "Unknown"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#EDEDED] mb-2 leading-tight">
                {anime.title_english || anime.title}
              </h1>
              {anime.title_english && (
                <h2 className="text-lg text-[#A0A0A0] font-medium">{anime.title}</h2>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {anime.genres?.map((genre: any) => (
                <span key={genre.mal_id} className="inline-flex items-center rounded-full border border-[#3ECF8E]/30 bg-[#3ECF8E]/10 px-3 py-1 text-xs font-medium text-[#3ECF8E] uppercase tracking-wider">
                  {genre.name}
                </span>
              ))}
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#EDEDED] mb-3 border-b border-[#2E2E2E] pb-2">Synopsis</h3>
              <p className="text-[#A0A0A0] leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {anime.synopsis || "No synopsis available for this anime."}
              </p>
            </div>

            {anime.relations && anime.relations.length > 0 && (
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-[#EDEDED] mb-6 flex items-center gap-2 border-b border-[#2E2E2E] pb-2">
                  <LinkIcon className="w-6 h-6 text-[#A0A0A0]" />
                  Related Entries
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {anime.relations.flatMap((relation: any) => 
                    relation.entry.map((ent: any) => (
                      <Link 
                        key={`${relation.relation}-${ent.mal_id}`} 
                        href={ent.type === "anime" ? `/anime/${ent.mal_id}` : ent.url}
                        target={ent.type === "anime" ? "_self" : "_blank"}
                        className="flex flex-col justify-center bg-[#282828] rounded-lg p-4 border border-[#2E2E2E] hover:border-[#3ECF8E] transition-colors group min-h-[90px]"
                      >
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <span className="text-xs font-bold text-[#3ECF8E] uppercase tracking-wider">
                            {ent.type}
                          </span>
                          <span className="text-[10px] font-bold text-[#A0A0A0] uppercase bg-[#1C1C1C] px-2 py-0.5 rounded border border-[#2E2E2E] whitespace-nowrap">
                            {relation.relation}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-[#EDEDED] group-hover:text-[#3ECF8E] transition-colors line-clamp-2">
                          {ent.name}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}

            {anime.trailer?.embed_url && (
              <div>
                <h3 className="text-xl font-bold text-[#EDEDED] mb-4 flex items-center gap-2 border-b border-[#2E2E2E] pb-2">
                  <PlayCircle className="w-5 h-5 text-[#A0A0A0]" />
                  Trailer
                </h3>
                <div className="aspect-video w-full rounded-xl overflow-hidden border border-[#2E2E2E] shadow-lg">
                  <iframe 
                    src={anime.trailer.embed_url} 
                    title={`${anime.title} Trailer`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}
          </div>
        </div>

        {characters.length > 0 && (
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-[#EDEDED] mb-6 flex items-center gap-2 border-b border-[#2E2E2E] pb-2">
              <Users className="w-6 h-6 text-[#A0A0A0]" />
              Characters
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {characters.map((char) => (
                <CharacterCard 
                  key={char.character.mal_id} 
                  char={char} 
                  user={user} 
                  onRequireLogin={() => setShowLoginPrompt(true)} 
                />
              ))}
            </div>

            <Link 
              href={`/anime/${id}/characters`} 
              className="inline-flex items-center justify-center bg-[#282828] hover:bg-[#333] border border-[#2E2E2E] text-[#EDEDED] font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-md transition-colors"
            >
              See All Characters
            </Link>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-[#EDEDED] mb-6 flex items-center gap-2 border-b border-[#2E2E2E] pb-2">
              <ThumbsUp className="w-6 h-6 text-[#A0A0A0]" />
              You Might Also Like
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recommendations.map((rec) => (
                <Link key={rec.entry.mal_id} href={`/anime/${rec.entry.mal_id}`} className="group relative flex flex-col w-full transition-all duration-300">
                  <div className="overflow-hidden rounded-md w-full h-[200px] shadow-lg border border-[#2E2E2E] bg-[#1C1C1C] relative transition-colors duration-300 group-hover:border-[#3ECF8E]">
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#11181C]/90 via-[#11181C]/10 to-transparent opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <img 
                      src={rec.entry.images?.jpg?.large_image_url} 
                      alt={rec.entry.title} 
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out md:group-hover:scale-110 z-0" 
                    />
                  </div>
                  <h3 className="text-xs font-semibold text-[#EDEDED] mt-2 line-clamp-2 md:group-hover:text-[#3ECF8E] transition-colors duration-300">
                    {rec.entry.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 border-t border-[#2E2E2E] pt-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-[#EDEDED] flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-[#A0A0A0]" />
              Discussion
            </h3>
            <span className="text-sm font-medium text-[#A0A0A0] bg-[#282828] px-3 py-1 rounded-full border border-[#2E2E2E]">
              {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
            </span>
          </div>

          {user ? (
            <form onSubmit={handlePostComment} className="mb-10 flex gap-3">
              <div className="w-10 h-10 rounded-full bg-[#3ECF8E]/20 border border-[#3ECF8E]/50 flex items-center justify-center shrink-0">
                <span className="text-[#3ECF8E] font-bold text-sm uppercase">
                  {user.user_metadata?.full_name ? user.user_metadata.full_name[0] : (user.email ? user.email[0] : 'U')}
                </span>
              </div>
              <div className="flex-1 relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="What did you think about this anime?"
                  className="w-full bg-[#1C1C1C] border border-[#2E2E2E] text-[#EDEDED] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#3ECF8E] focus:ring-1 focus:ring-[#3ECF8E] min-h-[80px] resize-y placeholder:text-[#555]"
                  disabled={isSubmittingComment}
                />
                <div className="absolute bottom-3 right-3">
                  <button 
                    type="submit"
                    disabled={!newComment.trim() || isSubmittingComment}
                    className="bg-[#3ECF8E] hover:bg-[#2EB87D] text-[#11181C] p-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-10 bg-[#1C1C1C] border border-dashed border-[#2E2E2E] rounded-lg p-8 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-[#282828] rounded-full flex items-center justify-center mb-4">
                <LogIn className="w-6 h-6 text-[#A0A0A0]" />
              </div>
              <h4 className="text-[#EDEDED] font-bold text-lg mb-2">Join the Conversation</h4>
              <p className="text-[#A0A0A0] text-sm mb-6 max-w-sm">Sign in to share your thoughts, reply to others, and add this anime to your list.</p>
              <button 
                onClick={() => setShowLoginPrompt(true)} 
                className="bg-[#3ECF8E] hover:bg-[#2EB87D] text-[#11181C] px-6 py-2.5 rounded-md font-bold transition-colors"
              >
                Log In to Comment
              </button>
            </div>
          )}

          <div className="space-y-6">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#282828] border border-[#2E2E2E] flex items-center justify-center shrink-0">
                    <span className="text-[#A0A0A0] font-bold text-sm uppercase">
                      {comment.user_email ? comment.user_email[0] : 'U'}
                    </span>
                  </div>
                  <div className="flex-1 bg-[#282828] border border-[#2E2E2E] rounded-lg p-4">
                    
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#EDEDED] text-sm">
                          {comment.user_email}
                        </span>
                        <span className="text-xs text-[#A0A0A0]">
                          {new Date(comment.created_at).toLocaleDateString(undefined, {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })}
                        </span>
                        {comment.is_edited && (
                          <span className="text-[10px] text-[#A0A0A0] bg-[#1C1C1C] px-1.5 py-0.5 rounded border border-[#2E2E2E]">Edited</span>
                        )}
                      </div>
                      
                      {user && user.id === comment.user_id && (
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
                      <p className="text-sm text-[#A0A0A0] leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 border border-dashed border-[#2E2E2E] rounded-lg bg-[#1C1C1C]">
                <p className="text-[#A0A0A0] text-sm">No comments yet. Be the first to start the discussion!</p>
              </div>
            )}
          </div>
        </div>

      </main>

      {showSaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setShowSaveModal(false)}>
          <div className="relative flex flex-col p-6 rounded-xl bg-[#1C1C1C] border border-[#2E2E2E] shadow-2xl max-w-sm w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[#EDEDED] font-bold text-lg">{isSaved ? 'Edit Anime' : 'Add to List'}</h2>
              <button onClick={() => setShowSaveModal(false)} className="text-[#A0A0A0] hover:text-[#EDEDED] p-1 rounded-md hover:bg-[#282828]"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex border-b border-[#2E2E2E] mb-6">
              <button onClick={() => setActiveTab('status')} className={`flex-1 pb-2 text-sm font-semibold transition-colors ${activeTab === 'status' ? 'text-[#3ECF8E] border-b-2 border-[#3ECF8E]' : 'text-[#A0A0A0] hover:text-[#EDEDED]'}`}>Status</button>
              <button onClick={() => setActiveTab('lists')} className={`flex-1 pb-2 text-sm font-semibold transition-colors ${activeTab === 'lists' ? 'text-[#3ECF8E] border-b-2 border-[#3ECF8E]' : 'text-[#A0A0A0] hover:text-[#EDEDED]'}`}>Lists</button>
            </div>
            <div className="min-h-[160px]">
              {activeTab === 'status' ? (
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-[#A0A0A0] uppercase font-bold tracking-wider mb-1">Watch Status</label>
                  <select 
                    value={watchStatus}
                    onChange={(e) => setWatchStatus(e.target.value)}
                    className="w-full bg-[#11181C] border border-[#2E2E2E] text-[#EDEDED] rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ECF8E] appearance-none"
                  >
                    {STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
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
                      placeholder="e.g. Masterpieces..."
                      className="w-full bg-[#11181C] border border-[#2E2E2E] text-[#EDEDED] rounded-md pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#3ECF8E] placeholder:text-[#555]"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6 pt-4 border-t border-[#2E2E2E]">
              {isSaved && (
                <button onClick={handleRemove} className="px-4 py-2 rounded-md bg-[#282828] text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-colors">
                  Remove
                </button>
              )}
              <button onClick={confirmSave} className="flex-1 flex items-center justify-center gap-2 bg-[#3ECF8E] text-[#11181C] py-2 rounded-md font-bold text-sm hover:bg-[#2EB87D] transition-colors ml-auto">
                <Check className="w-4 h-4" /> {isSaved ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {commentToDelete && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn" 
          onClick={() => setCommentToDelete(null)}
        >
          <div className="relative flex flex-col p-6 rounded-xl bg-[#1C1C1C] border border-[#2E2E2E] shadow-[8px_8px_0px_#11181C] max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4 text-[#EDEDED]">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h3 className="text-lg font-bold">Delete Comment</h3>
            </div>
            <p className="text-[#A0A0A0] text-sm mb-8 leading-relaxed">
              Are you sure you want to delete this comment? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setCommentToDelete(null)} 
                className="flex-1 py-2.5 rounded-md bg-[#282828] text-[#EDEDED] font-semibold hover:bg-[#333] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteComment} 
                className="flex-1 py-2.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 font-semibold hover:bg-red-500/20 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}