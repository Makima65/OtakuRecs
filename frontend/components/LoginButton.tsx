"use client";

import { useState, useEffect } from 'react';
import { LogOut, User, Settings } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function LoginButton() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  
  const supabase = createClient();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;

    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (isMounted) {
        setUser(error ? null : user);
        setLoading(false);
      }
    };
    
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (isMounted) {
          if (event === 'SIGNED_OUT') {
            setUser(null);
          } else {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []); 

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${pathname}`,
      },
    });
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn("Ignored Supabase lock error during logout");
    } finally {
      setMenuOpen(false);
      
      setTimeout(() => {
        window.location.reload(); 
      }, 100);
    }
  };

  if (loading) {
    return <div className="w-9 h-9 rounded-md bg-[#2A2A2A] animate-pulse border border-[#3E3E3E]" />;
  }

  if (!user) {
    return (
      <button 
        onClick={handleLogin}
        className="px-4 py-2 rounded-md border-2 border-[#3ECF8E] bg-[#11181C] text-[#EDEDED] font-semibold text-sm transition-all shadow-[3px_3px_0px_#3ECF8E] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#3ECF8E] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
      >
        Sign In
      </button>
    );
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-md border-2 border-[#2E2E2E] hover:border-[#3ECF8E] transition-colors overflow-hidden shadow-[2px_2px_0px_#11181C] bg-[#282828] relative z-10"
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

      {menuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#1C1C1C] border border-[#2E2E2E] rounded-md shadow-xl overflow-hidden z-50 animate-fadeIn">
          <div className="px-4 py-3 border-b border-[#2E2E2E] bg-[#11181C]">
            <p className="text-sm font-semibold text-[#EDEDED] truncate">
              {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-[#A0A0A0] truncate mt-0.5">
              {user.email}
            </p>
          </div>
          
          <Link 
            href="/profile"
            onClick={() => setMenuOpen(false)}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-[#EDEDED] hover:bg-[#282828] transition-colors text-left"
          >
            <Settings className="w-4 h-4 text-[#A0A0A0]" />
            Profile Settings
          </Link>

          <div className="h-px bg-[#2E2E2E] w-full" />
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-red-400 hover:bg-[#282828] hover:text-red-300 transition-colors text-left"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
      
      {menuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setMenuOpen(false)} 
        />
      )}
    </div>
  );
}