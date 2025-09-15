import React from 'react'
import { render, screen } from '@testing-library/react'
import { HeroSection } from '@/components/landing/HeroSection'

describe('HeroSection', () => {
  it('renders the main heading', () => {
    render(<HeroSection />)
    
    expect(screen.getByText('Transform PDFs into')).toBeInTheDocument()
    expect(screen.getByText('Voice-Powered Quizzes')).toBeInTheDocument()
  })

  it('renders the description text', () => {
    render(<HeroSection />)
    
    expect(screen.getByText(/Upload any PDF document and let AI create personalized quizzes/)).toBeInTheDocument()
  })

  it('renders the Get Started button with correct link', () => {
    render(<HeroSection />)
    
    const getStartedButton = screen.getByRole('link', { name: /Get Started Free/i })
    expect(getStartedButton).toBeInTheDocument()
    expect(getStartedButton).toHaveAttribute('href', '/signup')
  })

  it('renders the Watch Demo button', () => {
    render(<HeroSection />)
    
    expect(screen.getByRole('button', { name: /Watch Demo/i })).toBeInTheDocument()
  })

  it('renders the hero visual section', () => {
    render(<HeroSection />)
    
    expect(screen.getByText('Voice-First Learning')).toBeInTheDocument()
    expect(screen.getByText('Interactive quiz preview coming soon')).toBeInTheDocument()
  })

  it('has responsive design classes', () => {
    const { container } = render(<HeroSection />)
    
    // Check for responsive classes on main container
    const section = container.querySelector('section')
    expect(section).toHaveClass('py-24', 'sm:py-32')
    
    // Check for responsive text classes
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveClass('text-4xl', 'sm:text-6xl')
  })
})