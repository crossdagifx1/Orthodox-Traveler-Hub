import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// Simple debounce implementation
function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface SearchResult {
  id: string;
  type: 'destination' | 'church' | 'mezmur' | 'news' | 'marketplace' | 'user';
  title: string;
  subtitle?: string;
  imageUrl?: string;
  href: string;
  score?: number;
}

interface UseInstantSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  maxResults?: number;
  enabled?: boolean;
}

// Local search implementation using Fuse.js-style fuzzy matching
function createSearchIndex(items: SearchResult[]) {
  const normalize = (str: string) => str.toLowerCase().trim();
  
  return {
    search: (query: string): SearchResult[] => {
      const normalizedQuery = normalize(query);
      const terms = normalizedQuery.split(/\s+/);
      
      return items
        .map((item) => {
          const title = normalize(item.title);
          const subtitle = normalize(item.subtitle || '');
          
          let score = 0;
          
          // Exact match bonus
          if (title === normalizedQuery) score += 100;
          if (subtitle === normalizedQuery) score += 80;
          
          // Partial matches
          if (title.includes(normalizedQuery)) score += 50;
          if (subtitle.includes(normalizedQuery)) score += 30;
          
          // Individual term matching
          terms.forEach((term) => {
            if (title.includes(term)) score += 20;
            if (subtitle.includes(term)) score += 10;
          });
          
          return { item, score };
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ item }) => item);
    },
  };
}

export function useInstantSearch(options: UseInstantSearchOptions = {}) {
  const {
    debounceMs = 150,
    minQueryLength = 2,
    maxResults = 10,
    enabled = true,
  } = options;

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce the query
  const debouncedSetQuery = useRef(
    debounce((value: string) => {
      setDebouncedQuery(value);
    }, debounceMs)
  ).current;

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    debouncedSetQuery(value);
    setIsOpen(value.length >= minQueryLength);
  }, [debouncedSetQuery, minQueryLength]);

  // Fetch search index
  const { data: searchIndex, isLoading } = useQuery({
    queryKey: ['search-index'],
    queryFn: async () => {
      // In production, this would fetch from your search API
      // For now, returning empty array - populate with your actual data
      const response = await fetch('/api/search/index');
      if (!response.ok) throw new Error('Failed to load search index');
      const items: SearchResult[] = await response.json();
      return createSearchIndex(items);
    },
    enabled: enabled && debouncedQuery.length >= minQueryLength,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Perform search
  const results = debouncedQuery.length >= minQueryLength && searchIndex
    ? searchIndex.search(debouncedQuery).slice(0, maxResults)
    : [];

  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  }, []);

  const selectResult = useCallback((result: SearchResult) => {
    clearSearch();
    // Navigation handled by caller
    return result;
  }, [clearSearch]);

  // Keyboard navigation
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          selectResult(results[selectedIndex]);
        }
        break;
      case 'Escape':
        clearSearch();
        break;
    }
  }, [isOpen, results, selectedIndex, clearSearch, selectResult]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [debouncedQuery]);

  return {
    query,
    setQuery: handleQueryChange,
    debouncedQuery,
    results,
    isLoading,
    isOpen,
    setIsOpen,
    selectedIndex,
    handleKeyDown,
    clearSearch,
    selectResult,
    inputRef,
    hasResults: results.length > 0,
  };
}

// Group results by type
export function groupSearchResults(results: SearchResult[]) {
  return results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);
}

// Get icon for result type
export function getResultTypeIcon(type: SearchResult['type']) {
  const icons = {
    destination: 'MapPin',
    church: 'Church',
    mezmur: 'Music',
    news: 'Newspaper',
    marketplace: 'ShoppingBag',
    user: 'User',
  };
  return icons[type] || 'Search';
}

// Highlight matching text
export function highlightMatch(text: string, query: string) {
  if (!query) return text;
  
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, i) => 
    part.toLowerCase() === query.toLowerCase() ? (
      `<mark class="bg-primary/20 text-primary font-medium rounded px-0.5">${part}</mark>`
    ) : part
  ).join('');
}
