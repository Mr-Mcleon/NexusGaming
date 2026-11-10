# Remaining security remediation

- [x] Create private owner-scoped chat attachment storage and signed attachment flow.
- [x] Return accepted-friend leaderboard aggregates through an authenticated RPC.
- [x] Verify achievement eligibility server-side and remove direct unlock inserts.
- [x] Run targeted checks for these three changes.

- [x] Correct sale-email delivery bookkeeping in source with retryable leases and five passing regression tests.
- [x] Confirm the original migration defines UNIQUE (user_id, game_id, sale_price); stage a non-destructive guard for databases missing it.
- [x] Remove unused drizzle-orm/postgres and connection configuration; retain required drizzle-kit/blank schema and platform-managed auth files.
- [x] Preserve community rollback and surface cleanup failures without changing the feature or deleting existing data.
- [x] Run app types, email-function types, targeted/full lint, regression tests, and inspect successful preview builds.
- [ ] Apply staged sale-email migration and verify actual constraint/leases: blocked by unreachable Lovable Cloud database.
- [ ] Exercise trigger delivery, concurrent calls, failed-send retry, and two-account permissions: blocked by database availability and intentionally undeployed function changes.
- [ ] Revert managed preview-auth storage only through supported platform regeneration: no supported regeneration action is available.