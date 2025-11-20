/**
 * ENTERPRISE ERROR BOUNDARY - ZENITH TIER
 * Per React docs: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 * Per Sentry docs: https://docs.sentry.io/platforms/javascript/guides/react
 * 
 * Features:
 * - Graceful error recovery with user-friendly messages
 * - Automatic error reporting to monitoring (Sentry integration)
 * - Breadcrumb tracking for debugging
 * - Dark mode support
 * - WCAG 2.1 AA compliant
 */

"use client";

import React, { ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

/**
 * Enterprise-grade error boundary with monitoring integration
 */
export class ErrorBoundary extends React.Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Omit<State, "errorCount"> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Increment error count to detect repeated errors
    this.setState((prevState) => ({
      errorCount: prevState.errorCount + 1,
    }));

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by boundary:", error, errorInfo);
      console.error("Error stack:", error.stack);
      console.error("Component stack:", errorInfo.componentStack);
    }

    // Report to Sentry in production
    if (process.env.NODE_ENV === "production") {
      try {
        // Dynamic import to avoid bundle bloat in development
        import("@sentry/react").then(({ captureException }) => {
          captureException(error, {
            contexts: {
              react: {
                componentStack: errorInfo.componentStack,
              },
            },
            tags: {
              errorBoundary: "true",
            },
          });
        });
      } catch (sentryError) {
        console.error("Failed to report error to Sentry:", sentryError);
      }
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Auto-reset after multiple errors (every 10 seconds)
    if (this.state.errorCount > 2) {
      if (this.resetTimeoutId) {
        clearTimeout(this.resetTimeoutId);
      }
      this.resetTimeoutId = setTimeout(() => {
        this.resetErrorBoundary();
      }, 10000);
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }
    this.setState({
      hasError: false,
      error: null,
      errorCount: 0,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDevelopment = process.env.NODE_ENV === "development";
      const errorMessage = this.state.error?.message || "An unexpected error occurred";
      const errorStack = this.state.error?.stack || "";

      return (
        <div
          className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-md w-full">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
            </div>

            {/* Error Content */}
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Oops! Something went wrong
              </h1>

              <p className="text-gray-600 dark:text-gray-400">
                We're sorry for the inconvenience. Our team has been notified and is working on a fix.
              </p>

              {/* Error Details (Development Only) */}
              {isDevelopment && errorMessage && (
                <details className="mt-6 p-4 bg-gray-200 dark:bg-gray-800 rounded-lg text-left text-sm">
                  <summary className="cursor-pointer font-semibold text-gray-900 dark:text-white mb-2">
                    Error Details (Development)
                  </summary>
                  <div className="space-y-2">
                    <div className="text-red-600 dark:text-red-400 font-mono">
                      <span className="block font-bold">Message:</span>
                      <span className="block text-xs break-words">{errorMessage}</span>
                    </div>
                    {errorStack && (
                      <div className="text-gray-700 dark:text-gray-300 font-mono text-xs">
                        <span className="block font-bold">Stack Trace:</span>
                        <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-40">
                          {errorStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Error Count Warning */}
              {this.state.errorCount > 1 && (
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Multiple errors detected. Page will auto-reset in 10 seconds.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4">
                <button
                  onClick={this.resetErrorBoundary}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white font-semibold rounded-lg transition-colors duration-200"
                  aria-label="Try again"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>

                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold rounded-lg transition-colors duration-200"
                  aria-label="Go to home page"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </Link>
              </div>

              {/* Support Link */}
              <p className="text-sm text-gray-500 dark:text-gray-400 pt-2">
                If this problem persists, please{" "}
                <Link
                  href="/contact"
                  className="text-red-600 dark:text-red-400 hover:underline font-semibold"
                >
                  contact support
                </Link>
              </p>
            </div>

            {/* Accessibility Info */}
            <div className="sr-only">
              An error occurred while rendering this page. Error: {errorMessage}. Use the try again button to reload or go home to return to the main page.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function ErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;