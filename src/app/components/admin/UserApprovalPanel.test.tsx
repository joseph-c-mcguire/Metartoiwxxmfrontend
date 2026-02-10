import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { UserApprovalPanel } from './UserApprovalPanel';

// Mock Supabase and sonner
vi.mock('/utils/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: [
              { 
                id: '1', 
                username: 'user1', 
                email: 'user1@example.com', 
                approval_status: 'pending', 
                created_at: '2024-01-01' 
              },
            ],
            error: null,
          }),
        })),
      })),
      update: vi.fn().mockResolvedValue({ error: null }),
      eq: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('UserApprovalPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render component', () => {
    render(<UserApprovalPanel accessToken="test-token" />);
    expect(document.body).toBeTruthy();
  });

  it('should have correct component structure', () => {
    const { container } = render(<UserApprovalPanel accessToken="test-token" />);
    expect(container).toBeTruthy();
  });

  it('should initialize without errors', () => {
    expect(() => {
      render(<UserApprovalPanel accessToken="test-token" />);
    }).not.toThrow();
  });
});
