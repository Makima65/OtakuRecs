"use client";
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Heart } from 'lucide-react';
import LoginButton from './LoginButton';

interface NavbarProps {
  onReset?: () => void;
}

export default function Navbar({ onReset }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#2E2E2E] bg-[#111111]/80 backdrop-blur supports-[backdrop-filter]:bg-[#111111]/60">
      {/* Reduced horizontal padding on mobile (px-4) to give more room */}
      <div className="max-w-5xl mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        
        {/* Logo and Brand Group */}
        <Link 
          href="/"
          className="flex items-center gap-2 sm:gap-3 group transition-all duration-300" 
          onClick={onReset}
        >
          {/* HD Logo Image - Size Increased */}
          <div className="flex-shrink-0 group-hover:scale-110 transition-transform duration-300 mt-1">
            <Image 
              src="/otaku_logo2.png" 
              alt="OtakuRecs Logo"
              width={44} // Increased from 36
              height={44} // Increased from 36
              className="object-contain" 
              quality={100} 
            />
          </div>

          {/* Text Design - Now responsive! Smaller on mobile (text-xl), bigger on desktop (sm:text-2xl) */}
          <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-[#3ECF8E] transition-all duration-300">
            OTAKURECS
          </span>
        </Link>

        {/* Right Navigation */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link 
            href="/mylist" 
            className="flex items-center gap-1.5 sm:gap-2 text-sm font-medium text-[#A0A0A0] hover:text-[#EDEDED] transition-colors"
          >
            <Heart className="w-4 h-4 text-[#3ECF8E]" />
            <span className="hidden sm:inline">My List</span> {/* Hides the text on tiny phones, shows just the heart, but keeps text on desktop! */}
          </Link>
          
          <LoginButton />
        </div>
      </div>
    </header>
  );
}