import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';

interface Recommendation {
  id: string;
  type: 'destination' | 'church' | 'mezmur' | 'news' | 'marketplace';
  title: string;
  subtitle?: string;
  imageUrl?: string;
  href: string;
  score: number;
  reason: 'popular' | 'trending' | 'similar' | 'personalized' | 'new';
}

interface RecommendationOptions {
  limit?: number;
  types?: Array<'destination' | 'church' | 'mezmur' | 'news' | 'marketplace'>;
  context?: string; // e.g., 'home', 'destination-detail', 'profile'
  entityId?: string; // For similarity-based recommendations
}

export function useRecommendations(options: RecommendationOptions = {}) {
  const { user } = useAuth();
  const { limit = 10, types, context, entityId } = options;

  return useQuery({
    queryKey: ['recommendations', { limit, types, context, entityId, userId: user?.id }],
    queryFn: async (): Promise<Recommendation[]> => {
      // In production, this would call your AI/ML recommendation API
      // For now, returning mock recommendations
      
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit, types, context, entityId, userId: user?.id }),
      });

      if (!response.ok) {
        // Fallback to empty array if API fails
        return [];
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!user, // Only load if user is authenticated
  });
}

// Personalized recommendations based on user behavior
export function usePersonalizedRecommendations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['personalized-recommendations', user?.id],
    queryFn: async (): Promise<Recommendation[]> => {
      const response = await fetch('/api/recommendations/personalized', {
        headers: { Authorization: `Bearer ${user?.id}` },
      });

      if (!response.ok) return [];
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!user,
  });
}

// Similar items (e.g., "Similar Destinations")
export function useSimilarItems(entityType: string, entityId: string, limit = 6) {
  return useQuery({
    queryKey: ['similar-items', entityType, entityId, limit],
    queryFn: async (): Promise<Recommendation[]> => {
      const response = await fetch(
        `/api/recommendations/similar?type=${entityType}&id=${entityId}&limit=${limit}`
      );

      if (!response.ok) return [];
      return response.json();
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Trending items
export function useTrendingItems(type?: string, limit = 10) {
  return useQuery({
    queryKey: ['trending', type, limit],
    queryFn: async (): Promise<Recommendation[]> => {
      const url = type
        ? `/api/recommendations/trending?type=${type}&limit=${limit}`
        : `/api/recommendations/trending?limit=${limit}`;

      const response = await fetch(url);
      if (!response.ok) return [];
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  });
}

// New items
export function useNewItems(type?: string, limit = 10) {
  return useQuery({
    queryKey: ['new-items', type, limit],
    queryFn: async (): Promise<Recommendation[]> => {
      const url = type
        ? `/api/recommendations/new?type=${type}&limit=${limit}`
        : `/api/recommendations/new?limit=${limit}`;

      const response = await fetch(url);
      if (!response.ok) return [];
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}

// Track recommendation clicks for learning
export function trackRecommendationClick(recommendationId: string, type: string) {
  fetch('/api/recommendations/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recommendationId, type, action: 'click' }),
  }).catch(console.error);
}

// Track recommendation views
export function trackRecommendationView(recommendationIds: string[]) {
  fetch('/api/recommendations/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recommendationIds, action: 'view' }),
  }).catch(console.error);
}
