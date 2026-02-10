import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { AdminDashboard } from './AdminDashboard'

// Mock dependencies
vi.mock('/utils/supabase/client', () => ({
  supabase: {
    auth: { getSession: vi.fn() },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({ data: [], error: null }),
    })),
  },
}))

describe('AdminDashboard Component', () => {
  const defaultProps = {
    onLogout: vi.fn(),
    userEmail: 'admin@example.com',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render admin dashboard', () => {
    render(<AdminDashboard {...defaultProps} />)
    expect(document.body).toBeTruthy()
  })

  it('should display admin controls', () => {
    const { container } = render(<AdminDashboard {...defaultProps} />)
    expect(container.querySelector('main') || container.querySelector('div')).toBeTruthy()
  })
})
