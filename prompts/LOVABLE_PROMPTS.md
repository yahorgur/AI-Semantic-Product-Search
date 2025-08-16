# Prompts Used for AI-Semantic-Product-Search

This file contains the prompts used to generate the project with Lovable and ChatGPT.

---

## Prompt 1 — Frontend (Next.js + Tailwind)

You are building a super-simple web app named "Grocery Finder".

Tech:
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Fetches a Supabase Edge Function at: process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1/search"
- Auth: none (public demo). Use the anon key in the Authorization header.

Requirements:
- Single page at "/" with:
  - Centered card
  - Text input with placeholder "Search products…"
  - Debounce input by 300ms. Query fires when length >= 2.
  - Show a small "Searching…" loader when the request is in flight.
  - Render results as a clean list: product name (bold), optional price if returned.
  - Empty state: "No matches yet. Try 'milk' or 'pasta'."
  - Error state banner with error message.

- API Contract (from Edge Function):
  POST /search
    body: { q: string, limit?: number }
    returns: { results: Array<{ id: number, name: string, price_cents?: number }> }

- Implementation notes:
  - Read env vars NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
  - Use fetch with headers:
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      Content-Type: application/json
  - On each response, guard for non-200 and show error state.

- Styling:
  - Minimal Tailwind. Full-width input up to max-w-xl, rounded-lg, subtle shadow.
  - Results: zebra rows on hover.

- DX:
  - Provide a .env.example with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
  - Add npm scripts: dev, build, start, lint.
  - Include a short README explaining how to run locally.

---

## Prompt 2 — Supabase Edge Function (Deno/TS)

Create a Supabase Edge Function named "search" in TypeScript (Deno).

Database:
- Table: products
  columns:
    id bigserial primary key,
    name text not null,
    price_cents int null

RLS:
- Enable RLS on products.
- Policy: allow SELECT to anon and authenticated for demo.

Function behavior:
- Endpoint: POST /search
- Request JSON: { q: string, limit?: number }
- If q is missing or length < 2 -> return 400 with { error: "query too short" }.
- Default limit = 20, clamp to [1..50].
- Perform a case-insensitive search:
    SELECT id, name, price_cents
    FROM products
    WHERE name ILIKE '%' || q || '%'
    ORDER BY name ASC
    LIMIT limit;
- Return JSON: { results: Array<{ id, name, price_cents }> }

Implementation details:
- Use service role key inside the function (from env) or use standard client with RLS policies that allow read to anon.
- Read env:
    SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY (server only)
- Use the official Supabase JS client for Deno.
- Handle CORS: allow POST from localhost and Vercel previews (`*` is fine for demo).
- Robust error handling: return 500 with { error } on failure.

Also output the SQL snippets for:
- CREATE TABLE products…
- ALTER TABLE … ENABLE ROW LEVEL SECURITY;
- CREATE POLICY "read products" ON products FOR SELECT USING (true);

---

## Prompt — Edge Function: Backfill Missing Embeddings (OpenAI + pgvector)

You are updating the project "AI-Semantic-Product-Search".

Goal:
Create a Supabase Edge Function that finds rows in `products` where `embedding IS NULL`, generates embeddings with OpenAI (`text-embedding-3-small`, 1536 dims), and updates the `embedding` column. This is a one-off (can be re-run) backfill tool.

Scope & Deliverables:

1) Edge Function:
   - Path: supabase/functions/backfill_embeddings/index.ts
   - Runtime: Deno/TypeScript
   - Behavior:
     - Method: POST (no body required, optional batch_size param)
     - Fetch rows from `products` where `embedding IS NULL`, in batches (default 50, clamp 1..200).
     - For each row, embed the `name` field via OpenAI embeddings API (model `text-embedding-3-small`).
     - Update `products.embedding` with the returned vector.
     - Retry transient failures with exponential backoff.
     - Return JSON summary: { scanned, embedded, skipped, batch_size }
     - Include console logging for progress.

   - Env vars (read from secrets):
     - SUPABASE_URL
     - SUPABASE_SERVICE_ROLE_KEY
     - OPENAI_API_KEY

   - Implementation notes:
     - Use the official Supabase JS client for Deno.
     - Use fetch to call OpenAI: POST https://api.openai.com/v1/embeddings with headers:
       Authorization: Bearer ${OPENAI_API_KEY}; Content-Type: application/json
       body: { "input": "<name>", "model": "text-embedding-3-small" }
     - Ensure we never expose the service role key or OPENAI_API_KEY to the client.
     - Handle CORS for POST from localhost and Vercel previews (for convenience).

2) Prompt log:
   - Append this entire prompt (verbatim) to the end of `LOVABLE_PROMPTS.md` under a new header:
     ## Prompt — Edge Function: Backfill Missing Embeddings (OpenAI + pgvector)

Acceptance Criteria:
- Edge Function compiles and deploys.
- With existing rows where `embedding IS NULL`, it populates embeddings.
- No secrets are exposed to the frontend.
