export interface VitalMetric {
    name: string
    value: number
    rating: 'good' | 'needs-improvement' | 'poor'
    threshold: { good: number; poor: number }
    timestamp: number
}

export interface CustomMetric {
    name: string
    value: number
    unit: string
    timestamp: number
}

export interface PerformanceReport {
    vitals: VitalMetric[]
    customMetrics: CustomMetric[]
    summary: {
        overallScore: number
        issues: string[]
        recommendations: string[]
    }
    timestamp: number
}

export class PerformanceMonitor {
    private static instance: PerformanceMonitor
    private vitals: VitalMetric[] = []
    private customMetrics: CustomMetric[] = []
    private observers: PerformanceObserver[] = []
    private callbacks: Array<(metric: VitalMetric) => void> = []
    private isMonitoring = false

    private constructor() {
    }

    static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor()
        }
        return PerformanceMonitor.instance
    }

    /**
     * Start monitoring Web Vitals and performance metrics
     */
    observeWebVitals(callback?: (metric: VitalMetric) => void): () => void {
        if (this.isMonitoring) {
            console.warn('Performance monitoring already active')
            return () => {
            }
        }

        this.isMonitoring = true
        if (callback) {
            this.callbacks.push(callback)
        }

        // Observe Core Web Vitals
        this.observeLCP()
        this.observeFID()
        this.observeCLS()
        this.observeFCP()
        this.observeTTFB()

        // Return cleanup function
        return () => {
            this.stopMonitoring()
        }
    }

    /**
     * Track custom metrics
     */
    trackCustomMetric(name: string, value: number, unit: string = 'ms'): void {
        const metric: CustomMetric = {
            name,
            value,
            unit,
            timestamp: Date.now(),
        }

        this.customMetrics.push(metric)

        // Keep only last 100 metrics per name
        const metricsByName = this.customMetrics.filter(m => m.name === name)
        if (metricsByName.length > 100) {
            this.customMetrics = this.customMetrics.filter(m => m.name !== name || m === metric)
        }

        console.log(`Custom metric tracked: ${name} = ${value} ${unit}`)
    }

    /**
     * Get comprehensive performance report
     */
    getReport(): PerformanceReport {
        const now = Date.now()
        const recentVitals = this.vitals.filter(v => now - v.timestamp < 300000) // Last 5 minutes
        const recentCustom = this.customMetrics.filter(m => now - m.timestamp < 300000)

        const overallScore = this.calculateOverallScore(recentVitals)
        const issues = this.identifyIssues(recentVitals, recentCustom)
        const recommendations = this.generateRecommendations(issues)

        return {
            vitals: recentVitals,
            customMetrics: recentCustom,
            summary: {
                overallScore,
                issues,
                recommendations,
            },
            timestamp: now,
        }
    }

    /**
     * Get metrics for specific time range
     */
    getMetricsInRange(startTime: number, endTime: number): {
        vitals: VitalMetric[]
        customMetrics: CustomMetric[]
    } {
        return {
            vitals: this.vitals.filter(v => v.timestamp >= startTime && v.timestamp <= endTime),
            customMetrics: this.customMetrics.filter(m => m.timestamp >= startTime && m.timestamp <= endTime),
        }
    }

    /**
     * Clear all stored metrics
     */
    clearMetrics(): void {
        this.vitals = []
        this.customMetrics = []
        console.log('Performance metrics cleared')
    }

    /**
     * Export metrics as JSON
     */
    exportMetrics(): string {
        const data = {
            vitals: this.vitals,
            customMetrics: this.customMetrics,
            exportedAt: Date.now(),
        }
        return JSON.stringify(data, null, 2)
    }

    /**
     * Import metrics from JSON
     */
    importMetrics(jsonData: string): void {
        try {
            const data = JSON.parse(jsonData)
            this.vitals = data.vitals || []
            this.customMetrics = data.customMetrics || []
            console.log('Performance metrics imported successfully')
        } catch (error) {
            throw new Error(`Failed to import metrics: ${error instanceof Error ? error.message : 'Invalid JSON'}`)
        }
    }

    /**
     * Set up performance alerts
     */
    setupAlerts(config: {
        lcp?: { threshold: number; callback: (value: number) => void }
        fid?: { threshold: number; callback: (value: number) => void }
        cls?: { threshold: number; callback: (value: number) => void }
        custom?: { name: string; threshold: number; callback: (value: number) => void }
    }): () => void {
        const callbacks: Array<(metric: VitalMetric) => void> = []

        // Set up vital alerts
        if (config.lcp) {
            callbacks.push((metric) => {
                if (metric.name === 'LCP' && metric.value > config.lcp!.threshold) {
                    config.lcp!.callback(metric.value)
                }
            })
        }

        if (config.fid) {
            callbacks.push((metric) => {
                if (metric.name === 'FID' && metric.value > config.fid!.threshold) {
                    config.fid!.callback(metric.value)
                }
            })
        }

        if (config.cls) {
            callbacks.push((metric) => {
                if (metric.name === 'CLS' && metric.value > config.cls!.threshold) {
                    config.cls!.callback(metric.value)
                }
            })
        }

        // Add callbacks to existing monitoring
        callbacks.forEach(callback => this.callbacks.push(callback))

        // Return cleanup function
        return () => {
            callbacks.forEach(callback => {
                const index = this.callbacks.indexOf(callback)
                if (index > -1) {
                    this.callbacks.splice(index, 1)
                }
            })
        }
    }

    /**
     * Get performance insights
     */
    getInsights(): {
        trends: Array<{ metric: string; trend: 'improving' | 'declining' | 'stable' }>
        bottlenecks: string[]
        recommendations: string[]
    } {
        const insights = {
            trends: [] as Array<{ metric: string; trend: 'improving' | 'declining' | 'stable' }>,
            bottlenecks: [] as string[],
            recommendations: [] as string[],
        }

        // Analyze trends for each vital
        const vitalNames = ['LCP', 'FID', 'CLS', 'FCP', 'TTFB']

        vitalNames.forEach(name => {
            const metrics = this.vitals.filter(v => v.name === name).slice(-10)
            if (metrics.length >= 3) {
                const trend = this.calculateTrend(metrics)
                insights.trends.push({metric: name, trend})
            }
        })

        // Identify bottlenecks
        const poorVitals = this.vitals.filter(v => v.rating === 'poor')
        const bottleneckCounts = poorVitals.reduce((acc, vital) => {
            acc[vital.name] = (acc[vital.name] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        insights.bottlenecks = Object.entries(bottleneckCounts)
            .filter(([, count]) => count > 2)
            .map(([name]) => name)

        // Generate recommendations based on insights
        insights.recommendations = this.generateRecommendations(
            insights.bottlenecks.map(name => `${name} consistently poor`)
        )

        return insights
    }

    private stopMonitoring(): void {
        this.observers.forEach(observer => observer.disconnect())
        this.observers = []
        this.callbacks = []
        this.isMonitoring = false
    }

    private observeLCP(): void {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries()
                entries.forEach((entry) => {
                    if (entry.name === 'largest-contentful-paint') {
                        const metric = this.createVitalMetric(
                            'LCP',
                            entry.startTime,
                            {good: 2500, poor: 4000}
                        )
                        this.recordVital(metric)
                    }
                })
            })

            observer.observe({entryTypes: ['largest-contentful-paint']})
            this.observers.push(observer)
        } catch (error) {
            console.warn('LCP observation not supported:', error)
        }
    }

    private observeFID(): void {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries()
                entries.forEach((entry) => {
                    if (entry.name === 'first-input-delay') {
                        const metric = this.createVitalMetric(
                            'FID',
                            (entry as any).processingStart - entry.startTime,
                            {good: 100, poor: 300}
                        )
                        this.recordVital(metric)
                    }
                })
            })

            observer.observe({entryTypes: ['first-input']})
            this.observers.push(observer)
        } catch (error) {
            console.warn('FID observation not supported:', error)
        }
    }

    private observeCLS(): void {
        try {
            let clsValue = 0
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries()
                entries.forEach((entry) => {
                    if (!(entry as any).hadRecentInput) {
                        clsValue += (entry as any).value
                    }
                })

                const metric = this.createVitalMetric(
                    'CLS',
                    clsValue,
                    {good: 0.1, poor: 0.25}
                )
                this.recordVital(metric)
            })

            observer.observe({entryTypes: ['layout-shift']})
            this.observers.push(observer)
        } catch (error) {
            console.warn('CLS observation not supported:', error)
        }
    }

    private observeFCP(): void {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries()
                entries.forEach((entry) => {
                    if (entry.name === 'first-contentful-paint') {
                        const metric = this.createVitalMetric(
                            'FCP',
                            entry.startTime,
                            {good: 1800, poor: 3000}
                        )
                        this.recordVital(metric)
                    }
                })
            })

            observer.observe({entryTypes: ['paint']})
            this.observers.push(observer)
        } catch (error) {
            console.warn('FCP observation not supported:', error)
        }
    }

    private observeTTFB(): void {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries()
                entries.forEach((entry) => {
                    if (entry.name === 'navigation') {
                        const navEntry = entry as PerformanceNavigationTiming
                        const ttfb = navEntry.responseStart - navEntry.requestStart

                        const metric = this.createVitalMetric(
                            'TTFB',
                            ttfb,
                            {good: 800, poor: 1800}
                        )
                        this.recordVital(metric)
                    }
                })
            })

            observer.observe({entryTypes: ['navigation']})
            this.observers.push(observer)
        } catch (error) {
            console.warn('TTFB observation not supported:', error)
        }
    }

    private createVitalMetric(
        name: string,
        value: number,
        threshold: { good: number; poor: number }
    ): VitalMetric {
        let rating: 'good' | 'needs-improvement' | 'poor'

        if (value <= threshold.good) {
            rating = 'good'
        } else if (value <= threshold.poor) {
            rating = 'needs-improvement'
        } else {
            rating = 'poor'
        }

        return {
            name,
            value,
            rating,
            threshold,
            timestamp: Date.now(),
        }
    }

    private recordVital(metric: VitalMetric): void {
        this.vitals.push(metric)

        // Keep only last 50 metrics per type
        const vitalsByName = this.vitals.filter(v => v.name === metric.name)
        if (vitalsByName.length > 50) {
            this.vitals = this.vitals.filter(v => v.name !== metric.name || v === metric)
        }

        // Notify callbacks
        this.callbacks.forEach(callback => {
            try {
                callback(metric)
            } catch (error) {
                console.error('Error in vital callback:', error)
            }
        })

        console.log(`Web Vital recorded: ${metric.name} = ${metric.value} (${metric.rating})`)
    }

    private calculateOverallScore(vitals: VitalMetric[]): number {
        if (vitals.length === 0) return 100

        const scores = vitals.map(vital => {
            switch (vital.rating) {
                case 'good':
                    return 100
                case 'needs-improvement':
                    return 65
                case 'poor':
                    return 30
                default:
                    return 50
            }
        })

        return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    }

    private identifyIssues(vitals: VitalMetric[], customMetrics: CustomMetric[]): string[] {
        const issues: string[] = []

        // Check Core Web Vitals
        vitals.forEach(vital => {
            if (vital.rating === 'poor') {
                issues.push(`${vital.name} is in poor range (${vital.value})`)
            } else if (vital.rating === 'needs-improvement') {
                issues.push(`${vital.name} needs improvement (${vital.value})`)
            }
        })

        // Check for performance patterns
        const lcpMetrics = vitals.filter(v => v.name === 'LCP')
        if (lcpMetrics.length > 1) {
            const recent = lcpMetrics.slice(-3)
            const avg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length
            if (avg > 3000) {
                issues.push('Consistently slow Largest Contentful Paint')
            }
        }

        const fidMetrics = vitals.filter(v => v.name === 'FID')
        if (fidMetrics.length > 1) {
            const recent = fidMetrics.slice(-3)
            const avg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length
            if (avg > 200) {
                issues.push('Consistently high First Input Delay')
            }
        }

        return issues
    }

    private generateRecommendations(issues: string[]): string[] {
        const recommendations: string[] = []

        issues.forEach(issue => {
            if (issue.includes('LCP')) {
                recommendations.push('Optimize images, reduce server response time, eliminate render-blocking resources')
            } else if (issue.includes('FID')) {
                recommendations.push('Reduce JavaScript execution time, minimize main thread work')
            } else if (issue.includes('CLS')) {
                recommendations.push('Ensure images have dimensions, avoid inserting content above existing content')
            } else if (issue.includes('TTFB')) {
                recommendations.push('Improve server response time, use CDN, optimize backend performance')
            } else if (issue.includes('slow')) {
                recommendations.push('Profile and optimize slow operations, consider lazy loading')
            }
        })

        // Add general recommendations
        if (recommendations.length === 0) {
            recommendations.push('Performance looks good! Continue monitoring for regressions')
        }

        return [...new Set(recommendations)] // Remove duplicates
    }

    private calculateTrend(metrics: VitalMetric[]): 'improving' | 'declining' | 'stable' {
        if (metrics.length < 3) return 'stable'

        const recent = metrics.slice(-3)
        const older = metrics.slice(-6, -3)

        if (older.length === 0) return 'stable'

        const recentAvg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length
        const olderAvg = older.reduce((sum, m) => sum + m.value, 0) / older.length

        const change = (recentAvg - olderAvg) / olderAvg

        if (change > 0.1) return 'declining'
        if (change < -0.1) return 'improving'
        return 'stable'
    }
}

// Export singleton instance for easy use
export const performanceMonitor = PerformanceMonitor.getInstance()