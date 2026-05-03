"use client";
import Link from 'next/link';
import { Sparkles, Heart } from 'lucide-react';
import LoginButton from './LoginButton';

interface NavbarProps {
  onReset?: () => void;
}

export default function Navbar({ onReset }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#2E2E2E] bg-[#111111]/80 backdrop-blur supports-[backdrop-filter]:bg-[#111111]/60">
      <div className="max-w-5xl mx-auto flex h-16 items-center justify-between px-6">
        
        {/* Logo */}
        <div 
          className="flex items-center gap-2 font-bold text-xl tracking-tight text-[#EDEDED] hover:text-[#3ECF8E] transition-colors cursor-pointer" 
          onClick={onReset}
        >
          <Sparkles className="h-5 w-5 text-[#3ECF8E]" />
          OtakuRecs
        </div>

        {/* Right Navigation */}
        <div className="flex items-center gap-6">
          <Link 
            href="/mylist" 
            className="flex items-center gap-2 text-sm font-medium text-[#A0A0A0] hover:text-[#EDEDED] transition-colors"
          >
            <Heart className="w-4 h-4 text-[#3ECF8E]" />
            My List
          </Link>
          
          {/* Your newly updated Login Button */}
          <LoginButton />
        </div>
      </div>
    </header>
  );
}