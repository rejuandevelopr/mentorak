import Link from 'next/link'
import { PlayIcon, SpeakerWaveIcon, DocumentTextIcon, MicrophoneIcon, ChartBarIcon, SparklesIcon } from '@heroicons/react/24/outline'

export function DemoPreview() {
  return (
    <section className="py-24 sm:py-32 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl mb-6">
            See Mentorak in Action
          </h2>
          <p className="text-xl leading-8 text-gray-600">
            Experience how easy it is to transform your study materials into interactive voice quizzes.
          </p>
        </div>
        
        {/* Main Demo Area */}
        <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden mb-16">
          {/* Top Bar */}
          <div className="bg-primary px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <span className="text-white font-medium">Mentorak Quiz Session</span>
              </div>
              <div className="text-white/70 text-sm">Live Demo</div>
            </div>
          </div>
          
          {/* Demo Content */}
          <div className="p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left: Process Steps */}
              <div className="space-y-8">
                <div className="flex items-start space-x-4 group">
                  <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-lg">
                    1
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <DocumentTextIcon className="h-5 w-5 text-accent mr-2" />
                      <h3 className="text-xl font-semibold text-primary">Enter Any Topic</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      Simply type any subject you want to learn - from "Photosynthesis" to "Machine Learning".
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 group">
                  <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-lg">
                    2
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <SparklesIcon className="h-5 w-5 text-accent mr-2" />
                      <h3 className="text-xl font-semibold text-primary">AI Generation</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      Our AI instantly creates 10 unique multiple-choice questions tailored to your topic.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 group">
                  <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-lg">
                    3
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <MicrophoneIcon className="h-5 w-5 text-accent mr-2" />
                      <h3 className="text-xl font-semibold text-primary">Take the Quiz</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      Answer questions at your own pace with an intuitive, user-friendly interface.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 group">
                  <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-lg">
                    4
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <ChartBarIcon className="h-5 w-5 text-accent mr-2" />
                      <h3 className="text-xl font-semibold text-primary">Get Results</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      See detailed results with correct answers and explanations for every question.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Right: Interactive Quiz Preview */}
              <div className="relative">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 shadow-inner">
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* Quiz Header */}
                    <div className="bg-gradient-to-r from-accent to-accent/80 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <MicrophoneIcon className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-white font-semibold">Question 3 of 10</span>
                        </div>
                        <div className="text-white/80 text-sm">Photosynthesis Quiz</div>
                      </div>
                    </div>
                    
                    {/* Quiz Content */}
                    <div className="p-6">
                      <div className="mb-6">
                        <div className="flex items-center mb-3">
                          <SpeakerWaveIcon className="h-5 w-5 text-accent mr-2" />
                          <span className="text-sm text-gray-500">Now playing...</span>
                        </div>
                        <h4 className="text-lg font-semibold text-primary mb-4 leading-relaxed">
                          "What is the primary function of chlorophyll in plants?"
                        </h4>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:border-gray-300">
                          <span className="text-gray-700">A) Water storage</span>
                        </div>
                        <div className="p-4 border-2 border-accent bg-secondary rounded-lg shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-primary font-medium">B) Light absorption for photosynthesis</span>
                            <div className="w-2 h-2 bg-accent rounded-full"></div>
                          </div>
                        </div>
                        <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:border-gray-300">
                          <span className="text-gray-700">C) Structural support</span>
                        </div>
                        <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:border-gray-300">
                          <span className="text-gray-700">D) Nutrient transport</span>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500">
                          <PlayIcon className="h-4 w-4 mr-2" />
                          <span>Click to replay question</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-sm text-accent font-medium">Score: 85%</div>
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="w-3/4 h-full bg-accent rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <SparklesIcon className="h-8 w-8 text-accent" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <MicrophoneIcon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-secondary border border-accent/20 text-sm text-accent font-medium mb-6">
            <span className="w-2 h-2 bg-accent rounded-full mr-2 animate-pulse"></span>
            Try it yourself - it's completely free!
          </div>
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-primary/90 hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Start Learning Today
              <PlayIcon className="h-5 w-5" />
            </Link>
            <button className="inline-flex items-center gap-2 rounded-lg border-2 border-accent text-accent px-8 py-4 text-lg font-semibold hover:bg-accent hover:text-white transition-all duration-200">
              <PlayIcon className="h-5 w-5" />
              Watch Full Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}