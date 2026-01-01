import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
export function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#121212] border-b border-white/10">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex items-center gap-x-2 w-full"> 
           <h1 className="text-xl font-medium truncate">AIODocs</h1>
           <span className="text-muted-foreground">/</span>
           <span className="text-sm font-normal text-muted-foreground truncate">Workspace</span>
           <span className="text-muted-foreground">/</span>
           <span className="text-sm font-normal truncate">Document</span>
          </div>
        </Link>
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
            {["Features", "Pricing", "About"].map((item) => (
                <Link 
                    key={item} 
                    to={`/${item.toLowerCase()}`}
                    className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                    {item}
                </Link>
            ))}
        </div>
        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
             <Link 
                to="/dashboard" 
                className="hidden md:block text-sm font-medium text-gray-300 hover:text-white transition-colors"
             >
                Dashboard
             </Link>
             <Link 
                to="/login" 
                className="hidden md:block text-sm font-medium text-gray-300 hover:text-white transition-colors"
             >
                Log In
             </Link>
             <Link 
                to="/signup" 
                className="bg-[#2D2DFF] hover:bg-[#1F1FFF] text-white px-4 py-2 rounded-md text-sm font-medium transition-all shadow-[0_0_15px_rgba(45,45,255,0.3)] hover:shadow-[0_0_20px_rgba(45,45,255,0.5)]"
            >
                Get Started
             </Link>
        </div>
      </div>
    </nav>
  );
}