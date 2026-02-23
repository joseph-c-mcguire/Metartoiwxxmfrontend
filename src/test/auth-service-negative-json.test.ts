import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/env', () => ({
  getRequiredEnvVar: vi.fn(() => 'http://auth.test'),
}));

import {
  confirmPasswordReset,
  getAccessToken,
  getCurrentUser,
  login,
  register,
  requestPasswordReset,
} from '@/utils/authService';

describe('authService malformed JSON contracts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('falls back to Unknown error when login error payload is malformed JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => {
        throw new Error('malformed json');
      },
    } as unknown as Response);

    await expect(login({ email: 'pilot@example.com', password: 'bad-pass' })).rejects.toThrow('Unknown error');
  });

  it('falls back to Unknown error when register error payload is malformed JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => {
        throw new Error('invalid json payload');
      },
    } as unknown as Response);

    await expect(register({ email: 'new@example.com', password: 'weak' })).rejects.toThrow('Unknown error');
  });

  it('propagates parse failure when password reset request error payload is malformed JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => {
        throw new Error('cannot parse error payload');
      },
    } as unknown as Response);

    await expect(requestPasswordReset('pilot@example.com')).rejects.toThrow('cannot parse error payload');
  });

  it('propagates parse failure when password reset confirmation error payload is malformed JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => {
        throw new Error('broken confirm error payload');
      },
    } as unknown as Response);

    await expect(confirmPasswordReset('reset-token', 'new-password')).rejects.toThrow('broken confirm error payload');
  });

  it('clears tokens when refresh response JSON is malformed during getCurrentUser', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    localStorage.setItem('access_token', 'expired-access');
    localStorage.setItem('refresh_token', 'refresh-token');
    localStorage.setItem('expires_at', String(nowSeconds - 1));

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('refresh payload malformed');
      },
    } as unknown as Response);

    await expect(getCurrentUser()).rejects.toThrow('refresh payload malformed');
    expect(getAccessToken()).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(localStorage.getItem('expires_at')).toBeNull();
  });
});
