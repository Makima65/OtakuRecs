import { Users, Activity, ShieldAlert, MoreVertical, MousePointer2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

// 1. Initialize the Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Helper function to format the dates nicely
function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
}

export default async function AdminDashboard() {
  // 2. Fetch all data from Supabase in parallel
  const [
    { data: authData, error: authError },
    { data: viewsData },
    { count: searchCount }
  ] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers(),
    supabaseAdmin.from("page_views").select("session_id"),
    supabaseAdmin.from("search_logs").select("*", { count: 'exact', head: true })
  ]);
  
  if (authError) {
    console.error("Error fetching users:", authError);
  }

  const users = authData?.users || [];

  // 3. Calculate Real Stats
  const totalUsers = users.length;
  
  // Calculate users active in the last 24 hours
  const now = new Date();
  const activeToday = users.filter((u) => {
    if (!u.last_sign_in_at) return false;
    const lastSignIn = new Date(u.last_sign_in_at);
    return (now.getTime() - lastSignIn.getTime()) < 24 * 60 * 60 * 1000;
  }).length;

  // Calculate unique visitors using a Set to filter out duplicate session IDs
  const uniqueVisitors = new Set(viewsData?.map(v => v.session_id)).size;
  
  // Real search count from the database
  const totalSearches = searchCount || 0;

  // For the table, let's grab the 10 most recent users
  const recentUsers = users
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-[#111111] text-[#EDEDED] p-8 font-sans pb-24">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-[#3ECF8E] tracking-tight">Admin Overview</h1>
            <p className="text-[#8B909A] text-sm mt-1">Welcome back, Boss. Here is your live Supabase data.</p>
          </div>
          <Link href="/" className="px-4 py-2 bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg text-sm hover:text-[#3ECF8E] transition-colors">
            Back to Site
          </Link>
        </div>

        {/* Top Stats Cards - Updated to a 4-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          
          <div className="bg-[#141414] border border-[#2E2E2E] rounded-2xl p-6 flex items-center gap-4">
            <div className="p-3 bg-[#3ECF8E]/10 rounded-xl text-[#3ECF8E]">
              <Users size={28} />
            </div>
            <div>
              <p className="text-[#8B909A] text-sm font-medium">Total Accounts</p>
              <h2 className="text-3xl font-bold">{totalUsers}</h2>
            </div>
          </div>

          <div className="bg-[#141414] border border-[#2E2E2E] rounded-2xl p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
              <MousePointer2 size={28} />
            </div>
            <div>
              <p className="text-[#8B909A] text-sm font-medium">Unique Visitors</p>
              <h2 className="text-3xl font-bold">{uniqueVisitors}</h2>
            </div>
          </div>

          <div className="bg-[#141414] border border-[#2E2E2E] rounded-2xl p-6 flex items-center gap-4">
            <div className="p-3 bg-[#F96854]/10 rounded-xl text-[#F96854]">
              <Activity size={28} />
            </div>
            <div>
              <p className="text-[#8B909A] text-sm font-medium">Active Today</p>
              <h2 className="text-3xl font-bold">{activeToday}</h2>
            </div>
          </div>

          <div className="bg-[#141414] border border-[#2E2E2E] rounded-2xl p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
              <ShieldAlert size={28} />
            </div>
            <div>
              <p className="text-[#8B909A] text-sm font-medium">Searches Run</p>
              <h2 className="text-3xl font-bold">{totalSearches}</h2>
            </div>
          </div>
        </div>

        {/* Recent Users Table */}
        <div className="bg-[#141414] border border-[#2E2E2E] rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-[#2E2E2E]">
            <h3 className="font-semibold text-lg">Recent Signups</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1A1A1A] text-[#8B909A] text-sm">
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Provider</th>
                  <th className="px-6 py-3 font-medium">Joined</th>
                  <th className="px-6 py-3 font-medium">Last Login</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentUsers.map((user) => (
                  <tr key={user.id} className="border-b border-[#2E2E2E] hover:bg-[#1A1A1A]/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{user.email}</td>
                    <td className="px-6 py-4 text-[#8B909A] capitalize">{user.app_metadata.provider || 'Email'}</td>
                    <td className="px-6 py-4 text-[#8B909A]">{timeAgo(user.created_at)}</td>
                    <td className="px-6 py-4 text-[#8B909A]">
                      {user.last_sign_in_at ? timeAgo(user.last_sign_in_at) : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-[#8B909A] hover:text-white transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {recentUsers.length === 0 && (
              <div className="p-8 text-center text-[#8B909A]">
                No users found yet. Go sign up!
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}