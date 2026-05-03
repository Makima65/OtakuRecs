"use client";
import { useState, useEffect } from 'react';
import { LogOut, User } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AuthMenu() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // 1. Get the current session on load
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };
    checkUser();

    // 2. Listen for login/logout events in real-time
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    // Optionally refresh the page to clear any user-specific state
    window.location.reload(); 
  };

  if (loading) {
    return <div className="w-10 h-10 rounded-full bg-[#282828] animate-pulse border border-[#2E2E2E]" />;
  }

  // LOGGED OUT STATE
  if (!user) {
    return (
      <button 
        onClick={handleLogin}
        className="px-4 py-2 rounded-md border border-[#3ECF8E] bg-[#11181C] text-[#3ECF8E] font-semibold text-sm transition-all hover:bg-[#3ECF8E]/10 shadow-[2px_2px_0px_#3ECF8E] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        Sign In
      </button>
    );
  }

  // LOGGED IN STATE
  return (
    <div className="relative">
      {/* Avatar Button */}
      <button 
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-md border-2 border-[#2E2E2E] hover:border-[#3ECF8E] transition-colors overflow-hidden shadow-[2px_2px_0px_#11181C] bg-[#282828]"
      >
        {user.user_metadata?.avatar_url ? (
          <img 
            src={user.user_metadata.avatar_url} 
            alt="User Avatar" 
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-5 h-5 text-[#EDEDED]" />
        )}
      </button>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#1C1C1C] border border-[#2E2E2E] rounded-md shadow-xl overflow-hidden z-50 animate-fadeIn">
          <div className="px-4 py-3 border-b border-[#2E2E2E] bg-[#11181C]">
            <p className="text-sm font-semibold text-[#EDEDED] truncate">
              {user.user_metadata?.full_name || 'Otaku'}
            </p>
            <p className="text-xs text-[#A0A0A0] truncate mt-0.5">
              {user.email}
            </p>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-red-400 hover:bg-[#282828] hover:text-red-300 transition-colors text-left"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
      
      {/* Invisible overlay to close menu when clicking outside */}
      {menuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setMenuOpen(false)} 
        />
      )}
    </div>
  );
}