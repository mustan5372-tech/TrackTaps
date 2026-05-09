import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar, Cookie } from 'tough-cookie';

// Helper to create an axios instance with a cookie jar
export function createPodClient(cookieHeader = '') {
  const jar = new CookieJar();
  
  // If we have existing cookies from the client, populate the jar
  if (cookieHeader) {
    const cookies = cookieHeader.split(';');
    cookies.forEach(c => {
      try {
        const trimmed = c.trim();
        if (trimmed.startsWith('pod_') && !trimmed.startsWith('pod_token=')) {
          // Remove the 'pod_' prefix to restore the original cookie name
          const originalCookie = trimmed.substring(4);
          const cookie = Cookie.parse(originalCookie);
          if (cookie) {
            cookie.domain = 'api.pod.ai';
            jar.setCookieSync(cookie, 'https://api.pod.ai');
          }
        }
      } catch (e) {
        console.error('Error parsing cookie for jar:', e);
      }
    });
  }

  const client = wrapper(axios.create({
    jar,
    withCredentials: true,
    headers: {
      'X-College-Id': 'kiNdHC',
      'Origin': 'https://medicaps.pod.ai',
      'Referer': 'https://medicaps.pod.ai/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
    }
  }));

  return { client, jar };
}

export function parseCookies(cookieHeader) {
  const cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      cookies[parts[0].trim()] = parts[1].trim();
    });
  }
  return cookies;
}

export async function podFetch(url, options = {}, token, cookieHeader = '') {
  const { client, jar } = createPodClient(cookieHeader);
  
  const headers = {
    'Authorization': `Token ${token}`,
    ...options.headers
  };

  // Extract CSRF from jar if present
  const cookies = jar.getCookiesSync('https://api.pod.ai');
  const csrfCookie = cookies.find(c => c.key === 'csrftoken');
  if (csrfCookie) {
    headers['X-CSRFToken'] = csrfCookie.value;
  }

  console.log(`[Pod.ai Fetch] Requesting: ${url}`);
  
  try {
    const response = await client({
      url,
      method: options.method || 'GET',
      headers,
      data: options.body ? JSON.parse(options.body) : undefined,
      ...options,
      // Ensure we can see the raw body if it's not JSON
      validateStatus: () => true 
    });

    const contentType = response.headers['content-type'] || '';
    const status = response.status;

    console.log(`[Pod.ai Fetch] Response Status: ${status}`);
    
    if (!response.data && status !== 204) {
      console.warn(`[Pod.ai Fetch] Warning: Received empty response data for ${url}`);
    }

    if (contentType.includes('text/html') || (typeof response.data === 'string' && response.data.trim().startsWith('<!doctype'))) {
      const bodySnippet = typeof response.data === 'string' ? response.data.substring(0, 500) : 'Non-string body';
      console.log(`[Pod.ai Fetch] HTML Response detected from ${url}. Body snippet: ${bodySnippet}`);
      
      if (status === 401 || bodySnippet.includes('login')) {
        throw new Error('SESSION_EXPIRED');
      }
      throw new Error(`Pod.ai returned HTML instead of JSON (Status ${status}). This often happens when the URL is incorrect or a redirect occurred.`);
    }

    if (status >= 400) {
      console.error(`[Pod.ai Fetch] Error Status ${status}:`, response.data);
      throw new Error(response.data?.message || response.data?.error || `Pod.ai API error (${status})`);
    }

    return response.data;
  } catch (error) {
    console.error(`[Pod.ai Fetch] Exception during ${url}:`, error.message);
    throw error;
  }
}
