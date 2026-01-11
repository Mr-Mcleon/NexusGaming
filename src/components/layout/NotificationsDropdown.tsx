import { Bell, UserPlus, MessageSquare, Check, X, Tag, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { useFriends } from "@/hooks/useFriends";
import { 
  useSaleNotifications, 
  useUnreadSaleNotificationsCount,
  useMarkSaleNotificationRead,
  useDeleteSaleNotification,
  useSaleNotificationSubscription,
  type SaleNotification 
} from "@/hooks/useSaleNotifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export const NotificationsDropdown = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading } = useNotifications();
  const { data: saleNotifications = [], isLoading: loadingSales } = useSaleNotifications();
  const unreadSalesCount = useUnreadSaleNotificationsCount();
  const { acceptRequest, declineRequest } = useFriends();
  const markSaleRead = useMarkSaleNotificationRead();
  const deleteSaleNotification = useDeleteSaleNotification();

  // Subscribe to real-time sale notifications
  useSaleNotificationSubscription();

  const totalUnread = unreadCount + unreadSalesCount;

  const handleAccept = async (requestId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await acceptRequest(requestId);
  };

  const handleDecline = async (requestId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await declineRequest(requestId);
  };

  const handleSaleClick = (notification: SaleNotification) => {
    if (!notification.read) {
      markSaleRead.mutate(notification.id);
    }
    navigate(`/game/${notification.game_id}`);
  };

  const handleDeleteSale = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSaleNotification.mutate(id);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {totalUnread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-accent text-accent-foreground text-xs font-medium rounded-full flex items-center justify-center px-1">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 bg-popover border border-border">
        <Tabs defaultValue="all" className="w-full">
          <div className="p-3 border-b border-border">
            <h3 className="font-semibold mb-2">Notifications</h3>
            <TabsList className="w-full grid grid-cols-2 h-8">
              <TabsTrigger value="all" className="text-xs h-7">
                All {unreadCount > 0 && `(${unreadCount})`}
              </TabsTrigger>
              <TabsTrigger value="sales" className="text-xs h-7">
                Sales {unreadSalesCount > 0 && `(${unreadSalesCount})`}
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="all" className="m-0">
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
          </TabsContent>

          <TabsContent value="sales" className="m-0">
            <ScrollArea className="max-h-[400px]">
              {loadingSales ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading...
                </div>
              ) : saleNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Tag className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No sale alerts</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Add games to your wishlist to get notified when they go on sale
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {saleNotifications.map((notification) => (
                    <SaleNotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleSaleClick(notification)}
                      onDelete={(e) => handleDeleteSale(notification.id, e)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
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

interface SaleNotificationItemProps {
  notification: SaleNotification;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

const SaleNotificationItem = ({ notification, onClick, onDelete }: SaleNotificationItemProps) => {
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });
  const discount = Math.round(
    ((notification.original_price - notification.sale_price) / notification.original_price) * 100
  );
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-3 hover:bg-secondary/50 transition-colors cursor-pointer group",
        !notification.read && "bg-primary/5"
      )}
    >
      <div className="flex gap-3">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center overflow-hidden">
            {notification.game?.cover_image_url ? (
              <img 
                src={notification.game.cover_image_url} 
                alt="" 
                className="w-full h-full object-cover"
              />
            ) : (
              <Tag className="w-5 h-5 text-green-500" />
            )}
          </div>
          {!notification.read && (
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{notification.game?.title || "Game"}</p>
            <span className="shrink-0 px-1.5 py-0.5 bg-green-500/20 text-green-500 text-xs font-semibold rounded">
              -{discount}%
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground line-through">${notification.original_price.toFixed(2)}</span>
            <span className="text-green-500 font-semibold">${notification.sale_price.toFixed(2)}</span>
          </div>
          <p className="text-xs text-muted-foreground/70 mt-0.5">{timeAgo}</p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
};
