// frontend/components/SearchBar.tsx
import { Search, Loader2, SlidersHorizontal, Sparkles } from "lucide-react";

interface SearchBarProps {
  query: string;
  setQuery: (query: string) => void;
  searchVibe: () => void;
  searchName: () => void;
  loading: boolean;
  showFilters: boolean;
  setShowFilters: (val: boolean) => void;
  hasActiveFilters: boolean;
}

export default function SearchBar({ 
  query, 
  setQuery, 
  searchVibe, 
  searchName, 
  loading, 
  showFilters,
  setShowFilters,
  hasActiveFilters
}: SearchBarProps) {
  
  return (
    <div className="w-full">
      {/* Search Input & Buttons Row */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        
        {/* Input Container */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#707070]" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchName()}
            placeholder="Search an anime title, or describe a vibe..." 
            className="flex h-10 w-full rounded-md border border-[#3E3E3E] bg-[#1A1A1A] px-9 py-2 text-sm text-[#EDEDED] shadow-sm transition-all placeholder:text-[#707070] hover:border-[#555555] focus-visible:outline-none focus-visible:border-[#3ECF8E] focus-visible:ring-1 focus-visible:ring-[#3ECF8E]"
          />
        </div>
        
        {/* Buttons Container - Wraps neatly on mobile */}
        <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
          
          {/* Filter Toggle Button (Secondary) */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative inline-flex h-10 px-3 shrink-0 items-center justify-center rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3ECF8E] ${
              showFilters || hasActiveFilters
                ? 'bg-[#1A1A1A] border-[#3ECF8E]/50 text-[#3ECF8E]' 
                : 'border-[#3E3E3E] bg-[#2A2A2A] text-[#A0A0A0] hover:bg-[#333333] hover:text-[#EDEDED]'
            }`}
            title="Toggle Filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {/* Active dot indicator */}
            {!showFilters && hasActiveFilters && (
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[#3ECF8E]"></span>
            )}
          </button>

          {/* Normal Search Button (Secondary) */}
          <button 
            onClick={searchName}
            disabled={loading}
            className="flex-1 sm:flex-none inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#3E3E3E] bg-[#2A2A2A] px-4 text-sm font-medium text-[#EDEDED] shadow-sm transition-colors hover:bg-[#333333] hover:border-[#555555] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3ECF8E] disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-[#A0A0A0]" /> : <Search className="h-4 w-4 text-[#A0A0A0]" />}
            <span>Search</span>
          </button>

          {/* AI Vibe Search Button (Primary / Supabase Green) */}
          <button 
            onClick={searchVibe}
            disabled={loading}
            className="flex-1 sm:flex-none inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#24B47E] px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#1E9A6A] border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ECF8E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1C1C1C] disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Sparkles className="h-4 w-4" />}
            <span>Vibe Search</span>
          </button>
        </div>
      </div>
    </div>
  );
}