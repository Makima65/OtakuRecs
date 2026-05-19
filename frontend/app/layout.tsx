import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// 1. Import your UI components
import Navbar from "@/components/Navbar"; 
import Footer from "@/components/Footer"; 

// 2. Import the Tracker we built!
import AnalyticsTracker from "@/components/AnalyticsTracker"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OtakuRecs",
  description: "Your favorite anime character tracking app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#141414] text-[#EDEDED]">
        
        {/* 3. The Invisible Tracker 
           This doesn't show anything on the screen, but it handles 
           all the Supabase 'page_view' logic and your admin bypass.
        */}
        <AnalyticsTracker />

        <Navbar />

        <main className="flex-1">
          {children}
        </main>
        
        <Footer />
        
      </body>
    </html>
  );
}