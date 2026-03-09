import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAcceptInvite } from "@/hooks/useCommunityInvites";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const CommunityInvite = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { acceptInvite, loading } = useAcceptInvite();
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // Redirect to auth with return URL
      navigate(`/auth?redirect=/invite/${inviteCode}`);
      return;
    }
    if (!inviteCode || status !== "pending") return;

    const accept = async () => {
      const communityId = await acceptInvite(inviteCode);
      if (communityId) {
        setStatus("success");
        // Navigate to home after short delay (community will show in social tab)
        setTimeout(() => navigate("/"), 1500);
      } else {
        setStatus("error");
      }
    };
    accept();
  }, [user, authLoading, inviteCode]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center space-y-4">
        {(loading || status === "pending") && (
          <>
            <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
            <p className="text-muted-foreground">Accepting invite...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="w-12 h-12 mx-auto text-online" />
            <h2 className="text-xl font-bold">You're in!</h2>
            <p className="text-muted-foreground">Redirecting to the community...</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 mx-auto text-destructive" />
            <h2 className="text-xl font-bold">Invite Failed</h2>
            <p className="text-muted-foreground">This invite may be invalid, expired, or already used.</p>
            <Button onClick={() => navigate("/")} variant="outline">
              Go Home
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default CommunityInvite;
