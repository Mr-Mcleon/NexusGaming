ALTER TABLE public.sale_notifications ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;
ALTER TABLE public.sale_notifications ADD COLUMN IF NOT EXISTS email_claim_token uuid;
ALTER TABLE public.sale_notifications ADD COLUMN IF NOT EXISTS email_claim_until timestamptz;

-- Delivery metadata and prices must not be writable by notification recipients.
REVOKE UPDATE ON public.sale_notifications FROM authenticated, anon;
GRANT UPDATE (read) ON public.sale_notifications TO authenticated;

-- Preserve existing data: fail rather than remove duplicates if the expected key is missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = 'public.sale_notifications'::regclass
      AND i.indisunique AND i.indisvalid AND i.indpred IS NULL AND i.indexprs IS NULL
      AND i.indnkeyatts = 3
      AND (SELECT array_agg(a.attname::text ORDER BY a.attname)
           FROM unnest(i.indkey::smallint[]) WITH ORDINALITY k(attnum, ord)
           JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum
           WHERE k.ord <= i.indnkeyatts) = ARRAY['game_id', 'sale_price', 'user_id']::text[]
  ) THEN
    ALTER TABLE public.sale_notifications ADD CONSTRAINT sale_notification_delivery_dedupe UNIQUE (user_id, game_id, sale_price);
  END IF;
END;
$$;

-- Disable the unsafe pre-delivery claim used by older function code.
CREATE OR REPLACE FUNCTION public.claim_sale_notification_email(_notification_id uuid)
RETURNS TABLE(user_id uuid, game_title text, original_price numeric, sale_price numeric)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$ SELECT sn.user_id, g.title::text, sn.original_price, sn.sale_price
       FROM public.sale_notifications sn JOIN public.games g ON g.id = sn.game_id WHERE false $$;
REVOKE ALL ON FUNCTION public.claim_sale_notification_email(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_sale_notification_email(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.lease_sale_notification_email(_notification_id uuid)
RETURNS TABLE(user_id uuid, game_title text, original_price numeric, sale_price numeric, claim_token uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.sale_notifications sn
     SET email_claim_token = gen_random_uuid(), email_claim_until = now() + interval '5 minutes'
    FROM public.games g
   WHERE sn.id = _notification_id AND g.id = sn.game_id
     AND sn.email_sent_at IS NULL
     AND sn.created_at > now() - interval '1 hour'
     AND (sn.email_claim_until IS NULL OR sn.email_claim_until <= now())
  RETURNING sn.user_id, g.title::text, sn.original_price, sn.sale_price, sn.email_claim_token;
END;
$$;
REVOKE ALL ON FUNCTION public.lease_sale_notification_email(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lease_sale_notification_email(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.finish_sale_notification_email(_notification_id uuid, _claim_token uuid, _delivered boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE changed integer;
BEGIN
  UPDATE public.sale_notifications
     SET email_sent_at = CASE WHEN _delivered THEN now() ELSE email_sent_at END,
         email_claim_token = NULL, email_claim_until = NULL
   WHERE id = _notification_id AND email_claim_token = _claim_token AND email_sent_at IS NULL;
  GET DIAGNOSTICS changed = ROW_COUNT;
  RETURN changed = 1;
END;
$$;
REVOKE ALL ON FUNCTION public.finish_sale_notification_email(uuid, uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finish_sale_notification_email(uuid, uuid, boolean) TO service_role;
