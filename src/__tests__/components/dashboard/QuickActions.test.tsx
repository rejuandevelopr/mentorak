import React from 'react'
import { render, screen } from '@testing-library/react'
import { QuickActions } from '@/components/dashboard/QuickActions'

describe('QuickActions', () => {
  it('renders quick actions section', () => {
    render(<QuickActions />)

    expect(screen.getByText('Quick Actions')).toBeInTheDocument()
  })

  it('displays upload PDF action with correct link', () => {
    render(<QuickActions />)

    const uploadLink = screen.getByRole('link', { name: /upload pdf/i })
    expect(uploadLink).toBeInTheDocument()
    expect(uploadLink).toHaveAttribute('href', '/upload')
    expect(screen.getByText('Create a new quiz')).toBeInTheDocument()
  })

  it('displays quiz history action with correct link', () => {
    render(<QuickActions />)

    const historyLink = screen.getByRole('link', { name: /quiz history/i })
    expect(historyLink).toBeInTheDocument()
    expect(historyLink).toHaveAttribute('href', '/history')
    expect(screen.getByText('View past quizzes')).toBeInTheDocument()
  })

  it('displays coming soon voice quiz action', () => {
    render(<QuickActions />)

    expect(screen.getByText('Voice Quiz')).toBeInTheDocument()
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
  })

  it('has proper grid layout', () => {
    render(<QuickActions />)

    const grid = screen.getByText('Quick Actions').nextElementSibling
    expect(grid).toHaveClass(
      'grid',
      'grid-cols-1',
      'sm:grid-cols-2',
      'lg:grid-cols-3',
      'gap-4'
    )
  })

  it('upload action has proper styling', () => {
    render(<QuickActions />)

    const uploadLink = screen.getByRole('link', { name: /upload pdf/i })
    expect(uploadLink).toHaveClass(
      'flex',
      'items-center',
      'p-4',
      'bg-blue-50',
      'hover:bg-blue-100',
      'rounded-lg',
      'border',
      'border-blue-200',
      'transition-colors',
      'group'
    )
  })

  it('history action has proper styling', () => {
    render(<QuickActions />)

    const historyLink = screen.getByRole('link', { name: /quiz history/i })
    expect(historyLink).toHaveClass(
      'flex',
      'items-center',
      'p-4',
      'bg-green-50',
      'hover:bg-green-100',
      'rounded-lg',
      'border',
      'border-green-200',
      'transition-colors',
      'group'
    )
  })
})