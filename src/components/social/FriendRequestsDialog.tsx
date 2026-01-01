import { Check, X, Clock, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFriends } from "@/hooks/useFriends";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface FriendRequestsDialogProps {
  children: React.ReactNode;
}

export const FriendRequestsDialog = ({ children }: FriendRequestsDialogProps) => {
  const { pendingRequests, sentRequests, acceptRequest, declineRequest, loading } = useFriends();

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Friend Requests
            {pendingRequests.length > 0 && (
              <Badge variant="default" className="ml-2">
                {pendingRequests.length}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="received" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received">
              Received ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="sent">
              Sent ({sentRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-2 mt-4 max-h-64 overflow-y-auto">
            {loading ? (
              <p className="text-center text-muted-foreground py-4">Loading...</p>
            ) : pendingRequests.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No pending requests</p>
            ) : (
              pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-medium">
                    {request.sender_profile?.username?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {request.sender_profile?.username || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Wants to be your friend
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-8 h-8 text-online hover:text-online hover:bg-online/20"
                      onClick={() => acceptRequest(request.id)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-8 h-8 text-destructive hover:text-destructive hover:bg-destructive/20"
                      onClick={() => declineRequest(request.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-2 mt-4 max-h-64 overflow-y-auto">
            {loading ? (
              <p className="text-center text-muted-foreground py-4">Loading...</p>
            ) : sentRequests.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No sent requests</p>
            ) : (
              sentRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-medium">
                    {request.receiver_profile?.username?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {request.receiver_profile?.username || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pending
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => declineRequest(request.id)}
                  >
                    Cancel
                  </Button>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
