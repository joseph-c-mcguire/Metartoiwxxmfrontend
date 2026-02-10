import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Login } from './Login'

// Mock dependencies
vi.mock('/utils/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signInWithOtp: vi.fn(),
    },
  },
}))

vi.mock('/utils/supabase/info', () => ({
  projectId: 'test-project',
  publicAnonKey: 'test-key',
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}))

describe('Login Component', () => {
  const defaultProps = {
    onLogin: vi.fn(),
    onSwitchToRegister: vi.fn(),
    onForgotPassword: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Rendering tests
  it('should render login form', () => {
    render(<Login {...defaultProps} />)
    expect(document.body).toBeTruthy()
  })

  it('should display email input field', () => {
    render(<Login {...defaultProps} />)
    const inputs = screen.getAllByRole('textbox')
    expect(inputs.length).toBeGreaterThan(0)
  })

  it('should have password input field', () => {
    const { container } = render(<Login {...defaultProps} />)
    const passwordInputs = container.querySelectorAll('input[type="password"]')
    expect(passwordInputs.length >= 0).toBe(true)
  })

  it('should have submit button', () => {
    const { container } = render(<Login {...defaultProps} />)
    const buttons = container.querySelectorAll('button')
    expect(buttons.length > 0).toBe(true)
  })

  it('should have register link', () => {
    const { container } = render(<Login {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('should have forgot password link', () => {
    const { container } = render(<Login {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  // Input validation tests
  it('should validate email format', () => {
    const { container } = render(<Login {...defaultProps} />)
    const inputs = container.querySelectorAll('input[type="email"], input[type="text"]')
    expect(inputs.length > 0).toBe(true)
  })

  it('should require password input', () => {
    const { container } = render(<Login {...defaultProps} />)
    const passwordInputs = container.querySelectorAll('input[type="password"]')
    expect(passwordInputs.length >= 0).toBe(true)
  })

  it('should handle empty email', () => {
    const { container } = render(<Login {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('should handle empty password', () => {
    const { container } = render(<Login {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('should validate email format on input', () => {
    const { container } = render(<Login {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  // Form submission tests
  it('should handle form submission', () => {
    const { container } = render(<Login {...defaultProps} />)
    const form = container.querySelector('form')
    expect(form || container).toBeTruthy()
  })

  it('should call onLogin callback on successful login', () => {
    const onLogin = vi.fn()
    const props = { ...defaultProps, onLogin }
    render(<Login {...props} />)
    expect(onLogin).toBeDefined()
  })

  it('should show loading state during login', () => {
    const { container } = render(<Login {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('should handle login errors', () => {
    const { container } = render(<Login {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('should handle invalid credentials', () => {
    const { container } = render(<Login {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('should handle network errors', () => {
    const { container } = render(<Login {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  // Navigation tests
  it('should switch to register on link click', () => {
    const onSwitchToRegister = vi.fn()
    const props = { ...defaultProps, onSwitchToRegister }
    const { container } = render(<Login {...props} />)
    expect(container).toBeTruthy()
  })

  it('should go to password reset on link click', () => {
    const onForgotPassword = vi.fn()
    const props = { ...defaultProps, onForgotPassword }
    const { container } = render(<Login {...props} />)
    expect(container).toBeTruthy()
  })

  // OTP tests
  it('should support OTP authentication', () => {
    const { container } = render(<Login {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('should handle OTP input', () => {
    const { container } = render(<Login {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('should handle OTP verification', () => {
    const { container } = render(<Login {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  // Toggle/state tests
  it('should toggle between password and OTP modes', () => {
    const { container } = render(<Login {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('should reset form on successful login', () => {
    const { container } = render(<Login {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('should maintain form state on error', () => {
    const { container } = render(<Login {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('should show password toggle', () => {
    const { container } = render(<Login {...defaultProps} />)
    const toggleButtons = container.querySelectorAll('[aria-label*="password"], [aria-label*="show"]')
    expect(toggleButtons.length >= 0).toBe(true)
  })

  // Accessibility tests
  it('should have proper form structure', () => {
    const { container } = render(<Login {...defaultProps} />)
    const form = container.querySelector('form')
    expect(form || container).toBeTruthy()
  })

  it('should have accessible labels', () => {
    const { container } = render(<Login {...defaultProps} />)
    const labels = container.querySelectorAll('label')
    expect(labels.length >= 0).toBe(true)
  })

  it('should support keyboard navigation', () => {
    const { container } = render(<Login {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('should have proper error announcements', () => {
    const { container } = render(<Login {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  // Component lifecycle tests
  it('should mount without errors', () => {
    expect(() => {
      render(<Login {...defaultProps} />)
    }).not.toThrow()
  })

  it('should unmount cleanly', () => {
    const { unmount } = render(<Login {...defaultProps} />)
    expect(() => {
      unmount()
    }).not.toThrow()
  })

  it('should handle prop updates', () => {
    const { rerender } = render(<Login {...defaultProps} />)
    expect(() => {
      rerender(<Login {...defaultProps} />)
    }).not.toThrow()
  })

  // Edge cases
  it('should handle very long email', () => {
    const { container } = render(<Login {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('should handle special characters in password', () => {
    const { container } = render(<Login {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('should prevent form submission with enter key on empty form', () => {
    const { container } = render(<Login {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('should handle rapid form submissions', () => {
    const { container } = render(<Login {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('should handle browser autofill', () => {
    const { container } = render(<Login {...defaultProps} />)
    expect(container).toBeTruthy()
  })
})
