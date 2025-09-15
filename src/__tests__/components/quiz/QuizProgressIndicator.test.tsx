import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import QuizProgressIndicator from '@/components/quiz/QuizProgressIndicator';

describe('QuizProgressIndicator', () => {
  const defaultProps = {
    currentQuestion: 0,
    totalQuestions: 10,
    completedQuestions: [false, false, false, false, false, false, false, false, false, false],
  };

  it('renders progress indicator with correct initial state', () => {
    const { container } = render(<QuizProgressIndicator {...defaultProps} />);
    
    expect(container.querySelector('.bg-accent')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(10);
  });

  it('shows correct progress when questions are completed', () => {
    const completedQuestions = [true, true, true, false, false, false, false, false, false, false];
    const { container } = render(
      <QuizProgressIndicator 
        {...defaultProps} 
        currentQuestion={3}
        completedQuestions={completedQuestions}
      />
    );
    
    const progressBar = container.querySelector('.bg-accent');
    expect(progressBar).toHaveStyle('width: 30%');
  });

  it('shows completion message when all questions are answered', () => {
    const allCompleted = Array(10).fill(true);
    render(
      <QuizProgressIndicator 
        {...defaultProps} 
        currentQuestion={9}
        completedQuestions={allCompleted}
      />
    );
    
    expect(screen.getByText('All questions completed!')).toBeInTheDocument();
  });

  it('renders question navigation dots with correct states', () => {
    const completedQuestions = [true, true, false, false, false, false, false, false, false, false];
    render(
      <QuizProgressIndicator 
        {...defaultProps} 
        currentQuestion={2}
        completedQuestions={completedQuestions}
      />
    );
    
    // Check that all 10 question buttons are rendered
    const questionButtons = screen.getAllByRole('button');
    expect(questionButtons).toHaveLength(10);
    
    // Check completed questions have checkmarks
    const completedButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg')
    );
    expect(completedButtons.length).toBeGreaterThan(0);
  });

  it('calls onQuestionJump when question button is clicked', () => {
    const mockOnQuestionJump = vi.fn();
    render(
      <QuizProgressIndicator 
        {...defaultProps} 
        onQuestionJump={mockOnQuestionJump}
      />
    );
    
    const questionButton = screen.getByText('5');
    fireEvent.click(questionButton);
    
    expect(mockOnQuestionJump).toHaveBeenCalledWith(4); // 0-indexed
  });

  it('renders in compact mode', () => {
    const { container } = render(
      <QuizProgressIndicator 
        {...defaultProps} 
        compact={true}
      />
    );
    
    // Should still render all essential elements
    expect(container.querySelector('.space-y-2')).toBeInTheDocument();
    expect(container.querySelector('.text-xs')).toBeInTheDocument();
  });

  it('hides question numbers when showQuestionNumbers is false', () => {
    render(
      <QuizProgressIndicator 
        {...defaultProps} 
        showQuestionNumbers={false}
      />
    );
    
    // Should not render question navigation buttons
    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });

  it('displays correct progress bar width', () => {
    const completedQuestions = [true, true, true, true, true, false, false, false, false, false];
    const { container } = render(
      <QuizProgressIndicator 
        {...defaultProps} 
        completedQuestions={completedQuestions}
      />
    );
    
    const progressBar = container.querySelector('.bg-accent');
    expect(progressBar).toHaveStyle('width: 50%');
  });

  it('handles edge case with no completed questions', () => {
    const { container } = render(<QuizProgressIndicator {...defaultProps} />);
    
    const progressBar = container.querySelector('.bg-accent');
    expect(progressBar).toHaveStyle('width: 0%');
  });

  it('handles edge case with all questions completed', () => {
    const allCompleted = Array(10).fill(true);
    const { container } = render(
      <QuizProgressIndicator 
        {...defaultProps} 
        completedQuestions={allCompleted}
      />
    );
    
    const progressBar = container.querySelector('.bg-accent');
    expect(progressBar).toHaveStyle('width: 100%');
    expect(screen.getByText('All questions completed!')).toBeInTheDocument();
  });
});