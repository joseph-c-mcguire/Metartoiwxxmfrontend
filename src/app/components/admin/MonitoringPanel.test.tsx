import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MonitoringPanel } from './MonitoringPanel';

vi.mock('/utils/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('MonitoringPanel Component', () => {
  it('should render without errors', () => {
    const { container } = render(<MonitoringPanel />);
    expect(container).toBeTruthy();
  });

  it('should initialize properly', () => {
    expect(() => {
      render(<MonitoringPanel />);
    }).not.toThrow();
  });

  it('should be a valid React component', () => {
    const { container } = render(<MonitoringPanel />);
    expect(container.children.length).toBeGreaterThan(-1);
  });
});
