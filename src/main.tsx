/**
 * Main Entry Point
 *
 * Application bootstrap with React 18 createRoot, StrictMode, and error handling.
 *
 * @module main
 */

import * as React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Global error handler for uncaught errors
 */
window.onerror = (message, source, lineno, colno, error) => {
  console.error("[Global Error]", {
    message,
    source,
    lineno,
    colno,
    error,
  });

  // Don't prevent default handling
  return false;
};

/**
 * Global handler for unhandled promise rejections
 */
window.onunhandledrejection = (event) => {
  console.error("[Unhandled Promise Rejection]", event.reason);

  // Don't prevent default handling
};

// ============================================================================
// WebGL Support Detection
// ============================================================================

/**
 * Check if WebGL is supported
 */
function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return gl instanceof WebGLRenderingContext;
  } catch {
    return false;
  }
}

/**
 * Check if WebGL2 is supported
 */
function isWebGL2Supported(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    return gl instanceof WebGL2RenderingContext;
  } catch {
    return false;
  }
}

// Log WebGL support status
if (isWebGL2Supported()) {
  console.log("[WebGL] WebGL 2.0 supported");
} else if (isWebGLSupported()) {
  console.log("[WebGL] WebGL 1.0 supported (fallback)");
} else {
  console.error("[WebGL] WebGL not supported - visualizers may not work");
}

// ============================================================================
// React Application Mount
// ============================================================================

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("[React] Root element not found - cannot mount application");
  throw new Error("Root element 'root' not found in document");
}

/**
 * Render the application
 */
function renderApp(): void {
  const root = ReactDOM.createRoot(rootElement as HTMLElement);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );

  console.log("[React] Application mounted successfully");
}

// ============================================================================
// Development Helpers
// ============================================================================

// Development helpers - only in dev mode
const isDev =
  typeof process !== "undefined" &&
  process.env &&
  process.env.NODE_ENV === "development";

if (isDev) {
  // Expose debug utilities in development
  (window as any).__WINAMP_VIZ__ = {
    version: "1.0.0",
    webgl: isWebGLSupported(),
    webgl2: isWebGL2Supported(),
    reactVersion: React.version,
  };

  console.log("[Dev] Debug object available at window.__WINAMP_VIZ__");
}

// ============================================================================
// Initialize
// ============================================================================

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", () => {
  try {
    renderApp();
  } catch (error) {
    console.error("[React] Failed to render application:", error);

    // Show error to user
    rootElement.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background-color: #1a1a2e;
        color: #eaeaea;
        font-family: system-ui, sans-serif;
        padding: 2rem;
        text-align: center;
      ">
        <div style="font-size: 3rem; margin-bottom: 1rem;">💥</div>
        <h2 style="margin: 0 0 1rem 0;">Failed to Load</h2>
        <p style="color: #a0a0a0; max-width: 400px;">
          The application failed to start. Please check the console for details.
        </p>
        <button onclick="location.reload()" style="
          margin-top: 2rem;
          padding: 0.75rem 1.5rem;
          background: #4a4a6a;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        ">Reload Page</button>
      </div>
    `;
  }
});

// Handle hot module replacement in development
// Note: Vite HMR will work automatically, no manual accept needed
