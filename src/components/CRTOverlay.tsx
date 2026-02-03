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
    rgba(0, 0, 0, 0) 1px,
    rgba(0, 0, 0, 0.28) 1px,
    rgba(0, 0, 0, 0.28) 2px
  );
  background-size: 100% 2px;
}

.crt-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0) 40%,
    rgba(0, 0, 0, 0.55) 100%
  );
}

.crt-glow {
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 80px rgba(0, 255, 100, 0.03),
              inset 0 0 40px rgba(0, 255, 100, 0.02);
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
        <div className="crt-glow" />
      </div>
    </>
  );
};

export default CRTOverlay;
