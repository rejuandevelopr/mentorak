import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { WelcomeSection } from '@/components/dashboard/WelcomeSection'
import { User } from 'firebase/auth'

describe('WelcomeSection', () => {
  const mockUser = {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
  } as User

  beforeEach(() => {
    // Mock Date to control greeting
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('displays user display name when available', () => {
    render(<WelcomeSection user={mockUser} />)

    expect(screen.getByText(/Test User/)).toBeInTheDocument()
  })

  it('displays email username when no display name', () => {
    const userWithoutDisplayName = {
      ...mockUser,
      displayName: null,
    } as User

    render(<WelcomeSection user={userWithoutDisplayName} />)

    expect(screen.getByText(/test/)).toBeInTheDocument()
  })

  it('displays "User" when no display name or email', () => {
    const userWithoutInfo = {
      ...mockUser,
      displayName: null,
      email: null,
    } as User

    render(<WelcomeSection user={userWithoutInfo} />)

    expect(screen.getByText(/User/)).toBeInTheDocument()
  })

  it('displays morning greeting before 12 PM', () => {
    vi.setSystemTime(new Date('2024-01-01 10:00:00'))

    render(<WelcomeSection user={mockUser} />)

    expect(screen.getByText(/Good morning/)).toBeInTheDocument()
  })

  it('displays afternoon greeting between 12 PM and 6 PM', () => {
    vi.setSystemTime(new Date('2024-01-01 14:00:00'))

    render(<WelcomeSection user={mockUser} />)

    expect(screen.getByText(/Good afternoon/)).toBeInTheDocument()
  })

  it('displays evening greeting after 6 PM', () => {
    vi.setSystemTime(new Date('2024-01-01 20:00:00'))

    render(<WelcomeSection user={mockUser} />)

    expect(screen.getByText(/Good evening/)).toBeInTheDocument()
  })

  it('displays motivational message', () => {
    render(<WelcomeSection user={mockUser} />)

    expect(
      screen.getByText('Ready to turn your PDFs into interactive voice quizzes?')
    ).toBeInTheDocument()
  })

  it('displays user avatar icon', () => {
    render(<WelcomeSection user={mockUser} />)

    const avatar = screen.getByRole('img', { hidden: true })
    expect(avatar).toBeInTheDocument()
  })
})