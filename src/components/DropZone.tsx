/**
 * DropZone Component
 * Invisible full-screen drag-drop handler for audio files
 */

import { useState, useCallback, useEffect, type FC, type DragEvent } from "react";

interface DropZoneProps {
  onFileDrop: (file: File) => void;
}

const STYLES = `
.drop-zone {
  position: fixed;
  inset: 0;
  z-index: 100;
  pointer-events: none;
}

.drop-zone.active {
  pointer-events: auto;
}

.drop-zone-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 255, 157, 0.1);
  border: 3px dashed rgba(0, 255, 157, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.drop-zone.dragging .drop-zone-overlay {
  opacity: 1;
}

.drop-zone-text {
  color: #00ff9d;
  font-size: 24px;
  font-family: system-ui, sans-serif;
  text-shadow: 0 0 20px rgba(0, 255, 157, 0.5);
}
`;

export const DropZone: FC<DropZoneProps> = ({ onFileDrop }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsActive(true);
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging false if leaving the actual drop zone
    if (e.currentTarget === e.target) {
      setIsDragging(false);
      setIsActive(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      setIsActive(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file && file.type.startsWith("audio/")) {
          onFileDrop(file);
        }
      }
    },
    [onFileDrop]
  );

  // Global drag listener to detect when drag enters window
  useEffect(() => {
    const handleWindowDragEnter = () => {
      setIsActive(true);
    };
    window.addEventListener("dragenter", handleWindowDragEnter);
    return () => window.removeEventListener("dragenter", handleWindowDragEnter);
  }, []);

  return (
    <>
      <style>{STYLES}</style>
      <div
        className={`drop-zone ${isActive ? "active" : ""} ${isDragging ? "dragging" : ""}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="drop-zone-overlay">
          <span className="drop-zone-text">Drop audio file</span>
        </div>
      </div>
    </>
  );
};

export default DropZone;
