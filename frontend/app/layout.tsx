import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// 1. Import your Navbar! 
// (Make sure this path matches exactly where your Navbar file is saved)
import Navbar from "@/components/Navbar"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OtakuRecs", // Updated from "Create Next App"
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
      {/* 2. Added your dark theme colors to the body so it applies everywhere */}
      <body className="min-h-full flex flex-col bg-[#141414] text-[#EDEDED]">
        
        {/* 3. The Navbar goes right here! It will now show on every page. */}
        <Navbar />

        {/* 4. Wrap children in a main tag with flex-1 so your content fills the screen */}
        <main className="flex-1">
          {children}
        </main>
        
      </body>
    </html>
  );
}