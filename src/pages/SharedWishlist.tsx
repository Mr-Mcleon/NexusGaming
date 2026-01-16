import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSharedWishlist } from "@/hooks/useWishlistShare";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, User, DollarSign, TrendingDown, Gamepad2, ArrowUpDown, ChevronDown, Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SortOption = "name-asc" | "name-desc" | "price-low" | "price-high" | "discount";
import { toast } from "sonner";

// Helper to update Open Graph meta tags
const updateMetaTags = (tags: Record<string, string>) => {
  Object.entries(tags).forEach(([property, content]) => {
    let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
    if (!element) {
      element = document.createElement("meta");
      element.setAttribute("property", property);
      document.head.appendChild(element);
    }
    element.setAttribute("content", content);
  });
};

const updateTwitterTags = (tags: Record<string, string>) => {
  Object.entries(tags).forEach(([name, content]) => {
    let element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
    if (!element) {
      element = document.createElement("meta");
      element.setAttribute("name", name);
      document.head.appendChild(element);
    }
    element.setAttribute("content", content);
  });
};

// Social media brand icons as simple SVG components
const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const SharedWishlist = () => {
  const { token } = useParams<{ token: string }>();
  const { data: wishlist, isLoading, error } = useSharedWishlist(token || null);

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const ownerUsername = wishlist?.[0]?.owner_username || "Anonymous";
  const gameCount = wishlist?.length || 0;
  const shareText = `Check out ${ownerUsername}'s gaming wishlist with ${gameCount} games!`;
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  
  // Calculate statistics
  const stats = useMemo(() => {
    if (!wishlist || wishlist.length === 0) {
      return { totalValue: 0, totalSaleValue: 0, totalSavings: 0, gamesOnSale: 0, genreBreakdown: [], allGenres: [] as string[], minPrice: 0, maxPrice: 100 };
    }
    
    const totalValue = wishlist.reduce((sum, item) => sum + (item.game_price || 0), 0);
    const totalSaleValue = wishlist.reduce((sum, item) => sum + (item.game_sale_price ?? item.game_price ?? 0), 0);
    const totalSavings = totalValue - totalSaleValue;
    const gamesOnSale = wishlist.filter(item => item.game_sale_price !== null && item.game_sale_price < (item.game_price || 0)).length;
    
    // Calculate price range
    const prices = wishlist.map(item => item.game_sale_price ?? item.game_price ?? 0);
    const minPrice = Math.floor(Math.min(...prices));
    const maxPrice = Math.ceil(Math.max(...prices));
    
    // Calculate genre breakdown
    const genreCounts: Record<string, number> = {};
    wishlist.forEach(item => {
      item.game_genres?.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });
    
    const genreBreakdown = Object.entries(genreCounts)
      .map(([genre, count]) => ({ genre, count, percentage: Math.round((count / wishlist.length) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Get all unique genres sorted alphabetically
    const allGenres = Object.keys(genreCounts).sort();
    
    return { totalValue, totalSaleValue, totalSavings, gamesOnSale, genreBreakdown, allGenres, minPrice, maxPrice };
  }, [wishlist]);
  
  const { totalValue, totalSavings, gamesOnSale, genreBreakdown, allGenres, minPrice, maxPrice } = stats;

  // Filter and sort wishlist based on search, genre filter, price range, and sort options
  const filteredAndSortedWishlist = useMemo(() => {
    if (!wishlist) return [];
    
    // First filter by search query
    let filtered = searchQuery.trim()
      ? wishlist.filter(item => 
          item.game_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.game_genres?.some(genre => genre.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : wishlist;
    
    // Then filter by selected genre
    if (selectedGenre) {
      filtered = filtered.filter(item => 
        item.game_genres?.includes(selectedGenre)
      );
    }
    
    // Then filter by price range
    if (priceRange) {
      filtered = filtered.filter(item => {
        const effectivePrice = item.game_sale_price ?? item.game_price ?? 0;
        return effectivePrice >= priceRange[0] && effectivePrice <= priceRange[1];
      });
    }
    
    // Then sort
    return [...filtered].sort((a, b) => {
      const aPrice = a.game_sale_price ?? a.game_price ?? 0;
      const bPrice = b.game_sale_price ?? b.game_price ?? 0;
      const aDiscount = a.game_price && a.game_sale_price !== null && a.game_sale_price < a.game_price
        ? ((a.game_price - a.game_sale_price) / a.game_price) * 100
        : 0;
      const bDiscount = b.game_price && b.game_sale_price !== null && b.game_sale_price < b.game_price
        ? ((b.game_price - b.game_sale_price) / b.game_price) * 100
        : 0;
      
      switch (sortOption) {
        case "name-asc":
          return a.game_title.localeCompare(b.game_title);
        case "name-desc":
          return b.game_title.localeCompare(a.game_title);
        case "price-low":
          return aPrice - bPrice;
        case "price-high":
          return bPrice - aPrice;
        case "discount":
          return bDiscount - aDiscount;
        default:
          return 0;
      }
    });
  }, [wishlist, sortOption, searchQuery, selectedGenre, priceRange]);
  
  // Check if any filters are active
  const hasActiveFilters = searchQuery || selectedGenre || priceRange;

  const sortLabels: Record<SortOption, string> = {
    "name-asc": "Name (A-Z)",
    "name-desc": "Name (Z-A)",
    "price-low": "Price (Low to High)",
    "price-high": "Price (High to Low)",
    "discount": "Biggest Discount",
  };
  
  // Get first game cover for OG image
  const ogImage = wishlist?.[0]?.game_cover_image_url || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200";
  
  // Update Open Graph meta tags when wishlist data is available
  useEffect(() => {
    if (wishlist && wishlist.length > 0) {
      const title = `${ownerUsername}'s Gaming Wishlist`;
      const description = `${gameCount} games on their wishlist worth $${totalValue.toFixed(2)}${totalSavings > 0 ? ` - Save $${totalSavings.toFixed(2)} with current sales!` : ""}. Games include: ${wishlist.slice(0, 3).map(g => g.game_title).join(", ")}${wishlist.length > 3 ? "..." : ""}`;
      
      // Update page title
      document.title = title;
      
      // Update Open Graph tags
      updateMetaTags({
        "og:title": title,
        "og:description": description,
        "og:image": ogImage,
        "og:url": currentUrl,
        "og:type": "website",
        "og:site_name": "GameVault",
      });
      
      // Update Twitter Card tags
      updateTwitterTags({
        "twitter:card": "summary_large_image",
        "twitter:title": title,
        "twitter:description": description,
        "twitter:image": ogImage,
      });
    }
    
    // Cleanup on unmount
    return () => {
      document.title = "GameVault";
    };
  }, [wishlist, ownerUsername, gameCount, totalValue, totalSavings, ogImage, currentUrl]);
  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
  };

  const handleShare = (platform: string) => {
    if (platform === "discord" || platform === "instagram") {
      navigator.clipboard.writeText(`${shareText}\n${currentUrl}`);
      toast.success(`Link copied! Paste it in ${platform === "discord" ? "Discord" : "Instagram"}`);
    } else {
      window.open(shareLinks[platform as keyof typeof shareLinks], "_blank", "width=600,height=400");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto p-6">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-6 w-48 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !wishlist || wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Wishlist Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This wishlist doesn't exist or is no longer shared.
          </p>
          <Link to="/auth">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <User className="w-4 h-4" />
                <span className="text-sm">{ownerUsername}'s</span>
              </div>
              <h1 className="font-display text-2xl font-bold flex items-center gap-2">
                <Heart className="w-6 h-6 text-destructive fill-current" />
                Wishlist
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {/* Social Share Buttons */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">Share:</span>
                <button
                  onClick={() => handleShare("twitter")}
                  className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  title="Share on Twitter/X"
                >
                  <TwitterIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleShare("facebook")}
                  className="p-2 rounded-lg bg-secondary/50 hover:bg-[#1877F2] hover:text-white text-muted-foreground transition-colors"
                  title="Share on Facebook"
                >
                  <FacebookIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleShare("discord")}
                  className="p-2 rounded-lg bg-secondary/50 hover:bg-[#5865F2] hover:text-white text-muted-foreground transition-colors"
                  title="Copy for Discord"
                >
                  <DiscordIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleShare("instagram")}
                  className="p-2 rounded-lg bg-secondary/50 hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7] hover:text-white text-muted-foreground transition-colors"
                  title="Copy for Instagram"
                >
                  <InstagramIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {wishlist.length} {wishlist.length === 1 ? "game" : "games"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="max-w-6xl mx-auto px-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total Value Card */}
          <div className="rounded-xl bg-card border border-border/50 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Total Value</span>
            </div>
            <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
            {totalSavings > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Current sale price: ${(totalValue - totalSavings).toFixed(2)}
              </p>
            )}
          </div>
          
          {/* Potential Savings Card */}
          <div className="rounded-xl bg-card border border-border/50 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingDown className="w-5 h-5 text-green-500" />
              </div>
              <span className="text-sm text-muted-foreground">Potential Savings</span>
            </div>
            <p className="text-2xl font-bold text-green-500">
              {totalSavings > 0 ? `-$${totalSavings.toFixed(2)}` : "$0.00"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {gamesOnSale} {gamesOnSale === 1 ? "game" : "games"} on sale
            </p>
          </div>
          
          {/* Genre Breakdown Card */}
          <div className="rounded-xl bg-card border border-border/50 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-accent/50">
                <Gamepad2 className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">Top Genres</span>
            </div>
            <div className="space-y-2">
              {genreBreakdown.length > 0 ? (
                genreBreakdown.slice(0, 3).map(({ genre, count, percentage }) => (
                  <div key={genre} className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground min-w-[80px] text-right">
                      {genre} ({count})
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No genre data</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 pb-6">
        {/* Search and Sort Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search games or genres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground">
              {filteredAndSortedWishlist.length} {filteredAndSortedWishlist.length === 1 ? "game" : "games"}
              {hasActiveFilters && ` found`}
            </p>
            
            {/* Genre Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={`gap-2 ${selectedGenre ? 'border-primary text-primary' : ''}`}>
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">{selectedGenre || "All Genres"}</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover z-50 max-h-64 overflow-y-auto">
                <DropdownMenuItem onClick={() => setSelectedGenre(null)}>
                  All Genres
                </DropdownMenuItem>
                {allGenres.map(genre => (
                  <DropdownMenuItem key={genre} onClick={() => setSelectedGenre(genre)}>
                    {genre}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  <span className="hidden sm:inline">{sortLabels[sortOption]}</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover z-50">
                <DropdownMenuItem onClick={() => setSortOption("name-asc")}>
                  Name (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("name-desc")}>
                  Name (Z-A)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("price-low")}>
                  Price (Low to High)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("price-high")}>
                  Price (High to Low)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("discount")}>
                  Biggest Discount
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Price Range Filter */}
        {maxPrice > minPrice && (
          <div className="mb-4 p-4 rounded-xl bg-card/50 border border-border/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Price Range</span>
              </div>
              {priceRange && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setPriceRange(null)}
                  className="h-6 px-2 text-xs"
                >
                  Reset
                </Button>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground min-w-[60px]">
                ${priceRange ? priceRange[0] : minPrice}
              </span>
              <Slider
                value={priceRange || [minPrice, maxPrice]}
                onValueChange={(value) => setPriceRange(value as [number, number])}
                min={minPrice}
                max={maxPrice}
                step={1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground min-w-[60px] text-right">
                ${priceRange ? priceRange[1] : maxPrice}
              </span>
            </div>
          </div>
        )}
        
        {filteredAndSortedWishlist.length === 0 && hasActiveFilters ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No games found{searchQuery && ` matching "${searchQuery}"`}{selectedGenre && ` in ${selectedGenre}`}{priceRange && ` between $${priceRange[0]} - $${priceRange[1]}`}
            </p>
            <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(""); setSelectedGenre(null); setPriceRange(null); }} className="mt-2">
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredAndSortedWishlist.map((item) => {
              const isOnSale = item.game_sale_price !== null && item.game_sale_price < (item.game_price || 0);
              const discountPercent = isOnSale && item.game_price
                ? Math.round(((item.game_price - item.game_sale_price!) / item.game_price) * 100)
                : 0;

            return (
              <div
                key={item.id}
                className="group relative rounded-xl overflow-hidden bg-card border border-border/50 hover:border-primary/50 transition-all duration-300"
              >
                {isOnSale && (
                  <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded">
                    -{discountPercent}% OFF
                  </div>
                )}
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={item.game_cover_image_url || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400"}
                    alt={item.game_title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background/95 to-background/50 backdrop-blur-sm">
                  <h3 className="font-medium text-sm truncate mb-1">{item.game_title}</h3>
                  <div className="flex items-center justify-between">
                    {item.game_genres?.slice(0, 1).map((genre) => (
                      <span key={genre} className="text-xs text-muted-foreground">
                        {genre}
                      </span>
                    ))}
                    {item.game_price === 0 || item.game_price === null ? (
                      <span className="text-primary font-semibold text-sm">Free</span>
                    ) : isOnSale ? (
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground line-through text-xs">
                          ${item.game_price.toFixed(2)}
                        </span>
                        <span className="text-green-400 font-semibold text-sm">
                          ${item.game_sale_price!.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-primary font-semibold text-sm">
                        ${item.game_price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border/50 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center">
          <p className="text-muted-foreground text-sm mb-4">
            Want to create your own wishlist?
          </p>
          <Link to="/auth">
            <Button variant="gaming">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SharedWishlist;
