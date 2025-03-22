// Type declarations for Deno runtime and modules
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

declare module 'https://deno.land/std@0.168.0/http/server.ts' {
  export function serve(
    handler: (request: Request) => Response | Promise<Response>,
    options?: { port?: number; hostname?: string }
  ): void;
}

declare module 'https://esm.sh/@supabase/supabase-js@2.47.0' {
  export function createClient(supabaseUrl: string, supabaseKey: string, options?: any): any;
}
