import { describe, it, expect, vi } from 'vitest';
import { processFile, validateFile, ApiError } from './api';

function makeFile(name, type, size = 100) {
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], name, { type });
}

describe('validateFile', () => {
  it('accepts a PDF', () => {
    expect(validateFile(makeFile('a.pdf', 'application/pdf'))).toBeNull();
  });
  it('accepts a PNG', () => {
    expect(validateFile(makeFile('a.png', 'image/png'))).toBeNull();
  });
  it('rejects a txt file', () => {
    expect(validateFile(makeFile('a.txt', 'text/plain'))).toMatch(/unsupported/i);
  });
  it('rejects an oversized file', () => {
    const big = makeFile('a.pdf', 'application/pdf', 1);
    Object.defineProperty(big, 'size', { value: 20 * 1024 * 1024 });
    expect(validateFile(big)).toMatch(/too large/i);
  });
  it('rejects nothing chosen', () => {
    expect(validateFile(null)).toMatch(/choose/i);
  });
});

describe('processFile', () => {
  it('posts to /api/process and returns the body', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'success', keyphrases: ['transformer'], papers: [] })
    });
    const res = await processFile(makeFile('a.pdf', 'application/pdf'), { fetch: fetchImpl });
    expect(fetchImpl).toHaveBeenCalledWith('/api/process', expect.objectContaining({ method: 'POST' }));
    expect(res.keyphrases).toEqual(['transformer']);
  });

  it('throws a validation ApiError before fetching', async () => {
    const fetchImpl = vi.fn();
    await expect(
      processFile(makeFile('a.txt', 'text/plain'), { fetch: fetchImpl })
    ).rejects.toBeInstanceOf(ApiError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('maps a server error body to an ApiError', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ status: 'error', code: 'ENGINE_UNAVAILABLE', message: 'down' })
    });
    await expect(
      processFile(makeFile('a.pdf', 'application/pdf'), { fetch: fetchImpl })
    ).rejects.toMatchObject({ code: 'ENGINE_UNAVAILABLE', status: 503 });
  });

  it('maps a network failure to a NETWORK ApiError', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('boom'));
    await expect(
      processFile(makeFile('a.pdf', 'application/pdf'), { fetch: fetchImpl })
    ).rejects.toMatchObject({ code: 'NETWORK' });
  });
});
