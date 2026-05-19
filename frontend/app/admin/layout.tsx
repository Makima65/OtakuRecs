import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Await the cookies right at the top
  const cookieStore = await cookies();

  // 2. Initialize Supabase using the modern getAll/setAll standard
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This error is expected and safe to ignore here.
          }
        },
      },
    }
  );

  // 3. Get the user session securely
  const { data: { user } } = await supabase.auth.getUser();

  // 4. Check against your Admin Email (set this in .env.local)
  const isAdmin = user?.email === process.env.ADMIN_EMAIL;

  // 5. Protection Logic
  if (!isAdmin) {
    // IMPORTANT: Ensure your login page is physically located at `app/admin-login/page.tsx`
    // If it is inside `app/admin/...`, this layout will protect it and cause an infinite redirect loop.
    redirect("/admin-login");
  }

  return <>{children}</>;
}