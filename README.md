# 🛒 AI Semantic Product Search

A demo web app that showcases **semantic search for supermarket products** using:

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
- 🔍 **Vector search** with pgvector (semantic similarity)  
- 🛠 **Supabase Edge Function** handles queries + embeddings  
- 📦 **Seeded supermarket dataset** (~40 items like milk, pasta, chocolate)  
- 🎨 **Next.js + Tailwind** frontend with simple UI:
  - Input box
  - Loading & error states
  - Result list with product names & prices  

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
