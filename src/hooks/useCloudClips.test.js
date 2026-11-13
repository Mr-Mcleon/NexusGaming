import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";

const ts = createRequire(import.meta.url)("typescript");
const source = ts.transpileModule(readFileSync(new URL("./useCloudClips.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

function setup({ failMetadata = false, failDelete = false, failRemove = false, failFetch = false } = {}) {
  const events = [], toasts = [];
  const storage = {
    upload: async (path, blob, options) => { events.push(["upload", path, options.upsert]); return { error: null }; },
    remove: async (paths) => { events.push(["remove", ...paths]); return { error: failRemove ? new Error("remove failed") : null }; },
    download: async () => { events.push(["download"]); return { data: {}, error: null }; },
  };
  const supabase = { storage: { from: () => storage }, from: () => {
    let operation = "read", filters = [];
    const query = {
      select() { return query; }, eq(key, value) { filters.push([key, value]); return query; },
      upsert() { operation = "save"; events.push(["metadata-save"]); return query; },
      delete() { operation = "delete"; events.push(["metadata-delete"]); return query; },
      order: async () => ({ data: null, error: failFetch ? new Error("fetch failed") : null }),
      maybeSingle: async () => ({ data: filters.some(([key]) => key === "local_id")
        ? { storage_path: "user/old.webm" } : failDelete ? { id: "row" } : null, error: null }),
      single: async () => ({ data: failMetadata ? null : { id: "row" }, error: failMetadata ? new Error("save failed") : null }),
      then(resolve, reject) { return Promise.resolve({ data: failDelete ? null : [{ id: "row" }],
        error: operation === "delete" && failDelete ? new Error("delete failed") : null }).then(resolve, reject); },
    };
    return query;
  } };
  const modules = {
    react: { useState: (initial) => [initial, () => {}], useCallback: (fn) => fn },
    "@/integrations/supabase/client": { supabase },
    "@/contexts/AuthContext": { useAuth: () => ({ user: { id: "user" } }) },
    sonner: { toast: Object.fromEntries(["success", "warning", "error", "info"].map((kind) =>
      [kind, (message) => toasts.push([kind, message])])) },
  };
  const exports = {};
  runInNewContext(source, { exports, crypto: { randomUUID: () => "unique" }, console: { error() {} },
    require: (name) => { assert.ok(modules[name], name); return modules[name]; } });
  return { hook: exports.useCloudClips(), events, toasts };
}
const clip = { id: "local", name: "Example", blob: {}, duration: 1, size: 1 };
const cloud = { id: "row", storage_path: "user/old.webm" };

test("failed metadata save cleans only the new object, preserving the old backup", async () => {
  const { hook, events, toasts } = setup({ failMetadata: true });
  await hook.uploadClip(clip);
  assert.deepEqual(events.filter(([kind]) => kind === "remove"), [["remove", "user/local-unique.webm"]]);
  assert.equal(events[0][2], false);
  assert.equal(toasts.some(([kind]) => kind === "success"), false);
});
test("failed metadata deletion restores the object", async () => {
  const { hook, events, toasts } = setup({ failDelete: true });
  await hook.deleteCloudClip(cloud);
  assert.deepEqual(events.map(([kind]) => kind), ["download", "remove", "metadata-delete", "upload"]);
  assert.equal(toasts.some(([kind]) => kind === "success"), false);
});
test("failed storage deletion never deletes metadata", async () => {
  const { hook, events } = setup({ failRemove: true });
  await hook.deleteCloudClip(cloud);
  assert.equal(events.some(([kind]) => kind === "metadata-delete"), false);
});
test("zero successful bulk uploads report failure, not success", async () => {
  const { hook, toasts } = setup({ failMetadata: true });
  await hook.uploadAllClips([clip]);
  assert.equal(toasts.some(([kind]) => kind === "success"), false);
  assert.ok(toasts.some(([kind, message]) => kind === "error" && message.includes("1 failed")));
});
test("fetch failures are explicit and not empty results", async () => {
  const { hook, toasts } = setup({ failFetch: true });
  assert.equal(await hook.fetchCloudClips(), null);
  assert.equal(toasts[0][0], "error");
});