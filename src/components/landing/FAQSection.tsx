'use client'

import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

const faqs = [
  {
    question: "How do you create quizzes?",
    answer: "Our AI analyzes your uploaded PDF documents and automatically generates relevant multiple-choice questions based on the key concepts and information found in your materials. The questions are designed to test comprehension and reinforce learning."
  },
  {
    question: "Can you upload multiple PDFs?",
    answer: "Yes! You can upload multiple PDF documents to create comprehensive quiz sessions. Our system will process each document and can either create separate quizzes or combine content from multiple sources into a single comprehensive quiz."
  },
  {
    question: "Is it compatible with all PDFs?",
    answer: "Mentorak works with most standard PDF documents including textbooks, lecture notes, research papers, and study guides. The PDF should contain readable text (not just images) for optimal question generation."
  },
  {
    question: "How do you handle user privacy?",
    answer: "We take privacy seriously. Your uploaded documents are processed securely and are not shared with third parties. All data is encrypted in transit and at rest, and you maintain full control over your content and can delete it at any time."
  },
  {
    question: "What languages does Mentorak support?",
    answer: "Currently, Mentorak primarily supports English for both text processing and voice interaction. We're working on expanding language support to include Spanish, French, and other major languages in future updates."
  },
  {
    question: "Can you use Mentorak with iPad?",
    answer: "Yes! Mentorak is web-based and works seamlessly on iPad and other tablets through your browser. The responsive design ensures a great experience across all devices, with touch-friendly controls for mobile users."
  },
  {
    question: "Is Mentorak free to use?",
    answer: "Mentorak offers a free tier with basic features including limited PDF uploads and quiz sessions. Premium plans provide unlimited uploads, advanced analytics, and priority voice processing for a seamless learning experience."
  }
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-24 sm:py-32 bg-gray-50">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl mb-4">
            Need to know
          </h2>
          <p className="text-lg text-gray-600">
            Everything you need to know about Mentorak and how it works
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 hover:border-accent/20 transition-all duration-200 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:bg-gray-50"
              >
                <span className="text-lg font-semibold text-primary pr-8">
                  {faq.question}
                </span>
                <div className="flex-shrink-0">
                  {openIndex === index ? (
                    <ChevronUpIcon className="h-5 w-5 text-accent" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </button>
              
              {openIndex === index && (
                <div className="px-8 pb-6">
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-gray-600 leading-relaxed mt-4">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <h3 className="text-xl font-semibold text-primary mb-4">
              Still have questions?
            </h3>
            <p className="text-gray-600 mb-6">
              Can't find the answer you're looking for? Please chat with our friendly team.
            </p>
            <button className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
              Get in touch
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}