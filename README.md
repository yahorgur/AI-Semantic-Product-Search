# 🛒 AI Semantic Product Search

This is a demo web application showcasing AI-powered semantic product search for supermarkets.

## Semantic Search with pgvector

This application uses semantic vector search to find products based on meaning rather than exact text matches. Here's how it works:

### How Semantic Search Works

1. **Embedding Generation**: When you search for "milk", the system generates a 1536-dimensional vector embedding using OpenAI's `text-embedding-3-small` model
2. **Vector Similarity**: The search compares your query embedding against pre-computed embeddings of all product names using cosine similarity
3. **Intelligent Results**: Instead of only finding products with "milk" in the name, it can find related items like "Butter", "Cheese", "Yogurt" based on semantic similarity

### Benefits Over Traditional Search

- **Semantic Understanding**: Searching "dairy" returns milk, cheese, butter, yogurt
- **Typo Tolerance**: Misspellings often still return correct results  
- **Contextual Matches**: "breakfast items" might return cereals, milk, bread
- **Multilingual Potential**: Can work across languages (with proper training data)

### Technical Implementation

The search flow:
1. User types query → Frontend sends to Edge Function
2. Edge Function generates embedding using OpenAI API
3. Supabase RPC function `search_products_by_vector()` performs vector similarity search
4. Results ranked by semantic similarity (lower distance = more similar)
5. Frontend displays products with similarity scores

This approach provides a much more intuitive and powerful search experience compared to traditional text-based matching.

- **Supabase Postgres + pgvector** (vector database)
- **OpenAI embeddings** for semantic meaning
- **Supabase Edge Functions** for search logic
- **Next.js frontend** for the UI

Unlike traditional keyword search, this app understands **meaning**, not just exact words.  
For example:
- Searching for **“choco”** returns *Dark Chocolate 70% 100g*
- Searching for **“dairy”** returns *Milk, Yogurt, Cheese*
- Searching for **“cooking oil”** finds *Olive Oil 1L*

👉 Live Demo: *[add your Lovable link here]*

---

## ✨ Features

- **Semantic Vector Search**: Uses pgvector with OpenAI embeddings for intelligent product matching
- **Supabase Edge Function**: Handles queries and generates embeddings using OpenAI text-embedding-3-small
- **Seeded Dataset**: ~40 supermarket products ready to search
- **Next.js + Tailwind**: Simple UI with input, loading/error states, and results
- **Real-time Results**: Debounced search with instant semantic feedback

---

## 🏗️ Architecture
```
Next.js UI  →  Supabase Edge Function  →  Supabase Postgres (pgvector)
        (query)             (embedding)            (semantic search)
```

**Flow:**
1. Product names/descriptions are embedded with OpenAI and stored in Postgres.  
2. User enters a query → converted into an embedding.  
3. Database retrieves semantically similar products via `embedding <-> q_emb`.  
4. Results are returned and displayed in the UI.  

---

## 🚀 Getting Started

### 1. Clone
```bash
git clone https://github.com/<your-username>/AI-Semantic-Product-Search.git
cd AI-Semantic-Product-Search
```

### 2. Setup Supabase
Run in Supabase SQL editor:
```sql
create extension if not exists vector;

create table products (
  id bigserial primary key,
  name text not null,
  price_cents int,
  embedding vector(1536)
);

alter table products enable row level security;
create policy "public read" on products for select using (true);
```

### 3. Seed Products
Insert sample supermarket items (milk, bread, pasta, chocolate, etc).  
*(See `db/seed.sql` for an example dataset.)*

### 4. Backfill Embeddings
For each product, generate embeddings with OpenAI (`text-embedding-3-small`) and update the `embedding` column.

### 5. Deploy Edge Function
```bash
supabase functions deploy search
supabase secrets set OPENAI_API_KEY=your-openai-key
```

### 6. Run Frontend
Create `.env.local` in the Next.js app:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Then:
```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🧪 Example Queries
- `milk` → Milk, Yogurt, Butter  
- `pasta` → Spaghetti, Tomato Sauce  
- `choco` → Dark Chocolate, Peanut Butter  
- `dairy` → Milk, Cheese, Yogurt  

---

## 🛤 Roadmap
- [x] Semantic vector search with pgvector  
- [ ] Add **hybrid search** (BM25 + vector fusion)  
- [ ] Add **reranker** for better relevance  
- [ ] Deploy backend on **Kubernetes** for scalability  

---

## 🙋 About
This project demonstrates how to integrate **AI-powered search** into real-world apps.  
Built with **Supabase, Next.js, and OpenAI embeddings**.  

Author: *Yahor Zhylinski* — Backend Engineer exploring **Python, Go, TypeScript, Ruby On Rails, AI integrations, and cloud infrastructure**.
