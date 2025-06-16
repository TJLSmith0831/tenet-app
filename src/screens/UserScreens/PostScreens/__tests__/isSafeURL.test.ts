import { isSafeURL } from '../../../../utils/url';

describe('isSafeURL', () => {
  test('blocks known NSFW domains', () => {
    expect(isSafeURL('https://xvideos.com')).toBe(false);
    expect(isSafeURL('http://www.onlyfans.com')).toBe(false);
    expect(isSafeURL('https://foo.redtube')).toBe(false);
  });

  test('allows safe domains', () => {
    expect(isSafeURL('https://example.com')).toBe(true);
    expect(isSafeURL('https://subdomain.example.com')).toBe(true);
  });
});
