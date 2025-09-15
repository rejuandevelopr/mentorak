import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key is not configured',
          code: 'API_KEY_INVALID',
          userMessage: 'Content analysis service is not properly configured. Please contact support.'
        },
        { status: 500 }
      );
    }

    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        {
          error: 'Prompt is required',
          code: 'INVALID_INPUT',
          userMessage: 'Analysis prompt is required.'
        },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert content analyzer. Always respond with valid JSON format only. Do not include any explanatory text outside the JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        {
          error: 'No response received from OpenAI',
          code: 'ANALYSIS_FAILED',
          userMessage: 'Failed to analyze content. Please try again.'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ content });

  } catch (error: any) {
    console.error('Content analysis error:', error);

    // Handle OpenAI API specific errors
    if (error.status) {
      switch (error.status) {
        case 401:
          return NextResponse.json(
            {
              error: 'OpenAI API key is invalid',
              code: 'API_KEY_INVALID',
              userMessage: 'Content analysis service authentication failed. Please contact support.'
            },
            { status: 500 }
          );
        case 429:
          return NextResponse.json(
            {
              error: 'OpenAI API rate limit exceeded',
              code: 'RATE_LIMIT',
              userMessage: 'Content analysis service is temporarily busy. Please try again in a moment.'
            },
            { status: 429 }
          );
        case 402:
          return NextResponse.json(
            {
              error: 'OpenAI API quota exceeded',
              code: 'API_QUOTA_EXCEEDED',
              userMessage: 'Content analysis service quota exceeded. Please contact support.'
            },
            { status: 402 }
          );
        default:
          return NextResponse.json(
            {
              error: `OpenAI API error: ${error.message}`,
              code: 'ANALYSIS_FAILED',
              userMessage: 'Failed to analyze content. Please try again.'
            },
            { status: error.status }
          );
      }
    }

    return NextResponse.json(
      {
        error: 'Unexpected error during content analysis',
        code: 'ANALYSIS_FAILED',
        userMessage: 'Failed to analyze content. Please try again.'
      },
      { status: 500 }
    );
  }
}