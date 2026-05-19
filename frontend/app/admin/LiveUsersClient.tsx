"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Radio } from "lucide-react";

// IMPORTANT: Only use the ANON key here since this runs in the browser
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LiveUsersClient() {
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    // Listen to the exact same channel we set up on the main page
    const channel = supabase.channel('live_users');

    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      // Count how many unique visitor IDs are currently broadcasting
      setLiveCount(Object.keys(presenceState).length);
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="bg-[#141414] border border-[#3ECF8E]/50 rounded-2xl p-6 flex items-center gap-4 relative overflow-hidden shadow-[0_0_15px_rgba(62,207,142,0.1)]">
      <div className="absolute top-0 left-0 w-full h-1 bg-[#3ECF8E] animate-pulse" />
      <div className="p-3 bg-[#3ECF8E]/20 rounded-xl text-[#3ECF8E] animate-pulse">
        <Radio size={28} />
      </div>
      <div>
        <p className="text-[#3ECF8E] text-sm font-bold uppercase tracking-wider mb-1">Live Right Now</p>
        <h2 className="text-3xl font-bold text-white">
          {liveCount} <span className="text-sm font-normal text-[#8B909A] lowercase tracking-normal">visitors online</span>
        </h2>
      </div>
    </div>
  );
}