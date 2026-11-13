-- Enforce account ownership for associated games without changing existing rows or RLS.
-- MATCH SIMPLE preserves games without a linked account; unlinking clears only linked_account_id.
ALTER TABLE public.linked_accounts
  ADD CONSTRAINT linked_accounts_id_user_id_key UNIQUE (id, user_id);

ALTER TABLE public.external_games
  ADD CONSTRAINT external_games_linked_account_owner_fkey
  FOREIGN KEY (linked_account_id, user_id)
  REFERENCES public.linked_accounts (id, user_id)
  MATCH SIMPLE
  ON UPDATE NO ACTION
  ON DELETE SET NULL (linked_account_id);
