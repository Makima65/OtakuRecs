"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const trackVisit = async () => {
      // 1. ADMIN BYPASS
      if (localStorage.getItem("otaku_admin") === "true") {
        console.log("Admin detected. Analytics paused.");
        return;
      }

      // 2. Setup Session ID
      // By using || uuidv4(), TypeScript knows sessionId will NEVER be null
      const sessionId = localStorage.getItem("otaku_session_id") || uuidv4();
      localStorage.setItem("otaku_session_id", sessionId);

      // 3. Create a unique key for today PLUS the specific page
      const today = new Date().toISOString().split("T")[0];
      const uniqueKey = `${sessionId}_${today}_${pathname}`; 

      // 4. Send to Supabase
      await supabase.from("page_views").upsert(
        { 
          page_path: pathname, 
          session_id: sessionId,
          daily_unique_key: uniqueKey 
        },
        { onConflict: "daily_unique_key" }
      );
    };

    trackVisit();
  }, [pathname]);

  return null;
}