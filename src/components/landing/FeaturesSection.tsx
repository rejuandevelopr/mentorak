import { 
  DocumentTextIcon, 
  MicrophoneIcon, 
  ChartBarIcon, 
  CpuChipIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline'

const features = [
  {
    name: 'Instant Quiz Generation',
    description: 'Simply type any topic and get 10 personalized multiple-choice questions generated instantly by AI.',
    icon: CpuChipIcon,
  },
  {
    name: 'Any Subject, Any Level',
    description: 'From basic math to advanced physics, from history to programming - create quizzes on literally any topic.',
    icon: DocumentTextIcon,
  },
  {
    name: 'Detailed Results & Review',
    description: 'Get comprehensive feedback with correct answers, explanations, and performance tracking for every quiz.',
    icon: ChartBarIcon,
  },
  {
    name: 'Smart Randomization',
    description: 'Every quiz is unique with randomized questions and answer options, ensuring fresh learning experiences.',
    icon: MicrophoneIcon,
  },
]

export function FeaturesSection() {
  return (
    <section className="py-24 sm:py-32 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-accent">Learn Smarter</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Everything you need for AI-powered learning
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Master any subject with personalized quizzes that adapt to your learning needs and provide instant feedback.
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2">
            {features.map((feature, index) => (
              <div 
                key={feature.name} 
                className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group border border-gray-100 hover:border-accent/20"
              >
                {/* Top accent line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-accent/60 rounded-t-2xl"></div>
                
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-secondary mb-6 group-hover:bg-accent/10 transition-colors duration-300">
                  <feature.icon className="h-7 w-7 text-accent" />
                </div>
                
                {/* Content */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-primary group-hover:text-accent transition-colors">
                    {feature.name}
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
                
                {/* Hover Arrow */}
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                  <ArrowRightIcon className="h-5 w-5 text-accent" />
                </div>
                
                {/* Card Number */}
                <div className="absolute top-6 right-6 text-sm font-semibold text-accent/30 group-hover:text-accent/50 transition-colors">
                  0{index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-white border border-accent/20 text-sm text-primary shadow-sm">
            <span className="w-2 h-2 bg-accent rounded-full mr-3 animate-pulse"></span>
            Ready to transform your learning experience?
          </div>
        </div>
      </div>
    </section>
  )
}