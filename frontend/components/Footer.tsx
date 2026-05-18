import Link from "next/link";
import Image from "next/image";
import { Heart, Sparkles } from "lucide-react";
import { SiDiscord } from "react-icons/si";

export default function Footer() {
  return (
    <footer className="w-full bg-[#141414] border-t border-[#2E2E2E] mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-16">
          
          {/* Brand & Mission */}
          <div className="col-span-1 md:col-span-5 flex flex-col items-start">
            
            {/* New Logo + Brand Group */}
            <Link href="/" className="flex items-center gap-4 mb-6 group w-fit">
              {/* HD Logo Image */}
              <div className="flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Image 
                  src="/otaku_logo2.png" 
                  alt="OtakuRecs Logo"
                  width={56} 
                  height={56}
                  className="object-contain"
                  quality={100}
                />
              </div>
              
              {/* Stacked Text Layout */}
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-1.5">
                  {/* Standard Casing as requested, with green styling */}
                  <span className="text-3xl font-extrabold text-[#3ECF8E] tracking-tight transition-colors">
                    OtakuRecs
                  </span>
                  <Sparkles className="w-5 h-5 text-[#3ECF8E] group-hover:text-white transition-colors mt-1" />
                </div>
                <span className="text-xs font-bold tracking-[0.25em] text-[#EDEDED] mt-0.5">
                  SINCE 2026
                </span>
              </div>
            </Link>

            <p className="text-[#8B909A] text-sm leading-relaxed max-w-sm mb-6">
              The ultimate AI-powered anime recommendation engine. Stop endlessly scrolling through databases and let our hybrid AI find your next obsession in seconds.
            </p>
            
            {/* Custom Animated Socials */}
            <div className="flex flex-wrap gap-4 mt-2">
              
              {/* LinkedIn */}
              <a 
                href="https://www.linkedin.com/in/ralph-silva-922996325/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="relative group flex justify-center items-center p-3 rounded-xl drop-shadow-xl bg-[#0077b5] text-white font-semibold hover:translate-y-3 hover:rounded-[50%] transition-all duration-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z" />
                </svg>
                <span className="absolute opacity-0 group-hover:opacity-100 group-hover:text-[#EDEDED] font-bold text-sm group-hover:-translate-y-12 transition-all duration-500 pointer-events-none">
                  LinkedIn
                </span>
              </a>

              {/* GitHub */}
              <a 
                href="https://github.com/Makima65" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="relative group flex justify-center items-center p-3 rounded-xl drop-shadow-xl bg-[#24292e] text-white font-semibold hover:translate-y-3 hover:rounded-[50%] transition-all duration-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
                </svg>
                <span className="absolute opacity-0 group-hover:opacity-100 group-hover:text-[#EDEDED] font-bold text-sm group-hover:-translate-y-12 transition-all duration-500 pointer-events-none">
                  GitHub
                </span>
              </a>

              {/* Facebook */}
              <a 
                href="https://www.facebook.com/ralph.silva.982" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="relative group flex justify-center items-center p-3 rounded-xl drop-shadow-xl bg-[#1877f2] text-white font-semibold hover:translate-y-3 hover:rounded-[50%] transition-all duration-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z" />
                </svg>
                <span className="absolute opacity-0 group-hover:opacity-100 group-hover:text-[#EDEDED] font-bold text-sm group-hover:-translate-y-12 transition-all duration-500 pointer-events-none">
                  Facebook
                </span>
              </a>

              {/* Instagram */}
              <a 
                href="https://www.instagram.com/chryslerr_04/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="relative group flex justify-center items-center p-3 rounded-xl drop-shadow-xl bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] text-white font-semibold hover:translate-y-3 hover:rounded-[50%] transition-all duration-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334" />
                </svg>
                <span className="absolute opacity-0 group-hover:opacity-100 group-hover:text-[#EDEDED] font-bold text-sm group-hover:-translate-y-12 transition-all duration-500 pointer-events-none">
                  Instagram
                </span>
              </a>

              {/* TikTok */}
              <a 
                href="https://www.tiktok.com/@chrysler_65" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="relative group flex justify-center items-center p-3 rounded-xl drop-shadow-xl bg-black text-white font-semibold hover:translate-y-3 hover:rounded-[50%] transition-all duration-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3V0Z" />
                </svg>
                <span className="absolute opacity-0 group-hover:opacity-100 group-hover:text-[#EDEDED] font-bold text-sm group-hover:-translate-y-12 transition-all duration-500 pointer-events-none">
                  TikTok
                </span>
              </a>

              {/* Discord (Custom Matched) */}
              <a 
                href="#" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="relative group flex justify-center items-center p-3 rounded-xl drop-shadow-xl bg-[#5865F2] text-white font-semibold hover:translate-y-3 hover:rounded-[50%] transition-all duration-500"
              >
                <SiDiscord size={24} />
                <span className="absolute opacity-0 group-hover:opacity-100 group-hover:text-[#EDEDED] font-bold text-sm group-hover:-translate-y-12 transition-all duration-500 pointer-events-none">
                  Discord
                </span>
              </a>

            </div>
          </div>

          {/* Navigation Links */}
          <div className="col-span-1 md:col-span-2 md:col-start-7">
            <h3 className="text-[#EDEDED] font-semibold text-sm mb-5 uppercase tracking-wider">Navigation</h3>
            <ul className="space-y-3">
              <li><Link href="/" className="text-[#8B909A] hover:text-[#3ECF8E] text-sm transition-colors">Home</Link></li>
              <li><Link href="#" className="text-[#8B909A] hover:text-[#3ECF8E] text-sm transition-colors">AI Search</Link></li>
              <li><Link href="#" className="text-[#8B909A] hover:text-[#3ECF8E] text-sm transition-colors">Browse Genres</Link></li>
              <li><Link href="#" className="text-[#8B909A] hover:text-[#3ECF8E] text-sm transition-colors">Top Rated</Link></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-[#EDEDED] font-semibold text-sm mb-5 uppercase tracking-wider">Legal</h3>
            <ul className="space-y-3">
              <li><Link href="#" className="text-[#8B909A] hover:text-[#EDEDED] text-sm transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="text-[#8B909A] hover:text-[#EDEDED] text-sm transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-[#8B909A] hover:text-[#EDEDED] text-sm transition-colors">Cookie Policy</Link></li>
              <li><a href="mailto:your.email@gmail.com" className="text-[#8B909A] hover:text-[#EDEDED] text-sm transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Support CTA */}
          <div className="col-span-1 md:col-span-2 flex flex-col items-start md:items-end">
            <h3 className="text-[#EDEDED] font-semibold text-sm mb-5 uppercase tracking-wider w-full md:text-right">Support Us</h3>
            <div className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-4 flex flex-col gap-3">
              <p className="text-xs text-[#8B909A] leading-relaxed">
                OtakuRecs is an ad-free passion project. Help keep the servers running!
              </p>
              <button className="w-full flex items-center justify-center gap-2 bg-[#F96854]/10 hover:bg-[#F96854] text-[#F96854] hover:text-white border border-[#F96854]/20 hover:border-[#F96854] px-3 py-2 rounded-lg text-sm font-medium transition-all group">
                <Heart className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                Patreon
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Copyright Bar */}
        <div className="border-t border-[#2E2E2E] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#555555] text-xs">
            © {new Date().getFullYear()} OtakuRecs. Created by Ralph Chrysler Silva.
          </p>
          <p className="text-[#555555] text-xs flex items-center gap-1">
            Powered by <span className="text-[#8B909A] font-medium">Jikan API</span> & <span className="text-[#8B909A] font-medium">Pinecone AI</span>
          </p>
        </div>

      </div>
    </footer>
  );
}