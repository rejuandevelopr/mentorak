import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import AudioPlayer from '@/components/quiz/AudioPlayer';

// Mock HTML Audio element
const mockAudio = {
  play: vi.fn(() => Promise.resolve()),
  pause: vi.fn(),
  load: vi.fn(),
  src: '',
  currentTime: 0,
  duration: 0,
  volume: 1,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

Object.defineProperty(window, 'HTMLAudioElement', {
  writable: true,
  value: vi.fn(() => mockAudio)
});

describe('AudioPlayer', () => {
  const mockProps = {
    audioUrl: 'mock-audio-url',
    onPlay: vi.fn(),
    onPause: vi.fn(),
    onEnded: vi.fn(),
    onError: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock audio properties
    mockAudio.src = '';
    mockAudio.currentTime = 0;
    mockAudio.duration = 0;
    mockAudio.volume = 1;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders audio player with controls', () => {
    render(<AudioPlayer {...mockProps} />);
    
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('0:00')).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('renders without controls when showControls is false', () => {
    render(<AudioPlayer {...mockProps} showControls={false} />);
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText('0:00')).not.toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<AudioPlayer {...mockProps} isLoading={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText('Loading audio...')).toBeInTheDocument();
  });

  it('disables controls when no audio URL provided', () => {
    render(<AudioPlayer {...mockProps} audioUrl={undefined} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('calls play when play button is clicked', async () => {
    render(<AudioPlayer {...mockProps} />);
    
    const playButton = screen.getByRole('button');
    fireEvent.click(playButton);
    
    expect(mockAudio.play).toHaveBeenCalled();
  });

  it('calls pause when pause button is clicked while playing', async () => {
    render(<AudioPlayer {...mockProps} />);
    
    // Simulate playing state
    const playButton = screen.getByRole('button');
    fireEvent.click(playButton);
    
    // Simulate the audio element firing play event
    const playEventHandler = mockAudio.addEventListener.mock.calls.find(
      call => call[0] === 'play'
    )?.[1];
    if (playEventHandler) {
      playEventHandler();
    }
    
    await waitFor(() => {
      fireEvent.click(playButton);
      expect(mockAudio.pause).toHaveBeenCalled();
    });
  });

  it('updates progress when audio time changes', async () => {
    render(<AudioPlayer {...mockProps} />);
    
    // Simulate metadata loaded
    mockAudio.duration = 100;
    const metadataHandler = mockAudio.addEventListener.mock.calls.find(
      call => call[0] === 'loadedmetadata'
    )?.[1];
    if (metadataHandler) {
      metadataHandler();
    }
    
    // Simulate time update
    mockAudio.currentTime = 50;
    const timeUpdateHandler = mockAudio.addEventListener.mock.calls.find(
      call => call[0] === 'timeupdate'
    )?.[1];
    if (timeUpdateHandler) {
      timeUpdateHandler();
    }
    
    await waitFor(() => {
      expect(screen.getByText('0:50')).toBeInTheDocument();
      expect(screen.getByText('1:40')).toBeInTheDocument();
    });
  });

  it('handles seek input changes', () => {
    render(<AudioPlayer {...mockProps} />);
    
    // Set up duration first
    mockAudio.duration = 100;
    const metadataHandler = mockAudio.addEventListener.mock.calls.find(
      call => call[0] === 'loadedmetadata'
    )?.[1];
    if (metadataHandler) {
      metadataHandler();
    }
    
    const seekSlider = screen.getAllByRole('slider')[0]; // First slider is seek
    fireEvent.change(seekSlider, { target: { value: '30' } });
    
    expect(mockAudio.currentTime).toBe(30);
  });

  it('handles volume changes', () => {
    render(<AudioPlayer {...mockProps} />);
    
    const volumeSlider = screen.getAllByRole('slider')[1]; // Second slider is volume
    fireEvent.change(volumeSlider, { target: { value: '0.5' } });
    
    expect(mockAudio.volume).toBe(0.5);
  });

  it('calls onPlay callback when audio starts playing', async () => {
    render(<AudioPlayer {...mockProps} />);
    
    // Simulate play event
    const playEventHandler = mockAudio.addEventListener.mock.calls.find(
      call => call[0] === 'play'
    )?.[1];
    if (playEventHandler) {
      playEventHandler();
    }
    
    expect(mockProps.onPlay).toHaveBeenCalled();
  });

  it('calls onPause callback when audio is paused', async () => {
    render(<AudioPlayer {...mockProps} />);
    
    // Simulate pause event
    const pauseEventHandler = mockAudio.addEventListener.mock.calls.find(
      call => call[0] === 'pause'
    )?.[1];
    if (pauseEventHandler) {
      pauseEventHandler();
    }
    
    expect(mockProps.onPause).toHaveBeenCalled();
  });

  it('calls onEnded callback when audio ends', async () => {
    render(<AudioPlayer {...mockProps} />);
    
    // Simulate ended event
    const endedEventHandler = mockAudio.addEventListener.mock.calls.find(
      call => call[0] === 'ended'
    )?.[1];
    if (endedEventHandler) {
      endedEventHandler();
    }
    
    expect(mockProps.onEnded).toHaveBeenCalled();
  });

  it('calls onError callback and displays error when audio fails', async () => {
    render(<AudioPlayer {...mockProps} />);
    
    // Simulate error event
    const errorEventHandler = mockAudio.addEventListener.mock.calls.find(
      call => call[0] === 'error'
    )?.[1];
    if (errorEventHandler) {
      errorEventHandler();
    }
    
    await waitFor(() => {
      expect(mockProps.onError).toHaveBeenCalledWith('Failed to load or play audio');
      expect(screen.getByText('Failed to load or play audio')).toBeInTheDocument();
    });
  });

  it('auto-plays when autoPlay is true and audio can play', async () => {
    render(<AudioPlayer {...mockProps} autoPlay={true} />);
    
    // Simulate canplay event
    const canPlayHandler = mockAudio.addEventListener.mock.calls.find(
      call => call[0] === 'canplay'
    )?.[1];
    if (canPlayHandler) {
      canPlayHandler();
    }
    
    expect(mockAudio.play).toHaveBeenCalled();
  });

  it('does not auto-play when already playing', async () => {
    render(<AudioPlayer {...mockProps} autoPlay={true} />);
    
    // Simulate playing state first
    const playEventHandler = mockAudio.addEventListener.mock.calls.find(
      call => call[0] === 'play'
    )?.[1];
    if (playEventHandler) {
      playEventHandler();
    }
    
    // Clear previous calls
    mockAudio.play.mockClear();
    
    // Simulate canplay event
    const canPlayHandler = mockAudio.addEventListener.mock.calls.find(
      call => call[0] === 'canplay'
    )?.[1];
    if (canPlayHandler) {
      canPlayHandler();
    }
    
    expect(mockAudio.play).not.toHaveBeenCalled();
  });

  it('updates audio source when audioUrl changes', () => {
    const { rerender } = render(<AudioPlayer {...mockProps} />);
    
    expect(mockAudio.src).toBe('mock-audio-url');
    expect(mockAudio.load).toHaveBeenCalled();
    
    // Clear previous calls
    mockAudio.load.mockClear();
    
    rerender(<AudioPlayer {...mockProps} audioUrl="new-audio-url" />);
    
    expect(mockAudio.src).toBe('new-audio-url');
    expect(mockAudio.load).toHaveBeenCalled();
  });

  it('clears audio source when audioUrl is removed', () => {
    const { rerender } = render(<AudioPlayer {...mockProps} />);
    
    expect(mockAudio.src).toBe('mock-audio-url');
    
    rerender(<AudioPlayer {...mockProps} audioUrl={undefined} />);
    
    expect(mockAudio.src).toBe('');
  });

  it('formats time correctly', () => {
    render(<AudioPlayer {...mockProps} />);
    
    // Set up duration and current time
    mockAudio.duration = 125; // 2:05
    mockAudio.currentTime = 65; // 1:05
    
    const metadataHandler = mockAudio.addEventListener.mock.calls.find(
      call => call[0] === 'loadedmetadata'
    )?.[1];
    if (metadataHandler) {
      metadataHandler();
    }
    
    const timeUpdateHandler = mockAudio.addEventListener.mock.calls.find(
      call => call[0] === 'timeupdate'
    )?.[1];
    if (timeUpdateHandler) {
      timeUpdateHandler();
    }
    
    expect(screen.getByText('1:05')).toBeInTheDocument();
    expect(screen.getByText('2:05')).toBeInTheDocument();
  });

  it('handles play promise rejection gracefully', async () => {
    mockAudio.play.mockRejectedValueOnce(new Error('Play failed'));
    
    render(<AudioPlayer {...mockProps} />);
    
    const playButton = screen.getByRole('button');
    fireEvent.click(playButton);
    
    await waitFor(() => {
      expect(mockProps.onError).toHaveBeenCalledWith('Failed to play audio');
    });
  });

  it('removes event listeners on unmount', () => {
    const { unmount } = render(<AudioPlayer {...mockProps} />);
    
    const addEventListenerCalls = mockAudio.addEventListener.mock.calls.length;
    
    unmount();
    
    expect(mockAudio.removeEventListener).toHaveBeenCalledTimes(addEventListenerCalls);
  });

  it('applies custom className', () => {
    const { container } = render(<AudioPlayer {...mockProps} className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows correct button states for playing and paused', async () => {
    render(<AudioPlayer {...mockProps} />);
    
    const button = screen.getByRole('button');
    
    // Initially should show play button (not playing)
    expect(button).not.toHaveClass('bg-red-500');
    
    // Simulate play event
    const playEventHandler = mockAudio.addEventListener.mock.calls.find(
      call => call[0] === 'play'
    )?.[1];
    if (playEventHandler) {
      playEventHandler();
    }
    
    await waitFor(() => {
      expect(button).toHaveClass('bg-red-500'); // Should show pause button (playing)
    });
  });
});