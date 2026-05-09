-- Revoke anonymous (pre-login) SELECT on tables that should not be discoverable
-- without authentication. RLS still gates per-row access for authenticated users.

REVOKE SELECT ON public.rls_verification_runs FROM anon;
REVOKE SELECT ON public.user_roles FROM anon;
REVOKE SELECT ON public.user_settings FROM anon;
REVOKE SELECT ON public.cloud_clips FROM anon;
REVOKE SELECT ON public.blocked_users FROM anon;
REVOKE SELECT ON public.friendships FROM anon;
REVOKE SELECT ON public.messages FROM anon;
REVOKE SELECT ON public.conversation_participants FROM anon;
REVOKE SELECT ON public.conversations FROM anon;
REVOKE SELECT ON public.typing_indicators FROM anon;
REVOKE SELECT ON public.wishlist FROM anon;
REVOKE SELECT ON public.wishlist_price_alerts FROM anon;
REVOKE SELECT ON public.wishlist_shares FROM anon;
REVOKE SELECT ON public.sale_notifications FROM anon;
REVOKE SELECT ON public.user_library FROM anon;
REVOKE SELECT ON public.user_achievements FROM anon;
REVOKE SELECT ON public.activity_feed FROM anon;