/**
 * ErrorBoundary Component
 *
 * React error boundary for catching and handling errors gracefully.
 * Includes WebGL context loss detection and recovery UI.
 *
 * @module ErrorBoundary
 */

import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * Props for the ErrorBoundary component
 */
interface ErrorBoundaryProps {
  /** Child components to render and monitor for errors */
  children: ReactNode;

  /** Custom fallback component to render on error */
  fallback?: ReactNode;

  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;

  /** Callback when user clicks retry */
  onRetry?: () => void;
}

/**
 * State for the ErrorBoundary component
 */
interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The error that was caught */
  error: Error | null;
  /** Additional error info from React */
  errorInfo: ErrorInfo | null;
  /** Whether the error is a WebGL context loss */
  isWebGLError: boolean;
  /** Number of retry attempts */
  retryCount: number;
}

/**
 * React error boundary component that catches JavaScript errors in child components.
 *
 * Features:
 * - Catches React component errors
 * - Detects WebGL context loss
 * - Provides recovery UI with retry button
 * - Limits retry attempts to prevent infinite loops
 *
 * @example
 * ```tsx
 * <ErrorBoundary onError={(err) => console.error(err)} onRetry={() => window.location.reload()}>
 *   <VisualizerCanvas />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private canvasRef: HTMLCanvasElement | null = null;
  private webglContextLostHandler: ((event: Event) => void) | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isWebGLError: false,
      retryCount: 0,
    };
  }

  /**
   * Static method called when an error is thrown in a child component
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const isWebGLError = ErrorBoundary.isWebGLError(error);
    return {
      hasError: true,
      error,
      isWebGLError,
    };
  }

  /**
   * Check if an error is related to WebGL context loss
   */
  private static isWebGLError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    return (
      errorMessage.includes("webgl") ||
      errorMessage.includes("webgl2") ||
      errorMessage.includes("context lost") ||
      errorMessage.includes("contextlost") ||
      errorMessage.includes("drawingbuffer") ||
      errorMessage.includes("three.js") || // Common WebGL errors from Three.js
      errorMessage.includes("gl_") || // WebGL specific errors
      errorMessage.includes("lost context") ||
      errorMessage.includes("invalid context")
    );
  }

  /**
   * Lifecycle method called after an error is caught
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Error info:", errorInfo);

    this.setState({ errorInfo });

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo);

    // Track WebGL context loss if applicable
    if (this.state.isWebGLError) {
      this.handleWebGLContextLoss();
    }
  }

  /**
   * Set up WebGL context loss detection
   */
  private handleWebGLContextLoss(): void {
    // Try to find any canvas elements and listen for context loss
    const canvases = document.querySelectorAll("canvas");
    canvases.forEach((canvas) => {
      this.webglContextLostHandler = (event: Event) => {
        event.preventDefault();
        console.warn("[ErrorBoundary] WebGL context lost detected");
        this.setState({ isWebGLError: true });
      };

      canvas.addEventListener("webglcontextlost", this.webglContextLostHandler);
    });
  }

  /**
   * Clean up event listeners
   */
  componentWillUnmount(): void {
    if (this.webglContextLostHandler && this.canvasRef) {
      this.canvasRef.removeEventListener(
        "webglcontextlost",
        this.webglContextLostHandler,
      );
    }
  }

  /**
   * Handle retry button click
   */
  private handleRetry = (): void => {
    const { retryCount } = this.state;
    const maxRetries = 3;

    if (retryCount >= maxRetries) {
      console.error("[ErrorBoundary] Max retry attempts reached");
      return;
    }

    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isWebGLError: false,
      retryCount: retryCount + 1,
    });

    // Call the onRetry callback if provided
    this.props.onRetry?.();
  };

  /**
   * Handle full page reload
   */
  private handleReload = (): void => {
    window.location.reload();
  };

  /**
   * Render the error fallback UI
   */
  private renderErrorFallback(): ReactNode {
    const { error, isWebGLError, retryCount } = this.state;
    const { fallback } = this.props;

    // Use custom fallback if provided
    if (fallback) {
      return fallback;
    }

    const errorMessage = error?.message || "An unknown error occurred";
    const maxRetries = 3;
    const canRetry = retryCount < maxRetries;

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          backgroundColor: "#1a1a2e",
          color: "#eaeaea",
          borderRadius: "8px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          minHeight: "200px",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
          {isWebGLError ? "⚠️" : "💥"}
        </div>

        <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.5rem" }}>
          {isWebGLError ? "Graphics Error" : "Something Went Wrong"}
        </h2>

        <p
          style={{
            margin: "0 0 1.5rem 0",
            color: "#a0a0a0",
            textAlign: "center",
            maxWidth: "400px",
            wordBreak: "break-word",
          }}
        >
          {isWebGLError
            ? "The graphics context was lost. This can happen when the browser runs low on memory or the GPU crashes."
            : errorMessage}
        </p>

        {isWebGLError && (
          <p
            style={{
              margin: "0 0 1rem 0",
              fontSize: "0.875rem",
              color: "#888",
            }}
          >
            Tip: Close other browser tabs or applications to free up memory.
          </p>
        )}

        <div style={{ display: "flex", gap: "1rem" }}>
          {canRetry && (
            <button
              onClick={this.handleRetry}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#4a4a6a",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "1rem",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor =
                  "#5a5a7a";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor =
                  "#4a4a6a";
              }}
            >
              Try Again ({retryCount}/{maxRetries})
            </button>
          )}

          <button
            onClick={this.handleReload}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "transparent",
              color: "#a0a0a0",
              border: "1px solid #4a4a6a",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "1rem",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.borderColor = "#6a6a8a";
              (e.target as HTMLButtonElement).style.color = "#eaeaea";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.borderColor = "#4a4a6a";
              (e.target as HTMLButtonElement).style.color = "#a0a0a0";
            }}
          >
            Reload Page
          </button>
        </div>

        {process.env.NODE_ENV === "development" && error && (
          <details
            style={{ marginTop: "2rem", maxWidth: "600px", width: "100%" }}
          >
            <summary
              style={{ cursor: "pointer", color: "#888", fontSize: "0.875rem" }}
            >
              Error Details (Development Only)
            </summary>
            <pre
              style={{
                marginTop: "1rem",
                padding: "1rem",
                backgroundColor: "#0a0a1a",
                color: "#ff6b6b",
                borderRadius: "4px",
                fontSize: "0.75rem",
                overflow: "auto",
                maxHeight: "300px",
                textAlign: "left",
              }}
            >
              {error.stack || error.message}
            </pre>
          </details>
        )}
      </div>
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.renderErrorFallback();
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 *
 * @example
 * ```tsx
 * const SafeVisualizer = withErrorBoundary(VisualizerComponent);
 * ```
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">,
): React.ComponentType<P> {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
