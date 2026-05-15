import Link from "next/link";
import { Heart, Sparkles, ArrowRight } from "lucide-react";
import { SiX, SiInstagram, SiDiscord, SiGithub } from "react-icons/si";

export default function Footer() {
  return (
    <footer className="w-full bg-[#141414] border-t border-[#2E2E2E] mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-16">
          
          {/* Brand & Mission (Takes up more space) */}
          <div className="col-span-1 md:col-span-5 flex flex-col items-start">
            <Link href="/" className="text-2xl font-bold text-[#EDEDED] flex items-center gap-2 mb-4 group">
              OtakuRecs 
              <Sparkles className="w-5 h-5 text-[#3ECF8E] group-hover:text-white transition-colors" />
            </Link>
            <p className="text-[#8B909A] text-sm leading-relaxed max-w-sm mb-6">
              The ultimate AI-powered anime recommendation engine. Stop endlessly scrolling through databases and let our hybrid AI find your next obsession in seconds.
            </p>
            
<div className="flex gap-4">
              <Link href="#" className="text-[#8B909A] hover:text-[#EDEDED] transition-colors flex items-center justify-center">
                <SiX size={20} />
              </Link>
              <Link href="#" className="text-[#8B909A] hover:text-[#EDEDED] transition-colors flex items-center justify-center">
                <SiDiscord size={20} />
              </Link>
              <Link href="#" className="text-[#8B909A] hover:text-[#EDEDED] transition-colors flex items-center justify-center">
                <SiInstagram size={20} />
              </Link>
              <Link href="#" className="text-[#8B909A] hover:text-[#EDEDED] transition-colors flex items-center justify-center">
                <SiGithub size={20} />
              </Link>
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
              <li><Link href="#" className="text-[#8B909A] hover:text-[#EDEDED] text-sm transition-colors">Contact Us</Link></li>
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
            © {new Date().getFullYear()} OtakuRecs. Built by fans, for fans.
          </p>
          <p className="text-[#555555] text-xs flex items-center gap-1">
            Powered by <span className="text-[#8B909A] font-medium">Jikan API</span> & <span className="text-[#8B909A] font-medium">Pinecone AI</span>
          </p>
        </div>

      </div>
    </footer>
  );
}