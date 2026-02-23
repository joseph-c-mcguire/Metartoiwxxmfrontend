import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/env', () => ({
  getRequiredEnvVar: vi.fn(() => 'http://auth.test'),
}));

import {
  confirmPasswordReset,
  getAccessToken,
  getCurrentUser,
  isLoggedIn,
  login,
  logout,
  register,
  requestPasswordReset,
} from '@/utils/authService';

describe('authService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('stores access and refresh tokens on successful login', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        user: { id: 'u1', email: 'pilot@example.com', metadata: {} },
        session: {
          access_token: 'access-1',
          refresh_token: 'refresh-1',
          expires_at: 2000000000,
        },
      }),
    } as Response);

    const result = await login({ email: 'pilot@example.com', password: 'secret' });

    expect(result.user.email).toBe('pilot@example.com');
    expect(getAccessToken()).toBe('access-1');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-1');
    expect(localStorage.getItem('expires_at')).toBe('2000000000');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://auth.test/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('throws service detail for failed login response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ detail: 'Invalid credentials' }),
    } as Response);

    await expect(login({ email: 'pilot@example.com', password: 'bad' })).rejects.toThrow('Invalid credentials');
  });

  it('stores tokens on successful registration when session is returned', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        user: { id: 'u2', email: 'new@example.com', metadata: { name: 'New User' } },
        session: {
          access_token: 'access-2',
          refresh_token: 'refresh-2',
          expires_at: 2100000000,
        },
      }),
    } as Response);

    const response = await register({
      email: 'new@example.com',
      password: 'Str0ngPass!',
      name: 'New User',
    });

    expect(response.user.email).toBe('new@example.com');
    expect(getAccessToken()).toBe('access-2');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-2');
  });

  it('returns current user without refresh when token is not expired', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    localStorage.setItem('access_token', 'existing-access');
    localStorage.setItem('refresh_token', 'existing-refresh');
    localStorage.setItem('expires_at', String(nowSeconds + 3600));

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'u3', email: 'ops@example.com', metadata: {} }),
    } as Response);

    const user = await getCurrentUser();

    expect(user.email).toBe('ops@example.com');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://auth.test/auth/me',
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer existing-access' },
      })
    );
  });

  it('refreshes token before fetching current user when access token is expired', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    localStorage.setItem('access_token', 'expired-access');
    localStorage.setItem('refresh_token', 'refresh-ok');
    localStorage.setItem('expires_at', String(nowSeconds - 10));

    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          access_token: 'refreshed-access',
          refresh_token: 'refreshed-refresh',
          expires_at: nowSeconds + 7200,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'u4', email: 'tower@example.com', metadata: {} }),
      } as Response);

    const user = await getCurrentUser();

    expect(user.email).toBe('tower@example.com');
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://auth.test/auth/refresh',
      expect.objectContaining({ method: 'POST' })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://auth.test/auth/me',
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer refreshed-access' },
      })
    );
    expect(getAccessToken()).toBe('refreshed-access');
    expect(localStorage.getItem('refresh_token')).toBe('refreshed-refresh');
  });

  it('clears tokens and throws when refresh fails', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    localStorage.setItem('access_token', 'expired-access');
    localStorage.setItem('refresh_token', 'bad-refresh');
    localStorage.setItem('expires_at', String(nowSeconds - 1));

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ detail: 'refresh failed' }),
    } as Response);

    await expect(getCurrentUser()).rejects.toThrow('Failed to refresh token');
    expect(getAccessToken()).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(localStorage.getItem('expires_at')).toBeNull();
  });

  it('clears tokens during logout even when logout endpoint fails', async () => {
    localStorage.setItem('access_token', 'to-clear');
    localStorage.setItem('refresh_token', 'to-clear-refresh');
    localStorage.setItem('expires_at', '2000000000');

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network issue'));

    await logout();

    expect(getAccessToken()).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(localStorage.getItem('expires_at')).toBeNull();
  });

  it('sends request payload for password reset request and returns response body', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: 'Reset email sent' }),
    } as Response);

    const result = await requestPasswordReset('pilot@example.com');

    expect(result).toEqual({ message: 'Reset email sent' });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://auth.test/auth/password-reset/request',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('sends bearer token and payload for password reset confirmation', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: 'Password reset complete' }),
    } as Response);

    const result = await confirmPasswordReset('reset-token-123', 'NewStrongPassword!');

    expect(result).toEqual({ message: 'Password reset complete' });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://auth.test/auth/password-reset/confirm',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer reset-token-123',
        },
        body: JSON.stringify({ new_password: 'NewStrongPassword!' }),
      })
    );
  });

  it('reports login state based on token presence and expiration', () => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    expect(isLoggedIn()).toBe(false);

    localStorage.setItem('access_token', 'active-token');
    localStorage.setItem('expires_at', String(nowSeconds + 1800));
    expect(isLoggedIn()).toBe(true);

    localStorage.setItem('expires_at', String(nowSeconds - 5));
    expect(isLoggedIn()).toBe(false);
  });
});
