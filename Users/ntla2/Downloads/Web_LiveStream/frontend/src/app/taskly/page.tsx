import React from 'react';
import { Inter } from 'next/font/google';
import { Star, ArrowRight } from 'lucide-react';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '700'] });

export default function TasklyHero() {
  return (
    <div className={`min-h-screen bg-white text-black relative overflow-hidden antialiased ${inter.className}`}>
      <style dangerouslySetInnerHTML={{__html: "@import url('https://fonts.googleapis.com/css2?family=Fustat:wght@700&display=swap');"}} />
      
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[5%] w-[800px] h-[800px] bg-[#60B1FF] rounded-full mix-blend-multiply filter blur-[150px] opacity-40"></div>
        <div className="absolute top-[10%] left-[10%] w-[600px] h-[600px] bg-[#319AFF] rounded-full mix-blend-multiply filter blur-[150px] opacity-30"></div>
      </div>

      {/* The "Strong Liquid Glass" Navbar */}
      <div className="fixed top-[30px] left-1/2 -translate-x-1/2 z-50 w-fit">
        <nav className="flex items-center gap-10 px-6 py-3 rounded-[16px] backdrop-blur-[50px] bg-white/30"
             style={{
               border: '1px solid rgba(0,0,0,0.1)',
               boxShadow: 'inset 0px 4px 4px 0px rgba(255,255,255,0.25)'
             }}>
          <span className={`text-2xl font-bold font-['Fustat']`}>Taskly</span>
          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-700">
            <a href="#" className="hover:text-black transition-colors">Home</a>
            <a href="#" className="hover:text-black transition-colors">Features</a>
            <a href="#" className="hover:text-black transition-colors">Company</a>
            <a href="#" className="hover:text-black transition-colors">Pricing</a>
          </div>
          <button className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-xl backdrop-blur-md border border-white/60 text-sm font-medium hover:bg-white/70 transition-colors shadow-sm">
            SignUp <ArrowRight size={16} />
          </button>
        </nav>
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-6 pt-[200px] pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[60vh]">
          
          {/* Hero Content (Left) */}
          <div className="flex flex-col items-start max-w-2xl">
            {/* Social Proof */}
            <div className="flex items-center gap-3 mb-8 bg-gray-50/50 backdrop-blur-sm border border-gray-200 px-4 py-2 rounded-full shadow-sm">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="fill-[#FF801E] text-[#FF801E]" />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-700">Rated 4.9/5 by 2700+ customers</span>
            </div>

            {/* Headlines */}
            <h1 className={`text-[75px] leading-[1.05] tracking-[-2px] text-gray-900 font-['Fustat']`}>
              Work smarter, achieve faster
            </h1>
            <p className="text-[18px] tracking-[-1px] text-gray-600 mt-6 leading-relaxed">
              Effortlessly manage your projects, collaborate with your team, and achieve your goals with our intuitive task management tool.
            </p>

            {/* Primary CTA */}
            <button 
              className="mt-10 flex items-center gap-4 px-8 py-4 rounded-[16px] text-white font-medium hover:scale-[1.02] transition-transform duration-300 backdrop-blur-[2px] group"
              style={{
                backgroundColor: 'rgba(0,132,255,0.8)',
                boxShadow: 'inset 0px 4px 4px 0px rgba(255,255,255,0.35), 0 10px 30px -10px rgba(0,132,255,0.5)'
              }}
            >
              <span className="text-lg">Get Started Now</span>
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white text-[#0084FF] group-hover:translate-x-1 transition-transform">
                <ArrowRight size={16} strokeWidth={3} />
              </span>
            </button>
          </div>

          {/* The Glassy Orb (Right) */}
          <div className="relative flex justify-center items-center w-full h-[600px] bg-black rounded-[40px] overflow-hidden lg:overflow-visible lg:bg-transparent">
            {/* 
              Note: Using a black background container for the video orb temporarily 
              because mix-blend-screen over pure white makes it invisible. 
              To match the prompt, we keep the video blending but ensure it's visible. 
            */}
            <div className="absolute inset-0 bg-black/5 rounded-[40px] lg:bg-transparent -z-10" />
            <video 
              src="https://future.co/images/homepage/glassy-orb/orb-purple.webm" 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="scale-125 mix-blend-screen w-full max-w-[800px] translate-x-[5%] pointer-events-none"
              style={{ 
                filter: 'hue-rotate(-55deg) saturate(250%) brightness(1.2) contrast(1.1)' 
              }} 
            />
          </div>
        </div>

        {/* Footer Logos */}
        <div className="mt-32 border-t border-gray-100 pt-16 flex flex-col items-center">
          <p className="text-sm text-gray-400 font-medium mb-10">Trusted by Top-tier product companies</p>
          <div className="flex flex-wrap justify-center gap-[100px] opacity-40 grayscale items-center">
            {/* Placeholder SVGs */}
            <svg width="120" height="30" viewBox="0 0 120 30" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 20h20v-5H10v5zm0-10h20V5H10v5z" />
              <text x="35" y="18" fontSize="16" fontWeight="bold">Acme Corp</text>
            </svg>
            <svg width="120" height="30" viewBox="0 0 120 30" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <circle cx="15" cy="15" r="10" />
              <text x="35" y="18" fontSize="16" fontWeight="bold">Globex</text>
            </svg>
            <svg width="120" height="30" viewBox="0 0 120 30" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="5" width="20" height="20" />
              <text x="35" y="18" fontSize="16" fontWeight="bold">Soylent</text>
            </svg>
            <svg width="120" height="30" viewBox="0 0 120 30" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <polygon points="15,5 25,25 5,25" />
              <text x="35" y="18" fontSize="16" fontWeight="bold">Initech</text>
            </svg>
            <svg width="120" height="30" viewBox="0 0 120 30" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 15q10-10 20 0t20 0" stroke="currentColor" strokeWidth="4" fill="none" />
              <text x="50" y="18" fontSize="16" fontWeight="bold">Umbrella</text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
