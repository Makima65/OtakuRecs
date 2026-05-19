"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

// Standard browser client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    } else {
      // Upon success, refresh the router so the layout re-runs the security check
      router.refresh();
      router.push("/admin");
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center p-4 font-sans text-[#EDEDED]">
      <div className="w-full max-w-md bg-[#141414] border border-[#2E2E2E] rounded-2xl p-8 shadow-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-[#F96854]/10 rounded-full text-[#F96854] mb-4">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-2xl font-bold">Restricted Access</h1>
          <p className="text-[#8B909A] text-sm mt-1">Admin login required.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-sm rounded-lg text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#8B909A] mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#3ECF8E] transition-colors"
              placeholder="boss@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#8B909A] mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#3ECF8E] transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black font-bold py-3 rounded-lg mt-6 transition-colors disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Access Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}