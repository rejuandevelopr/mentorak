import Link from 'next/link'
import { ArrowRightIcon, PlayIcon, DocumentTextIcon, MicrophoneIcon, SparklesIcon } from '@heroicons/react/24/outline'

export function HeroSection() {
  return (
    <section className="relative px-6 lg:px-8 py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-left">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-secondary text-accent border border-accent/20 mb-6">
              <SparklesIcon className="h-4 w-4 mr-2" />
              AI-Powered Learning Platform
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl leading-tight">
              Learn Anything with
              <span className="block text-accent"> AI-Generated Quizzes</span>
            </h1>
            
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl">
              Simply enter any topic and get instant, personalized multiple-choice quizzes. 
              From science to history, master any subject with AI-powered learning.
            </p>
            
            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Get Started Free
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
              
              <button className="inline-flex items-center px-6 py-3 rounded-lg border border-gray-300 text-primary font-semibold hover:bg-gray-50 transition-colors">
                <PlayIcon className="mr-2 h-4 w-4" />
                Watch Demo
              </button>
            </div>
            
            {/* Feature Pills */}
            <div className="mt-8 flex flex-wrap gap-3">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-700">
                <SparklesIcon className="h-4 w-4 mr-2 text-accent" />
                Any Topic
              </div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-700">
                <DocumentTextIcon className="h-4 w-4 mr-2 text-accent" />
                10 Questions
              </div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-700">
                <MicrophoneIcon className="h-4 w-4 mr-2 text-accent" />
                Instant Results
              </div>
            </div>
          </div>
          
          {/* Right Visual */}
          <div className="relative">
            <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 shadow-2xl">
              {/* Mock Interface */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-primary px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">Quiz Session</h3>
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center mr-3">
                        <SparklesIcon className="h-4 w-4 text-accent" />
                      </div>
                      <span className="text-sm text-gray-500">Question 3 of 10 • Photosynthesis</span>
                    </div>
                    <h4 className="text-lg font-semibold text-primary mb-4">
                      "What is the primary function of chlorophyll in plants?"
                    </h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <span className="text-gray-700">A) Water storage</span>
                    </div>
                    <div className="p-3 border-2 border-accent bg-secondary rounded-lg">
                      <span className="text-primary font-medium">B) Light absorption for photosynthesis</span>
                    </div>
                    <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <span className="text-gray-700">C) Structural support</span>
                    </div>
                    <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <span className="text-gray-700">D) Nutrient transport</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <SparklesIcon className="h-4 w-4 mr-1" />
                      <span>AI-generated instantly</span>
                    </div>
                    <div className="text-sm text-accent font-medium">
                      Score: 85%
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
                <SparklesIcon className="h-8 w-8 text-accent" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <MicrophoneIcon className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}