import Link from 'next/link'
import { CheckIcon, SparklesIcon, StarIcon } from '@heroicons/react/24/outline'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for students and casual learners',
    features: [
      'Unlimited quiz generation',
      '10 questions per quiz',
      'Any topic or subject',
      'Instant AI-powered questions',
      'Detailed results & explanations',
      'Progress tracking',
      'Randomized questions',
      'Mobile-friendly interface'
    ],
    cta: 'Get Started Free',
    ctaLink: '/signup',
    popular: false,
    available: true
  },
  {
    name: 'Pro',
    price: '$9',
    period: 'per month',
    description: 'Advanced features for serious learners',
    features: [
      'Everything in Free',
      'Voice-powered quizzes',
      'AI chat tutor',
      'PDF document upload',
      'Advanced analytics',
      'Custom quiz lengths',
      'Export quiz results',
      'Priority support'
    ],
    cta: 'Coming Soon',
    ctaLink: '#',
    popular: true,
    available: false,
    comingSoon: true
  }
]

export function PricingSection() {
  return (
    <section className="py-24 sm:py-32 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-4xl text-center mb-16">
          <h2 className="text-base font-semibold leading-7 text-accent">Pricing</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-primary sm:text-5xl">
            Start Learning for Free
          </p>
          <p className="mt-6 text-xl leading-8 text-gray-600">
            Choose the plan that fits your learning journey. Upgrade anytime as we add more features.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl p-8 shadow-lg ring-1 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                plan.popular
                  ? 'ring-accent bg-gradient-to-br from-white to-secondary/30'
                  : 'ring-gray-200 bg-white hover:ring-gray-300'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent text-white text-sm font-semibold shadow-lg">
                    <StarIcon className="h-4 w-4 mr-2" />
                    Most Popular
                  </div>
                </div>
              )}

              {/* Coming Soon Badge */}
              {plan.comingSoon && (
                <div className="absolute top-6 right-6">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                    <SparklesIcon className="h-3 w-3 mr-1" />
                    Coming Soon
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-primary mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold text-primary">{plan.price}</span>
                  <span className="text-xl text-gray-500 ml-2">/{plan.period}</span>
                </div>
              </div>

              {/* Features */}
              <div className="mb-8">
                <ul className="space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckIcon className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${
                        plan.available ? 'text-accent' : 'text-gray-400'
                      }`} />
                      <span className={`text-sm ${
                        plan.available ? 'text-gray-700' : 'text-gray-500'
                      }`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Button */}
              <div className="mt-auto">
                {plan.available ? (
                  <Link
                    href={plan.ctaLink}
                    className={`block w-full text-center px-6 py-4 rounded-xl font-semibold transition-all duration-200 ${
                      plan.popular
                        ? 'bg-accent text-white hover:bg-accent/90 shadow-lg hover:shadow-xl'
                        : 'bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <button
                    disabled
                    className="block w-full text-center px-6 py-4 rounded-xl font-semibold bg-gray-100 text-gray-500 cursor-not-allowed"
                  >
                    {plan.cta}
                  </button>
                )}
              </div>

              {/* Free Plan Highlight */}
              {plan.name === 'Free' && (
                <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center text-green-800 text-sm font-medium">
                    <CheckIcon className="h-4 w-4 mr-2" />
                    No credit card required
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-600 mb-6">
            <SparklesIcon className="h-4 w-4 mr-2 text-accent" />
            All plans include unlimited quiz generation and detailed analytics
          </div>
          
          <div className="space-y-4">
            <p className="text-lg font-semibold text-primary">
              Ready to start learning smarter?
            </p>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join thousands of students already using Mentorak to master new subjects. 
              Start with our free plan and upgrade when you're ready for advanced features.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link
                href="/signup"
                className="inline-flex items-center px-8 py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Start Learning Free
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center px-8 py-4 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ Teaser */}
        <div className="mt-16 bg-gray-50 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-semibold text-primary mb-4">
            Questions about pricing?
          </h3>
          <p className="text-gray-600 mb-6">
            We're here to help you choose the right plan for your learning goals.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center">
              <CheckIcon className="h-4 w-4 mr-2 text-accent" />
              No hidden fees
            </div>
            <div className="flex items-center">
              <CheckIcon className="h-4 w-4 mr-2 text-accent" />
              Cancel anytime
            </div>
            <div className="flex items-center">
              <CheckIcon className="h-4 w-4 mr-2 text-accent" />
              Free forever plan
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}