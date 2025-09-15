import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnhancedMCQGenerator, generateEnhancedMCQs } from '@/lib/openai/enhanced-mcq-generator';
import { AppError, ErrorCodes } from '@/lib/errors/AppError';

// Mock fetch globally
global.fetch = vi.fn();

describe('EnhancedMCQGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock
    (global.fetch as any).mockReset();
  });

  describe('generateContentSpecificMCQs', () => {
    it('should throw error for insufficient text content', async () => {
      const generator = new EnhancedMCQGenerator('test-key');
      
      await expect(
        generator.generateContentSpecificMCQs('short text')
      ).rejects.toThrow(AppError);
    });

    it('should generate content-specific questions with valid text', async () => {
      const generator = new EnhancedMCQGenerator('test-key');
      
      const longText = `
        Machine learning is a subset of artificial intelligence that focuses on algorithms 
        that can learn from data. Neural networks are a key component of deep learning, 
        which uses multiple layers to process information. The backpropagation algorithm 
        is used to train neural networks by adjusting weights based on error gradients.
        Supervised learning uses labeled data to train models, while unsupervised learning 
        finds patterns in unlabeled data. Common applications include image recognition,
        natural language processing, and recommendation systems.
      `.repeat(3); // Make it long enough

      // Mock content analysis API call
      (global.fetch as any).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            content: JSON.stringify({
              keyTopics: ['machine learning', 'neural networks', 'deep learning'],
              mainConcepts: ['backpropagation', 'supervised learning', 'unsupervised learning'],
              factualInformation: ['algorithms learn from data', 'multiple layers process information'],
              contentType: 'technical',
              complexity: 'intermediate',
              textSections: ['Introduction', 'Neural Networks', 'Learning Types']
            })
          })
        })
      );

      // Mock enhanced MCQ generation API call
      (global.fetch as any).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            questions: [
              {
                id: 'enhanced_q_1',
                text: 'What algorithm is used to train neural networks by adjusting weights?',
                options: ['Backpropagation', 'Forward propagation', 'Gradient descent', 'Linear regression'],
                correctAnswer: 0,
                metadata: { generationType: 'enhanced' }
              },
              {
                id: 'enhanced_q_2',
                text: 'Which type of learning uses labeled data to train models?',
                options: ['Unsupervised learning', 'Supervised learning', 'Reinforcement learning', 'Transfer learning'],
                correctAnswer: 1,
                metadata: { generationType: 'enhanced' }
              }
            ]
          })
        })
      );

      const questions = await generator.generateContentSpecificMCQs(longText, {
        numberOfQuestions: 2,
        requireContentSpecific: false // Disable validation for this test
      });

      expect(questions).toHaveLength(2);
      expect(questions[0].text).toContain('algorithm');
      expect(questions[1].text).toContain('labeled data');
    });

    it('should retry with different prompts when questions are not content-specific', async () => {
      const generator = new EnhancedMCQGenerator('test-key');
      
      const longText = `
        The Renaissance was a period of cultural rebirth in Europe from the 14th to 17th centuries.
        It began in Italy and spread throughout Europe. Key figures included Leonardo da Vinci,
        Michelangelo, and Raphael. The printing press, invented by Johannes Gutenberg around 1440,
        helped spread Renaissance ideas. Art during this period focused on realism and perspective.
        Humanism emerged as a philosophical movement emphasizing human potential and achievements.
      `.repeat(2);

      // Mock content analysis
      (global.fetch as any).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            content: JSON.stringify({
              keyTopics: ['Renaissance', 'Italy', 'art', 'humanism'],
              mainConcepts: ['Leonardo da Vinci', 'printing press', 'realism', 'perspective'],
              factualInformation: ['14th to 17th centuries', 'Johannes Gutenberg', '1440'],
              contentType: 'academic',
              complexity: 'intermediate',
              textSections: ['Introduction', 'Key Figures', 'Innovations']
            })
          })
        })
      );

      // First attempt - generic questions (should be rejected)
      (global.fetch as any).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            questions: [
              {
                id: 'q_1',
                text: 'What is the best way to study history?',
                options: ['Read books', 'Watch videos', 'Visit museums', 'All of the above'],
                correctAnswer: 3
              }
            ]
          })
        })
      );

      // Second attempt - content-specific questions
      (global.fetch as any).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            questions: [
              {
                id: 'enhanced_q_1',
                text: 'Who invented the printing press around 1440?',
                options: ['Leonardo da Vinci', 'Johannes Gutenberg', 'Michelangelo', 'Raphael'],
                correctAnswer: 1
              },
              {
                id: 'enhanced_q_2',
                text: 'In which country did the Renaissance begin?',
                options: ['France', 'Germany', 'Italy', 'England'],
                correctAnswer: 2
              }
            ]
          })
        })
      );

      const questions = await generator.generateContentSpecificMCQs(longText, {
        numberOfQuestions: 2,
        maxRetries: 2,
        requireContentSpecific: true
      });

      expect(questions).toHaveLength(2);
      expect(questions[0].text).toContain('printing press');
      expect(questions[1].text).toContain('Renaissance');
      
      // Should have made 3 API calls: 1 for analysis, 2 for generation attempts
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('generateEnhancedMCQs', () => {
    it('should use retry logic for transient failures', async () => {
      const longText = 'This is a long enough text for MCQ generation. '.repeat(20);

      // Mock content analysis success
      (global.fetch as any).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            content: JSON.stringify({
              keyTopics: ['topic1', 'topic2'],
              mainConcepts: ['concept1', 'concept2'],
              factualInformation: ['fact1', 'fact2'],
              contentType: 'general',
              complexity: 'basic',
              textSections: ['section1', 'section2']
            })
          })
        })
      );

      // First generation attempt fails
      (global.fetch as any).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 429,
          json: () => Promise.resolve({
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT'
          })
        })
      );

      // Second generation attempt succeeds
      (global.fetch as any).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            questions: [
              {
                id: 'enhanced_q_1',
                text: 'Test question about the content?',
                options: ['A', 'B', 'C', 'D'],
                correctAnswer: 0
              }
            ]
          })
        })
      );

      const questions = await generateEnhancedMCQs(longText, {
        numberOfQuestions: 1,
        maxRetries: 2,
        requireContentSpecific: false
      });

      expect(questions).toHaveLength(1);
      expect(questions[0].text).toBe('Test question about the content?');
    });
  });

  describe('content validation', () => {
    it('should detect generic question indicators', async () => {
      const generator = new EnhancedMCQGenerator('test-key');
      
      // Access private method through any cast for testing
      const detectGenericIndicators = (generator as any).detectGenericIndicators;
      
      const genericQuestions = [
        'What is the best way to learn?',
        'Which of the following is true?',
        'What should you do when studying?',
        'How can you improve your skills?'
      ];

      genericQuestions.forEach(question => {
        const indicators = detectGenericIndicators(question);
        expect(indicators.length).toBeGreaterThan(0);
      });

      const specificQuestion = 'According to the document, what year was the printing press invented?';
      const specificIndicators = detectGenericIndicators(specificQuestion);
      expect(specificIndicators.length).toBe(0);
    });

    it('should check for specific content references', async () => {
      const generator = new EnhancedMCQGenerator('test-key');
      
      const checkSpecificReferences = (generator as any).checkSpecificReferences;
      
      const contentAnalysis = {
        keyTopics: ['machine learning', 'neural networks'],
        mainConcepts: ['backpropagation', 'gradient descent'],
        factualInformation: ['1943', 'McCulloch-Pitts neuron'],
        contentType: 'technical',
        complexity: 'advanced',
        textSections: ['Introduction', 'History', 'Applications']
      };

      const specificQuestion = {
        text: 'What is backpropagation used for in neural networks?',
        options: ['Training', 'Testing', 'Validation', 'Deployment'],
        correctAnswer: 0
      };

      const genericQuestion = {
        text: 'What is the best learning method?',
        options: ['Practice', 'Theory', 'Both', 'Neither'],
        correctAnswer: 2
      };

      const hasSpecificRefs = checkSpecificReferences(specificQuestion, contentAnalysis, 'sample text');
      const hasGenericRefs = checkSpecificReferences(genericQuestion, contentAnalysis, 'sample text');

      expect(hasSpecificRefs).toBe(true);
      expect(hasGenericRefs).toBe(false);
    });
  });
});