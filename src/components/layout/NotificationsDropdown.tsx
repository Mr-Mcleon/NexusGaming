import { Bell, UserPlus, MessageSquare, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { useFriends } from "@/hooks/useFriends";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export const NotificationsDropdown = () => {
  const { notifications, unreadCount, loading } = useNotifications();
  const { acceptRequest, declineRequest } = useFriends();

  const handleAccept = async (requestId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await acceptRequest(requestId);
  };

  const handleDecline = async (requestId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await declineRequest(requestId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-accent text-accent-foreground text-xs font-medium rounded-full flex items-center justify-center px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 bg-popover border border-border">
        <div className="p-3 border-b border-border">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-xs text-muted-foreground">{unreadCount} new</p>
          )}
        </div>
        
        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onAccept: (id: string, e: React.MouseEvent) => void;
  onDecline: (id: string, e: React.MouseEvent) => void;
}

const NotificationItem = ({ notification, onAccept, onDecline }: NotificationItemProps) => {
  const timeAgo = formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true });
  
  return (
    <div className={cn(
      "p-3 hover:bg-secondary/50 transition-colors cursor-pointer",
      !notification.read && "bg-primary/5"
    )}>
      <div className="flex gap-3">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center overflow-hidden">
            {notification.avatar ? (
              <img 
                src={notification.avatar} 
                alt="" 
                className="w-full h-full object-cover"
              />
            ) : notification.type === "friend_request" ? (
              <UserPlus className="w-5 h-5 text-muted-foreground" />
            ) : (
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          {!notification.read && (
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{notification.title}</p>
          <p className="text-xs text-muted-foreground truncate">{notification.description}</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">{timeAgo}</p>
          
          {notification.type === "friend_request" && notification.actionId && (
            <div className="flex gap-2 mt-2">
              <Button 
                size="sm" 
                variant="gaming" 
                className="h-7 text-xs"
                onClick={(e) => onAccept(notification.actionId!, e)}
              >
                <Check className="w-3 h-3 mr-1" />
                Accept
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 text-xs"
                onClick={(e) => onDecline(notification.actionId!, e)}
              >
                <X className="w-3 h-3 mr-1" />
                Decline
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
