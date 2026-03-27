export interface VitalMetric {
    name: string
    value: number
    rating: 'good' | 'needs-improvement' | 'poor'
    threshold: { good: number; poor: number }
}

export interface WCAGScore {
    overall: number
    categories: {
        perceivable: number
        operable: number
        understandable: number
        robust: number
    }
    issues: Array<{
        type: 'error' | 'warning'
        category: string
        description: string
        element: string
        fix: string
    }>
}

export class AccessibilityManager {
    private static focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]',
    ]

    private static headingLevels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']

    /**
     * Create focus trap for modal/dialog patterns
     */
    static focusTrap(container: HTMLElement): () => void {
        const focusableElements = container.querySelectorAll(
            this.focusableSelectors.join(', ')
        ) as NodeListOf<HTMLElement>

        if (focusableElements.length === 0) {
            return () => {
            } // No focusable elements, nothing to trap
        }

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        // Store current active element
        const previousActiveElement = document.activeElement as HTMLElement

        // Focus first element
        setTimeout(() => firstElement.focus(), 0)

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Tab') return

            if (event.shiftKey) {
                // Shift + Tab (backward)
                if (document.activeElement === firstElement) {
                    event.preventDefault()
                    lastElement.focus()
                }
            } else {
                // Tab (forward)
                if (document.activeElement === lastElement) {
                    event.preventDefault()
                    firstElement.focus()
                }
            }
        }

        container.addEventListener('keydown', handleKeyDown)

        // Return cleanup function
        return () => {
            container.removeEventListener('keydown', handleKeyDown)
            // Restore focus to previous element
            if (previousActiveElement && previousActiveElement.focus) {
                previousActiveElement.focus()
            }
        }
    }

    /**
     * Announce message to screen readers using ARIA live region
     */
    static announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
        const announcerId = `accessibility-announcer-${priority}`
        let announcer = document.getElementById(announcerId)

        if (!announcer) {
            announcer = document.createElement('div')
            announcer.id = announcerId
            announcer.setAttribute('aria-live', priority)
            announcer.setAttribute('aria-atomic', 'true')
            announcer.style.position = 'absolute'
            announcer.style.left = '-10000px'
            announcer.style.width = '1px'
            announcer.style.height = '1px'
            announcer.style.overflow = 'hidden'
            document.body.appendChild(announcer)
        }

        // Clear previous message and set new one
        announcer.textContent = ''
        setTimeout(() => {
            announcer!.textContent = message
        }, 100)
    }

    /**
     * Calculate WCAG compliance score for an element
     */
    static getWCAGScore(element: HTMLElement): WCAGScore {
        const issues: WCAGScore['issues'] = []
        let perceivable = 0
        let operable = 0
        let understandable = 0
        let robust = 0

        // Check for alt text on images
        const images = element.querySelectorAll('img')
        images.forEach((img, index) => {
            if (!img.getAttribute('alt') && img.getAttribute('alt') !== '') {
                issues.push({
                    type: 'error',
                    category: 'perceivable',
                    description: 'Image missing alt text',
                    element: `img[${index}]`,
                    fix: 'Add descriptive alt text to the image',
                })
            } else {
                perceivable += 10
            }
        })

        // Check for proper heading structure
        const headings = element.querySelectorAll(this.headingLevels.join(','))
        let lastLevel = 0
        headings.forEach((heading, index) => {
            const level = parseInt(heading.tagName.charAt(1))
            if (level > lastLevel + 1) {
                issues.push({
                    type: 'warning',
                    category: 'perceivable',
                    description: 'Heading level skipped',
                    element: `${heading.tagName}[${index}]`,
                    fix: 'Use proper heading hierarchy without skipping levels',
                })
            } else {
                perceivable += 10
            }
            lastLevel = level
        })

        // Check for form labels
        const inputs = element.querySelectorAll('input, select, textarea')
        inputs.forEach((input, index) => {
            const hasLabel = element.querySelector(`label[for="${input.id}"]`) ||
                input.getAttribute('aria-label') ||
                input.getAttribute('aria-labelledby')

            if (!hasLabel) {
                issues.push({
                    type: 'error',
                    category: 'perceivable',
                    description: 'Form input missing label',
                    element: `${input.tagName}[${index}]`,
                    fix: 'Add a label or aria-label/aria-labelledby',
                })
            } else {
                perceivable += 10
            }
        })

        // Check for keyboard accessibility
        const clickableElements = element.querySelectorAll('button, a, [role="button"]')
        clickableElements.forEach((element, index) => {
            const hasTabIndex = element.hasAttribute('tabindex')
            const isDisabled = element.hasAttribute('disabled')

            if (!hasTabIndex && !isDisabled) {
                issues.push({
                    type: 'warning',
                    category: 'operable',
                    description: 'Interactive element missing tabindex',
                    element: `${element.tagName}[${index}]`,
                    fix: 'Add tabindex="0" for keyboard accessibility',
                })
            } else {
                operable += 10
            }
        })

        // Check for ARIA roles
        const elementsWithRoles = element.querySelectorAll('[role]')
        elementsWithRoles.forEach((element, index) => {
            const role = element.getAttribute('role')
            if (role && !this.isValidARIARole(role)) {
                issues.push({
                    type: 'error',
                    category: 'robust',
                    description: 'Invalid ARIA role',
                    element: `[role="${role}"][${index}]`,
                    fix: 'Use a valid ARIA role',
                })
            } else {
                robust += 10
            }
        })

        // Check for sufficient color contrast (simplified)
        const textElements = element.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a')
        textElements.forEach((element, index) => {
            const styles = window.getComputedStyle(element)
            const color = styles.color
            const backgroundColor = styles.backgroundColor

            // Simplified contrast check - in production use a proper contrast calculation
            if (color === backgroundColor) {
                issues.push({
                    type: 'error',
                    category: 'perceivable',
                    description: 'Insufficient color contrast',
                    element: `${element.tagName}[${index}]`,
                    fix: 'Ensure text and background colors have sufficient contrast',
                })
            } else {
                perceivable += 5
            }
        })

        // Calculate scores
        const maxPerceivable = (images.length + headings.length + inputs.length + textElements.length) * 10
        const maxOperable = clickableElements.length * 10
        const maxRobust = elementsWithRoles.length * 10

        perceivable = maxPerceivable > 0 ? (perceivable / maxPerceivable) * 100 : 100
        operable = maxOperable > 0 ? (operable / maxOperable) * 100 : 100
        robust = maxRobust > 0 ? (robust / maxRobust) * 100 : 100
        understandable = 100 // Simplified - would check language, reading level, etc.

        const overall = (perceivable + operable + understandable + robust) / 4

        return {
            overall,
            categories: {
                perceivable,
                operable,
                understandable,
                robust,
            },
            issues,
        }
    }

    /**
     * Set up keyboard navigation shortcuts
     */
    static setupKeyboardNav(shortcuts: Record<string, () => void>): () => void {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Ignore if user is typing in an input field
            const target = event.target as HTMLElement
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return
            }

            const key = []
            if (event.ctrlKey) key.push('ctrl')
            if (event.altKey) key.push('alt')
            if (event.shiftKey) key.push('shift')
            if (event.metaKey) key.push('meta')
            key.push(event.key.toLowerCase())

            const shortcut = key.join('+')
            const handler = shortcuts[shortcut]

            if (handler) {
                event.preventDefault()
                handler()
            }
        }

        document.addEventListener('keydown', handleKeyDown)

        // Return cleanup function
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }

    /**
     * Add skip links for keyboard navigation
     */
    static addSkipLinks(): void {
        const skipLinks = [
            {href: '#main-content', text: 'Skip to main content'},
            {href: '#navigation', text: 'Skip to navigation'},
            {href: '#search', text: 'Skip to search'},
        ]

        const existingSkipLinks = document.querySelector('.skip-links')
        if (existingSkipLinks) {
            return // Skip links already exist
        }

        const skipLinksContainer = document.createElement('div')
        skipLinksContainer.className = 'skip-links'
        skipLinksContainer.setAttribute('role', 'navigation')
        skipLinksContainer.setAttribute('aria-label', 'Skip navigation links')

        Object.assign(skipLinksContainer.style, {
            position: 'absolute',
            top: '-40px',
            left: '6px',
            background: '#000',
            color: '#fff',
            padding: '8px',
            textDecoration: 'none',
            borderRadius: '0 0 4px 4px',
            zIndex: '100000',
            fontSize: '14px',
        })

        skipLinks.forEach(link => {
            const anchor = document.createElement('a')
            anchor.href = link.href
            anchor.textContent = link.text
            anchor.style.cssText = `
        color: white;
        text-decoration: none;
        margin-right: 10px;
      `
            anchor.addEventListener('focus', () => {
                skipLinksContainer.style.top = '0'
            })
            anchor.addEventListener('blur', () => {
                skipLinksContainer.style.top = '-40px'
            })
            skipLinksContainer.appendChild(anchor)
        })

        document.body.insertBefore(skipLinksContainer, document.body.firstChild)
    }

    /**
     * Check if element has sufficient color contrast
     */
    static checkColorContrast(element: HTMLElement): { ratio: number; passes: boolean } {
        const styles = window.getComputedStyle(element)
        const color = this.parseColor(styles.color)
        const backgroundColor = this.parseColor(styles.backgroundColor)

        if (!color || !backgroundColor) {
            return {ratio: 0, passes: false}
        }

        const ratio = this.calculateContrastRatio(color, backgroundColor)
        const isLargeText = this.isLargeText(element)
        const threshold = isLargeText ? 3 : 4.5

        return {
            ratio: Math.round(ratio * 100) / 100,
            passes: ratio >= threshold,
        }
    }

    /**
     * Generate accessibility report for a page
     */
    static generateAccessibilityReport(): WCAGScore {
        const body = document.body
        if (!body) {
            return {
                overall: 0,
                categories: {perceivable: 0, operable: 0, understandable: 0, robust: 0},
                issues: [],
            }
        }

        return this.getWCAGScore(body)
    }

    /**
     * Auto-fix common accessibility issues
     */
    static autoFixCommonIssues(): void {
        // Add missing alt tags to images
        const images = document.querySelectorAll('img:not([alt])')
        images.forEach(img => {
            const src = img.getAttribute('src') || ''
            const filename = src.split('/').pop()?.split('.')[0] || 'image'
            img.setAttribute('alt', `Image: ${filename}`)
        })

        // Add tabindex to clickable elements
        const clickables = document.querySelectorAll('button:not([tabindex]), a:not([tabindex])')
        clickables.forEach(element => {
            element.setAttribute('tabindex', '0')
        })

        // Add role to semantic elements that might need it
        const main = document.querySelector('main:not([role])')
        if (main) {
            main.setAttribute('role', 'main')
        }

        const nav = document.querySelector('nav:not([role])')
        if (nav) {
            nav.setAttribute('role', 'navigation')
        }

        // Add skip links if they don't exist
        this.addSkipLinks()
    }

    private static isValidARIARole(role: string): boolean {
        const validRoles = [
            'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 'cell',
            'checkbox', 'columnheader', 'combobox', 'complementary', 'contentinfo', 'definition',
            'dialog', 'directory', 'document', 'feed', 'figure', 'form', 'grid', 'gridcell',
            'group', 'heading', 'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
            'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
            'navigation', 'none', 'note', 'option', 'presentation', 'progressbar', 'radio',
            'radiogroup', 'region', 'row', 'rowgroup', 'rowheader', 'scrollbar', 'search',
            'searchbox', 'separator', 'slider', 'spinbutton', 'status', 'switch', 'tab',
            'table', 'tablist', 'tabpanel', 'tablist', 'textbox', 'timer', 'toolbar',
            'tooltip', 'tree', 'treegrid', 'treeitem', 'group', 'img'
        ]
        return validRoles.includes(role)
    }

    private static parseColor(color: string): { r: number; g: number; b: number } | null {
        const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
        if (match) {
            return {
                r: parseInt(match[1]),
                g: parseInt(match[2]),
                b: parseInt(match[3]),
            }
        }
        return null
    }

    private static calculateContrastRatio(
        color1: { r: number; g: number; b: number },
        color2: { r: number; g: number; b: number }
    ): number {
        const luminance = (color: { r: number; g: number; b: number }) => {
            const [r, g, b] = [color.r, color.g, color.b].map(val => {
                val = val / 255
                return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
            })
            return 0.2126 * r + 0.7152 * g + 0.0722 * b
        }

        const lum1 = luminance(color1)
        const lum2 = luminance(color2)

        const brightest = Math.max(lum1, lum2)
        const darkest = Math.min(lum1, lum2)

        return (brightest + 0.05) / (darkest + 0.05)
    }

    private static isLargeText(element: HTMLElement): boolean {
        const styles = window.getComputedStyle(element)
        const fontSize = parseFloat(styles.fontSize)
        const fontWeight = styles.fontWeight

        const isBold = fontWeight === 'bold' || parseInt(fontWeight) >= 700
        const isLarge = fontSize >= 18 || (fontSize >= 14 && isBold)

        return isLarge
    }
}