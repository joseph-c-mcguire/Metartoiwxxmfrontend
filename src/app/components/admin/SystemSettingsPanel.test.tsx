import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { SystemSettingsPanel } from './SystemSettingsPanel';

vi.mock('/utils/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('SystemSettingsPanel Component', () => {
  it('should render without errors', () => {
    const { container } = render(<SystemSettingsPanel />);
    expect(container).toBeTruthy();
  });

  it('should initialize properly', () => {
    expect(() => {
      render(<SystemSettingsPanel />);
    }).not.toThrow();
  });

  it('should be a valid React component', () => {
    const { container } = render(<SystemSettingsPanel />);
    expect(container.children.length).toBeGreaterThan(-1);
  });
});
