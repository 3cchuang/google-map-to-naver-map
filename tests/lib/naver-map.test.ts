import { getNaverLinks } from '@/lib/naver-map';
import { describe, it, expect } from 'vitest';

describe('getNaverLinks', () => {
  it('should generate correct links for a given query', () => {
    const query = 'Shake Shack Seomyeon';
    const links = getNaverLinks(query);
    const encoded = encodeURIComponent(query);

    expect(links.web).toBe(`https://map.naver.com/v5/search/${encoded}`);
    expect(links.ios).toContain(`query=${encoded}`);
    expect(links.ios).toContain('appname=com.joe.gmap2nmap');
    expect(links.android).toContain(`query=${encoded}`);
    expect(links.android).toContain('package=com.nhn.android.nmap');
  });

  it('should handle special characters in query', () => {
    const query = '쉐이크쉑 서면점';
    const links = getNaverLinks(query);
    const encoded = encodeURIComponent(query);

    expect(links.web).toBe(`https://map.naver.com/v5/search/${encoded}`);
    expect(links.ios).toContain(`query=${encoded}`);
  });
});
