import { describe, expect, it } from 'vitest';
import {
  assertDevelopmentCityTarget,
  approvedDevelopmentCities,
} from '../prisma/development-cities.js';

describe('explicit development city reference seed', () => {
  it('uses only documented mappings', () => {
    expect(approvedDevelopmentCities).toEqual([
      { name: 'Lahore', code: 'LHR' },
      { name: 'Faisalabad', code: 'FSD' },
      { name: 'Islamabad', code: 'ISB' },
    ]);
  });
  it('fails closed for production, remote and non-development database targets', () => {
    expect(() =>
      assertDevelopmentCityTarget(
        'postgresql://test@127.0.0.1/hopebridge_dev',
        'development',
      ),
    ).not.toThrow();
    for (const [url, mode] of [
      ['postgresql://test@127.0.0.1/hopebridge_dev', 'production'],
      ['postgresql://test@example.test/hopebridge_dev', 'development'],
      ['postgresql://test@127.0.0.1/hopebridge_prod', 'development'],
      ['https://localhost/hopebridge_dev', 'development'],
      ['', 'development'],
    ])
      expect(() => assertDevelopmentCityTarget(url!, mode)).toThrow();
  });
});
