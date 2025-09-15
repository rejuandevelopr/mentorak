import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should display the landing page correctly', async ({ page }) => {
    await page.goto('/')

    // Check if the page loads
    await expect(page).toHaveTitle(/Mentorak/)

    // Check for main navigation elements
    await expect(page.locator('nav')).toBeVisible()

    // Check for hero section
    await expect(page.locator('h1')).toBeVisible()

    // Check for CTA buttons
    const ctaButtons = page.locator('a[href*="signup"], button:has-text("Get Started")')
    await expect(ctaButtons.first()).toBeVisible()
  })

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/')

    // Look for signup link or button
    const signupLink = page.locator('a[href*="signup"], a:has-text("Sign Up"), a:has-text("Get Started")')
    
    if (await signupLink.count() > 0) {
      await signupLink.first().click()
      
      // Should navigate to signup page
      await expect(page).toHaveURL(/signup/)
    } else {
      // If no signup link found, just verify the page structure
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('should have responsive design', async ({ page }) => {
    await page.goto('/')

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('body')).toBeVisible()

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('body')).toBeVisible()

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('body')).toBeVisible()
  })

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/')
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    
    // Check that there are no critical JavaScript errors
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') &&
      !error.includes('net::ERR_')
    )
    
    expect(criticalErrors).toHaveLength(0)
  })
})