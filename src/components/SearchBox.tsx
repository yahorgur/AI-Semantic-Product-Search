import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ShoppingCart, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SearchResult {
  id: number;
  name: string;
  price_cents?: number;
}

interface SearchResponse {
  results: SearchResult[];
}

const SearchBox = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPrice = (priceCents: number) => {
    return `$${(priceCents / 100).toFixed(2)}`;
  };

  const searchProducts = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        'https://mvfhcykdmzuwcmgussar.supabase.co/functions/v1/search',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12ZmhjeWtkbXp1d2NtZ3Vzc2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMjk3NzksImV4cCI6MjA3MDkwNTc3OX0.kXegy2tPxGB8dVg-mP06B3hgSPJU1tedkhkXpTkgRQA`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ q: searchQuery, limit: 10 }),
        }
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProducts(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchProducts]);

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      <Card className="shadow-lg border-grocery-green/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart className="h-6 w-6 text-grocery-green" />
            <h1 className="text-2xl font-bold text-grocery-green">Grocery Finder</h1>
          </div>
          
          <div className="relative">
            <Input
              type="text"
              placeholder="Search products…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border-grocery-green/30 focus:border-grocery-green focus:ring-grocery-green"
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-grocery-green" />
              </div>
            )}
          </div>
          
          {isLoading && (
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Searching…
            </p>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && query.length >= 2 && results.length === 0 && (
        <Card className="border-muted">
          <CardContent className="p-6 text-center text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No matches yet. Try 'milk' or 'pasta'.</p>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <Card className="shadow-md">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {results.map((item, index) => (
                <div
                  key={item.id}
                  className={`p-4 transition-colors hover:bg-grocery-surface-hover ${
                    index % 2 === 0 ? 'bg-grocery-surface' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{item.name}</span>
                    {item.price_cents && (
                      <span className="text-grocery-green font-medium">
                        {formatPrice(item.price_cents)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SearchBox;