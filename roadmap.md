# Remaining security remediation

- [ ] Correct sale-email delivery bookkeeping with retryable leases and regression tests.
- [ ] Verify sale-notification deduplication without deleting existing rows.
- [ ] Remove unrelated dependencies where safe; retain managed integration files and required migration tooling.
- [ ] Preserve community rollback and check cleanup errors.
- [ ] Run available non-destructive checks; report database and deployment limitations.