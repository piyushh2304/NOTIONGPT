import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  className?: string;
  placeholder?: string;
}

export function SearchBar({ className, placeholder = "What do you want learn..." }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/dashboard/search?q=${encodeURIComponent(query)}`);
      setQuery("");
    }
  };

  return (
    <form onSubmit={handleSearch} className={cn("relative w-full group", className)}>
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-orange-500 transition-colors" />
      </div>
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full h-10 pl-10 pr-12 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus-visible:ring-orange-500/50 focus-visible:border-orange-500/50 transition-all shadow-none"
      />
      {query && (
        <button
          type="submit"
          className="absolute inset-y-0 right-1 px-3 flex items-center justify-center text-xs font-medium text-orange-500 hover:text-orange-400 z-30"
        >
          Search
        </button>
      )}
    </form>
  );
}
