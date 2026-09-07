import React from 'react';
import { ChordPosition } from '../lib/chordDatabase';

interface ChordDiagramSvgProps {
  position: ChordPosition;
  instrument?: 'guitar' | 'ukulele';
  width?: number;
  height?: number;
}

export const ChordDiagramSvg: React.FC<ChordDiagramSvgProps> = ({
  position,
  instrument = 'guitar',
  width = 180,
  height = 220,
}) => {
  const isGuitar = instrument === 'guitar';
  const stringCount = isGuitar ? 6 : 4;
  const fretCount = 4; // Display 4 frets

  const paddingX = 30;
  const paddingTop = 45;
  const paddingBottom = 25;

  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingTop - paddingBottom;

  const stringSpacing = innerWidth / (stringCount - 1);
  const fretSpacing = innerHeight / fretCount;

  const baseFret = position.baseFret || 1;
  const frets = position.frets || [];
  const fingers = position.fingers || [];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="select-none text-text-primary"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background container */}
      <rect width={width} height={height} fill="transparent" rx="8" />

      {/* Base Fret Indicator (e.g., "3fr") */}
      {baseFret > 1 && (
        <text
          x={paddingX - 12}
          y={paddingTop + fretSpacing * 0.65}
          fontSize="11"
          fontWeight="700"
          fill="currentColor"
          textAnchor="end"
          className="font-mono"
        >
          {baseFret}fr
        </text>
      )}

      {/* Nut (Thick bar if baseFret is 1) */}
      {baseFret === 1 ? (
        <rect
          x={paddingX - 1}
          y={paddingTop - 4}
          width={innerWidth + 2}
          height={6}
          fill="currentColor"
          rx="1"
        />
      ) : (
        /* Top Fret Line if baseFret > 1 */
        <line
          x1={paddingX}
          y1={paddingTop}
          x2={paddingX + innerWidth}
          y2={paddingTop}
          stroke="currentColor"
          strokeWidth="2"
        />
      )}

      {/* Fret Lines (Horizontal) */}
      {Array.from({ length: fretCount }).map((_, i) => {
        const y = paddingTop + (i + 1) * fretSpacing;
        return (
          <line
            key={`fret-${i}`}
            x1={paddingX}
            y1={y}
            x2={paddingX + innerWidth}
            y2={y}
            stroke="currentColor"
            strokeWidth="1.2"
            opacity="0.3"
          />
        );
      })}

      {/* String Lines (Vertical) */}
      {Array.from({ length: stringCount }).map((_, i) => {
        const x = paddingX + i * stringSpacing;
        return (
          <line
            key={`string-${i}`}
            x1={x}
            y1={paddingTop}
            x2={x}
            y2={paddingTop + innerHeight}
            stroke="currentColor"
            strokeWidth={1.2 + (stringCount - 1 - i) * 0.2} // Thicker bass strings
            opacity="0.6"
          />
        );
      })}

      {/* String Top Markers (X = Muted, O = Open) */}
      {Array.from({ length: stringCount }).map((_, i) => {
        const val = frets[i];
        const x = paddingX + i * stringSpacing;
        const y = paddingTop - 14;

        if (val === -1) {
          // Muted (X)
          return (
            <text
              key={`marker-${i}`}
              x={x}
              y={y + 4}
              fontSize="12"
              fontWeight="800"
              fill="var(--accent-primary, #ef4444)"
              textAnchor="middle"
              className="font-mono"
            >
              ✕
            </text>
          );
        }

        if (val === 0) {
          // Open String (O)
          return (
            <circle
              key={`marker-${i}`}
              cx={x}
              cy={y}
              r="4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              opacity="0.8"
            />
          );
        }

        return null;
      })}

      {/* Barre Chord Indicator */}
      {position.barre && (
        (() => {
          const { fret, fromString, toString } = position.barre;
          const relativeFret = fret - baseFret + 1;
          if (relativeFret >= 1 && relativeFret <= fretCount) {
            const y = paddingTop + (relativeFret - 0.5) * fretSpacing;
            const x1 = paddingX + (fromString - 1) * stringSpacing;
            const x2 = paddingX + (toString - 1) * stringSpacing;
            return (
              <rect
                key="barre"
                x={Math.min(x1, x2) - 6}
                y={y - 6}
                width={Math.abs(x2 - x1) + 12}
                height={12}
                rx="6"
                fill="var(--accent-primary, #3b82f6)"
                opacity="0.85"
              />
            );
          }
          return null;
        })()
      )}

      {/* Finger Dots & Numbers */}
      {Array.from({ length: stringCount }).map((_, i) => {
        const fretVal = frets[i];
        if (fretVal && fretVal > 0) {
          const relativeFret = fretVal - baseFret + 1;
          if (relativeFret >= 1 && relativeFret <= fretCount) {
            const x = paddingX + i * stringSpacing;
            const y = paddingTop + (relativeFret - 0.5) * fretSpacing;
            const fingerNum = fingers[i];

            return (
              <g key={`dot-${i}`}>
                {/* Finger Dot */}
                <circle
                  cx={x}
                  cy={y}
                  r="9"
                  fill="var(--accent-primary, #3b82f6)"
                  className="shadow-sm"
                />
                {/* Finger Number inside dot */}
                {fingerNum && fingerNum > 0 && (
                  <text
                    x={x}
                    y={y + 3.5}
                    fontSize="10"
                    fontWeight="800"
                    fill="#ffffff"
                    textAnchor="middle"
                    className="font-mono select-none"
                  >
                    {fingerNum}
                  </text>
                )}
              </g>
            );
          }
        }
        return null;
      })}
    </svg>
  );
};
