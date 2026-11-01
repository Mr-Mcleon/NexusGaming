import { describe, expect, test } from "bun:test";
import { deliverClaimedEmail, deliveryIdempotencyKey } from "./delivery";

describe("sale-email retry bookkeeping", () => {
  test("records sent only after successful provider acceptance", async () => {
    const events: string[] = [];
    await deliverClaimedEmail(async () => { events.push("accepted"); return true; },
      async (delivered) => { events.push(delivered ? "sent" : "released"); });
    expect(events).toEqual(["accepted", "sent"]);
  });
  test("failed send releases the lease and can retry", async () => {
    const settled: boolean[] = [];
    await expect(deliverClaimedEmail(async () => { throw new Error("provider unavailable"); },
      async (sent) => { settled.push(sent); })).rejects.toThrow("provider unavailable");
    await deliverClaimedEmail(async () => true, async (sent) => { settled.push(sent); });
    expect(settled).toEqual([false, true]);
  });
  test("skipped email releases the lease without marking sent", async () => {
    const settled: boolean[] = [];
    expect(await deliverClaimedEmail(async () => false, async (sent) => { settled.push(sent); })).toBe(false);
    expect(settled).toEqual([false]);
  });
  test("bookkeeping failure after acceptance retains the lease", async () => {
    const settled: boolean[] = [];
    await expect(deliverClaimedEmail(async () => true, async (sent) => {
      settled.push(sent); throw new Error("database unavailable");
    })).rejects.toThrow("database unavailable");
    expect(settled).toEqual([true]);
  });
  test("retries of one notification use the same provider key", () => {
    const id = "55ec0e91-5a81-43b5-9d90-9d43124c2383";
    expect(deliveryIdempotencyKey(id)).toBe(`sale-notification/${id}`);
    expect(deliveryIdempotencyKey(id)).not.toBe(deliveryIdempotencyKey("other-notification"));
  });
});