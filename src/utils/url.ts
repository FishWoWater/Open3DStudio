// Utility to prefix a relative URL with the API endpoint
export function getFullApiUrl(url: string | undefined, apiEndpoint: string): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  let endpoint = apiEndpoint;
  if (endpoint.endsWith('/')) endpoint = endpoint.slice(0, -1);
  if (!url.startsWith('/')) url = '/' + url;
  return endpoint + url;
} 