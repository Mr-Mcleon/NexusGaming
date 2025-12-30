import { useState } from "react";
import { Search, Tag, Flame, Gift, Clock, Star, ChevronRight, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StoreGame {
  id: string;
  title: string;
  image: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  tags: string[];
  releaseDate?: string;
}

const featuredDeals: StoreGame[] = [
  {
    id: "1",
    title: "Cyber Odyssey 2077",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=400&fit=crop",
    price: 29.99,
    originalPrice: 59.99,
    discount: 50,
    rating: 4.8,
    tags: ["RPG", "Open World", "Cyberpunk"],
  },
];

const newReleases: StoreGame[] = [
  { id: "2", title: "Stellar Wars Remastered", image: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=400&h=500&fit=crop", price: 49.99, rating: 4.7, tags: ["Space", "Strategy"], releaseDate: "Dec 2024" },
  { id: "3", title: "Neon Racer Ultimate", image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=500&fit=crop", price: 39.99, rating: 4.5, tags: ["Racing", "Arcade"], releaseDate: "Dec 2024" },
  { id: "4", title: "Shadow Legends II", image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=500&fit=crop", price: 59.99, rating: 4.9, tags: ["Action", "Fantasy"], releaseDate: "Jan 2025" },
];

const onSale: StoreGame[] = [
  { id: "5", title: "Quantum Break", image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=500&fit=crop", price: 14.99, originalPrice: 29.99, discount: 50, rating: 4.9, tags: ["Puzzle", "Sci-Fi"] },
  { id: "6", title: "Dark Horizon", image: "https://images.unsplash.com/photo-1552820728-8b83bb6b2b0c?w=400&h=500&fit=crop", price: 19.99, originalPrice: 39.99, discount: 50, rating: 4.6, tags: ["Horror", "Survival"] },
  { id: "7", title: "Apex Hunter", image: "https://images.unsplash.com/photo-1493711662062-fa541f7f0cf5?w=400&h=500&fit=crop", price: 9.99, originalPrice: 24.99, discount: 60, rating: 4.4, tags: ["FPS", "Multiplayer"] },
  { id: "8", title: "Nova Strike", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=500&fit=crop", price: 24.99, originalPrice: 49.99, discount: 50, rating: 4.3, tags: ["Shooter", "Action"] },
];

const categories = [
  { id: "action", label: "Action", emoji: "⚔️" },
  { id: "rpg", label: "RPG", emoji: "🧙" },
  { id: "strategy", label: "Strategy", emoji: "♟️" },
  { id: "racing", label: "Racing", emoji: "🏎️" },
  { id: "sports", label: "Sports", emoji: "⚽" },
  { id: "indie", label: "Indie", emoji: "🎨" },
  { id: "horror", label: "Horror", emoji: "👻" },
  { id: "simulation", label: "Simulation", emoji: "🏗️" },
];

export const StoreSection = () => {
  const [activeCategory, setActiveCategory] = useState("action");

  return (
    <div className="h-full overflow-y-auto scrollbar-gaming">
      {/* Hero Banner */}
      <div className="relative h-96 overflow-hidden">
        <img 
          src={featuredDeals[0].image} 
          alt={featuredDeals[0].title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-destructive text-destructive-foreground text-sm font-bold rounded-full flex items-center gap-1">
              <Percent className="w-4 h-4" /> {featuredDeals[0].discount}% OFF
            </span>
            <span className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-full">Featured Deal</span>
          </div>
          <h1 className="font-display text-4xl lg:text-5xl font-bold mb-3">{featuredDeals[0].title}</h1>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-warning fill-warning" />
              <span className="font-medium">{featuredDeals[0].rating}</span>
            </div>
            <div className="flex items-center gap-2">
              {featuredDeals[0].tags.map((tag) => (
                <span key={tag} className="text-sm text-muted-foreground">{tag}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">${featuredDeals[0].price}</span>
              <span className="text-lg text-muted-foreground line-through">${featuredDeals[0].originalPrice}</span>
            </div>
            <Button variant="gaming" size="xl">
              Buy Now
            </Button>
            <Button variant="glass" size="xl">
              Add to Wishlist
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Categories */}
        <section>
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-gaming">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-200",
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "glass-card hover:bg-secondary"
                )}
              >
                <span>{cat.emoji}</span>
                <span className="font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* New Releases */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl font-bold">New Releases</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {newReleases.map((game) => (
              <div 
                key={game.id}
                className="group glass-card rounded-xl overflow-hidden hover:scale-[1.02] transition-all duration-300 cursor-pointer"
              >
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={game.image} 
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {game.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-secondary text-xs rounded-full text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                    <span className="text-xs text-primary ml-auto">{game.releaseDate}</span>
                  </div>
                  <h3 className="font-medium mb-2">{game.title}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-warning fill-warning" />
                      <span className="text-sm">{game.rating}</span>
                    </div>
                    <span className="font-bold text-primary">${game.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* On Sale */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-destructive" />
              <h2 className="font-display text-xl font-bold">On Sale</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {onSale.map((game) => (
              <div 
                key={game.id}
                className="group glass-card rounded-xl overflow-hidden hover:scale-[1.02] transition-all duration-300 cursor-pointer"
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img 
                    src={game.image} 
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {game.discount && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full">
                      -{game.discount}%
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm mb-2 truncate">{game.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">${game.price}</span>
                    {game.originalPrice && (
                      <span className="text-xs text-muted-foreground line-through">${game.originalPrice}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Free to Play Banner */}
        <section className="relative overflow-hidden rounded-2xl p-8 bg-gradient-to-r from-accent/20 via-primary/10 to-transparent border border-accent/20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-accent mb-2">
                <Gift className="w-5 h-5" />
                <span className="text-sm font-medium uppercase tracking-wider">Free to Play</span>
              </div>
              <h2 className="font-display text-2xl font-bold mb-2">Play for Free</h2>
              <p className="text-muted-foreground max-w-md">
                Discover amazing free-to-play games. No payment required, just instant fun!
              </p>
            </div>
            <Button variant="gaming" size="lg">
              Browse Free Games
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};
