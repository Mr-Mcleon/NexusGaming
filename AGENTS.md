# Project architecture

- Sale-email delivery uses service-only database leases and a stable provider idempotency key; record delivery only after provider acceptance so failures can retry safely.
- Keep the blank Drizzle schema and migration tooling for the managed migration workflow; do not add runtime ORM models.
- Managed auth client/storage files are platform-owned; do not edit or remove their dependencies manually.