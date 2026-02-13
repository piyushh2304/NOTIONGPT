import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { SearchBar } from "@/components/search-bar";

export function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#121212] border-b border-white/10">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
           <div className="p-1.5 rounded-lg bg-orange-600/10">
              <Zap className="h-5 w-5 text-orange-500" />
           </div>
           <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">AccessEdu</h1>
        </Link>
        
        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <SearchBar className="z-50" />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 shrink-0">
             <Link 
                to="/dashboard" 
                className="hidden md:block text-sm font-medium text-gray-400 hover:text-white transition-colors"
             >
                Dashboard
             </Link>
             <Link 
                to="/login" 
                className="hidden md:block text-sm font-medium text-gray-400 hover:text-white transition-colors"
             >
                Sign In
             </Link>
             <Link 
                to="/signup" 
                className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            >
                Create Account
            </Link>
        </div>
      </div>
    </nav>
  );
}
