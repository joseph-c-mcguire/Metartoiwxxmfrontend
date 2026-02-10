/**
 * Sign out user with specified scope
 * Delegates to auth service for session management
 */

export async function signOutWithScope(scope: 'global' | 'local' | 'others'): Promise<boolean> {
  try {
    const authServiceUrl = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8003';
    
    const response = await fetch(`${authServiceUrl}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
