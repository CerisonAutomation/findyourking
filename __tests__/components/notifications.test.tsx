/**
 * Notifications Component Tests
 * Verifies realtime notifications work correctly
 */

import { render, screen, waitFor } from '@testing-library/react'
import { Notifications } from '@/components/notifications'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}))

describe('Notifications', () => {
  const mockChannel = {
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(),
    state: 'joined',
  }

  const mockSupabase = {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    }),
    channel: jest.fn().mockReturnValue(mockChannel),
    removeChannel: jest.fn(),
    realtime: {
      setAuth: jest.fn().mockResolvedValue(undefined),
    },
  }

  beforeEach(() => {
    (createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  it('renders notification bell', () => {
    render(<Notifications />)
    const bell = screen.getByRole('button')
    expect(bell).toBeInTheDocument()
  })

  it('fetches initial notifications on mount', async () => {
    render(<Notifications />)
    
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
    })
  })

  it('subscribes to realtime channel with correct topic pattern', async () => {
    render(<Notifications />)
    
    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalledWith(
        expect.stringMatching(/^user:.+:notifications$/),
        expect.objectContaining({
          config: expect.objectContaining({
            private: true,
          }),
        })
      )
    })
  })

  it('sets auth before subscribing', async () => {
    render(<Notifications />)
    
    await waitFor(() => {
      expect(mockSupabase.realtime.setAuth).toHaveBeenCalledWith('test-token')
    })
  })
})

