/**
 * Window90s Component
 *
 * Draggable window frame component with authentic 90s styling:
 * - Title bar with fake minimize/maximize/close
 * - Draggable (mouse events)
 * - Resizable handles
 * - 3D border effect
 * - Content area
 *
 * Based on Windows 95/98 and Winamp window aesthetics
 *
 * @module Window90s
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";

// ============================================================================
// Types
// ============================================================================

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface WindowState {
  position: WindowPosition;
  size: WindowSize;
  minimized: boolean;
  maximized: boolean;
  focused: boolean;
}

export interface Window90sProps {
  /** Window title */
  title?: string;

  /** Initial position */
  defaultPosition?: WindowPosition;

  /** Initial size */
  defaultSize?: WindowSize;

  /** Minimum window size */
  minSize?: WindowSize;

  /** Maximum window size */
  maxSize?: WindowSize;

  /** Window content */
  children: React.ReactNode;

  /** Show window controls (minimize, maximize, close) */
  showControls?: boolean;

  /** Allow dragging by title bar */
  draggable?: boolean;

  /** Allow resizing */
  resizable?: boolean;

  /** Winamp-style window (rectangular, no rounded corners) */
  winampStyle?: boolean;

  /** Active/focused state */
  active?: boolean;

  /** On focus callback */
  onFocus?: () => void;

  /** On close callback */
  onClose?: () => void;

  /** On minimize callback */
  onMinimize?: () => void;

  /** On maximize callback */
  onMaximize?: () => void;

  /** On window move callback */
  onMove?: (position: WindowPosition) => void;

  /** On window resize callback */
  onResize?: (size: WindowSize) => void;

  /** Custom title bar color */
  titleBarColor?: string;

  /** Additional CSS class */
  className?: string;

  /** Window ID for z-index management */
  id?: string;

  /** Initial z-index */
  zIndex?: number;

  /** Center window on mount */
  centerOnMount?: boolean;
}

export interface Window90sRef {
  /** Get current window state */
  getState: () => WindowState;
  /** Set window position */
  setPosition: (position: WindowPosition) => void;
  /** Set window size */
  setSize: (size: WindowSize) => void;
  /** Minimize window */
  minimize: () => void;
  /** Maximize/restore window */
  maximize: () => void;
  /** Focus window (bring to front) */
  focus: () => void;
  /** Close window */
  close: () => void;
}

// ============================================================================
// Style Constants
// ============================================================================

const WIN95_COLORS = {
  activeTitleBar: "#000080", // Navy blue
  inactiveTitleBar: "#808080", // Gray
  titleBarText: "#ffffff",
  face: "#c0c0c0",
  highlight: "#ffffff",
  shadow: "#808080",
  darkShadow: "#404040",
  black: "#000000",
} as const;

const WINAMP_COLORS = {
  titleBar: "#2b2b2b",
  titleBarText: "#c0c0c0",
  face: "#c0c0c0",
} as const;

// ============================================================================
// CSS Styles
// ============================================================================

const WINDOW_STYLES = `
.window-90s {
  position: absolute;
  background-color: ${WIN95_COLORS.face};
  border: 2px solid;
  border-color: ${WIN95_COLORS.highlight} ${WIN95_COLORS.darkShadow} ${WIN95_COLORS.darkShadow} ${WIN95_COLORS.highlight};
  box-shadow: 2px 2px 0 ${WIN95_COLORS.darkShadow};
  font-family: 'MS Sans Serif', 'Arial', sans-serif;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  min-width: 100px;
  min-height: 60px;
  user-select: none;
}

/* Winamp style - no rounded corners, darker */
.window-90s-winamp {
  border: 1px solid #404040;
  box-shadow: none;
  font-family: 'Courier New', monospace;
}

/* Title bar */
.window-90s-titlebar {
  background: linear-gradient(
    to right,
    ${WIN95_COLORS.activeTitleBar} 0%,
    #1084d0 100%
  );
  color: ${WIN95_COLORS.titleBarText};
  padding: 2px 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 20px;
  cursor: default;
}

.window-90s-inactive .window-90s-titlebar {
  background: ${WIN95_COLORS.inactiveTitleBar};
  color: #c0c0c0;
}

.window-90s-winamp .window-90s-titlebar {
  background: ${WINAMP_COLORS.titleBar};
  color: ${WINAMP_COLORS.titleBarText};
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Title text */
.window-90s-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 4px;
  font-weight: bold;
}

/* Title bar icon */
.window-90s-icon {
  width: 16px;
  height: 16px;
  margin-right: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Window controls container */
.window-90s-controls {
  display: flex;
  gap: 2px;
}

/* Window control buttons (minimize, maximize, close) */
.window-90s-btn {
  width: 16px;
  height: 14px;
  background-color: ${WIN95_COLORS.face};
  border: 2px solid;
  border-color: ${WIN95_COLORS.highlight} ${WIN95_COLORS.darkShadow} ${WIN95_COLORS.darkShadow} ${WIN95_COLORS.highlight};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 9px;
  line-height: 1;
  padding: 0;
  color: #000000;
}

.window-90s-btn:active {
  border-color: ${WIN95_COLORS.darkShadow} ${WIN95_COLORS.highlight} ${WIN95_COLORS.highlight} ${WIN95_COLORS.darkShadow};
}

/* Button symbols */
.window-90s-btn-minimize::before {
  content: '';
  width: 8px;
  height: 2px;
  background: #000;
  margin-top: 4px;
}

.window-90s-btn-maximize::before {
  content: '';
  width: 7px;
  height: 5px;
  border: 1px solid #000;
  border-top-width: 2px;
}

.window-90s-btn-restore::before {
  content: '';
  width: 7px;
  height: 5px;
  border: 1px solid #000;
  border-top-width: 2px;
  position: relative;
}

.window-90s-btn-restore::after {
  content: '';
  position: absolute;
  top: -3px;
  left: 2px;
  width: 7px;
  height: 5px;
  border: 1px solid #000;
  border-top-width: 2px;
  background: ${WIN95_COLORS.face};
}

.window-90s-btn-close::before {
  content: '×';
  font-size: 12px;
  font-weight: bold;
  margin-top: -2px;
}

/* Content area */
.window-90s-content {
  flex: 1;
  overflow: auto;
  padding: 4px;
  background-color: ${WIN95_COLORS.face};
  border: 2px solid;
  border-color: ${WIN95_COLORS.darkShadow} ${WIN95_COLORS.highlight} ${WIN95_COLORS.highlight} ${WIN95_COLORS.darkShadow};
  margin: 2px;
}

.window-90s-winamp .window-90s-content {
  border: 1px solid #808080;
  margin: 1px;
}

/* Resize handles */
.window-90s-resize-handle {
  position: absolute;
  z-index: 10;
}

.window-90s-resize-n {
  top: 0;
  left: 8px;
  right: 8px;
  height: 4px;
  cursor: ns-resize;
}

.window-90s-resize-s {
  bottom: 0;
  left: 8px;
  right: 8px;
  height: 4px;
  cursor: ns-resize;
}

.window-90s-resize-e {
  right: 0;
  top: 8px;
  bottom: 8px;
  width: 4px;
  cursor: ew-resize;
}

.window-90s-resize-w {
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 4px;
  cursor: ew-resize;
}

.window-90s-resize-ne {
  top: 0;
  right: 0;
  width: 8px;
  height: 8px;
  cursor: nesw-resize;
}

.window-90s-resize-nw {
  top: 0;
  left: 0;
  width: 8px;
  height: 8px;
  cursor: nwse-resize;
}

.window-90s-resize-se {
  bottom: 0;
  right: 0;
  width: 8px;
  height: 8px;
  cursor: nwse-resize;
}

.window-90s-resize-sw {
  bottom: 0;
  left: 0;
  width: 8px;
  height: 8px;
  cursor: nesw-resize;
}

/* Minimized state */
.window-90s-minimized {
  width: 160px !important;
  height: auto !important;
}

.window-90s-minimized .window-90s-content {
  display: none;
}

/* Maximized state */
.window-90s-maximized {
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  position: fixed;
  z-index: 9999;
}

.window-90s-maximized .window-90s-resize-handle {
  display: none;
}

/* Focus state */
.window-90s:focus {
  outline: none;
}

/* Menu bar (optional) */
.window-90s-menubar {
  display: flex;
  gap: 8px;
  padding: 2px 4px;
  border-bottom: 1px solid ${WIN95_COLORS.darkShadow};
  background-color: ${WIN95_COLORS.face};
}

.window-90s-menuitem {
  padding: 2px 8px;
  cursor: pointer;
}

.window-90s-menuitem:hover {
  background-color: ${WIN95_COLORS.activeTitleBar};
  color: ${WIN95_COLORS.titleBarText};
}

/* Status bar (optional) */
.window-90s-statusbar {
  display: flex;
  justify-content: space-between;
  padding: 2px 4px;
  border-top: 1px solid ${WIN95_COLORS.darkShadow};
  background-color: ${WIN95_COLORS.face};
  font-size: 11px;
}

.window-90s-statusbar-panel {
  border: 1px solid;
  border-color: ${WIN95_COLORS.darkShadow} ${WIN95_COLORS.highlight} ${WIN95_COLORS.highlight} ${WIN95_COLORS.darkShadow};
  padding: 1px 4px;
  flex: 1;
}

.window-90s-statusbar-divider {
  width: 1px;
  background-color: ${WIN95_COLORS.darkShadow};
  margin: 0 2px;
}
`;

// ============================================================================
// Component
// ============================================================================

export const Window90s = forwardRef<Window90sRef, Window90sProps>(
  (
    {
      title = "Window",
      defaultPosition = { x: 100, y: 100 },
      defaultSize = { width: 400, height: 300 },
      minSize = { width: 100, height: 60 },
      maxSize = { width: Infinity, height: Infinity },
      children,
      showControls = true,
      draggable = true,
      resizable = true,
      winampStyle = false,
      active: controlledActive,
      onFocus,
      onClose,
      onMinimize,
      onMaximize,
      onMove,
      onResize,
      titleBarColor,
      className = "",
      id,
      zIndex: initialZIndex = 100,
      centerOnMount = false,
    },
    ref,
  ) => {
    const windowRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<WindowPosition>(defaultPosition);
    const [size, setSize] = useState<WindowSize>(defaultSize);
    const [minimized, setMinimized] = useState(false);
    const [maximized, setMaximized] = useState(false);
    const [active, setActive] = useState(controlledActive ?? false);
    const [zIndex, setZIndex] = useState(initialZIndex);
    const [preMaximizeState, setPreMaximizeState] = useState<{
      position: WindowPosition;
      size: WindowSize;
    } | null>(null);

    // Dragging state
    const dragState = useRef<{
      isDragging: boolean;
      startX: number;
      startY: number;
      initialX: number;
      initialY: number;
    }>({
      isDragging: false,
      startX: 0,
      startY: 0,
      initialX: 0,
      initialY: 0,
    });

    // Resizing state
    const resizeState = useRef<{
      isResizing: boolean;
      direction: string;
      startX: number;
      startY: number;
      initialWidth: number;
      initialHeight: number;
      initialX: number;
      initialY: number;
    }>({
      isResizing: false,
      direction: "",
      startX: 0,
      startY: 0,
      initialWidth: 0,
      initialHeight: 0,
      initialX: 0,
      initialY: 0,
    });

    // Center on mount
    useEffect(() => {
      if (centerOnMount && windowRef.current) {
        const rect = windowRef.current.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        setPosition({
          x: (windowWidth - rect.width) / 2,
          y: (windowHeight - rect.height) / 2,
        });
      }
    }, [centerOnMount]);

    // Handle controlled active state
    useEffect(() => {
      if (controlledActive !== undefined) {
        setActive(controlledActive);
      }
    }, [controlledActive]);

    // Expose imperative handle
    useImperativeHandle(
      ref,
      () => ({
        getState: () => ({
          position,
          size,
          minimized,
          maximized,
          focused: active,
        }),
        setPosition: (newPosition) => {
          if (!maximized) {
            setPosition(newPosition);
          }
        },
        setSize: (newSize) => {
          if (!maximized) {
            setSize(newSize);
          }
        },
        minimize: () => handleMinimize(),
        maximize: () => handleMaximize(),
        focus: () => handleFocus(),
        close: () => onClose?.(),
      }),
      [position, size, minimized, maximized, active],
    );

    // Focus window
    const handleFocus = useCallback(() => {
      setActive(true);
      setZIndex((prev) => prev + 1);
      onFocus?.();
    }, [onFocus]);

    // Minimize window
    const handleMinimize = useCallback(() => {
      setMinimized(true);
      onMinimize?.();
    }, [onMinimize]);

    // Maximize/restore window
    const handleMaximize = useCallback(() => {
      if (maximized) {
        // Restore
        if (preMaximizeState) {
          setPosition(preMaximizeState.position);
          setSize(preMaximizeState.size);
        }
        setMaximized(false);
      } else {
        // Maximize - save current state
        setPreMaximizeState({ position, size });
        setMaximized(true);
      }
      onMaximize?.();
    }, [maximized, preMaximizeState, position, size, onMaximize]);

    // Close window
    const handleClose = useCallback(() => {
      onClose?.();
    }, [onClose]);

    // Start dragging
    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (!draggable || minimized || maximized) return;
        if (e.button !== 0) return;

        e.preventDefault();
        handleFocus();

        dragState.current = {
          isDragging: true,
          startX: e.clientX,
          startY: e.clientY,
          initialX: position.x,
          initialY: position.y,
        };
      },
      [draggable, minimized, maximized, position.x, position.y, handleFocus],
    );

    // Start resizing
    const handleResizeStart = useCallback(
      (e: React.MouseEvent, direction: string) => {
        if (!resizable || minimized || maximized) return;
        if (e.button !== 0) return;

        e.preventDefault();
        e.stopPropagation();

        resizeState.current = {
          isResizing: true,
          direction,
          startX: e.clientX,
          startY: e.clientY,
          initialWidth: size.width,
          initialHeight: size.height,
          initialX: position.x,
          initialY: position.y,
        };
      },
      [resizable, minimized, maximized, size, position],
    );

    // Mouse move handler (drag + resize)
    useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        // Handle dragging
        if (dragState.current.isDragging) {
          const deltaX = e.clientX - dragState.current.startX;
          const deltaY = e.clientY - dragState.current.startY;

          const newPosition = {
            x: dragState.current.initialX + deltaX,
            y: dragState.current.initialY + deltaY,
          };

          setPosition(newPosition);
          onMove?.(newPosition);
        }

        // Handle resizing
        if (resizeState.current.isResizing) {
          const {
            direction,
            startX,
            startY,
            initialWidth,
            initialHeight,
            initialX,
            initialY,
          } = resizeState.current;
          const deltaX = e.clientX - startX;
          const deltaY = e.clientY - startY;

          let newWidth = initialWidth;
          let newHeight = initialHeight;
          let newX = initialX;
          let newY = initialY;

          if (direction.includes("e")) {
            newWidth = Math.max(minSize.width, initialWidth + deltaX);
          }
          if (direction.includes("w")) {
            const proposedWidth = initialWidth - deltaX;
            newWidth = Math.max(minSize.width, proposedWidth);
            if (proposedWidth >= minSize.width) {
              newX = initialX + deltaX;
            }
          }
          if (direction.includes("s")) {
            newHeight = Math.max(minSize.height, initialHeight + deltaY);
          }
          if (direction.includes("n")) {
            const proposedHeight = initialHeight - deltaY;
            newHeight = Math.max(minSize.height, proposedHeight);
            if (proposedHeight >= minSize.height) {
              newY = initialY + deltaY;
            }
          }

          // Apply max size constraints
          if (maxSize.width !== Infinity) {
            newWidth = Math.min(newWidth, maxSize.width);
          }
          if (maxSize.height !== Infinity) {
            newHeight = Math.min(newHeight, maxSize.height);
          }

          if (direction.includes("w") || direction.includes("n")) {
            setPosition({ x: newX, y: newY });
          }
          setSize({ width: newWidth, height: newHeight });
          onResize?.({ width: newWidth, height: newHeight });
        }
      };

      const handleMouseUp = () => {
        dragState.current.isDragging = false;
        resizeState.current.isResizing = false;
      };

      if (dragState.current.isDragging || resizeState.current.isResizing) {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      }

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }, [minSize, maxSize, onMove, onResize]);

    // Build class names
    const windowClasses = [
      "window-90s",
      winampStyle && "window-90s-winamp",
      !active && "window-90s-inactive",
      minimized && "window-90s-minimized",
      maximized && "window-90s-maximized",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const titleBarStyle: React.CSSProperties = titleBarColor
      ? { background: titleBarColor }
      : {};

    return (
      <>
        <style>{WINDOW_STYLES}</style>
        <div
          ref={windowRef}
          className={windowClasses}
          style={{
            left: position.x,
            top: position.y,
            width: size.width,
            height: size.height,
            zIndex,
          }}
          onMouseDown={handleFocus}
          id={id}
          tabIndex={0}
        >
          {/* Resize handles */}
          {resizable && !minimized && !maximized && (
            <>
              <div
                className="window-90s-resize-handle window-90s-resize-n"
                onMouseDown={(e) => handleResizeStart(e, "n")}
              />
              <div
                className="window-90s-resize-handle window-90s-resize-s"
                onMouseDown={(e) => handleResizeStart(e, "s")}
              />
              <div
                className="window-90s-resize-handle window-90s-resize-e"
                onMouseDown={(e) => handleResizeStart(e, "e")}
              />
              <div
                className="window-90s-resize-handle window-90s-resize-w"
                onMouseDown={(e) => handleResizeStart(e, "w")}
              />
              <div
                className="window-90s-resize-handle window-90s-resize-ne"
                onMouseDown={(e) => handleResizeStart(e, "ne")}
              />
              <div
                className="window-90s-resize-handle window-90s-resize-nw"
                onMouseDown={(e) => handleResizeStart(e, "nw")}
              />
              <div
                className="window-90s-resize-handle window-90s-resize-se"
                onMouseDown={(e) => handleResizeStart(e, "se")}
              />
              <div
                className="window-90s-resize-handle window-90s-resize-sw"
                onMouseDown={(e) => handleResizeStart(e, "sw")}
              />
            </>
          )}

          {/* Title bar */}
          <div
            className="window-90s-titlebar"
            style={titleBarStyle}
            onMouseDown={handleMouseDown}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flex: 1,
                overflow: "hidden",
              }}
            >
              <div className="window-90s-icon">
                <svg width="14" height="14" viewBox="0 0 14 14">
                  <rect
                    x="1"
                    y="1"
                    width="12"
                    height="12"
                    fill={winampStyle ? "#00ff00" : "#c0c0c0"}
                    stroke="#000"
                  />
                </svg>
              </div>
              <span className="window-90s-title">{title}</span>
            </div>

            {showControls && (
              <div className="window-90s-controls">
                <button
                  className="window-90s-btn window-90s-btn-minimize"
                  onClick={handleMinimize}
                  title="Minimize"
                />
                <button
                  className={`window-90s-btn ${
                    maximized
                      ? "window-90s-btn-restore"
                      : "window-90s-btn-maximize"
                  }`}
                  onClick={handleMaximize}
                  title={maximized ? "Restore" : "Maximize"}
                />
                <button
                  className="window-90s-btn window-90s-btn-close"
                  onClick={handleClose}
                  title="Close"
                />
              </div>
            )}
          </div>

          {/* Content */}
          {!minimized && <div className="window-90s-content">{children}</div>}
        </div>
      </>
    );
  },
);

Window90s.displayName = "Window90s";

export default Window90s;
