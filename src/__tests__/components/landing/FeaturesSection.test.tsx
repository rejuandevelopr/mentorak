import React from 'react'
import { render, screen } from '@testing-library/react'
import { FeaturesSection } from '@/components/landing/FeaturesSection'

describe('FeaturesSection', () => {
  it('renders the section heading', () => {
    render(<FeaturesSection />)
    
    expect(screen.getByText('Learn Smarter')).toBeInTheDocument()
    expect(screen.getByText('Everything you need for voice-powered learning')).toBeInTheDocument()
  })

  it('renders all four feature items', () => {
    render(<FeaturesSection />)
    
    expect(screen.getByText('PDF Upload & Processing')).toBeInTheDocument()
    expect(screen.getByText('Voice Interaction')).toBeInTheDocument()
    expect(screen.getByText('Progress Tracking')).toBeInTheDocument()
    expect(screen.getByText('AI-Powered Generation')).toBeInTheDocument()
  })

  it('renders feature descriptions', () => {
    render(<FeaturesSection />)
    
    expect(screen.getByText(/Upload any PDF document and our AI will extract key concepts/)).toBeInTheDocument()
    expect(screen.getByText(/Answer questions naturally using your voice/)).toBeInTheDocument()
    expect(screen.getByText(/Track your learning progress with detailed analytics/)).toBeInTheDocument()
    expect(screen.getByText(/Powered by OpenAI and ElevenLabs/)).toBeInTheDocument()
  })

  it('has proper responsive grid layout', () => {
    const { container } = render(<FeaturesSection />)
    
    const gridContainer = container.querySelector('dl')
    expect(gridContainer).toHaveClass('grid', 'lg:grid-cols-2')
  })

  it('renders feature icons', () => {
    const { container } = render(<FeaturesSection />)
    
    // Check that SVG icons are present (Heroicons render as SVG)
    const icons = container.querySelectorAll('svg')
    expect(icons).toHaveLength(4)
  })
})