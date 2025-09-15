import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateEnhancedMCQs } from '@/lib/openai/enhanced-mcq-generator';

// Mock the API endpoints
global.fetch = vi.fn();

describe('Enhanced MCQ Generation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockReset();
  });

  it('should generate content-specific questions from academic text', async () => {
    const academicText = `
      Photosynthesis is the process by which plants convert light energy into chemical energy.
      This process occurs in the chloroplasts of plant cells, specifically in structures called
      thylakoids. The process consists of two main stages: the light-dependent reactions and
      the Calvin cycle. During the light-dependent reactions, chlorophyll absorbs photons and
      uses this energy to split water molecules (H2O) into hydrogen and oxygen. The oxygen is
      released as a byproduct, while the hydrogen is used to produce ATP and NADPH. In the
      Calvin cycle, also known as the light-independent reactions, CO2 from the atmosphere
      is fixed into organic molecules using the ATP and NADPH produced in the first stage.
      The overall equation for photosynthesis is: 6CO2 + 6H2O + light energy → C6H12O6 + 6O2.
      This process is crucial for life on Earth as it produces oxygen and serves as the base
      of most food chains.
    `;

    // Mock content analysis response
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          content: JSON.stringify({
            keyTopics: ['photosynthesis', 'chloroplasts', 'light-dependent reactions', 'Calvin cycle'],
            mainConcepts: ['chlorophyll', 'thylakoids', 'ATP', 'NADPH', 'CO2 fixation'],
            factualInformation: ['6CO2 + 6H2O + light energy → C6H12O6 + 6O2', 'water molecules split into hydrogen and oxygen'],
            contentType: 'academic',
            complexity: 'intermediate',
            textSections: ['Process Overview', 'Light-Dependent Reactions', 'Calvin Cycle']
          })
        })
      })
    );

    // Mock enhanced MCQ generation response
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          questions: [
            {
              id: 'enhanced_q_1',
              text: 'In which cellular structures do the light-dependent reactions of photosynthesis occur?',
              options: ['Mitochondria', 'Thylakoids', 'Nucleus', 'Ribosomes'],
              correctAnswer: 1,
              metadata: { generationType: 'enhanced' }
            },
            {
              id: 'enhanced_q_2',
              text: 'What is the overall chemical equation for photosynthesis?',
              options: [
                'C6H12O6 + 6O2 → 6CO2 + 6H2O + energy',
                '6CO2 + 6H2O + light energy → C6H12O6 + 6O2',
                '2H2O → 2H2 + O2',
                'ATP + ADP → energy'
              ],
              correctAnswer: 1,
              metadata: { generationType: 'enhanced' }
            },
            {
              id: 'enhanced_q_3',
              text: 'Which molecules are produced during the light-dependent reactions and used in the Calvin cycle?',
              options: ['CO2 and H2O', 'ATP and NADPH', 'Glucose and oxygen', 'Chlorophyll and photons'],
              correctAnswer: 1,
              metadata: { generationType: 'enhanced' }
            }
          ]
        })
      })
    );

    const questions = await generateEnhancedMCQs(academicText, {
      numberOfQuestions: 3,
      difficulty: 'mixed',
      requireContentSpecific: true
    });

    expect(questions).toHaveLength(3);
    
    // Verify questions are content-specific
    expect(questions[0].text).toContain('cellular structures');
    expect(questions[1].text).toContain('chemical equation');
    expect(questions[2].text).toContain('Calvin cycle');
    
    // Verify correct answers reference specific content
    expect(questions[0].options[questions[0].correctAnswer]).toBe('Thylakoids');
    expect(questions[1].options[questions[1].correctAnswer]).toContain('6CO2 + 6H2O');
    expect(questions[2].options[questions[2].correctAnswer]).toBe('ATP and NADPH');
  });

  it('should handle technical documentation content', async () => {
    const technicalText = `
      React Hooks were introduced in React 16.8 as a way to use state and lifecycle methods
      in functional components. The useState hook allows you to add state to functional components.
      It returns an array with two elements: the current state value and a function to update it.
      The useEffect hook lets you perform side effects in functional components, replacing
      componentDidMount, componentDidUpdate, and componentWillUnmount lifecycle methods.
      The dependency array in useEffect controls when the effect runs. An empty dependency array
      means the effect runs only once after the initial render. Custom hooks are JavaScript
      functions whose names start with "use" and can call other hooks. They allow you to
      extract component logic into reusable functions.
    `;

    // Mock content analysis
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          content: JSON.stringify({
            keyTopics: ['React Hooks', 'useState', 'useEffect', 'custom hooks'],
            mainConcepts: ['functional components', 'state management', 'lifecycle methods', 'dependency array'],
            factualInformation: ['React 16.8', 'returns an array with two elements', 'names start with "use"'],
            contentType: 'technical',
            complexity: 'intermediate',
            textSections: ['Introduction', 'useState Hook', 'useEffect Hook', 'Custom Hooks']
          })
        })
      })
    );

    // Mock enhanced MCQ generation
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          questions: [
            {
              id: 'enhanced_q_1',
              text: 'In which version of React were Hooks introduced?',
              options: ['React 16.6', 'React 16.8', 'React 17.0', 'React 18.0'],
              correctAnswer: 1
            },
            {
              id: 'enhanced_q_2',
              text: 'What does the useState hook return?',
              options: [
                'A single state value',
                'An array with two elements',
                'An object with state properties',
                'A function to update state'
              ],
              correctAnswer: 1
            }
          ]
        })
      })
    );

    const questions = await generateEnhancedMCQs(technicalText, {
      numberOfQuestions: 2,
      difficulty: 'medium',
      requireContentSpecific: true
    });

    expect(questions).toHaveLength(2);
    expect(questions[0].text).toContain('React');
    expect(questions[1].text).toContain('useState');
  });

  it('should retry when initial questions are too generic', async () => {
    const businessText = `
      Agile methodology is a project management approach that emphasizes iterative development,
      collaboration, and flexibility. The Agile Manifesto, created in 2001, outlines four
      core values: individuals and interactions over processes and tools, working software
      over comprehensive documentation, customer collaboration over contract negotiation,
      and responding to change over following a plan. Scrum is one of the most popular
      Agile frameworks, featuring roles like Product Owner, Scrum Master, and Development Team.
      Sprint planning, daily standups, sprint reviews, and retrospectives are key Scrum ceremonies.
      User stories are used to capture requirements from the user's perspective.
    `;

    // Mock content analysis
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          content: JSON.stringify({
            keyTopics: ['Agile methodology', 'Scrum', 'Agile Manifesto', 'user stories'],
            mainConcepts: ['iterative development', 'Product Owner', 'Scrum Master', 'sprint planning'],
            factualInformation: ['created in 2001', 'four core values', 'daily standups'],
            contentType: 'business',
            complexity: 'intermediate',
            textSections: ['Agile Overview', 'Agile Manifesto', 'Scrum Framework', 'Ceremonies']
          })
        })
      })
    );

    // First attempt - generic questions (will be rejected)
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          questions: [
            {
              id: 'q_1',
              text: 'What is the best way to manage a project?',
              options: ['Agile', 'Waterfall', 'Hybrid', 'Ad-hoc'],
              correctAnswer: 0
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
              text: 'When was the Agile Manifesto created?',
              options: ['1999', '2001', '2003', '2005'],
              correctAnswer: 1
            },
            {
              id: 'enhanced_q_2',
              text: 'Which role in Scrum is responsible for managing the product backlog?',
              options: ['Scrum Master', 'Product Owner', 'Development Team', 'Stakeholder'],
              correctAnswer: 1
            }
          ]
        })
      })
    );

    const questions = await generateEnhancedMCQs(businessText, {
      numberOfQuestions: 2,
      maxRetries: 2,
      requireContentSpecific: true
    });

    expect(questions).toHaveLength(2);
    expect(questions[0].text).toContain('Agile Manifesto');
    expect(questions[1].text).toContain('Scrum');
    
    // Should have made 3 API calls: 1 analysis + 2 generation attempts
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('should handle API failures gracefully', async () => {
    const shortText = 'This text is too short for enhanced MCQ generation.';

    await expect(
      generateEnhancedMCQs(shortText, {
        numberOfQuestions: 5,
        requireContentSpecific: true
      })
    ).rejects.toThrow('Text content is insufficient for generating content-specific questions');
  });
});