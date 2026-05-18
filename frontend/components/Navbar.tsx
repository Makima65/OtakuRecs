"use client";
import Link from 'next/link';
import Image from 'next/image'; // Import the Next.js Image component for performance
import { Sparkles, Heart } from 'lucide-react';
import LoginButton from './LoginButton';

interface NavbarProps {
  onReset?: () => void;
}

export default function Navbar({ onReset }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#2E2E2E] bg-[#111111]/80 backdrop-blur supports-[backdrop-filter]:bg-[#111111]/60">
      <div className="max-w-5xl mx-auto flex h-16 items-center justify-between px-6">
        
        {/* Logo and Brand Group */}
        <Link 
          href="/"
          className="flex items-center gap-3 group transition-all duration-300" // Use gap-3 for a cleaner look
          onClick={onReset}
        >
          {/* HD Logo Image with hover effect */}
          <div className="flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
            {/* When you're ready, create your high-definition logo file 
              (e.g., logo.png or logo.svg) and place it in your 
              project's /public folder. 
            */}
            <Image 
              src="/otaku_logo.png" // Path to your new HD logo file
              alt="OtakuRecs Logo"
              width={36} // Define the height/width for HD quality at a crisp size
              height={36}
              className="object-contain" // Keep the anime girl head proportioned perfectly
              quality={100} // Force highest quality rendering
            />
          </div>

          {/* The New "Letter Design": Green, Bold, and Blocky text as seen in your image */}
          <span className="font-extrabold text-3xl tracking-tight text-[#3ECF8E] transition-all duration-300">
            OTAKURECS
          </span>
        </Link>

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