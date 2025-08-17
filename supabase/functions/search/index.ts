import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*", // Demo: allow all origins (localhost, Vercel previews, etc.)
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: corsHeaders },
      );
    }

    // Parse body
    let body: unknown;
    try {
      body = await req.json();
    } catch (_) {
      return new Response(
        JSON.stringify({ error: "invalid JSON body" }),
        { status: 400, headers: corsHeaders },
      );
    }

    const { q, limit } = (body ?? {}) as { q?: unknown; limit?: unknown };

    if (typeof q !== "string" || q.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "query too short" }),
        { status: 400, headers: corsHeaders },
      );
    }

    // Validate and clamp limit
    const DEFAULT_LIMIT = 20;
    const MAX_LIMIT = 50;
    const MIN_LIMIT = 1;
    let parsedLimit = DEFAULT_LIMIT;

    if (typeof limit === "number" && Number.isFinite(limit)) {
      parsedLimit = Math.trunc(limit);
    } else if (typeof limit === "string") {
      const num = Number(limit);
      if (Number.isFinite(num)) parsedLimit = Math.trunc(num);
    }

    const finalLimit = Math.min(Math.max(parsedLimit || DEFAULT_LIMIT, MIN_LIMIT), MAX_LIMIT);

    // Initialize Supabase client with service role key (server-only)
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
      return new Response(
        JSON.stringify({ error: "server misconfiguration" }),
        { status: 500, headers: corsHeaders },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Generate embedding for the query using OpenAI
    const query = q.trim();
    console.log(`Semantic search for: "${query}" limit=${finalLimit}`);

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY env var");
      return new Response(
        JSON.stringify({ error: "server misconfiguration" }),
        { status: 500, headers: corsHeaders },
      );
    }

    // Generate embedding for the query
    let queryEmbedding: number[];
    try {
      const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: query,
          model: "text-embedding-3-small",
        }),
      });

      if (!embeddingResponse.ok) {
        const errorText = await embeddingResponse.text();
        console.error("OpenAI embedding error:", errorText);
        return new Response(
          JSON.stringify({ error: "embedding generation failed" }),
          { status: 500, headers: corsHeaders },
        );
      }

      const embeddingData = await embeddingResponse.json();
      queryEmbedding = embeddingData.data[0].embedding;
    } catch (e) {
      console.error("OpenAI embedding request failed:", e);
      return new Response(
        JSON.stringify({ error: "embedding generation failed" }),
        { status: 500, headers: corsHeaders },
      );
    }

    // Perform vector similarity search using RPC
    const { data, error } = await supabase.rpc("search_products_by_vector", {
      q_emb: queryEmbedding,
      limit_n: finalLimit,
    });

    if (error) {
      console.error("DB error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: corsHeaders },
      );
    }

    const results = (data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      price_cents: row.price_cents ?? null,
      distance: row.distance ?? null,
    }));

    return new Response(
      JSON.stringify({ results }),
      { headers: corsHeaders },
    );
  } catch (e) {
    console.error("Search function error:", e);
    const message = e instanceof Error ? e.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: corsHeaders },
    );
  }
});
