import { useParams, Link } from "react-router-dom";
import { useSharedWishlist } from "@/hooks/useWishlistShare";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Tag, Heart, User } from "lucide-react";

const SharedWishlist = () => {
  const { token } = useParams<{ token: string }>();
  const { data: wishlist, isLoading, error } = useSharedWishlist(token || null);

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

  const ownerUsername = wishlist[0]?.owner_username || "Anonymous";

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
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {wishlist.length} {wishlist.length === 1 ? "game" : "games"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {wishlist.map((item) => {
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
