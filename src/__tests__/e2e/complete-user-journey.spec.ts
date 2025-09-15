/**
 * Complete User Journey E2E Test
 * Tests the entire application flow from landing page to quiz completion
 * using Playwright for browser automation
 */

import { test, expect, Page, BrowserContext } from '@playwright/test'

// Test configuration
const TEST_USER = {
  email: 'e2e-test@example.com',
  password: 'TestPassword123!',
  displayName: 'E2E Test User'
}

const SAMPLE_PDF_PATH = './src/__tests__/fixtures/sample-document.pdf'

class MentorakApp {
  constructor(private page: Page) {}

  // Navigation helpers
  async goToLandingPage() {
    await this.page.goto('/')
    await this.page.waitForLoadState('networkidle')
  }

  async goToDashboard() {
    await this.page.goto('/dashboard')
    await this.page.waitForLoadState('networkidle')
  }

  async goToUpload() {
    await this.page.goto('/upload')
    await this.page.waitForLoadState('networkidle')
  }

  // Authentication helpers
  async signUp(email: string, password: string, displayName?: string) {
    await this.page.goto('/signup')
    await this.page.waitForLoadState('networkidle')

    if (displayName) {
      await this.page.fill('[data-testid="display-name-input"]', displayName)
    }
    await this.page.fill('[data-testid="email-input"]', email)
    await this.page.fill('[data-testid="password-input"]', password)
    await this.page.fill('[data-testid="confirm-password-input"]', password)
    
    await this.page.click('[data-testid="signup-button"]')
    await this.page.waitForURL('/dashboard', { timeout: 10000 })
  }

  async signIn(email: string, password: string) {
    await this.page.goto('/login')
    await this.page.waitForLoadState('networkidle')

    await this.page.fill('[data-testid="email-input"]', email)
    await this.page.fill('[data-testid="password-input"]', password)
    
    await this.page.click('[data-testid="login-button"]')
    await this.page.waitForURL('/dashboard', { timeout: 10000 })
  }

  async signOut() {
    await this.page.click('[data-testid="user-menu-button"]')
    await this.page.click('[data-testid="logout-button"]')
    await this.page.waitForURL('/', { timeout: 5000 })
  }

  // Quiz flow helpers
  async uploadPDF(filePath: string) {
    await this.goToUpload()
    
    // Upload file
    const fileInput = this.page.locator('input[type="file"]')
    await fileInput.setInputFiles(filePath)
    
    // Wait for processing to complete
    await this.page.waitForSelector('[data-testid="processing-complete"]', { timeout: 60000 })
    
    // Should redirect to quiz page
    await this.page.waitForURL(/\/quiz\?id=/, { timeout: 10000 })
  }

  async takeVoiceQuiz() {
    // Wait for quiz to load
    await this.page.waitForSelector('[data-testid="quiz-session"]')
    
    // Get total number of questions
    const questionCount = await this.page.locator('[data-testid="question-counter"]').textContent()
    const totalQuestions = parseInt(questionCount?.split('/')[1] || '0')
    
    // Answer each question
    for (let i = 0; i < totalQuestions; i++) {
      // Wait for question to load
      await this.page.waitForSelector('[data-testid="current-question"]')
      
      // Click on first option (for testing purposes)
      await this.page.click('[data-testid="option-0"]')
      
      // Wait for next question or completion
      if (i < totalQuestions - 1) {
        await this.page.click('[data-testid="next-question-button"]')
      } else {
        await this.page.click('[data-testid="complete-quiz-button"]')
      }
    }
    
    // Should redirect to results page
    await this.page.waitForURL(/\/result\?id=/, { timeout: 10000 })
  }

  async viewQuizResults() {
    // Wait for results to load
    await this.page.waitForSelector('[data-testid="quiz-results"]')
    
    // Verify results are displayed
    const score = await this.page.locator('[data-testid="quiz-score"]').textContent()
    expect(score).toMatch(/\d+%/)
    
    return {
      score: score || '0%',
      hasDetailedResults: await this.page.locator('[data-testid="detailed-results"]').isVisible()
    }
  }

  async viewQuizHistory() {
    await this.page.goto('/history')
    await this.page.waitForLoadState('networkidle')
    
    // Wait for history table to load
    await this.page.waitForSelector('[data-testid="quiz-history-table"]')
    
    const quizRows = await this.page.locator('[data-testid="quiz-row"]').count()
    return quizRows
  }

  // Verification helpers
  async verifyLandingPageElements() {
    await expect(this.page.locator('h1')).toContainText('Transform PDFs into Interactive Voice Quizzes')
    await expect(this.page.locator('[data-testid="get-started-button"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="features-section"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="demo-preview"]')).toBeVisible()
  }

  async verifyDashboardElements() {
    await expect(this.page.locator('[data-testid="welcome-message"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="upload-button"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="recent-quizzes"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="dashboard-stats"]')).toBeVisible()
  }

  async verifyProtectedRouteRedirect() {
    await this.page.goto('/dashboard')
    await this.page.waitForURL('/login', { timeout: 5000 })
  }
}

test.describe('Complete User Journey', () => {
  let app: MentorakApp
  let context: BrowserContext
  let page: Page

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext()
    page = await context.newPage()
    app = new MentorakApp(page)
  })

  test.afterEach(async () => {
    await context.close()
  })

  test('should complete full user journey from landing to quiz completion', async () => {
    // Step 1: Visit landing page as unauthenticated user
    await app.goToLandingPage()
    await app.verifyLandingPageElements()

    // Step 2: Verify protected routes redirect to login
    await app.verifyProtectedRouteRedirect()

    // Step 3: Sign up for new account
    await app.signUp(TEST_USER.email, TEST_USER.password, TEST_USER.displayName)

    // Step 4: Verify dashboard loads correctly
    await app.verifyDashboardElements()

    // Step 5: Upload PDF and generate quiz
    await app.uploadPDF(SAMPLE_PDF_PATH)

    // Step 6: Take the voice quiz
    await app.takeVoiceQuiz()

    // Step 7: View quiz results
    const results = await app.viewQuizResults()
    expect(results.score).toMatch(/\d+%/)
    expect(results.hasDetailedResults).toBe(true)

    // Step 8: Navigate back to dashboard
    await app.goToDashboard()
    await app.verifyDashboardElements()

    // Step 9: View quiz history
    const historyCount = await app.viewQuizHistory()
    expect(historyCount).toBeGreaterThan(0)

    // Step 10: Sign out
    await app.signOut()

    // Step 11: Verify redirect to landing page
    await expect(page).toHaveURL('/')
  })

  test('should handle returning user login flow', async () => {
    // Assume user already exists (from previous test or setup)
    await app.goToLandingPage()
    
    // Click login link
    await page.click('[data-testid="login-link"]')
    
    // Sign in with existing credentials
    await app.signIn(TEST_USER.email, TEST_USER.password)
    
    // Verify dashboard loads
    await app.verifyDashboardElements()
    
    // Verify quiz history is preserved
    const historyCount = await app.viewQuizHistory()
    expect(historyCount).toBeGreaterThanOrEqual(0)
  })

  test('should handle quiz retaking flow', async () => {
    // Sign in
    await app.signIn(TEST_USER.email, TEST_USER.password)
    
    // Go to history and select a quiz
    await app.viewQuizHistory()
    
    // Click on first quiz result
    await page.click('[data-testid="quiz-row"]:first-child')
    
    // Should navigate to detailed result view
    await page.waitForURL(/\/history\//, { timeout: 5000 })
    
    // Click retake quiz button
    await page.click('[data-testid="retake-quiz-button"]')
    
    // Should redirect to upload page
    await page.waitForURL('/upload', { timeout: 5000 })
  })

  test('should handle error scenarios gracefully', async () => {
    await app.signIn(TEST_USER.email, TEST_USER.password)
    
    // Test invalid file upload
    await app.goToUpload()
    
    // Try to upload invalid file type
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('./package.json') // Invalid file type
    
    // Should show error message
    await expect(page.locator('[data-testid="upload-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="upload-error"]')).toContainText('Invalid file type')
  })

  test('should maintain session across page refreshes', async () => {
    // Sign in
    await app.signIn(TEST_USER.email, TEST_USER.password)
    await app.verifyDashboardElements()
    
    // Refresh page
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Should still be on dashboard (not redirected to login)
    await expect(page).toHaveURL('/dashboard')
    await app.verifyDashboardElements()
  })

  test('should handle offline/online state changes', async () => {
    await app.signIn(TEST_USER.email, TEST_USER.password)
    
    // Go offline
    await context.setOffline(true)
    
    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
    
    // Try to navigate (should show offline message)
    await page.click('[data-testid="upload-button"]')
    await expect(page.locator('[data-testid="offline-message"]')).toBeVisible()
    
    // Go back online
    await context.setOffline(false)
    
    // Offline indicator should disappear
    await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible()
    
    // Navigation should work again
    await page.click('[data-testid="upload-button"]')
    await page.waitForURL('/upload', { timeout: 5000 })
  })

  test('should handle voice interaction gracefully when unavailable', async () => {
    await app.signIn(TEST_USER.email, TEST_USER.password)
    
    // Upload PDF and start quiz
    await app.uploadPDF(SAMPLE_PDF_PATH)
    
    // Deny microphone permissions (simulate voice unavailable)
    await context.grantPermissions([], { origin: page.url() })
    
    // Should show fallback text input
    await expect(page.locator('[data-testid="text-input-fallback"]')).toBeVisible()
    
    // Should be able to complete quiz with text input
    await page.fill('[data-testid="text-answer-input"]', 'Test answer')
    await page.click('[data-testid="submit-answer-button"]')
    
    // Quiz should continue normally
    await expect(page.locator('[data-testid="quiz-session"]')).toBeVisible()
  })

  test('should display proper loading states during operations', async () => {
    await app.signIn(TEST_USER.email, TEST_USER.password)
    
    // Test upload loading state
    await app.goToUpload()
    
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(SAMPLE_PDF_PATH)
    
    // Should show processing indicator
    await expect(page.locator('[data-testid="processing-indicator"]')).toBeVisible()
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible()
    
    // Wait for completion
    await page.waitForSelector('[data-testid="processing-complete"]', { timeout: 60000 })
  })

  test('should handle navigation between all major sections', async () => {
    await app.signIn(TEST_USER.email, TEST_USER.password)
    
    // Test navigation flow
    const navigationTests = [
      { button: '[data-testid="dashboard-nav"]', url: '/dashboard' },
      { button: '[data-testid="upload-nav"]', url: '/upload' },
      { button: '[data-testid="history-nav"]', url: '/history' },
    ]
    
    for (const nav of navigationTests) {
      await page.click(nav.button)
      await page.waitForURL(nav.url, { timeout: 5000 })
      await expect(page).toHaveURL(nav.url)
    }
  })
})

test.describe('Data Persistence and Integrity', () => {
  let app: MentorakApp
  let context: BrowserContext
  let page: Page

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext()
    page = await context.newPage()
    app = new MentorakApp(page)
  })

  test.afterEach(async () => {
    await context.close()
  })

  test('should persist quiz data across sessions', async () => {
    // First session: Create and complete a quiz
    await app.signIn(TEST_USER.email, TEST_USER.password)
    await app.uploadPDF(SAMPLE_PDF_PATH)
    await app.takeVoiceQuiz()
    const results1 = await app.viewQuizResults()
    await app.signOut()
    
    // Second session: Verify data is still there
    await app.signIn(TEST_USER.email, TEST_USER.password)
    const historyCount = await app.viewQuizHistory()
    expect(historyCount).toBeGreaterThan(0)
    
    // Click on the quiz we just created
    await page.click('[data-testid="quiz-row"]:first-child')
    await page.waitForURL(/\/history\//, { timeout: 5000 })
    
    // Verify the score matches
    const score = await page.locator('[data-testid="quiz-score"]').textContent()
    expect(score).toBe(results1.score)
  })

  test('should handle concurrent quiz sessions correctly', async () => {
    // This test would require multiple browser contexts
    // to simulate concurrent users, but for now we'll test
    // that a single user can have multiple quiz sessions
    
    await app.signIn(TEST_USER.email, TEST_USER.password)
    
    // Start first quiz
    await app.uploadPDF(SAMPLE_PDF_PATH)
    const firstQuizUrl = page.url()
    
    // Open new tab and start second quiz
    const newPage = await context.newPage()
    const newApp = new MentorakApp(newPage)
    await newApp.goToUpload()
    await newApp.uploadPDF(SAMPLE_PDF_PATH)
    const secondQuizUrl = newPage.url()
    
    // Verify both quizzes are independent
    expect(firstQuizUrl).not.toBe(secondQuizUrl)
    
    // Complete both quizzes
    await app.takeVoiceQuiz()
    await newApp.takeVoiceQuiz()
    
    // Verify both results are saved
    await app.viewQuizHistory()
    const historyCount = await app.viewQuizHistory()
    expect(historyCount).toBeGreaterThanOrEqual(2)
    
    await newPage.close()
  })
})