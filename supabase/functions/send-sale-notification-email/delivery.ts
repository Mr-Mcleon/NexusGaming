export const deliveryIdempotencyKey = (notificationId: string) => `sale-notification/${notificationId}`;

// Provider acceptance precedes the sent timestamp. If bookkeeping fails after
// acceptance, retain the lease; expiry plus provider idempotency makes retry safe.
export async function deliverClaimedEmail(
  deliver: () => Promise<boolean>,
  finish: (delivered: boolean) => Promise<void>,
): Promise<boolean> {
  let accepted = false;
  try {
    accepted = await deliver();
    if (accepted) await finish(true);
    return accepted;
  } finally {
    if (!accepted) await finish(false);
  }
}