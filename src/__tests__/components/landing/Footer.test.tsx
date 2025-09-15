import React from 'react'
import { render, screen } from '@testing-library/react'
import { Footer } from '@/components/landing/Footer'

describe('Footer', () => {
  it('renders the get in touch section', () => {
    render(<Footer />)
    
    expect(screen.getByText('Get in touch')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'E-Mail' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Call us' })).toBeInTheDocument()
  })

  it('renders locations section', () => {
    render(<Footer />)
    
    expect(screen.getByText('Locations')).toBeInTheDocument()
    expect(screen.getByText('Head Office')).toBeInTheDocument()
    expect(screen.getByText('Remote Hub')).toBeInTheDocument()
    expect(screen.getByText('123 Innovation Drive')).toBeInTheDocument()
    expect(screen.getByText('San Francisco, CA 94105')).toBeInTheDocument()
  })

  it('renders connect section', () => {
    render(<Footer />)
    
    expect(screen.getByText('Connect')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'X/Twitter' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Newsletter' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Referral Program' })).toBeInTheDocument()
  })

  it('renders language section', () => {
    render(<Footer />)
    
    expect(screen.getByText('Language')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Deutsch' })).toBeInTheDocument()
  })

  it('renders legals section', () => {
    render(<Footer />)
    
    expect(screen.getByText('Legals')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Terms of Use' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Imprint' })).toBeInTheDocument()
  })

  it('renders copyright notice', () => {
    render(<Footer />)
    
    expect(screen.getByText(/©2025 Mentorak LLC/)).toBeInTheDocument()
  })

  it('has correct email link', () => {
    render(<Footer />)
    
    const emailLink = screen.getByRole('link', { name: 'E-Mail' })
    expect(emailLink).toHaveAttribute('href', 'mailto:hello@mentorak.com')
  })

  it('has black background styling', () => {
    const { container } = render(<Footer />)
    
    const footer = container.querySelector('footer')
    expect(footer).toHaveClass('bg-primary', 'text-white')
  })

  it('renders large background text', () => {
    const { container } = render(<Footer />)
    
    // Check for the large "Mentorak" background text
    const backgroundText = container.querySelector('div[style*="fontSize"]')
    expect(backgroundText).toBeInTheDocument()
    expect(backgroundText).toHaveTextContent('Mentorak')
  })

  it('has proper vertical layout structure', () => {
    const { container } = render(<Footer />)
    
    // Check for the main container with max-width
    const mainContainer = container.querySelector('.max-w-md')
    expect(mainContainer).toBeInTheDocument()
  })
})