import { supabase } from './supabase';

/**
 * Make an authenticated API call to our backend.
 * Automatically includes the Supabase JWT in the Authorization header.
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  // Get the current session token from Supabase
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.set('Authorization', `Bearer ${session.access_token}`);
    }
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
