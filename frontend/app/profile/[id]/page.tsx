"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, User, Save, AlertTriangle, CheckCircle2, Globe, Lock, 
  Calendar, LayoutGrid, Settings, Tv, Users as UsersIcon, ListFilter, HeartCrack 
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import AnimeCard from '@/components/AnimeCard';

const BAD_WORDS = ['fuck', 'shit', 'bitch', 'asshole', 'dick', 'cunt', 'slut', 'nigger', 'faggot'];

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  
  const profileId = params.id as string;
  
  // Auth & Permissions
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileExists, setProfileExists] = useState(true);

  // Profile Data
  const [profileData, setProfileData] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'settings'>('list');
  
  // Forms
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' | null }>({ text: '', type: null });

  // List States
  const [viewMode, setViewMode] = useState<'anime' | 'characters'>('anime');
  const [savedAnime, setSavedAnime] = useState<any[]>([]);
  const [activeAnimeList, setActiveAnimeList] = useState<string>("My List");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  
  const [savedCharacters, setSavedCharacters] = useState<any[]>([]);
  const [activeCharList, setActiveCharList] = useState<string>("Favorite Characters");

  const fetchPageData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const viewer = session?.user;
    setCurrentUser(viewer);

    const me = viewer?.id === profileId;
    setIsOwner(me);

    // Fetch Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profile) {
      setProfileData(profile);
      setUsername(profile.username || "");
      setIsPublic(profile.is_public);
      
      // Fetch Lists ONLY if Owner OR if Profile is Public
      if (me || profile.is_public) {
        // Fetch Anime
        const { data: animeData } = await supabase
          .from('user_anime_list')
          .select('*')
          .eq('user_id', profileId)
          .order('created_at', { ascending: false });

        if (animeData) {
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
          setActiveAnimeList(prev => (!availableAnimeLists.includes(prev) && availableAnimeLists.length > 0 ? availableAnimeLists[0] as string : prev));
        }

        // Fetch Characters
        const { data: charData } = await supabase
          .from('user_character_list')
          .select('*')
          .eq('user_id', profileId)
          .order('created_at', { ascending: false });

        if (charData) {
          setSavedCharacters(charData);
          const availableCharLists = Array.from(new Set(charData.map(c => c.list_name)));
          setActiveCharList(prev => (!availableCharLists.includes(prev) && availableCharLists.length > 0 ? availableCharLists[0] as string : prev));
        }
      }
    } else {
      setProfileExists(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (profileId) fetchPageData();
  }, [profileId, supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    
    setMessage({ text: '', type: null });
    const newUsername = username.trim();

    if (newUsername.length < 3) return setMessage({ text: 'Username must be at least 3 characters long.', type: 'error' });
    if (newUsername.length > 20) return setMessage({ text: 'Username cannot exceed 20 characters.', type: 'error' });
    if (BAD_WORDS.some(word => newUsername.toLowerCase().includes(word))) return setMessage({ text: 'Please choose a more appropriate username.', type: 'error' });

    setIsSaving(true);
    try {
      const { error: profileError } = await supabase.from('profiles').upsert({ 
        id: currentUser.id, username: newUsername, is_public: isPublic, avatar_url: profileData?.avatar_url
      });
      if (profileError) throw profileError;
      await supabase.from('character_comments').update({ username: newUsername }).eq('user_id', currentUser.id);
      await supabase.from('anime_comments').update({ user_email: newUsername }).eq('user_id', currentUser.id);
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch (error: any) {
      setMessage({ text: error.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#1C1C1C] flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#2E2E2E] border-t-[#3ECF8E] rounded-full animate-spin" /></div>;
  if (!profileExists) return <div className="min-h-screen bg-[#1C1C1C] flex flex-col items-center justify-center text-[#EDEDED]"><AlertTriangle className="w-16 h-16 text-[#A0A0A0] mb-4" /><h1 className="text-2xl font-bold">User Not Found</h1><button onClick={() => router.push('/')} className="mt-4 text-[#3ECF8E]">Go Home</button></div>;

  const isPrivateView = !isOwner && !profileData.is_public;

  // Filters
  const uniqueAnimeLists = Array.from(new Set(savedAnime.map(a => a.list_name)));
  const filteredAnime = savedAnime.filter(a => a.list_name === activeAnimeList && (statusFilter === "All" || a.watch_status === statusFilter));
  const uniqueCharLists = Array.from(new Set(savedCharacters.map(c => c.list_name)));
  const filteredCharacters = savedCharacters.filter(c => c.list_name === activeCharList);

  return (
    <div className="min-h-screen bg-[#1C1C1C] text-[#EDEDED] font-sans pb-24">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        
        {/* HEADER SECTION */}
        <div className="bg-[#11181C] border border-[#2E2E2E] rounded-2xl p-6 sm:p-10 shadow-xl relative overflow-hidden mb-8">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-[#3ECF8E] overflow-hidden bg-[#282828] shrink-0">
              {profileData?.avatar_url ? <img src={profileData.avatar_url} alt="User" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User className="w-12 h-12 text-[#A0A0A0]" /></div>}
            </div>
            <div className="flex-1 text-center sm:text-left mt-2">
              <h1 className="text-3xl font-bold text-[#EDEDED] flex items-center justify-center sm:justify-start gap-3">{profileData?.username || "Unknown User"}</h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 text-[#A0A0A0] text-sm">
                <span className="flex items-center gap-1.5 bg-[#1C1C1C] px-3 py-1.5 rounded-full border border-[#2E2E2E]">
                  {profileData?.is_public ? <Globe className="w-4 h-4 text-[#3ECF8E]" /> : <Lock className="w-4 h-4 text-red-400" />}
                  {profileData?.is_public ? "Public Profile" : "Private Profile"}
                </span>
                {profileData?.created_at && <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Joined {new Date(profileData.created_at).toLocaleDateString()}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-2 border-b border-[#2E2E2E] mb-8 overflow-x-auto">
          <button onClick={() => setActiveTab('list')} className={`flex items-center gap-2 px-6 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'list' ? 'border-[#3ECF8E] text-[#3ECF8E]' : 'border-transparent text-[#A0A0A0] hover:text-[#EDEDED]'}`}>
            <LayoutGrid className="w-4 h-4" /> {isOwner ? 'My List' : 'Anime List'}
          </button>
          {isOwner && (
            <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-6 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'settings' ? 'border-[#3ECF8E] text-[#3ECF8E]' : 'border-transparent text-[#A0A0A0] hover:text-[#EDEDED]'}`}>
              <Settings className="w-4 h-4" /> Profile Settings
            </button>
          )}
        </div>

        {/* LIST CONTENT */}
        {activeTab === 'list' && (
          <div>
            {isPrivateView ? (
              <div className="bg-[#11181C] border border-[#2E2E2E] rounded-xl p-12 text-center flex flex-col items-center">
                <Lock className="w-12 h-12 text-[#A0A0A0] mb-4" />
                <h3 className="text-xl font-bold text-[#EDEDED]">This profile is private</h3>
                <p className="text-[#A0A0A0] mt-2">You cannot view the saved anime of a private account.</p>
              </div>
            ) : (
              <>
                <div className="flex gap-6 mb-8 border-b border-[#2E2E2E]">
                  <button onClick={() => setViewMode('anime')} className={`pb-3 font-bold flex items-center gap-2 ${viewMode === 'anime' ? 'text-[#3ECF8E] border-b-2 border-[#3ECF8E]' : 'text-[#A0A0A0]'}`}><Tv className="w-4 h-4" /> Anime</button>
                  <button onClick={() => setViewMode('characters')} className={`pb-3 font-bold flex items-center gap-2 ${viewMode === 'characters' ? 'text-[#3ECF8E] border-b-2 border-[#3ECF8E]' : 'text-[#A0A0A0]'}`}><UsersIcon className="w-4 h-4" /> Characters</button>
                </div>

                {viewMode === 'anime' ? (
                  <>
                    {savedAnime.length > 0 && (
                      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8 bg-[#11181C] p-4 rounded-xl border border-[#2E2E2E]">
                        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto scrollbar-hide">
                          {uniqueAnimeLists.map(listName => (
                            <button key={listName as string} onClick={() => setActiveAnimeList(listName as string)} className={`px-4 py-1.5 rounded-md text-sm font-semibold ${activeAnimeList === listName ? 'bg-[#3ECF8E] text-[#11181C]' : 'bg-[#282828] text-[#A0A0A0]'}`}>{listName as string}</button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <ListFilter className="w-4 h-4 text-[#A0A0A0]" />
                          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[#282828] border border-[#2E2E2E] text-[#EDEDED] rounded-md px-3 py-1.5 text-sm">
                            <option value="All">All Statuses</option><option value="Unwatched">Unwatched</option><option value="Watching">Watching</option><option value="Watched">Watched</option><option value="Want to Watch">Want to Watch</option><option value="Stalled">Stalled</option><option value="Dropped">Dropped</option>
                          </select>
                        </div>
                      </div>
                    )}
                    {savedAnime.length === 0 ? (
                      <div className="py-20 text-center"><HeartCrack className="w-12 h-12 text-[#A0A0A0] mx-auto mb-4" /><p className="text-[#A0A0A0]">{isOwner ? "You haven't saved any anime yet." : "This user hasn't saved any anime yet."}</p></div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                        {filteredAnime.map((anime, index) => <AnimeCard key={index} anime={anime} onUpdate={fetchPageData} />)}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {savedCharacters.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto mb-8 bg-[#11181C] p-4 rounded-xl border border-[#2E2E2E]">
                        {uniqueCharLists.map(listName => (
                          <button key={listName as string} onClick={() => setActiveCharList(listName as string)} className={`px-4 py-1.5 rounded-md text-sm font-semibold ${activeCharList === listName ? 'bg-[#3ECF8E] text-[#11181C]' : 'bg-[#282828] text-[#A0A0A0]'}`}>{listName as string}</button>
                        ))}
                      </div>
                    )}
                    {savedCharacters.length === 0 ? (
                      <div className="py-20 text-center"><UsersIcon className="w-12 h-12 text-[#A0A0A0] mx-auto mb-4" /><p className="text-[#A0A0A0]">{isOwner ? "You haven't saved any characters." : "This user hasn't saved any characters."}</p></div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                        {filteredCharacters.map((char, index) => (
                          <Link href={`/character/${char.character_id}`} key={index} className="group relative rounded-md overflow-hidden h-[250px] sm:h-[280px] border border-[#2E2E2E]">
                            <img src={char.image_url} alt={char.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#11181C] to-transparent opacity-80" />
                            <h3 className="absolute bottom-2 left-2 right-2 text-sm font-semibold truncate group-hover:text-[#3ECF8E]">{char.name}</h3>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* SETTINGS CONTENT (Only visible to Owner) */}
        {activeTab === 'settings' && isOwner && (
          <div className="bg-[#11181C] border border-[#2E2E2E] rounded-2xl p-6 sm:p-10 shadow-xl max-w-xl">
            <form onSubmit={handleSave} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-[#EDEDED] uppercase tracking-wider">Display Name</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-[#1C1C1C] border border-[#2E2E2E] rounded-lg px-4 py-3 focus:border-[#3ECF8E] text-[#EDEDED]" />
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <label className="text-sm font-bold text-[#EDEDED] uppercase tracking-wider">Profile Visibility</label>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setIsPublic(true)} className={`flex-1 flex justify-center gap-2 py-3 rounded-lg border-2 ${isPublic ? 'border-[#3ECF8E] bg-[#3ECF8E]/10 text-[#3ECF8E]' : 'border-[#2E2E2E] text-[#A0A0A0]'}`}><Globe className="w-4 h-4" /> Public</button>
                  <button type="button" onClick={() => setIsPublic(false)} className={`flex-1 flex justify-center gap-2 py-3 rounded-lg border-2 ${!isPublic ? 'border-[#3ECF8E] bg-[#3ECF8E]/10 text-[#3ECF8E]' : 'border-[#2E2E2E] text-[#A0A0A0]'}`}><Lock className="w-4 h-4" /> Private</button>
                </div>
              </div>
              {message.type && (
                <div className={`p-3 rounded-lg flex items-center gap-2 ${message.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-[#3ECF8E]/10 text-[#3ECF8E]'}`}>
                  {message.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span className="text-sm">{message.text}</span>
                </div>
              )}
              <button type="submit" disabled={isSaving || username.length < 3} className="bg-[#3ECF8E] text-[#11181C] font-bold py-3 rounded-lg mt-4 flex justify-center gap-2">
                {isSaving ? "Saving..." : <><Save className="w-4 h-4" /> Save Changes</>}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}