
import { serve } from "https://deno.land/std@0.182.0/http/server.ts";
import { handleRequest } from "./handlers.ts";

// Serve the function
serve(async (req: Request) => {
  return await handleRequest(req);
});
