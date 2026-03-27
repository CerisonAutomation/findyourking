/**
 * Utility Types - Common utility type definitions
 */

// Make all properties optional recursively
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Make all properties required
export type RequiredFields<T, K extends keyof T> = T & {
    [P in K]-?: T[P]
}

// Make specific properties optional
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// Extract array element type
export type ArrayElement<T> = T extends (infer U)[] ? U : never

// Extract promise value type
export type PromiseValue<T> = T extends Promise<infer U> ? U : never

// Constructor type
export type Constructor<T = {}> = new (...args: any[]) => T

// Event handler type
export type EventHandler<T = any> = (event: T) => void

// Async event handler type
export type AsyncEventHandler<T = any> = (event: T) => Promise<void>

// Key-value pair type
export type KeyValuePair<K = string, V = any> = {
    key: K
    value: V
}

// ID type
export type ID = string

// Timestamp type
export type Timestamp = string | number | Date

// Status type
export type Status = 'pending' | 'loading' | 'success' | 'error' | 'idle'

// Sort direction type
export type SortDirection = 'asc' | 'desc'

// File type
export type FileType = 'image' | 'video' | 'audio' | 'document' | 'other'

// Device type
export type DeviceType = 'mobile' | 'tablet' | 'desktop'

// OS type
export type OSType = 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'other'

// Browser type
export type BrowserType = 'chrome' | 'firefox' | 'safari' | 'edge' | 'other'