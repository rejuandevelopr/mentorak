import { Question } from '../../types/models';
import { AppError, ErrorCodes } from '@/lib/errors/AppError';
import { withAPIRetry } from '../utils/retry';

export interface ContentAnalysis {
  keyTopics: string[];
  mainConcepts: string[];
  factualInformation: string[];
  contentType: 'academic' | 'technical' | 'business' | 'general';
  complexity: 'basic' | 'intermediate' | 'advanced';
  textSections: string[];
}

export interface QuestionValidationResult {
  isContentSpecific: boolean;
  hasSpecificReferences: boolean;
  confidenceScore: number;
  referencedConcepts: string[];
  genericIndicators: string[];
}

export interface EnhancedMCQOptions {
  numberOfQuestions?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  questionTypes?: string[];
  maxRetries?: number;
  requireContentSpecific?: boolean;
}

/**
 * Enhanced MCQ generator that ensures content-specific questions
 */
export class EnhancedMCQGenerator {
  private openaiApiKey: string;

  constructor(apiKey?: string) {
    this.openaiApiKey = apiKey || process.env.OPENAI_API_KEY || '';
  }

  /**
   * Generate MCQs with content analysis and validation
   */
  async generateContentSpecificMCQs(
    text: string,
    options: EnhancedMCQOptions = {}
  ): Promise<Question[]> {
    const {
      numberOfQuestions = 10,
      difficulty = 'mixed',
      questionTypes = ['factual', 'conceptual', 'analytical'],
      maxRetries = 3,
      requireContentSpecific = true
    } = options;

    // Validate input text
    if (!text || text.trim().length < 200) {
      throw new AppError(
        'Text content is insufficient for generating content-specific questions',
        ErrorCodes.INVALID_INPUT,
        'The PDF content is too short to generate meaningful quiz questions. Please upload a document with more substantial content.',
        'medium'
      );
    }

    // Step 1: Analyze content to identify key concepts and topics
    console.log('🔍 Analyzing content for key concepts...');
    const contentAnalysis = await this.analyzeContent(text);
    
    console.log('📊 Content Analysis Results:', {
      keyTopics: contentAnalysis.keyTopics.length,
      mainConcepts: contentAnalysis.mainConcepts.length,
      contentType: contentAnalysis.contentType,
      complexity: contentAnalysis.complexity
    });

    // Step 2: Generate questions with enhanced prompting
    let questions: Question[] = [];
    let attempt = 0;
    
    while (attempt < maxRetries && questions.length === 0) {
      attempt++;
      console.log(`🤖 MCQ Generation Attempt ${attempt}/${maxRetries}`);
      
      try {
        const generatedQuestions = await this.generateQuestionsWithAnalysis(
          text,
          contentAnalysis,
          numberOfQuestions,
          difficulty,
          questionTypes,
          attempt
        );

        // Step 3: Validate questions are content-specific
        if (requireContentSpecific) {
          const validatedQuestions = await this.validateQuestionSpecificity(
            generatedQuestions,
            contentAnalysis,
            text
          );
          
          if (validatedQuestions.length >= Math.floor(numberOfQuestions * 0.7)) {
            questions = validatedQuestions.slice(0, numberOfQuestions);
            console.log(`✅ Generated ${questions.length} content-specific questions`);
            break;
          } else {
            console.log(`⚠️ Only ${validatedQuestions.length}/${numberOfQuestions} questions were content-specific, retrying...`);
          }
        } else {
          questions = generatedQuestions.slice(0, numberOfQuestions);
          break;
        }
      } catch (error) {
        console.log(`❌ Attempt ${attempt} failed:`, error instanceof Error ? error.message : 'Unknown error');
        if (attempt === maxRetries) {
          throw error;
        }
      }
    }

    if (questions.length === 0) {
      throw new AppError(
        'Failed to generate content-specific questions after multiple attempts',
        ErrorCodes.MCQ_GENERATION_FAILED,
        'Unable to generate quiz questions that are specific to your document content. The document may not contain sufficient detailed information for quiz generation.',
        'high'
      );
    }

    return questions;
  }

  /**
   * Analyze content to identify key concepts, topics, and structure
   */
  private async analyzeContent(text: string): Promise<ContentAnalysis> {
    const analysisPrompt = `
Analyze the following text content and extract key information for quiz generation:

Text content:
"""
${text.substring(0, 2000)}${text.length > 2000 ? '...' : ''}
"""

Please identify and return a JSON object with:
1. keyTopics: Array of 5-8 main topics/subjects covered
2. mainConcepts: Array of 8-12 important concepts, terms, or ideas
3. factualInformation: Array of 6-10 specific facts, numbers, dates, or concrete details
4. contentType: One of "academic", "technical", "business", "general"
5. complexity: One of "basic", "intermediate", "advanced"
6. textSections: Array of 3-5 distinct content sections or themes

Focus on extracting specific, concrete information that could be used to create detailed questions.

Respond with valid JSON only:
{
  "keyTopics": ["topic1", "topic2", ...],
  "mainConcepts": ["concept1", "concept2", ...],
  "factualInformation": ["fact1", "fact2", ...],
  "contentType": "academic",
  "complexity": "intermediate",
  "textSections": ["section1", "section2", ...]
}
`;

    try {
      const response = await fetch('/api/openai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: analysisPrompt })
      });

      if (!response.ok) {
        throw new Error('Content analysis failed');
      }

      const result = await response.json();
      return this.parseContentAnalysis(result.content);
    } catch (error) {
      console.log('⚠️ Content analysis failed, using fallback analysis');
      return this.createFallbackAnalysis(text);
    }
  }

  /**
   * Generate questions using content analysis and enhanced prompting
   */
  private async generateQuestionsWithAnalysis(
    text: string,
    analysis: ContentAnalysis,
    numberOfQuestions: number,
    difficulty: string,
    questionTypes: string[],
    attempt: number
  ): Promise<Question[]> {
    const enhancedPrompt = this.createEnhancedPrompt(
      text,
      analysis,
      numberOfQuestions,
      difficulty,
      questionTypes,
      attempt
    );

    const response = await fetch('/api/generate-mcq-enhanced', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        numberOfQuestions,
        attempt
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new AppError(
        errorData.error || 'Enhanced MCQ generation failed',
        errorData.code || ErrorCodes.MCQ_GENERATION_FAILED,
        errorData.userMessage || 'Failed to generate quiz questions. Please try again.',
        'high'
      );
    }

    const result = await response.json();
    return result.questions;
  }

  /**
   * Create enhanced prompt with content analysis
   */
  private createEnhancedPrompt(
    text: string,
    analysis: ContentAnalysis,
    numberOfQuestions: number,
    difficulty: string,
    questionTypes: string[],
    attempt: number
  ): string {
    const promptVariations = [
      // Attempt 1: Standard enhanced prompt
      `You are an expert educator creating quiz questions from specific document content.

CONTENT ANALYSIS:
- Key Topics: ${analysis.keyTopics.join(', ')}
- Main Concepts: ${analysis.mainConcepts.join(', ')}
- Factual Information: ${analysis.factualInformation.join(', ')}
- Content Type: ${analysis.contentType}
- Complexity: ${analysis.complexity}

SOURCE TEXT:
"""
${text.substring(0, 3000)}${text.length > 3000 ? '...' : ''}
"""

CRITICAL REQUIREMENTS:
1. Generate exactly ${numberOfQuestions} multiple-choice questions
2. Each question MUST be answerable ONLY by someone who read this specific text
3. Questions MUST reference specific facts, concepts, names, numbers, or details from the text
4. DO NOT create general knowledge questions that could be answered without reading the text
5. Each question should test comprehension of the actual content provided
6. Include questions about: ${analysis.keyTopics.slice(0, 3).join(', ')}
7. Reference specific concepts: ${analysis.mainConcepts.slice(0, 4).join(', ')}
8. Use factual details: ${analysis.factualInformation.slice(0, 3).join(', ')}

Question types to include: ${questionTypes.join(', ')}
Difficulty level: ${difficulty}

Format as JSON array:
[{"text":"Question referencing specific content?","options":["A","B","C","D"],"correctAnswer":0}]`,

      // Attempt 2: More specific content focus
      `Create quiz questions that test specific knowledge from this document content.

KEY CONTENT TO REFERENCE:
${analysis.keyTopics.map((topic, i) => `${i + 1}. ${topic}`).join('\n')}

SPECIFIC CONCEPTS TO TEST:
${analysis.mainConcepts.map((concept, i) => `${i + 1}. ${concept}`).join('\n')}

DOCUMENT TEXT:
"""
${text.substring(0, 3000)}${text.length > 3000 ? '...' : ''}
"""

Create ${numberOfQuestions} questions where:
- Each question references specific information from the text above
- Wrong answers are plausible but clearly incorrect based on the text
- Questions cannot be answered through general knowledge alone
- Focus on testing understanding of the specific content provided

JSON format: [{"text":"Question about specific content?","options":["A","B","C","D"],"correctAnswer":0}]`,

      // Attempt 3: Section-based approach
      `Generate content-specific quiz questions from this document.

CONTENT SECTIONS IDENTIFIED:
${analysis.textSections.map((section, i) => `Section ${i + 1}: ${section}`).join('\n')}

FULL TEXT:
"""
${text.substring(0, 3000)}${text.length > 3000 ? '...' : ''}
"""

Requirements for ${numberOfQuestions} questions:
- Each question must quote, reference, or test specific information from the text
- Questions should cover different sections of the content
- Avoid generic questions that don't require reading this specific document
- Test comprehension of actual facts, concepts, and details mentioned
- Ensure questions are answerable only from the provided text

Return JSON: [{"text":"Specific question about the text content?","options":["A","B","C","D"],"correctAnswer":0}]`
    ];

    return promptVariations[Math.min(attempt - 1, promptVariations.length - 1)];
  }

  /**
   * Validate that questions are content-specific
   */
  private async validateQuestionSpecificity(
    questions: Question[],
    analysis: ContentAnalysis,
    originalText: string
  ): Promise<Question[]> {
    const validatedQuestions: Question[] = [];

    for (const question of questions) {
      const validation = await this.validateSingleQuestion(question, analysis, originalText);
      
      if (validation.isContentSpecific && validation.confidenceScore >= 0.7) {
        validatedQuestions.push(question);
        console.log(`✅ Question validated: ${question.text.substring(0, 50)}...`);
      } else {
        console.log(`❌ Question rejected (score: ${validation.confidenceScore}): ${question.text.substring(0, 50)}...`);
        console.log(`   Generic indicators: ${validation.genericIndicators.join(', ')}`);
      }
    }

    return validatedQuestions;
  }

  /**
   * Validate a single question for content specificity
   */
  private async validateSingleQuestion(
    question: Question,
    analysis: ContentAnalysis,
    originalText: string
  ): Promise<QuestionValidationResult> {
    // Check for generic question indicators
    const genericIndicators = this.detectGenericIndicators(question.text);
    
    // Check for specific content references
    const hasSpecificReferences = this.checkSpecificReferences(question, analysis, originalText);
    
    // Calculate confidence score
    let confidenceScore = 0.5; // Base score
    
    // Boost score for specific references
    if (hasSpecificReferences) confidenceScore += 0.3;
    
    // Reduce score for generic indicators
    confidenceScore -= genericIndicators.length * 0.1;
    
    // Check if question references key concepts
    const referencedConcepts = analysis.mainConcepts.filter(concept =>
      question.text.toLowerCase().includes(concept.toLowerCase()) ||
      question.options.some(option => option.toLowerCase().includes(concept.toLowerCase()))
    );
    
    if (referencedConcepts.length > 0) confidenceScore += 0.2;
    
    // Ensure score is between 0 and 1
    confidenceScore = Math.max(0, Math.min(1, confidenceScore));
    
    return {
      isContentSpecific: confidenceScore >= 0.7 && genericIndicators.length === 0,
      hasSpecificReferences,
      confidenceScore,
      referencedConcepts,
      genericIndicators
    };
  }

  /**
   * Detect generic question indicators
   */
  private detectGenericIndicators(questionText: string): string[] {
    const indicators: string[] = [];
    const text = questionText.toLowerCase();
    
    const genericPatterns = [
      { pattern: /what is the best way to/, indicator: 'generic best practice' },
      { pattern: /which of the following is true/, indicator: 'generic true/false' },
      { pattern: /what should you do when/, indicator: 'generic advice' },
      { pattern: /how can you/, indicator: 'generic how-to' },
      { pattern: /what is important/, indicator: 'generic importance' },
      { pattern: /why is it important/, indicator: 'generic importance' },
      { pattern: /what helps with/, indicator: 'generic help' },
      { pattern: /which approach/, indicator: 'generic approach' },
      { pattern: /what is the benefit/, indicator: 'generic benefit' },
      { pattern: /main subject/, indicator: 'generic subject' }
    ];
    
    for (const { pattern, indicator } of genericPatterns) {
      if (pattern.test(text)) {
        indicators.push(indicator);
      }
    }
    
    return indicators;
  }

  /**
   * Check if question references specific content
   */
  private checkSpecificReferences(
    question: Question,
    analysis: ContentAnalysis,
    originalText: string
  ): boolean {
    const questionText = question.text.toLowerCase();
    const allOptions = question.options.join(' ').toLowerCase();
    const combinedText = questionText + ' ' + allOptions;
    
    // Check for references to key topics
    const topicReferences = analysis.keyTopics.some(topic =>
      combinedText.includes(topic.toLowerCase())
    );
    
    // Check for references to main concepts
    const conceptReferences = analysis.mainConcepts.some(concept =>
      combinedText.includes(concept.toLowerCase())
    );
    
    // Check for references to factual information
    const factualReferences = analysis.factualInformation.some(fact =>
      combinedText.includes(fact.toLowerCase())
    );
    
    return topicReferences || conceptReferences || factualReferences;
  }

  /**
   * Parse content analysis response
   */
  private parseContentAnalysis(content: string): ContentAnalysis {
    try {
      const parsed = JSON.parse(content);
      return {
        keyTopics: Array.isArray(parsed.keyTopics) ? parsed.keyTopics : [],
        mainConcepts: Array.isArray(parsed.mainConcepts) ? parsed.mainConcepts : [],
        factualInformation: Array.isArray(parsed.factualInformation) ? parsed.factualInformation : [],
        contentType: parsed.contentType || 'general',
        complexity: parsed.complexity || 'intermediate',
        textSections: Array.isArray(parsed.textSections) ? parsed.textSections : []
      };
    } catch (error) {
      console.log('Failed to parse content analysis, using fallback');
      return this.createFallbackAnalysis('');
    }
  }

  /**
   * Create fallback analysis when AI analysis fails
   */
  private createFallbackAnalysis(text: string): ContentAnalysis {
    // Simple keyword extraction as fallback
    const words = text.toLowerCase().split(/\W+/).filter(word => word.length > 4);
    const wordFreq = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topWords = Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
    
    return {
      keyTopics: topWords.slice(0, 5),
      mainConcepts: topWords.slice(0, 8),
      factualInformation: topWords.slice(0, 6),
      contentType: 'general',
      complexity: 'intermediate',
      textSections: ['Introduction', 'Main Content', 'Conclusion']
    };
  }
}

/**
 * Enhanced MCQ generation with retry logic
 */
export async function generateEnhancedMCQs(
  text: string,
  options: EnhancedMCQOptions = {}
): Promise<Question[]> {
  const generator = new EnhancedMCQGenerator();
  
  return withAPIRetry(
    () => generator.generateContentSpecificMCQs(text, options),
    {
      maxAttempts: options.maxRetries || 3,
      retryOn: [
        ErrorCodes.RATE_LIMIT,
        ErrorCodes.SERVICE_UNAVAILABLE,
        ErrorCodes.NETWORK_ERROR,
        ErrorCodes.TIMEOUT,
        ErrorCodes.CONNECTION_ERROR
      ],
      onRetry: (attempt, error) => {
        console.log(`Enhanced MCQ generation retry attempt ${attempt} due to: ${error.message}`);
      }
    }
  );
}