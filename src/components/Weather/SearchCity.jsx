import { Search, MapPin, Sparkles } from "lucide-react";
import { useState } from "react";

export default function SearchCity({ onSearch }) {
  const [searchInput, setSearchInput] = useState("");

  const quickCities = [
    "London",
    "New York",
    "Tokyo",
    "Dubai",
    "Paris",
    "Sydney",
    "Beirut",
    "Toronto",
  ];

  const handleSearch = (e) => {
    e.preventDefault();

    const city = searchInput.trim();

    if (!city) return;

    onSearch(city);
  };

  return (
    <div className="mb-8">
      {/* Search Box */}
      <form
        onSubmit={handleSearch}
        className="
          relative overflow-hidden
          rounded-3xl
          border border-white/10
          bg-slate-900/70
          backdrop-blur-xl
          p-3
          shadow-2xl
        "
      >
        <div className="flex flex-col md:flex-row gap-3">
          {/* Input */}
          <div className="relative flex-1">
            <Search
              size={20}
              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search any city worldwide..."
              className="
                w-full h-14 rounded-2xl
                bg-white/5
                border border-white/10
                pl-14 pr-4
                text-white
                placeholder:text-slate-500
                outline-none
                focus:border-blue-500/40
                focus:bg-white/[0.07]
                transition-all
              "
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            className="
              h-14 px-8 rounded-2xl
              bg-gradient-to-r from-blue-500 to-cyan-500
              hover:from-blue-400 hover:to-cyan-400
              text-white font-bold
              shadow-lg shadow-blue-500/20
              transition-all duration-300
              hover:scale-[1.02]
              flex items-center justify-center gap-2
            "
          >
            <Sparkles size={18} />
            Search
          </button>
        </div>
      </form>

      {/* Quick Cities */}
      <div className="mt-5 flex flex-wrap gap-3">
        {quickCities.map((city) => (
          <button
            key={city}
            onClick={() => onSearch(city)}
            className="
              group flex items-center gap-2
              px-4 py-2 rounded-2xl
              bg-white/5
              border border-white/10
              text-slate-300
              hover:bg-blue-500/10
              hover:border-blue-500/20
              hover:text-white
              transition-all
            "
          >
            <MapPin
              size={15}
              className="text-blue-400 group-hover:scale-110 transition-transform"
            />

            <span className="text-sm font-medium">
              {city}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}