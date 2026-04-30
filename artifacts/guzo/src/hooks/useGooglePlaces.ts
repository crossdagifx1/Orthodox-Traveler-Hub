import { useState, useEffect, useCallback } from 'react';

interface GooglePlace {
  place_id: string;
  name: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    viewport?: {
      northeast: { lat: number; lng: number };
      southwest: { lat: number; lng: number };
    };
  };
  photos?: Array<{ photo_reference: string; height: number; width: number }>;
  rating?: number;
  user_ratings_total?: number;
  formatted_address?: string;
  types?: string[];
  opening_hours?: {
    open_now?: boolean;
    periods?: Array<{
      open: { day: number; time: string };
      close: { day: number; time: string };
    }>;
  };
  website?: string;
  international_phone_number?: string;
}

interface GooglePlacesResponse {
  results: GooglePlace[];
  status: string;
  next_page_token?: string;
  error_message?: string;
}

// Fetch churches from our database instead of direct Google Places API
export function useEthiopianOrthodoxChurches() {
  const [data, setData] = useState<GooglePlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChurches() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/churches?country=Ethiopia');
        if (!response.ok) throw new Error('Failed to fetch churches');
        const churches = await response.json();
        
        // Convert database churches to Google Place format
        const convertedData = churches.map((church: any) => ({
          place_id: church.googlePlaceId || `db_${church.id}`,
          name: church.name,
          geometry: {
            location: {
              lat: church.latitude,
              lng: church.longitude,
            },
          },
          photos: church.photos?.map((ref: string) => ({ photo_reference: ref, height: 400, width: 400 })) || [],
          rating: church.rating,
          user_ratings_total: church.userRatingsTotal,
          formatted_address: church.address,
          types: church.types,
          opening_hours: church.openingHours,
          website: church.website,
          international_phone_number: church.internationalPhoneNumber,
        }));
        
        setData(convertedData);
        setError(null);
      } catch (err) {
        console.error('Error fetching churches:', err);
        setError('Failed to fetch churches');
        setData([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchChurches();
  }, []);

  return { data, isLoading, error };
}

export function usePlaceDetails(placeId: string) {
  const [apiKey] = useState(import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '');
  const [data, setData] = useState<GooglePlace | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!placeId || !apiKey) return;

    async function fetchPlaceDetails() {
      try {
        setIsLoading(true);
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}`;
        const response = await fetch(url);
        const responseData = await response.json();

        if (responseData.status !== 'OK') {
          console.error('Google Place Details error:', responseData.status);
          setError(responseData.error_message || 'Failed to fetch place details');
          return;
        }

        setData(responseData.result);
        setError(null);
      } catch (err) {
        console.error('Error fetching place details:', err);
        setError('Failed to fetch place details');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlaceDetails();
  }, [placeId, apiKey]);

  return { data, isLoading, error };
}

export function usePlacePhoto(photoReference: string, maxWidth = 400) {
  const [apiKey] = useState(import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '');

  return useCallback(() => {
    if (!apiKey || !photoReference) return null;
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${apiKey}`;
  }, [apiKey, photoReference, maxWidth]);
}

// Helper to convert Google Place to our marker format
export function googlePlaceToMarker(place: GooglePlace) {
  return {
    id: place.place_id,
    lat: place.geometry.location.lat,
    lng: place.geometry.location.lng,
    title: place.name,
    subtitle: place.formatted_address,
    imageUrl: place.photos?.[0] 
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY}`
      : undefined,
    detailsHref: `/churches/${place.place_id}`,
    badge: place.rating ? `⭐ ${place.rating.toFixed(1)}` : undefined,
    meta: [
      place.opening_hours?.open_now && 'Open Now',
      place.rating && { label: `${place.user_ratings_total} reviews` },
    ].filter(Boolean) as Array<{ label: string }>,
  };
}
