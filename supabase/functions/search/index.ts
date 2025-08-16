import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mock grocery data for demonstration
const groceryItems = [
  { id: 1, name: "Whole Milk", price_cents: 349 },
  { id: 2, name: "2% Milk", price_cents: 329 },
  { id: 3, name: "Almond Milk", price_cents: 449 },
  { id: 4, name: "Oat Milk", price_cents: 499 },
  { id: 5, name: "Pasta - Penne", price_cents: 199 },
  { id: 6, name: "Pasta - Spaghetti", price_cents: 189 },
  { id: 7, name: "Pasta - Fusilli", price_cents: 209 },
  { id: 8, name: "Pasta Sauce - Marinara", price_cents: 249 },
  { id: 9, name: "Fresh Bread", price_cents: 299 },
  { id: 10, name: "Whole Wheat Bread", price_cents: 329 },
  { id: 11, name: "Bananas", price_cents: 129 },
  { id: 12, name: "Apples - Gala", price_cents: 199 },
  { id: 13, name: "Orange Juice", price_cents: 399 },
  { id: 14, name: "Greek Yogurt", price_cents: 549 },
  { id: 15, name: "Cheddar Cheese", price_cents: 449 },
  { id: 16, name: "Chicken Breast", price_cents: 699 },
  { id: 17, name: "Ground Beef", price_cents: 599 },
  { id: 18, name: "Salmon Fillet", price_cents: 899 },
  { id: 19, name: "Rice - Jasmine", price_cents: 329 },
  { id: 20, name: "Olive Oil", price_cents: 799 },
  { id: 21, name: "Eggs - Dozen", price_cents: 279 },
  { id: 22, name: "Butter", price_cents: 429 },
  { id: 23, name: "Cereal - Cheerios", price_cents: 549 },
  { id: 24, name: "Coffee Beans", price_cents: 1299 },
  { id: 25, name: "Green Tea", price_cents: 399 }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { q: query, limit = 10 } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query parameter "q" is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Searching for: "${query}" with limit: ${limit}`);

    // Filter items based on query (case-insensitive)
    const results = groceryItems
      .filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, Math.min(limit, 50)); // Cap at 50 results

    console.log(`Found ${results.length} results`);

    return new Response(
      JSON.stringify({ results }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Search function error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});