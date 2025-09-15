import { NextResponse } from 'next/server'

/**
 * Success response format: { quiz: [...] } or other success data
 * Error response format: { error: "message" }
 */
export interface APISuccessResponse<T = any> {
  [key: string]: T
}

export interface APIErrorResponse {
  error: string
}

/**
 * Create consistent JSON response with proper Content-Type headers
 * Ensures all API responses follow the same format and have correct headers
 */
export function createJSONResponse<T = any>(
  data: APISuccessResponse<T> | APIErrorResponse, 
  status: number = 200
): NextResponse {
  return new NextResponse(
    JSON.stringify(data),
    {
      status,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}

/**
 * Create success response with quiz data
 * Format: { quiz: [...] }
 */
export function createQuizSuccessResponse(quiz: any[]): NextResponse {
  return createJSONResponse({ quiz }, 200)
}

/**
 * Create error response with consistent format
 * Format: { error: "message" }
 */
export function createErrorResponse(message: string, status: number = 500): NextResponse {
  return createJSONResponse({ error: message }, status)
}