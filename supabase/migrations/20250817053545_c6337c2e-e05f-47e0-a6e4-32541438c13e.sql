-- Create RPC function for vector search
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
as $$
  select id, name, price_cents,
         (embedding <-> q_emb) as distance
  from products
  where embedding is not null
  order by embedding <-> q_emb
  limit limit_n;
$$;

-- Grant execute permissions
grant execute on function search_products_by_vector(vector, int) to anon, authenticated;