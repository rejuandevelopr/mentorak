import React from 'react';

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}

/**
 * Basic skeleton component for loading states
 */
export function Skeleton({ 
  className = '', 
  width, 
  height, 
  rounded = false 
}: SkeletonProps) {
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`animate-pulse bg-gray-200 ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
      style={style}
      aria-label="Loading content"
    />
  );
}

/**
 * Skeleton for text lines
 */
export function SkeletonText({ 
  lines = 3, 
  className = '' 
}: { 
  lines?: number; 
  className?: string; 
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={16}
          width={index === lines - 1 ? '75%' : '100%'}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for cards
 */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-4 border rounded-lg ${className}`}>
      <div className="flex items-center space-x-3 mb-4">
        <Skeleton width={40} height={40} rounded />
        <div className="flex-1">
          <Skeleton height={16} width="60%" className="mb-2" />
          <Skeleton height={12} width="40%" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

/**
 * Skeleton for quiz history table
 */
export function SkeletonTable({ 
  rows = 5, 
  columns = 4, 
  className = '' 
}: { 
  rows?: number; 
  columns?: number; 
  className?: string; 
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex space-x-4 pb-2 border-b">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`header-${index}`} height={16} width="20%" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex space-x-4 py-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={`cell-${rowIndex}-${colIndex}`} 
              height={14} 
              width="20%" 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for dashboard stats
 */
export function SkeletonStats({ className = '' }: { className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton height={12} width="60%" className="mb-2" />
              <Skeleton height={24} width="40%" />
            </div>
            <Skeleton width={40} height={40} rounded />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for quiz questions
 */
export function SkeletonQuiz({ className = '' }: { className?: string }) {
  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Progress bar */}
        <div className="mb-6">
          <Skeleton height={8} width="100%" className="rounded-full" />
        </div>
        
        {/* Question */}
        <div className="mb-6">
          <Skeleton height={20} width="80%" className="mb-4" />
          <SkeletonText lines={2} />
        </div>
        
        {/* Options */}
        <div className="space-y-3 mb-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 border rounded">
              <Skeleton width={16} height={16} rounded />
              <Skeleton height={16} width="70%" />
            </div>
          ))}
        </div>
        
        {/* Controls */}
        <div className="flex justify-between">
          <Skeleton width={80} height={36} />
          <Skeleton width={100} height={36} />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for navigation
 */
export function SkeletonNavigation({ className = '' }: { className?: string }) {
  return (
    <nav className={`bg-white shadow-sm border-b ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Skeleton width={120} height={24} />
          <div className="flex space-x-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} width={80} height={20} />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}