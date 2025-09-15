import React from 'react'
import { render, screen } from '@testing-library/react'
import { DemoPreview } from '@/components/landing/DemoPreview'

describe('DemoPreview', () => {
  it('renders the section heading', () => {
    render(<DemoPreview />)
    
    expect(screen.getByText('See Mentorak in Action')).toBeInTheDocument()
    expect(screen.getByText(/Experience how easy it is to transform your study materials/)).toBeInTheDocument()
  })

  it('renders all four demo steps', () => {
    render(<DemoPreview />)
    
    expect(screen.getByText('Upload Your PDF')).toBeInTheDocument()
    expect(screen.getByText('AI Generates Questions')).toBeInTheDocument()
    expect(screen.getByText('Voice Interaction')).toBeInTheDocument()
    expect(screen.getByText('Track Progress')).toBeInTheDocument()
  })

  it('renders step numbers', () => {
    render(<DemoPreview />)
    
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('renders the sample quiz question', () => {
    render(<DemoPreview />)
    
    expect(screen.getByText('Sample Quiz Question')).toBeInTheDocument()
    expect(screen.getByText(/What is the primary function of mitochondria/)).toBeInTheDocument()
  })

  it('renders quiz answer options', () => {
    render(<DemoPreview />)
    
    expect(screen.getByText('A) Protein synthesis')).toBeInTheDocument()
    expect(screen.getByText('B) DNA replication')).toBeInTheDocument()
    expect(screen.getByText('C) Energy production (ATP synthesis)')).toBeInTheDocument()
    expect(screen.getByText('D) Waste removal')).toBeInTheDocument()
  })

  it('renders the Start Learning Today button with correct link', () => {
    render(<DemoPreview />)
    
    const startLearningButton = screen.getByRole('link', { name: /Start Learning Today/i })
    expect(startLearningButton).toBeInTheDocument()
    expect(startLearningButton).toHaveAttribute('href', '/signup')
  })

  it('has responsive grid layout', () => {
    const { container } = render(<DemoPreview />)
    
    const gridContainer = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2')
    expect(gridContainer).toBeInTheDocument()
  })
})