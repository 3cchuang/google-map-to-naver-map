import { resolveGoogleMapsUrl } from '@/lib/google-maps';
import { describe, it, expect } from 'vitest';

describe('resolveGoogleMapsUrl', () => {
  it('should resolve short URLs and extract names', async () => {
    const url = 'https://maps.app.goo.gl/jhzmcZJWfPkv5JGn6';
    const result = await resolveGoogleMapsUrl(url);
    
    // We expect the name to at least contain the core place name.
    // Google's return value can be "Shake Shack 西面店" or "南韓 Busan... Shake Shack 西面店"
    expect(result.name.toLowerCase()).toContain('shake shack');
    expect(result.name).toContain('西面');
    
    // For Korean, it should at least contain some Korean characters or the English name if fallback occurred.
    // Based on debug, it contains the full address including "삼정타워" and "Shake Shack"
    expect(result.koreanName).toMatch(/[\uac00-\ud7af]|Shake Shack/);
  }, 20000);
});
