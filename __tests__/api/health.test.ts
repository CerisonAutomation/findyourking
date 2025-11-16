/**
 * Health Check API Tests
 * Verifies the health endpoint returns correct status
 */

import { GET } from '@/app/api/health/route';

describe('/api/health', () => {
  it('returns 200 OK status', async () => {
    const request = new Request('http://localhost:3000/api/health');
    const response = await GET();

    expect(response.status).toBe(200);
  });

  it('returns JSON with status ok', async () => {
    const request = new Request('http://localhost:3000/api/health');
    const response = await GET();
    const data = await response.json();

    expect(data.status).toBe('ok');
  });

  it('includes timestamp', async () => {
    const request = new Request('http://localhost:3000/api/health');
    const response = await GET();
    const data = await response.json();

    expect(data.status).toBe('ok');
    expect(data.timestamp).toBeDefined();
    expect(typeof data.timestamp).toBe('number');
  });
});
