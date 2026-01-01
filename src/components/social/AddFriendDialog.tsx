import { useState } from "react";
import { Search, UserPlus, Check, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFriends, type UserProfile } from "@/hooks/useFriends";
import { cn } from "@/lib/utils";

interface AddFriendDialogProps {
  children: React.ReactNode;
}

export const AddFriendDialog = ({ children }: AddFriendDialogProps) => {
  const { searchUsers, sendFriendRequest, sentRequests, friends } = useFriends();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    const results = await searchUsers(searchQuery);
    setSearchResults(results);
    setSearching(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSendRequest = async (userId: string) => {
    setSendingTo(userId);
    await sendFriendRequest(userId);
    setSendingTo(null);
  };

  const getStatus = (userId: string) => {
    if (friends.some(f => f.user_id === userId || f.friend_id === userId)) {
      return "friend";
    }
    if (sentRequests.some(r => r.friend_id === userId)) {
      return "pending";
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add Friend
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={searching}>
              <Search className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {searching ? (
              <p className="text-center text-muted-foreground py-4">Searching...</p>
            ) : searchResults.length === 0 && searchQuery ? (
              <p className="text-center text-muted-foreground py-4">No users found</p>
            ) : (
              searchResults.map((profile) => {
                const status = getStatus(profile.user_id);
                
                return (
                  <div
                    key={profile.user_id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-medium">
                      {profile.username?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{profile.username || "Unknown"}</p>
                    </div>
                    {status === "friend" ? (
                      <div className="flex items-center gap-1 text-online text-sm">
                        <Check className="w-4 h-4" />
                        Friends
                      </div>
                    ) : status === "pending" ? (
                      <div className="flex items-center gap-1 text-warning text-sm">
                        <Clock className="w-4 h-4" />
                        Pending
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleSendRequest(profile.user_id)}
                        disabled={sendingTo === profile.user_id}
                      >
                        {sendingTo === profile.user_id ? "Sending..." : "Add"}
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {!searchQuery && (
            <p className="text-center text-sm text-muted-foreground">
              Search for users by their username to add them as friends
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
