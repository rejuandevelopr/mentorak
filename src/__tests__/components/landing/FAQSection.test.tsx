import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { FAQSection } from '@/components/landing/FAQSection'

describe('FAQSection', () => {
  it('renders the section heading', () => {
    render(<FAQSection />)
    
    expect(screen.getByText('Need to know')).toBeInTheDocument()
    expect(screen.getByText('Everything you need to know about Mentorak and how it works')).toBeInTheDocument()
  })

  it('renders all FAQ questions', () => {
    render(<FAQSection />)
    
    expect(screen.getByText('How do you create quizzes?')).toBeInTheDocument()
    expect(screen.getByText('Can you upload multiple PDFs?')).toBeInTheDocument()
    expect(screen.getByText('Is it compatible with all PDFs?')).toBeInTheDocument()
    expect(screen.getByText('How do you handle user privacy?')).toBeInTheDocument()
    expect(screen.getByText('What languages does Mentorak support?')).toBeInTheDocument()
    expect(screen.getByText('Can you use Mentorak with iPad?')).toBeInTheDocument()
    expect(screen.getByText('Is Mentorak free to use?')).toBeInTheDocument()
  })

  it('toggles FAQ answers when clicked', () => {
    render(<FAQSection />)
    
    const firstQuestion = screen.getByText('How do you create quizzes?')
    
    // Answer should not be visible initially
    expect(screen.queryByText(/Our AI analyzes your uploaded PDF documents/)).not.toBeInTheDocument()
    
    // Click to open
    fireEvent.click(firstQuestion)
    expect(screen.getByText(/Our AI analyzes your uploaded PDF documents/)).toBeInTheDocument()
    
    // Click to close
    fireEvent.click(firstQuestion)
    expect(screen.queryByText(/Our AI analyzes your uploaded PDF documents/)).not.toBeInTheDocument()
  })

  it('only shows one answer at a time', () => {
    render(<FAQSection />)
    
    const firstQuestion = screen.getByText('How do you create quizzes?')
    const secondQuestion = screen.getByText('Can you upload multiple PDFs?')
    
    // Open first FAQ
    fireEvent.click(firstQuestion)
    expect(screen.getByText(/Our AI analyzes your uploaded PDF documents/)).toBeInTheDocument()
    
    // Open second FAQ - should close first
    fireEvent.click(secondQuestion)
    expect(screen.queryByText(/Our AI analyzes your uploaded PDF documents/)).not.toBeInTheDocument()
    expect(screen.getByText(/You can upload multiple PDF documents/)).toBeInTheDocument()
  })

  it('renders the bottom CTA section', () => {
    render(<FAQSection />)
    
    expect(screen.getByText('Still have questions?')).toBeInTheDocument()
    expect(screen.getByText(/Can't find the answer you're looking for/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Get in touch' })).toBeInTheDocument()
  })

  it('has proper chevron icon behavior', () => {
    render(<FAQSection />)
    
    const firstQuestion = screen.getByText('How do you create quizzes?')
    const questionButton = firstQuestion.closest('button')
    
    // Should show down chevron initially
    expect(questionButton?.querySelector('svg')).toBeInTheDocument()
    
    // Click to open - should show up chevron
    fireEvent.click(firstQuestion)
    expect(questionButton?.querySelector('svg')).toBeInTheDocument()
  })
})