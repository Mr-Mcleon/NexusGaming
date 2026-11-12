import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = ts.transpileModule(readFileSync(new URL("./useAchievements.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

async function checkReviews(count, eligible = true) {
  const calls = [];
  const toasts = [];
  const achievement = { id: "review-achievement", requirement_type: "reviews_written", requirement_value: 3 };
  const modules = {
    "@tanstack/react-query": {
      useQuery: ({ queryKey }) => ({ data: queryKey[0] === "achievements" ? [achievement]
        : queryKey[0] === "user-achievements" ? [] : count }),
      useMutation: ({ mutationFn }) => ({ mutateAsync: mutationFn }),
      useQueryClient: () => ({ invalidateQueries() {} }),
    },
    "@/integrations/supabase/client": { supabase: {
      rpc: async (...args) => { calls.push(args); return { data: eligible, error: null }; },
    } },
    "@/contexts/AuthContext": { useAuth: () => ({ user: { id: "current-user" } }) },
    "./useGames": { useUserLibrary: () => ({ data: [] }) },
    "./useFriends": { useFriends: () => ({ friends: [] }) },
    "sonner": { toast: { success: (...args) => toasts.push(args) } },
    "react": { useEffect: (effect) => effect() },
  };
  const exports = {};
  runInNewContext(source, { exports, require: (name) => {
    assert.ok(modules[name], `Unexpected import: ${name}`);
    return modules[name];
  } });
  exports.useAchievementChecker();
  await new Promise((resolve) => setImmediate(resolve));
  return { calls, toasts };
}

test("reviews_written at the actual review threshold requests only server-authorized unlock", async () => {
  const { calls, toasts } = await checkReviews(3);
  assert.deepEqual(calls.map(([name, args]) => [name, { ...args }]), [
    ["unlock_achievement_if_eligible", { achievement_id: "review-achievement" }],
  ]);
  assert.equal(toasts.length, 1);
});

test("reviews_written below the threshold does not request an unlock", async () => {
  assert.equal((await checkReviews(2)).calls.length, 0);
});

test("unavailable review counts do not request an unlock", async () => {
  assert.equal((await checkReviews(undefined)).calls.length, 0);
});

test("server rejection of review eligibility does not show an unlock toast", async () => {
  const result = await checkReviews(3, false);
  assert.equal(result.calls.length, 1);
  assert.equal(result.toasts.length, 0);
});