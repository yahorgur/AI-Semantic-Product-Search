-- Fix the search path for the RPC function
create or replace function search_products_by_vector(
  q_emb vector,
  limit_n int default 20
)
returns table (
  id bigint,
  name text,
  price_cents bigint,
  distance double precision
)
language sql
security definer
set search_path = public
as $$
  select id, name, price_cents,
         (embedding <-> q_emb) as distance
  from products
  where embedding is not null
  order by embedding <-> q_emb
  limit limit_n;
$$;

-- Add RLS policies for products table to fix the RLS warning
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow all users to read products (for demo purposes as specified in original requirements)
CREATE POLICY "read products" ON products FOR SELECT USING (true);