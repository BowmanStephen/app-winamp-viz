/**
 * CRTOverlay Component
 * Minimal scanlines + vignette overlay for CRT effect
 */

import type { FC } from "react";

interface CRTOverlayProps {
  enabled: boolean;
}

const STYLES = `
.crt-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 999;
}

.crt-scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0) 0px,
    rgba(0, 0, 0, 0) 2px,
    rgba(0, 0, 0, 0.12) 2px,
    rgba(0, 0, 0, 0.12) 4px
  );
  background-size: 100% 4px;
}

.crt-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0) 50%,
    rgba(0, 0, 0, 0.4) 100%
  );
}
`;

export const CRTOverlay: FC<CRTOverlayProps> = ({ enabled }) => {
  if (!enabled) return null;

  return (
    <>
      <style>{STYLES}</style>
      <div className="crt-overlay">
        <div className="crt-scanlines" />
        <div className="crt-vignette" />
      </div>
    </>
  );
};

export default CRTOverlay;
