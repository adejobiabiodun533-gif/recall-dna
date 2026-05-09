import { Sparkles, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative py-16 overflow-hidden bg-[#0a0c10]">
      {/* Cinematic Background Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[150px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-black text-white tracking-tighter">
              Recall<span className="text-blue-500">DNA</span>
            </span>
          </div>

          <p className="text-gray-400 text-sm font-medium mb-8 max-w-md text-center leading-relaxed">
            Revolutionizing how students master Biochemistry through the power of AI-driven recall and synthesis.
          </p>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent mb-8"></div>

          <div className="flex flex-col md:flex-row items-center justify-between w-full gap-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-widest">
              <span>Created with</span>
              <Heart className="h-3 w-3 text-red-500 fill-red-500 animate-pulse" />
              <span>by</span>
              <span className="text-gray-300">Adejobi Abiodun Oluwatunmise</span>
            </div>

            <p className="text-xs text-gray-600 font-medium">
              © {new Date().getFullYear()} RecallDNA. Built for the future of learning.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
