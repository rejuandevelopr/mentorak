import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'
import { ArrowLeftIcon, SparklesIcon, BookOpenIcon, AcademicCapIcon } from '@heroicons/react/24/outline'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"></div>
      </div>

      {/* Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 rounded-xl bg-white/90 backdrop-blur-md text-gray-700 hover:bg-white hover:text-primary transition-all duration-300 shadow-lg hover:shadow-xl border border-white/20 hover:-translate-y-0.5"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Visual Content */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Main Visual Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent/10 text-accent font-medium text-sm mb-4">
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    AI-Powered Learning
                  </div>
                  <h2 className="text-3xl font-bold text-primary mb-4">
                    Welcome back to your learning journey
                  </h2>
                  <p className="text-gray-600 text-lg">
                    Continue mastering any subject with personalized AI-generated quizzes
                  </p>
                </div>

                {/* Feature Highlights */}
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                      <BookOpenIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">Unlimited Quizzes</h3>
                      <p className="text-sm text-gray-600">Generate quizzes on any topic instantly</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-gradient-to-r from-accent/5 to-secondary/10 rounded-xl">
                    <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center mr-4">
                      <AcademicCapIcon className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">Track Progress</h3>
                      <p className="text-sm text-gray-600">Monitor your learning achievements</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-gradient-to-r from-secondary/10 to-primary/5 rounded-xl">
                    <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center mr-4">
                      <SparklesIcon className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">Smart Learning</h3>
                      <p className="text-sm text-gray-600">AI adapts to your learning style</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center shadow-lg">
                <SparklesIcon className="h-8 w-8 text-accent" />
              </div>
              <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center shadow-lg">
                <BookOpenIcon className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            {/* Header */}
            <div className="text-center mb-8">
              <Link href="/" className="inline-block mb-6">
                <div className="flex items-center justify-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-xl">
                    <span className="text-white font-bold text-2xl">M</span>
                  </div>
                  <span className="ml-3 text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Mentorak
                  </span>
                </div>
              </Link>
              <h1 className="text-4xl font-bold text-primary mb-3">Welcome back</h1>
              <p className="text-gray-600 text-lg">Sign in to continue your learning journey</p>
            </div>

            {/* Login Form */}
            <LoginForm />

            {/* Mobile Feature Pills */}
            <div className="lg:hidden mt-8 flex flex-wrap justify-center gap-3">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-sm text-primary">
                <SparklesIcon className="h-4 w-4 mr-2" />
                AI-Powered
              </div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-sm text-accent">
                <BookOpenIcon className="h-4 w-4 mr-2" />
                Any Topic
              </div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-secondary/20 text-sm text-primary">
                <AcademicCapIcon className="h-4 w-4 mr-2" />
                Track Progress
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}