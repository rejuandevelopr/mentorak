import React from 'react';
import { render, screen } from '@testing-library/react';
import { 
  LoadingSpinner, 
  FullPageLoader, 
  ButtonLoader, 
  LoadingOverlay 
} from '@/components/ui/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('should apply size classes correctly', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    expect(screen.getByRole('status').querySelector('svg')).toHaveClass('w-4 h-4');

    rerender(<LoadingSpinner size="lg" />);
    expect(screen.getByRole('status').querySelector('svg')).toHaveClass('w-8 h-8');

    rerender(<LoadingSpinner size="xl" />);
    expect(screen.getByRole('status').querySelector('svg')).toHaveClass('w-12 h-12');
  });

  it('should apply color classes correctly', () => {
    const { rerender } = render(<LoadingSpinner color="primary" />);
    expect(screen.getByRole('status').querySelector('svg')).toHaveClass('text-blue-600');

    rerender(<LoadingSpinner color="white" />);
    expect(screen.getByRole('status').querySelector('svg')).toHaveClass('text-white');

    rerender(<LoadingSpinner color="gray" />);
    expect(screen.getByRole('status').querySelector('svg')).toHaveClass('text-gray-400');
  });

  it('should apply custom className', () => {
    render(<LoadingSpinner className="custom-class" />);
    expect(screen.getByRole('status')).toHaveClass('custom-class');
  });
});

describe('FullPageLoader', () => {
  it('should render with default message', () => {
    render(<FullPageLoader />);
    
    expect(screen.getAllByText('Loading...')).toHaveLength(2); // One in sr-only, one visible
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render with custom message', () => {
    render(<FullPageLoader message="Generating quiz..." />);
    
    expect(screen.getByText('Generating quiz...')).toBeInTheDocument();
  });

  it('should have fixed positioning and overlay styles', () => {
    const { container } = render(<FullPageLoader />);
    
    const fixedContainer = container.querySelector('.fixed.inset-0');
    expect(fixedContainer).toBeInTheDocument();
    expect(fixedContainer).toHaveClass('bg-white', 'bg-opacity-75');
  });
});

describe('ButtonLoader', () => {
  it('should render with default props', () => {
    render(<ButtonLoader />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner.querySelector('svg')).toHaveClass('w-4 h-4', 'text-white');
    expect(spinner).toHaveClass('mr-2');
  });

  it('should apply custom size and className', () => {
    render(<ButtonLoader size="md" className="ml-2" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner.querySelector('svg')).toHaveClass('w-6 h-6');
    expect(spinner).toHaveClass('ml-2');
  });
});

describe('LoadingOverlay', () => {
  it('should render children when not loading', () => {
    render(
      <LoadingOverlay isLoading={false}>
        <div>Content</div>
      </LoadingOverlay>
    );
    
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('should show overlay when loading', () => {
    render(
      <LoadingOverlay isLoading={true}>
        <div>Content</div>
      </LoadingOverlay>
    );
    
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getAllByText('Loading...')).toHaveLength(2); // One in sr-only, one visible
  });

  it('should show custom loading message', () => {
    render(
      <LoadingOverlay isLoading={true} message="Processing...">
        <div>Content</div>
      </LoadingOverlay>
    );
    
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <LoadingOverlay isLoading={false} className="custom-container">
        <div>Content</div>
      </LoadingOverlay>
    );
    
    const container = screen.getByText('Content').parentElement;
    expect(container).toHaveClass('custom-container');
  });
});