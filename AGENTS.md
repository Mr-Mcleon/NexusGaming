# Project architecture

- Sale-email delivery uses service-only database leases and a stable provider idempotency key; record delivery only after provider acceptance so failures can retry safely.
- Keep the blank Drizzle schema and migration tooling for the managed migration workflow; do not add runtime ORM models.
- Managed auth client/storage files are platform-owned; do not edit or remove their dependencies manually.
- Friend leaderboard aggregates and achievement eligibility are computed by authenticated security-definer RPCs to preserve private-row isolation.
- Chat attachment storage is owner-only; messages share expiring signed bearer URLs, and supported MIME types are restricted in storage write policies and client validation.
- Cloud clip writes use unique object paths and compensating cleanup; deletions preserve a temporary copy for rollback because storage and metadata cannot share a transaction.