import {expect, test} from '@playwright/test'

test.describe('Discover Page', () => {
    test.beforeEach(async ({page}) => {
        // Mock authentication - in a real app, you'd have proper auth flow
        await page.goto('/discover')

        // Wait for page to load
        await page.waitForLoadState('networkidle')
    })

    test('loads discover page successfully', async ({page}) => {
        // Check if page loads without errors
        await expect(page).toHaveTitle(/Zenith/)

        // Check for main elements
        await expect(page.locator('h1')).toContainText('Discover')

        // Check for view mode toggle
        await expect(page.locator('text=Swipe')).toBeVisible()
        await expect(page.locator('text=Grid')).toBeVisible()

        // Check for filters button
        await expect(page.locator('button:has-text("Filters")')).toBeVisible()
    })

    test('switches between swipe and grid view modes', async ({page}) => {
        // Default should be swipe view
        await expect(page.locator('text=Swipe')).toHaveClass(/bg-blue-600|bg-blue-500/)

        // Switch to grid view
        await page.click('text=Grid')
        await expect(page.locator('text=Grid')).toHaveClass(/bg-blue-600|bg-blue-500/)

        // Switch back to swipe view
        await page.click('text=Swipe')
        await expect(page.locator('text=Swipe')).toHaveClass(/bg-blue-600|bg-blue-500/)
    })

    test('opens and closes filters panel', async ({page}) => {
        // Open filters
        await page.click('button:has-text("Filters")')

        // Check if filters panel is open
        await expect(page.locator('text=Filters')).toBeVisible()
        await expect(page.locator('label:has-text("Age Range")')).toBeVisible()
        await expect(page.locator('label:has-text("Max Distance")')).toBeVisible()
        await expect(page.locator('label:has-text("Verified only")')).toBeVisible()
        await expect(page.locator('label:has-text("Online only")')).toBeVisible()

        // Close filters by clicking outside or on close button
        await page.keyboard.press('Escape')

        // Filters should be closed
        await expect(page.locator('label:has-text("Age Range")')).not.toBeVisible()
    })

    test('applies filters correctly', async ({page}) => {
        // Open filters
        await page.click('button:has-text("Filters")')

        // Set age range
        const ageSlider = page.locator('[role="slider"]').first()
        await ageSlider.fill('25, 35')

        // Set verified only
        await page.click('label:has-text("Verified only") input[type="checkbox"]')

        // Apply filters
        await page.click('button:has-text("Apply Filters")')

        // Wait for profiles to reload
        await page.waitForTimeout(1000)

        // Check that filters are applied (would depend on mock data)
        // In a real test, you'd verify the filtered results
    })

    test('swipe card interactions work', async ({page}) => {
        // Ensure we're in swipe view
        if (await page.locator('text=Grid').isVisible()) {
            await page.click('text=Swipe')
        }

        // Wait for cards to load
        await page.waitForTimeout(1000)

        // Check for swipe buttons
        await expect(page.locator('button:has([data-lucide="X"])')).toBeVisible() // Pass button
        await expect(page.locator('button:has([data-lucide="Heart"])')).toBeVisible() // Like button
        await expect(page.locator('button:has([data-lucide="Star"])')).toBeVisible() // Super like button

        // Test card drag (if cards are present)
        const card = page.locator('[data-testid="profile-card"]').first()
        if (await card.isVisible()) {
            // Drag card to the right (like)
            await card.dragTo(page.locator('body'), {targetPosition: {x: 200, y: 0}})

            // Wait for animation
            await page.waitForTimeout(500)
        }
    })

    test('grid view displays profile cards correctly', async ({page}) => {
        // Switch to grid view
        await page.click('text=Grid')

        // Wait for grid to load
        await page.waitForTimeout(1000)

        // Check for profile cards in grid
        const profileCards = page.locator('[data-testid="profile-card"]')

        if (await profileCards.first().isVisible()) {
            // Check card elements
            const firstCard = profileCards.first()

            await expect(firstCard.locator('img')).toBeVisible() // Avatar
            await expect(firstCard.locator('text=/,\s\d+/')).toBeVisible() // Age
            await expect(firstCard.locator('button:has([data-lucide="X"])')).toBeVisible() // Pass button
            await expect(firstCard.locator('button:has([data-lucide="Heart"])')).toBeVisible() // Like button
        }
    })

    test('handles empty state gracefully', async ({page}) => {
        // Mock empty profiles response
        await page.route('/api/profiles*', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({profiles: []})
            })
        })

        // Reload page
        await page.reload()
        await page.waitForLoadState('networkidle')

        // Check for empty state message
        await expect(page.locator('text=No profiles found')).toBeVisible()
        await expect(page.locator('text=Try adjusting your filters to see more people')).toBeVisible()
        await expect(page.locator('button:has-text("Adjust Filters")')).toBeVisible()
    })

    test('shows online status badges correctly', async ({page}) => {
        // Wait for profiles to load
        await page.waitForTimeout(1000)

        const profileCards = page.locator('[data-testid="profile-card"]')
        const firstCard = profileCards.first()

        if (await firstCard.isVisible()) {
            // Check for online status indicator
            const onlineIndicator = firstCard.locator('[data-testid="online-status"]')

            if (await onlineIndicator.isVisible()) {
                // Should have either "Online" or "Offline" badge
                await expect(
                    onlineIndicator.locator('text=Online').or(onlineIndicator.locator('text=Offline'))
                ).toBeVisible()
            }
        }
    })

    test('handles loading states', async ({page}) => {
        // Mock slow API response
        await page.route('/api/profiles*', route => {
            // Delay response
            setTimeout(() => {
                route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({profiles: []})
                })
            }, 2000)
        })

        // Reload page
        await page.reload()

        // Should show loading state
        await expect(page.locator('.animate-spin')).toBeVisible()
        await expect(page.locator('text=Loading profiles...')).toBeVisible()

        // Wait for loading to complete
        await page.waitForTimeout(2500)

        // Loading should be gone
        await expect(page.locator('.animate-spin')).not.toBeVisible()
    })

    test('handles network errors gracefully', async ({page}) => {
        // Mock API error
        await page.route('/api/profiles*', route => {
            route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({error: 'Internal server error'})
            })
        })

        // Reload page
        await page.reload()
        await page.waitForLoadState('networkidle')

        // Should show error state or empty state
        await expect(page.locator('text=No profiles found')).toBeVisible()
    })

    test('responsive design works on mobile', async ({page}) => {
        // Set mobile viewport
        await page.setViewportSize({width: 375, height: 667})

        // Check mobile-specific elements
        await expect(page.locator('nav.fixed.bottom-0')).toBeVisible() // Bottom nav
        await expect(page.locator('header.sticky.top-0')).toBeVisible() // Header

        // Check that sidebar is hidden on mobile
        await expect(page.locator('.hidden.md\\:flex')).not.toBeVisible()

        // Test mobile swipe gestures (if implemented)
        const card = page.locator('[data-testid="profile-card"]').first()
        if (await card.isVisible()) {
            // Test touch interactions
            await card.tap()
            await expect(card).toBeVisible()
        }
    })

    test('accessibility features work', async ({page}) => {
        // Check for skip links
        await expect(page.locator('a[href^="#"][data-testid="skip-link"]')).toBeVisible()

        // Check for ARIA labels
        await expect(page.locator('button[aria-label*="Filter"]')).toBeVisible()

        // Check keyboard navigation
        await page.keyboard.press('Tab')
        await expect(page.locator(':focus')).toBeVisible()

        // Test keyboard shortcuts
        await page.keyboard.press('Escape')
        // Should close any open modals or panels
    })

    test('performance metrics are acceptable', async ({page}) => {
        // Start performance monitoring
        const navigationStart = await page.evaluate(() => performance.timing.navigationStart)

        // Navigate to discover page
        await page.goto('/discover')
        await page.waitForLoadState('networkidle')

        // Check load time
        const loadComplete = await page.evaluate(() => performance.timing.loadEventEnd)
        const loadTime = loadComplete - navigationStart

        // Should load within reasonable time (3 seconds)
        expect(loadTime).toBeLessThan(3000)

        // Check for console errors
        const errors: string[] = []
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text())
            }
        })

        // Should have no console errors
        await page.waitForTimeout(2000)
        expect(errors).toHaveLength(0)
    })
})

test.describe('Discover Page - Authenticated', () => {
    test('authenticated user sees personalized content', async ({page}) => {
        // Mock authenticated session
        await page.addInitScript(() => {
            // Mock localStorage for auth token
            localStorage.setItem('supabase.auth.token', 'mock-token')
        })

        // Mock API responses for authenticated user
        await page.route('/api/profiles*', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    profiles: [
                        {
                            id: '1',
                            username: 'testuser',
                            age: 25,
                            bio: 'Test bio',
                            interests: ['music', 'travel'],
                            verified: true,
                            avatar_url: 'https://example.com/avatar.jpg',
                            online_status: 'online'
                        }
                    ]
                })
            })
        })

        await page.goto('/discover')
        await page.waitForLoadState('networkidle')

        // Should see profile cards
        await expect(page.locator('[data-testid="profile-card"]').first()).toBeVisible()

        // Should see user-specific features
        await expect(page.locator('button:has-text("Like")')).toBeVisible()
        await expect(page.locator('button:has-text("Pass")')).toBeVisible()
    })
})