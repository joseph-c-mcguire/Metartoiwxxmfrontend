import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Login } from '@/app/components/auth/Login';

vi.mock('/utils/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('Login support links', () => {
  it('renders API docs, GitHub issues, and contact email links', () => {
    render(
      <Login
        onLogin={vi.fn()}
        onOpenTerms={vi.fn()}
        onOpenPrivacy={vi.fn()}
      />, 
    );

    expect(screen.getByRole('link', { name: 'Swagger UI' })).toHaveAttribute(
      'href',
      'https://metar-to-iwxxm-api.onrender.com/docs',
    );

    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/joseph-c-mcguire/metar-to-IWXXM/issues',
    );

    expect(screen.getByRole('link', { name: 'Joseph.c.mcg@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:Joseph.c.mcg@gmail.com',
    );
  });
});
