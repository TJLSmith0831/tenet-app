export const normalizeUrl = (url: string): string => {
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
};

const unsafeDomains = ['porn', 'xvideos', 'redtube', 'onlyfans', 'nsfw', 'lush'];

/**
 * Checks if a given URL points to a known NSFW domain.
 *
 * @param normalizedURL - The URL string to validate
 * @returns true if safe, false if blocked
 */
export const isSafeURL = (normalizedURL: string): boolean => {
  try {
    const hostname = new URL(normalizedURL).hostname.toLowerCase();
    return !unsafeDomains.some(blocked => {
      const pattern = new RegExp(`(^|\\.)${blocked}($|\\.)`);
      return pattern.test(hostname);
    });
  } catch {
    return false; // invalid URL
  }
};
