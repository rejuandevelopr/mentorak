import { SignupForm } from '@/components/auth/SignupForm'
import Link from 'next/link'
import { ArrowLeftIcon, SparklesIcon, RocketLaunchIcon, GiftIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"></div>
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
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-accent/20 to-primary/20 text-primary font-medium text-sm mb-4">
                    <RocketLaunchIcon className="h-4 w-4 mr-2" />
                    Start Your Journey
                  </div>
                  <h2 className="text-3xl font-bold text-primary mb-4">
                    Join thousands of learners
                  </h2>
                  <p className="text-gray-600 text-lg">
                    Create your free account and unlock unlimited AI-powered learning
                  </p>
                </div>

                {/* Benefits List */}
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">100% Free Forever</h3>
                      <p className="text-sm text-gray-600">No hidden fees, no credit card required</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-primary/5 rounded-xl border border-blue-100">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                      <SparklesIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">Unlimited Quizzes</h3>
                      <p className="text-sm text-gray-600">Generate as many quizzes as you want</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-accent/5 rounded-xl border border-purple-100">
                    <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center mr-4">
                      <GiftIcon className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">Instant Access</h3>
                      <p className="text-sm text-gray-600">Start learning immediately after signup</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl">
                    <div className="text-2xl font-bold text-primary">10K+</div>
                    <div className="text-xs text-gray-600">Active Users</div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-accent/5 to-secondary/10 rounded-xl">
                    <div className="text-2xl font-bold text-accent">50K+</div>
                    <div className="text-xs text-gray-600">Quizzes Created</div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-secondary/10 to-primary/5 rounded-xl">
                    <div className="text-2xl font-bold text-primary">95%</div>
                    <div className="text-xs text-gray-600">Success Rate</div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-br from-accent/20 to-primary/20 rounded-full flex items-center justify-center shadow-lg">
                <RocketLaunchIcon className="h-8 w-8 text-accent" />
              </div>
              <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-gradient-to-br from-green-200/50 to-emerald-200/50 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Right Side - Signup Form */}
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
              <h1 className="text-4xl font-bold text-primary mb-3">Start learning today</h1>
              <p className="text-gray-600 text-lg">Create your free account and generate unlimited quizzes</p>
            </div>

            {/* Signup Form */}
            <SignupForm />

            {/* Mobile Benefits */}
            <div className="lg:hidden mt-8 space-y-3">
              <div className="flex items-center justify-center p-3 bg-green-50 rounded-xl border border-green-100">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-primary">100% Free Forever</span>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-sm text-primary">
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Unlimited Quizzes
                </div>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-sm text-accent">
                  <GiftIcon className="h-4 w-4 mr-2" />
                  Instant Access
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}