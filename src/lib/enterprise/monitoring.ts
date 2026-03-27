import {performance} from 'perf_hooks'

// Performance monitoring configuration
export const monitoringConfig = {
    // Performance thresholds (in milliseconds)
    thresholds: {
        apiResponse: 10, // 10ms p95
        databaseQuery: 5, // 5ms p95
        aiInference: 100, // 100ms p95
        voiceProcessing: 200, // 200ms p95
        translationService: 50, // 50ms p95
        pageLoad: 1000, // 1 second
        bundleSize: 100 * 1024, // 100KB
    },

    // Alert thresholds
    alerts: {
        errorRate: 0.05, // 5% error rate
        responseTime: 100, // 100ms average
        memoryUsage: 0.8, // 80% memory usage
        cpuUsage: 0.8, // 80% CPU usage
        diskUsage: 0.9, // 90% disk usage
    },

    // Sampling rates
    sampling: {
        traces: 0.1, // 10% sampling
        logs: 1.0, // 100% sampling
        metrics: 1.0, // 100% sampling
        errors: 1.0, // 100% sampling
    }
}

// Performance metrics
export interface PerformanceMetrics {
    timestamp: number
    operation: string
    duration: number
    success: boolean
    errorCode?: string
    userId?: string
    metadata?: Record<string, any>
}

// System health metrics
export interface HealthMetrics {
    timestamp: number
    cpu: number
    memory: number
    disk: number
    network: number
    activeConnections: number
    queueLength: number
}

// Performance monitoring service
export class PerformanceMonitor {
    private static metrics: PerformanceMetrics[] = []
    private static healthMetrics: HealthMetrics[] = []
    private static alertingEnabled = true

    // Start performance measurement
    static startMeasurement(operation: string, userId?: string): () => PerformanceMetrics {
        const startTime = performance.now()

        return (): PerformanceMetrics => {
            const endTime = performance.now()
            const duration = endTime - startTime

            const metric: PerformanceMetrics = {
                timestamp: Date.now(),
                operation,
                duration,
                success: true,
                userId,
                metadata: {}
            }

            this.recordMetric(metric)
            this.checkThresholds(metric)

            return metric
        }
    }

    // Record performance metric
    static recordMetric(metric: PerformanceMetrics): void {
        this.metrics.push(metric)

        // Keep only last 10000 metrics to prevent memory leaks
        if (this.metrics.length > 10000) {
            this.metrics = this.metrics.slice(-10000)
        }

        // Send to monitoring service (in production)
        this.sendToMonitoringService(metric)
    }

    // Record error metric
    static recordError(operation: string, error: Error, userId?: string): void {
        const metric: PerformanceMetrics = {
            timestamp: Date.now(),
            operation,
            duration: 0,
            success: false,
            errorCode: error.name,
            userId,
            metadata: {
                message: error.message,
                stack: error.stack
            }
        }

        this.recordMetric(metric)
        this.checkThresholds(metric)
    }

    // Get performance statistics
    static getPerformanceStats(operation?: string, timeWindow?: number): {
        count: number
        avgDuration: number
        p95Duration: number
        p99Duration: number
        errorRate: number
        successRate: number
    } {
        const now = Date.now()
        const windowStart = timeWindow ? now - timeWindow : 0

        let filteredMetrics = this.metrics.filter(m => m.timestamp >= windowStart)

        if (operation) {
            filteredMetrics = filteredMetrics.filter(m => m.operation === operation)
        }

        if (filteredMetrics.length === 0) {
            return {
                count: 0,
                avgDuration: 0,
                p95Duration: 0,
                p99Duration: 0,
                errorRate: 0,
                successRate: 0
            }
        }

        const durations = filteredMetrics.map(m => m.duration).sort((a, b) => a - b)
        const errorCount = filteredMetrics.filter(m => !m.success).length
        const successCount = filteredMetrics.length - errorCount

        return {
            count: filteredMetrics.length,
            avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
            p95Duration: durations[Math.floor(durations.length * 0.95)],
            p99Duration: durations[Math.floor(durations.length * 0.99)],
            errorRate: errorCount / filteredMetrics.length,
            successRate: successCount / filteredMetrics.length
        }
    }

    // Record system health metrics
    static recordHealthMetrics(metrics: HealthMetrics): void {
        this.healthMetrics.push(metrics)

        // Keep only last 1000 health metrics
        if (this.healthMetrics.length > 1000) {
            this.healthMetrics = this.healthMetrics.slice(-1000)
        }

        this.checkHealthThresholds(metrics)
    }

    // Enable/disable alerting
    static setAlertingEnabled(enabled: boolean): void {
        this.alertingEnabled = enabled
    }

    // Get recent metrics
    static getRecentMetrics(count: number = 100): PerformanceMetrics[] {
        return this.metrics.slice(-count)
    }

    // Get recent health metrics
    static getRecentHealthMetrics(count: number = 100): HealthMetrics[] {
        return this.healthMetrics.slice(-count)
    }

    // Clear metrics
    static clearMetrics(): void {
        this.metrics = []
        this.healthMetrics = []
    }

    // Check performance thresholds
    private static checkThresholds(metric: PerformanceMetrics): void {
        const threshold = monitoringConfig.thresholds[metric.operation as keyof typeof monitoringConfig.thresholds]

        if (threshold && metric.duration > threshold) {
            this.triggerAlert('PERFORMANCE_THRESHOLD_EXCEEDED', {
                operation: metric.operation,
                duration: metric.duration,
                threshold,
                timestamp: metric.timestamp
            })
        }
    }

    // Check health thresholds
    private static checkHealthThresholds(metrics: HealthMetrics): void {
        const {alerts} = monitoringConfig

        if (metrics.cpu > alerts.cpuUsage) {
            this.triggerAlert('HIGH_CPU_USAGE', {
                cpu: metrics.cpu,
                threshold: alerts.cpuUsage,
                timestamp: metrics.timestamp
            })
        }

        if (metrics.memory > alerts.memoryUsage) {
            this.triggerAlert('HIGH_MEMORY_USAGE', {
                memory: metrics.memory,
                threshold: alerts.memoryUsage,
                timestamp: metrics.timestamp
            })
        }

        if (metrics.disk > alerts.diskUsage) {
            this.triggerAlert('HIGH_DISK_USAGE', {
                disk: metrics.disk,
                threshold: alerts.diskUsage,
                timestamp: metrics.timestamp
            })
        }
    }

    // Trigger alert
    static triggerAlert(type: string, data: any): void {
        if (!this.alertingEnabled) return

        const alert = {
            type,
            timestamp: Date.now(),
            data,
            severity: this.getAlertSeverity(type)
        }

        console.warn('ALERT:', JSON.stringify(alert))

        // In production, send to alerting service (PagerDuty, Slack, etc.)
        this.sendToAlertingService(alert)
    }

    // Get alert severity
    private static getAlertSeverity(type: string): 'low' | 'medium' | 'high' | 'critical' {
        const criticalAlerts = ['HIGH_CPU_USAGE', 'HIGH_MEMORY_USAGE', 'HIGH_DISK_USAGE']
        const highAlerts = ['PERFORMANCE_THRESHOLD_EXCEEDED']
        const mediumAlerts = ['ERROR_RATE_HIGH']

        if (criticalAlerts.includes(type)) return 'critical'
        if (highAlerts.includes(type)) return 'high'
        if (mediumAlerts.includes(type)) return 'medium'
        return 'low'
    }

    // Send to monitoring service (placeholder)
    private static sendToMonitoringService(metric: PerformanceMetrics): void {
        // In production, send to DataDog, New Relic, or similar
        if (Math.random() < monitoringConfig.sampling.traces) {
            // Send trace
        }
    }

    // Send to alerting service (placeholder)
    private static sendToAlertingService(alert: any): void {
        // In production, send to PagerDuty, Slack, etc.
    }
}

// Bundle size monitoring
export class BundleSizeMonitor {
    private static bundleSizes: Record<string, number> = {}

    static recordBundleSize(name: string, size: number): void {
        this.bundleSizes[name] = size

        const threshold = monitoringConfig.thresholds.bundleSize
        if (size > threshold) {
            PerformanceMonitor.triggerAlert('BUNDLE_SIZE_EXCEEDED', {
                bundle: name,
                size,
                threshold,
                timestamp: Date.now()
            })
        }
    }

    static getBundleSizes(): Record<string, number> {
        return {...this.bundleSizes}
    }

    static getTotalBundleSize(): number {
        return Object.values(this.bundleSizes).reduce((sum, size) => sum + size, 0)
    }
}

// API monitoring middleware
export function withPerformanceMonitoring(operation: string) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value

        descriptor.value = async function (...args: any[]) {
            const endMeasurement = PerformanceMonitor.startMeasurement(operation)

            try {
                const result = await method.apply(this, args)
                endMeasurement()
                return result
            } catch (error) {
                PerformanceMonitor.recordError(operation, error as Error)
                throw error
            }
        }

        return descriptor
    }
}

// Database query monitoring
export class DatabaseMonitor {
    static monitorQuery(query: string, duration: number, success: boolean): void {
        PerformanceMonitor.recordMetric({
            timestamp: Date.now(),
            operation: 'databaseQuery',
            duration,
            success,
            metadata: {query: query.substring(0, 100)}
        })
    }

    static monitorConnection(poolSize: number, activeConnections: number): void {
        PerformanceMonitor.recordHealthMetrics({
            timestamp: Date.now(),
            cpu: 0, // Would be populated by system monitoring
            memory: 0,
            disk: 0,
            network: 0,
            activeConnections,
            queueLength: Math.max(0, activeConnections - poolSize)
        })
    }
}

// AI model monitoring
export class AIModelMonitor {
    static monitorInference(model: string, inputSize: number, outputSize: number, duration: number): void {
        PerformanceMonitor.recordMetric({
            timestamp: Date.now(),
            operation: 'aiInference',
            duration,
            success: true,
            metadata: {
                model,
                inputSize,
                outputSize
            }
        })
    }

    static monitorModelLoad(model: string, loadTime: number, memoryUsage: number): void {
        PerformanceMonitor.recordMetric({
            timestamp: Date.now(),
            operation: 'modelLoad',
            duration: loadTime,
            success: true,
            metadata: {
                model,
                memoryUsage
            }
        })
    }
}

// Voice processing monitoring
export class VoiceMonitor {
    static monitorVoiceProcessing(operation: string, duration: number, success: boolean): void {
        PerformanceMonitor.recordMetric({
            timestamp: Date.now(),
            operation: `voice${operation}`,
            duration,
            success
        })
    }

    static monitorWakeWordDetection(duration: number, confidence: number): void {
        PerformanceMonitor.recordMetric({
            timestamp: Date.now(),
            operation: 'wakeWordDetection',
            duration,
            success: confidence > 0.8,
            metadata: {confidence}
        })
    }
}

// Translation service monitoring
export class TranslationMonitor {
    static monitorTranslation(
        sourceLanguage: string,
        targetLanguage: string,
        textLength: number,
        duration: number,
        success: boolean
    ): void {
        PerformanceMonitor.recordMetric({
            timestamp: Date.now(),
            operation: 'translation',
            duration,
            success,
            metadata: {
                sourceLanguage,
                targetLanguage,
                textLength
            }
        })
    }
}

// Real-time monitoring dashboard data
export function getMonitoringDashboardData(): {
    performance: any
    health: any
    alerts: any
    bundleSize: any
} {
    return {
        performance: {
            api: PerformanceMonitor.getPerformanceStats('apiResponse', 3600000), // Last hour
            database: PerformanceMonitor.getPerformanceStats('databaseQuery', 3600000),
            ai: PerformanceMonitor.getPerformanceStats('aiInference', 3600000),
            voice: PerformanceMonitor.getPerformanceStats('voiceProcessing', 3600000),
            translation: PerformanceMonitor.getPerformanceStats('translation', 3600000)
        },
        health: {
            current: PerformanceMonitor.getRecentHealthMetrics(1)[0] || {
                cpu: 0,
                memory: 0,
                disk: 0,
                network: 0,
                activeConnections: 0,
                queueLength: 0
            },
            trends: PerformanceMonitor.getRecentHealthMetrics(60) // Last 60 data points
        },
        alerts: {
            recent: PerformanceMonitor.getRecentMetrics(100).filter(m => !m.success),
            count: PerformanceMonitor.getRecentMetrics(1000).filter(m => !m.success).length
        },
        bundleSize: {
            total: BundleSizeMonitor.getTotalBundleSize(),
            individual: BundleSizeMonitor.getBundleSizes(),
            threshold: monitoringConfig.thresholds.bundleSize
        }
    }
}
