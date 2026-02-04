import { type FC } from "react";
import type { ShaderDefinition } from "../shaders";

interface ShaderCreditsProps {
  shader: ShaderDefinition;
}

const STYLES = `
.shader-credits {
  position: fixed;
  top: 16px;
  left: 16px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.85);
  font-family: system-ui, sans-serif;
  font-size: 12px;
  line-height: 1.4;
  z-index: 900;
  max-width: 320px;
  pointer-events: none;
}

.shader-credits .title {
  font-weight: 600;
  color: #ffffff;
}

.shader-credits .meta {
  color: rgba(255, 255, 255, 0.65);
  margin-top: 2px;
}

.shader-credits .note {
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  margin-top: 4px;
}
`;

export const ShaderCredits: FC<ShaderCreditsProps> = ({ shader }) => (
  <>
    <style>{STYLES}</style>
    <div className="shader-credits">
      <div className="title">{shader.name}</div>
      <div className="meta">
        {shader.author} · {shader.license}
      </div>
      {shader.attributionNote ? (
        <div className="note">{shader.attributionNote}</div>
      ) : null}
    </div>
  </>
);

export default ShaderCredits;
