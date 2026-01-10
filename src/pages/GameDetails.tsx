import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Clock, Calendar, Users, Play, Heart, Plus, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  useGameDetails,
  useGameScreenshots,
  useGameReviews,
  useUserPlayHistory,
  useSubmitReview,
  useDeleteReview,
} from "@/hooks/useGameDetails";
import { useAddToLibrary, useUserLibrary } from "@/hooks/useGames";
import { useSetPlayingStatus } from "@/hooks/usePlayingStatus";
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

const formatPlayTime = (minutes: number) => {
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
};

const GameDetails = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: game, isLoading: gameLoading } = useGameDetails(gameId || "");
  const { data: screenshots = [] } = useGameScreenshots(gameId || "");
  const { data: reviews = [] } = useGameReviews(gameId || "");
  const { data: playHistory } = useUserPlayHistory(gameId || "");
  const { data: library = [] } = useUserLibrary();
  
  const addToLibrary = useAddToLibrary();
  const { setPlaying } = useSetPlayingStatus();
  const submitReview = useSubmitReview();
  const deleteReview = useDeleteReview();
  
  const { data: wishlist = [] } = useWishlist();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const [currentScreenshot, setCurrentScreenshot] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");

  const isInLibrary = library.some((entry) => entry.game_id === gameId);
  const isInWishlist = wishlist.some((entry) => entry.game_id === gameId);
  const userReview = reviews.find((r) => r.user_id === user?.id);
  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : game?.rating || 0;

  const handlePlay = async () => {
    if (!gameId || !game) return;
    const success = await setPlaying(gameId);
    if (success) {
      toast.success(`Now playing ${game.title}`);
    }
  };

  const handleAddToLibrary = () => {
    if (gameId) {
      addToLibrary.mutate(gameId);
    }
  };

  const handleToggleWishlist = () => {
    if (!gameId) return;
    if (isInWishlist) {
      removeFromWishlist.mutate(gameId);
    } else {
      addToWishlist.mutate(gameId);
    }
  };

  const handleSubmitReview = () => {
    if (!gameId) return;
    submitReview.mutate({
      gameId,
      rating: reviewRating,
      title: reviewTitle || undefined,
      content: reviewContent || undefined,
    });
    setReviewTitle("");
    setReviewContent("");
  };

  const handleDeleteReview = (reviewId: string) => {
    deleteReview.mutate(reviewId);
  };

  const nextScreenshot = () => {
    setCurrentScreenshot((prev) => (prev + 1) % screenshots.length);
  };

  const prevScreenshot = () => {
    setCurrentScreenshot((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  };

  if (gameLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-96 w-full rounded-xl mb-6" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Game Not Found</h1>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[50vh] overflow-hidden">
        <img
          src={game.cover_image_url || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920"}
          alt={game.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        {/* Back Button */}
        <Button
          variant="glass"
          size="icon"
          className="absolute top-6 left-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {/* Game Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-3">
              {game.genres?.slice(0, 4).map((genre) => (
                <span key={genre} className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-full">
                  {genre}
                </span>
              ))}
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">{game.title}</h1>
            <div className="flex flex-wrap items-center gap-6 text-muted-foreground mb-6">
              {game.developer && <span>{game.developer}</span>}
              {game.release_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(game.release_date), "MMM d, yyyy")}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-warning fill-warning" />
                {averageRating.toFixed(1)} ({reviews.length} reviews)
              </span>
            </div>
            <div className="flex items-center gap-4">
              {isInLibrary ? (
                <Button variant="gaming" size="lg" onClick={handlePlay}>
                  <Play className="w-5 h-5" />
                  Play Now
                </Button>
              ) : (
                <Button variant="gaming" size="lg" onClick={handleAddToLibrary}>
                  <Plus className="w-5 h-5" />
                  Add to Library
                </Button>
              )}
              <Button 
                variant="glass" 
                size="lg"
                onClick={handleToggleWishlist}
                disabled={addToWishlist.isPending || removeFromWishlist.isPending}
                className={cn(isInWishlist && "text-destructive")}
              >
                <Heart className={cn("w-5 h-5", isInWishlist && "fill-current")} />
                {isInWishlist ? "In Wishlist" : "Wishlist"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-12">
        {/* Play History */}
        {playHistory && (
          <section className="glass-card rounded-xl p-6">
            <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Your Play History
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-secondary/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {formatPlayTime(playHistory.play_time_minutes)}
                </p>
                <p className="text-sm text-muted-foreground">Total Playtime</p>
              </div>
              <div className="text-center p-4 bg-secondary/50 rounded-lg">
                <p className="text-2xl font-bold">
                  {playHistory.last_played_at
                    ? format(new Date(playHistory.last_played_at), "MMM d")
                    : "Never"}
                </p>
                <p className="text-sm text-muted-foreground">Last Played</p>
              </div>
              <div className="text-center p-4 bg-secondary/50 rounded-lg">
                <p className="text-2xl font-bold">
                  {format(new Date(playHistory.added_at), "MMM d, yyyy")}
                </p>
                <p className="text-sm text-muted-foreground">Added to Library</p>
              </div>
              <div className="text-center p-4 bg-secondary/50 rounded-lg">
                <p className="text-2xl font-bold">
                  {playHistory.is_favorite ? "Yes" : "No"}
                </p>
                <p className="text-sm text-muted-foreground">Favorite</p>
              </div>
            </div>
          </section>
        )}

        {/* Description */}
        <section>
          <h2 className="font-display text-xl font-bold mb-4">About This Game</h2>
          <p className="text-muted-foreground leading-relaxed">
            {game.description || "No description available for this game."}
          </p>
          {game.tags && game.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {game.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Screenshots */}
        {screenshots.length > 0 && (
          <section>
            <h2 className="font-display text-xl font-bold mb-4">Screenshots</h2>
            <div className="relative rounded-xl overflow-hidden">
              <img
                src={screenshots[currentScreenshot]?.image_url}
                alt={screenshots[currentScreenshot]?.caption || "Screenshot"}
                className="w-full aspect-video object-cover"
              />
              {screenshots.length > 1 && (
                <>
                  <Button
                    variant="glass"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2"
                    onClick={prevScreenshot}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="glass"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    onClick={nextScreenshot}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {screenshots.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentScreenshot(idx)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-colors",
                          idx === currentScreenshot ? "bg-primary" : "bg-muted-foreground/50"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            {screenshots[currentScreenshot]?.caption && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                {screenshots[currentScreenshot].caption}
              </p>
            )}
          </section>
        )}

        {/* Reviews */}
        <section>
          <h2 className="font-display text-xl font-bold mb-4">
            Reviews ({reviews.length})
          </h2>

          {/* Write Review */}
          {user && !userReview && (
            <div className="glass-card rounded-xl p-6 mb-6">
              <h3 className="font-medium mb-4">Write a Review</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-muted-foreground">Rating:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        "w-6 h-6",
                        star <= reviewRating
                          ? "text-warning fill-warning"
                          : "text-muted-foreground"
                      )}
                    />
                  </button>
                ))}
              </div>
              <Input
                placeholder="Review title (optional)"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                className="mb-3"
              />
              <Textarea
                placeholder="Share your thoughts about this game..."
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                className="mb-4"
                rows={4}
              />
              <Button
                variant="gaming"
                onClick={handleSubmitReview}
                disabled={submitReview.isPending}
              >
                Submit Review
              </Button>
            </div>
          )}

          {/* Review List */}
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="glass-card rounded-xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={review.profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {review.profile?.username?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{review.profile?.username || "Anonymous"}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(review.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "w-4 h-4",
                            star <= review.rating
                              ? "text-warning fill-warning"
                              : "text-muted-foreground"
                          )}
                        />
                      ))}
                    </div>
                    {review.user_id === user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteReview(review.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                {review.title && (
                  <h4 className="font-medium mb-2">{review.title}</h4>
                )}
                {review.content && (
                  <p className="text-muted-foreground">{review.content}</p>
                )}
              </div>
            ))}

            {reviews.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No reviews yet. Be the first to review!</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default GameDetails;
