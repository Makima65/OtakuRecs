// frontend/app/profile/page.tsx

"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Save, AlertTriangle, CheckCircle2, Globe, Lock } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';


const BAD_WORDS = ['fuck', 'shit', 'bitch', 'asshole', 'dick', 'cunt', 'slut', 'nigger', 'faggot'];

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [userAuth, setUserAuth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [username, setUsername] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' | null }>({ text: '', type: null });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/');
        return;
      }
      
      setUserAuth(session.user);

      // Fetch the permanent profile from the database!
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, is_public')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setUsername(profile.username || "");
        setIsPublic(profile.is_public);
      } else {
        // Fallback if trigger didn't run for some reason
        setUsername(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "");
      }

      setLoading(false);
    };

    fetchUser();
  }, [router, supabase]);

  const containsProfanity = (text: string) => {
    const lowerText = text.toLowerCase();
    return BAD_WORDS.some(word => lowerText.includes(word));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: '', type: null });

    const newUsername = username.trim();

    if (newUsername.length < 3) {
      setMessage({ text: 'Username must be at least 3 characters long.', type: 'error' });
      return;
    }

    if (newUsername.length > 20) {
      setMessage({ text: 'Username cannot exceed 20 characters.', type: 'error' });
      return;
    }

    if (containsProfanity(newUsername)) {
      setMessage({ text: 'Please choose a more appropriate username.', type: 'error' });
      return;
    }

    setIsSaving(true);

    try {
      // 1. Save to the permanent database table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: userAuth.id, 
          username: newUsername,
          is_public: isPublic,
          avatar_url: userAuth.user_metadata?.avatar_url
        });

      if (profileError) throw profileError;

      // 2. Update existing Character Comments
      await supabase
        .from('character_comments')
        .update({ username: newUsername })
        .eq('user_id', userAuth.id);

      // 3. Update existing Anime Comments
      await supabase
        .from('anime_comments')
        .update({ user_email: newUsername })
        .eq('user_id', userAuth.id);

      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      
    } catch (error: any) {
      setMessage({ text: error.message || 'Failed to update profile. Username might be taken.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C1C1C] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#2E2E2E] border-t-[#3ECF8E] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1C1C1C] text-[#EDEDED] font-sans selection:bg-[#3ECF8E]/30 pb-24">
      

      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-8">
        <button 
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#A0A0A0] hover:text-[#3ECF8E] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-[#11181C] border border-[#2E2E2E] rounded-2xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#3ECF8E]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <h1 className="text-3xl font-bold text-[#EDEDED] mb-8 relative z-10 flex items-center gap-3">
            <User className="w-8 h-8 text-[#3ECF8E]" />
            Profile Settings
          </h1>

          <div className="flex flex-col sm:flex-row gap-8 items-start relative z-10">
            <div className="flex flex-col items-center gap-4 shrink-0">
              <div className="w-24 h-24 rounded-full border-2 border-[#3ECF8E] overflow-hidden bg-[#282828] shadow-[0_0_15px_rgba(62,207,142,0.2)]">
                {userAuth.user_metadata?.avatar_url ? (
                  <img 
                    src={userAuth.user_metadata.avatar_url} 
                    alt="User Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#282828]">
                    <User className="w-10 h-10 text-[#A0A0A0]" />
                  </div>
                )}
              </div>
              <span className="text-xs font-semibold text-[#A0A0A0] bg-[#1C1C1C] px-3 py-1 rounded-full border border-[#2E2E2E]">
                Google Account
              </span>
            </div>

            <form onSubmit={handleSave} className="flex-1 w-full flex flex-col gap-6">
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-[#A0A0A0] uppercase tracking-wider">
                  Email Address
                </label>
                <input 
                  type="text" 
                  value={userAuth.email} 
                  disabled 
                  className="w-full bg-[#1C1C1C]/50 border border-[#2E2E2E] text-[#666] rounded-lg px-4 py-3 text-sm cursor-not-allowed"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-[#EDEDED] uppercase tracking-wider">
                  Display Name
                </label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter a custom username..."
                  className="w-full bg-[#1C1C1C] border border-[#2E2E2E] text-[#EDEDED] rounded-lg px-4 py-3 text-base focus:outline-none focus:border-[#3ECF8E] transition-colors shadow-inner"
                />
              </div>

              {/* NEW: Public/Private Toggle */}
              <div className="flex flex-col gap-3 pt-2">
                <label className="text-sm font-bold text-[#EDEDED] uppercase tracking-wider">
                  Profile Visibility
                </label>
                
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
                      isPublic ? 'border-[#3ECF8E] bg-[#3ECF8E]/10 text-[#3ECF8E]' : 'border-[#2E2E2E] bg-[#1C1C1C] text-[#A0A0A0] hover:border-[#444]'
                    }`}
                  >
                    <Globe className="w-4 h-4" /> Public
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
                      !isPublic ? 'border-[#3ECF8E] bg-[#3ECF8E]/10 text-[#3ECF8E]' : 'border-[#2E2E2E] bg-[#1C1C1C] text-[#A0A0A0] hover:border-[#444]'
                    }`}
                  >
                    <Lock className="w-4 h-4" /> Private
                  </button>
                </div>
                <p className="text-xs text-[#A0A0A0]">
                  {isPublic 
                    ? "Other users can see your saved Anime and Characters." 
                    : "Your lists are completely hidden from other users."}
                </p>
              </div>

              {message.type && (
                <div className={`flex items-center gap-2 p-3 rounded-lg border ${message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-[#3ECF8E]/10 border-[#3ECF8E]/20 text-[#3ECF8E]'}`}>
                  {message.type === 'error' ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  <span className="text-sm font-medium">{message.text}</span>
                </div>
              )}

              <div className="pt-4 border-t border-[#2E2E2E] flex justify-end">
                <button 
                  type="submit"
                  disabled={isSaving || username.length < 3}
                  className="bg-[#3ECF8E] hover:bg-[#2EB87D] disabled:bg-[#282828] disabled:text-[#666] disabled:border border border-[#3ECF8E] text-[#11181C] font-bold py-2.5 px-6 rounded-lg transition-all flex items-center gap-2"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-[#11181C] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
}