import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OpenAIEmbeddingResponse {
  data: Array<{
    embedding: number[];
  }>;
}

async function generateEmbedding(text: string, openaiApiKey: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-3-small'
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data: OpenAIEmbeddingResponse = await response.json();
  return data.data[0].embedding;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message);
      await sleep(delay);
    }
  }
  
  throw lastError!;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
      throw new Error('Missing required environment variables');
    }

    // Parse request body for batch_size parameter
    let batchSize = 50;
    try {
      const body = await req.json();
      if (body.batch_size) {
        batchSize = Math.max(1, Math.min(200, parseInt(body.batch_size)));
      }
    } catch {
      // If no body or invalid JSON, use default batch_size
    }

    console.log(`Starting backfill with batch size: ${batchSize}`);

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch products without embeddings
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name')
      .is('embedding', null)
      .limit(batchSize);

    if (fetchError) {
      throw new Error(`Failed to fetch products: ${fetchError.message}`);
    }

    if (!products || products.length === 0) {
      console.log('No products found without embeddings');
      return new Response(
        JSON.stringify({ 
          scanned: 0, 
          embedded: 0, 
          skipped: 0, 
          batch_size: batchSize,
          message: 'No products found without embeddings'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Found ${products.length} products without embeddings`);

    let embedded = 0;
    let skipped = 0;

    // Process each product
    for (const product of products) {
      try {
        console.log(`Processing product ${product.id}: ${product.name}`);
        
        // Generate embedding with retry logic
        const embedding = await retryWithBackoff(
          () => generateEmbedding(product.name, openaiApiKey)
        );

        // Update the product with the embedding
        const { error: updateError } = await supabase
          .from('products')
          .update({ embedding })
          .eq('id', product.id);

        if (updateError) {
          console.error(`Failed to update product ${product.id}:`, updateError.message);
          skipped++;
        } else {
          console.log(`Successfully embedded product ${product.id}`);
          embedded++;
        }

        // Small delay to avoid rate limiting
        await sleep(100);

      } catch (error) {
        console.error(`Failed to process product ${product.id}:`, error.message);
        skipped++;
      }
    }

    const result = {
      scanned: products.length,
      embedded,
      skipped,
      batch_size: batchSize
    };

    console.log('Backfill complete:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in backfill_embeddings function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});