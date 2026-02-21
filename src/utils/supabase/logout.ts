/**
 * Sign out user with specified scope
 * Delegates to auth service for session management
 */

import { getAccessToken } from '../authService';

export async function signOutWithScope(scope: 'global' | 'local' | 'others'): Promise<boolean> {
  try {
    const authServiceUrl = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8003';
    const token = getAccessToken();

    if (!token) {
      return true;
    }
    
    const response = await fetch(`${authServiceUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ scope }),
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('Logout failed:', response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}
