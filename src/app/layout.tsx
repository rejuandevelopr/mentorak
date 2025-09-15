import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/components/ui/Toast'
import { AsyncErrorBoundary } from '@/components/errors/AsyncErrorBoundary'
import { OfflineIndicator } from '@/components/ui/OfflineIndicator'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mentorak - Voice-Powered Learning',
  description: 'Transform PDFs into interactive voice quizzes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AsyncErrorBoundary>
          <ToastProvider>
            <AuthProvider>
              <OfflineIndicator />
              {children}
            </AuthProvider>
          </ToastProvider>
        </AsyncErrorBoundary>
      </body>
    </html>
  )
}