/**
 * Sync Ethiopian Orthodox churches from Google Places API
 * This can be called periodically (e.g., via cron job) to keep the database up to date
 */

export async function syncChurchesFromGooglePlaces(apiKey: string) {
  const location = "9.145,40.489673"; // Center of Ethiopia
  const radius = 500000; // 500km radius covering most of Ethiopia
  const query = "Ethiopian Orthodox Church OR Tewahedo Church OR Orthodox Cathedral";

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&keyword=${encodeURIComponent(query)}&key=${apiKey}`;
  const response = await fetch(url);
  const data: any = await response.json();

  if (data.status !== "OK") {
    throw new Error(`Google Places API error: ${data.status}`);
  }

  return {
    total: data.results?.length || 0,
    next_page_token: data.next_page_token,
  };
}

/**
 * Run a full sync of all Ethiopian Orthodox churches
 * This handles pagination if there are more than 20 results
 */
export async function fullChurchSync(apiKey: string) {
  let totalSynced = 0;
  let totalUpdated = 0;
  let nextPageToken: string | undefined;

  do {
    const location = "9.145,40.489673";
    const radius = 500000;
    const query = "Ethiopian Orthodox Church OR Tewahedo Church OR Orthodox Cathedral";

    let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&keyword=${encodeURIComponent(query)}&key=${apiKey}`;
    if (nextPageToken) {
      url += `&pagetoken=${nextPageToken}`;
    }

    const response = await fetch(url);
    const data: any = await response.json();

    if (data.status !== "OK") {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    // For each batch of churches, we would sync them to the database
    // This is handled by the API endpoint at POST /api/churches/sync-google-places
    // Call that endpoint to sync this batch
    const syncResponse = await fetch(`${process.env.API_URL || 'http://localhost:8080'}/api/churches/sync-google-places`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_SECRET || 'dev-secret'}`,
      },
    });

    if (!syncResponse.ok) {
      const error = await syncResponse.json();
      console.error('Sync batch error:', error);
    } else {
      const result: any = await syncResponse.json();
      totalSynced += result.synced || 0;
      totalUpdated += result.updated || 0;
    }

    nextPageToken = data.next_page_token;
    
    // Rate limiting - Google Places API has limits
    if (nextPageToken) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    }
  } while (nextPageToken);

  return {
    totalSynced,
    totalUpdated,
  };
}
