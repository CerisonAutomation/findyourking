"use client";

import { createBrowserClient } from "@supabase/ssr";

/** camelCase key transformer — maps Supabase snake_case columns to Drizzle camelCase types */
function toCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function transformKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(transformKeys);
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        toCamel(k),
        transformKeys(v),
      ])
    );
  }
  return obj;
}

export function createClient() {
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Wrap .from() to apply camelCase transformation on every response
  const originalFrom = client.from.bind(client);
  // @ts-expect-error — wrapping for key transform
  client.from = (table: string) => {
    const builder = originalFrom(table);
    const originalSelect = builder.select.bind(builder);
    // @ts-expect-error
    builder.select = (...args: Parameters<typeof originalSelect>) => {
      const query = originalSelect(...args);
      const originalThen = query.then.bind(query);
      // @ts-expect-error
      query.then = (resolve: any, reject: any) =>
        originalThen((result: any) => {
          if (result?.data) result.data = transformKeys(result.data);
          return resolve ? resolve(result) : result;
        }, reject);
      return query;
    };
    return builder;
  };

  return client;
}
