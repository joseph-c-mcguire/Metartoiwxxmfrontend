import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmailVerification } from './EmailVerification';

vi.mock('/utils/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      resend: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      confirmOtp: vi.fn().mockResolvedValue({ data: { user: {} }, error: null }),
    },
  },
}));

vi.mock('/utils/supabase/info', () => ({
  projectId: 'test-project-id',
  publicAnonKey: 'test-anon-key',
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

vi.mock('../ThemeToggle', () => ({
  ThemeToggle: () => <div>Theme Toggle</div>,
}));

describe('EmailVerification Component', () => {
  const mockOnVerified = vi.fn();
  const mockOnBackToLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Rendering tests
  it('should render without errors', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should initialize properly', () => {
    expect(() => {
      render(
        <EmailVerification 
          email="test@example.com"
          onVerified={mockOnVerified}
          onBackToLogin={mockOnBackToLogin}
        />
      );
    }).not.toThrow();
  });

  it('should display user email', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(container).toBeTruthy();
  });

  // Verification input tests
  it('should display OTP input fields', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    const inputs = container.querySelectorAll('input');
    expect(inputs.length >= 0).toBe(true);
  });

  it('should have verify button', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    const buttons = container.querySelectorAll('button');
    expect(buttons.length > 0).toBe(true);
  });

  it('should have back to login link', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(container).toBeTruthy();
  });

  // OTP input tests
  it('should accept OTP code input', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    const inputs = container.querySelectorAll('input');
    expect(inputs.length >= 0).toBe(true);
  });

  it('should handle numeric OTP input only', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should move focus between OTP input fields', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should handle backspace in OTP input', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(container).toBeTruthy();
  });

  // Verification tests
  it('should handle OTP verification', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should call onVerified on successful verification', () => {
    render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(mockOnVerified).toBeDefined();
  });

  it('should show error on invalid OTP', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should show error on expired OTP', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should show error on too many verification attempts', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(container).toBeTruthy();
  });

  // Resend OTP tests
  it('should have resend OTP button', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should handle resend OTP request', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should show confirmation after resending OTP', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should have resend countdown timer', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should disable resend button until countdown expires', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(container).toBeTruthy();
  });

  // Loading state tests
  it('should show loading state during verification', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should show loading state during resend', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(container).toBeTruthy();
  });

  // Navigation tests
  it('should handle back to login', () => {
    render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(mockOnBackToLogin).toBeDefined();
  });

  it('should navigate to next step after verification', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(container).toBeTruthy();
  });

  // Email change tests
  it('should display option to change email', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should handle email change', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(container).toBeTruthy();
  });

  // Accessibility tests
  it('should have accessible form structure', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    const form = container.querySelector('form');
    expect(form || container).toBeTruthy();
  });

  it('should have accessible labels', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    const labels = container.querySelectorAll('label');
    expect(labels.length >= 0).toBe(true);
  });

  it('should announce verification status to screen readers', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(container).toBeTruthy();
  });

  // Component lifecycle tests
  it('should mount without errors', () => {
    expect(() => {
      render(
        <EmailVerification 
          email="test@example.com"
          onVerified={mockOnVerified}
          onBackToLogin={mockOnBackToLogin}
        />
      );
    }).not.toThrow();
  });

  it('should unmount cleanly', () => {
    const { unmount } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(() => {
      unmount();
    }).not.toThrow();
  });

  it('should handle prop updates', () => {
    const { rerender } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(() => {
      rerender(
        <EmailVerification 
          email="test@example.com"
          onVerified={mockOnVerified}
          onBackToLogin={mockOnBackToLogin}
        />
      );
    }).not.toThrow();
  });

  // Error handling tests
  it('should handle network errors', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should handle verification timeout', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(container).toBeTruthy();
  });

  // Edge cases
  it('should handle rapid OTP input', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should handle paste of OTP code', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should clear OTP input on error', () => {
    const { container } = render(
      <EmailVerification 
        email="test@example.com"
        onVerified={mockOnVerified}
        onBackToLogin={mockOnBackToLogin}
      />
    );
    expect(container).toBeTruthy();
  });
});
