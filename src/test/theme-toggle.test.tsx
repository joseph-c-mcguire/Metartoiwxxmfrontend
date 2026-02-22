import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from '@/app/components/ThemeToggle';

const { setThemeMock } = vi.hoisted(() => ({
  setThemeMock: vi.fn(),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: setThemeMock,
  }),
}));

describe('ThemeToggle', () => {
  it('toggles from dark to light mode', async () => {
    render(<ThemeToggle />);

    await waitFor(() => {
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    const toggle = screen.getByRole('switch', { name: 'Switch to light mode' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(toggle);
    expect(setThemeMock).toHaveBeenCalledWith('light');
  });
});
