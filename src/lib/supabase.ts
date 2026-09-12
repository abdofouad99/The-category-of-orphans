import { createServerClient } from "@supabase/ssr";
import { createBrowserClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import dns from "node:dns";

// =============================================================================
// DNS Resolution Patch (Ensures reliable connection without DNS failures)
// =============================================================================
if (typeof window === "undefined") {
  const originalLookup = dns.lookup;
  const HOSTS: Record<string, string[]> = {
    "fzxqojzhrkdqfuoajxoo.supabase.co": ["104.18.38.10", "172.64.149.246"],
    "aws-0-ap-south-1.pooler.supabase.com": ["3.111.105.85", "65.0.195.55"],
    "fsodnxtxtyyyowqxbkpi.supabase.co": ["104.18.38.10", "172.64.149.246"],
    "aws-1-ap-northeast-1.pooler.supabase.com": ["13.114.6.6", "57.182.231.186", "18.176.230.146"],
  };

  (dns as any).lookup = function (hostname: any, options: any, callback: any) {
    if (typeof options === "function") {
      callback = options;
      options = {};
    }
    if (typeof hostname === "string" && HOSTS[hostname]) {
      const ips = HOSTS[hostname];
      if (options && options.all) {
        return callback(
          null,
          ips.map((ip) => ({ address: ip, family: 4 }))
        );
      }
      return callback(null, ips[0], 4);
    }
    return originalLookup(hostname, options, callback);
  };
}


/**
 * Server-side Supabase client (for Server Components, Server Actions, Route Handlers)
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Can be ignored in Server Components
          }
        },
      },
    }
  );
}

/**
 * Admin Supabase client with service_role (bypasses RLS — use carefully!)
 * Only use in Server Actions and backend operations.
 */
export function createSupabaseAdminClient() {
  const { createClient } = require("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Browser-side Supabase client (for Client Components)
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
